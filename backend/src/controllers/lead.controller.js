import Lead from "../modules/Lead.js";
import Room from "../modules/Room.js";
import User from "../modules/User.js";
import { io } from "../server.js";

export const createOrUpdateLead = async (req, res) => {
    try {
        const {
            roomId,
            type = "viewing",
            customerName,
            customerPhone,
            appointment,
            viewingDate,
            timeSlot,
            viewingMethod = "direct",
            peopleCount = 1,
            hasPet = false,
            hasVehicle = false,
            depositAmount = 0,
            paymentMethod = "contact_later",
            moveInDate,
            note
        } = req.body;
        const userId = req.user._id;

        // Upsert: Find if user already has a lead for this room
        let lead = await Lead.findOne({ userId, roomId });

        // Calculate hold expiration if reservation (default 24h)
        const holdExpiresAt = type === "reservation" 
            ? new Date(Date.now() + 24 * 60 * 60 * 1000) 
            : undefined;

        const updateData = {
            type,
            customerName: customerName || req.user.username || "Khách hàng",
            customerPhone,
            appointment: appointment || (viewingDate ? `${viewingDate} (${timeSlot || 'Cả ngày'})` : "Sớm nhất có thể"),
            viewingDate,
            timeSlot,
            viewingMethod,
            peopleCount: Number(peopleCount) || 1,
            hasPet: Boolean(hasPet),
            hasVehicle: Boolean(hasVehicle),
            depositAmount: Number(depositAmount) || 0,
            paymentMethod,
            paymentStatus: depositAmount > 0 && paymentMethod === "vietqr" ? "pending" : "pending",
            holdExpiresAt,
            moveInDate,
            note,
            status: "pending" // Reset status to pending when edited
        };

        if (lead) {
            Object.assign(lead, updateData);
            await lead.save();
        } else {
            lead = await Lead.create({
                userId,
                roomId,
                ...updateData
            });
        }

        // Populate for response & global broadcast
        const populatedLead = await Lead.findById(lead._id)
            .populate("userId", "username email avatar")
            .populate("roomId", "code address price images district displayId status cashbackAmount");

        if (populatedLead) {
            io.emit('newGlobalLead', {
                username: populatedLead.userId?.username || populatedLead.customerName || "Khách hàng",
                address: populatedLead.roomId?.address || "Hà Nội",
                code: populatedLead.roomId?.code || populatedLead.roomId?.displayId || "N/A",
                type: populatedLead.type
            });
        }

        // Emit realtime event for Admin sidebar count
        io.emit('leadCountUpdate');

        res.status(200).json({ success: true, lead: populatedLead });
    } catch (error) {
        console.error("Error creating/updating lead:", error);
        res.status(500).json({ message: error.message });
    }
};

export const getUserLeadForRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const lead = await Lead.findOne({ userId, roomId })
            .populate("roomId", "code address price images district displayId status cashbackAmount");
        res.status(200).json(lead);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET MY BOOKINGS (For regular user)
export const getMyBookings = async (req, res) => {
    try {
        const userId = req.user._id;
        const bookings = await Lead.find({ userId })
            .populate("roomId", "code address price images district displayId status availability cashbackAmount")
            .sort({ createdAt: -1 });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// CANCEL MY BOOKING (For regular user)
export const cancelMyBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        const lead = await Lead.findOneAndUpdate(
            { _id: id, userId },
            { status: "cancelled" },
            { new: true }
        );

        if (!lead) return res.status(404).json({ message: "Không tìm thấy yêu cầu hoặc bạn không có quyền" });

        io.emit('leadCountUpdate');
        res.status(200).json({ success: true, lead });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET ROOM BOOKING STATS (Social proof for room page)
export const getRoomStats = async (req, res) => {
    try {
        const { roomId } = req.params;
        const now = new Date();

        // Check active reservation
        const activeReservation = await Lead.findOne({
            roomId,
            type: "reservation",
            status: { $in: ["pending", "confirmed", "contacted"] },
            holdExpiresAt: { $gt: now }
        }).select("holdExpiresAt createdAt");

        // Count recent viewings (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentViewingsCount = await Lead.countDocuments({
            roomId,
            type: "viewing",
            createdAt: { $gte: sevenDaysAgo }
        });

        res.status(200).json({
            hasActiveReservation: Boolean(activeReservation),
            holdExpiresAt: activeReservation?.holdExpiresAt || null,
            recentViewingsCount: Math.max(recentViewingsCount, 1) // Base friendly count
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLeads = async (req, res) => {
    try {
        const leads = await Lead.find()
            .populate("userId", "username email avatar")
            .populate("roomId", "code address price images district displayId status availability cashbackAmount")
            .sort({ createdAt: -1 });
        res.status(200).json(leads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPendingCount = async (req, res) => {
    try {
        const count = await Lead.countDocuments({ status: "pending" });
        const viewingPending = await Lead.countDocuments({ type: "viewing", status: "pending" });
        const reservationPending = await Lead.countDocuments({ type: "reservation", status: "pending" });
        res.status(200).json({ count, viewingPending, reservationPending });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note, adminNote, paymentStatus } = req.body;

        const updateFields = {};
        if (status) updateFields.status = status;
        if (note !== undefined) updateFields.note = note;
        if (adminNote !== undefined) updateFields.adminNote = adminNote;
        if (paymentStatus !== undefined) updateFields.paymentStatus = paymentStatus;

        const lead = await Lead.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        ).populate("userId", "username email avatar")
         .populate("roomId", "code address price images district displayId status availability cashbackAmount");

        if (!lead) return res.status(404).json({ message: "Lead not found" });

        // If status completed, broadcast for social proof
        if (status === "completed") {
            io.emit('newCashbackReceived', {
                username: lead.userId?.username || lead.customerName || "Khách hàng",
                address: lead.roomId?.address || "Hà Nội"
            });
        }

        // Notify user in their personal room
        if (lead.userId?._id) {
            io.to(lead.userId._id.toString()).emit('myBookingUpdated', lead);
        }

        // Update counts for all admin sidebars
        io.emit('leadCountUpdate');

        res.status(200).json({ success: true, lead });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE LEAD
export const deleteLead = async (req, res) => {
    try {
        const lead = await Lead.findByIdAndDelete(req.params.id);
        if (!lead) return res.status(404).json({ message: "Lead not found" });

        // Update counts for all admin sidebars
        io.emit('leadCountUpdate');

        res.status(200).json({ success: true, message: "Lead deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET SUCCESS STORIES (Completed in last 30 days)
export const getSuccessStories = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const stories = await Lead.find({
            status: "completed",
            updatedAt: { $gte: thirtyDaysAgo }
        })
        .populate("userId", "username")
        .populate("roomId", "address")
        .sort({ updatedAt: -1 });

        res.status(200).json(stories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET GLOBAL STATS (Total counts for auto-display)
export const getGlobalStats = async (req, res) => {
    try {
        const totalLeads = await Lead.countDocuments();
        const totalRooms = await Room.countDocuments();
        const totalUsers = await User.countDocuments();
        
        res.status(200).json({
            totalLeads: totalLeads + 1200, // Adding a base to look established
            totalRooms,
            totalUsers: totalUsers + 500
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

