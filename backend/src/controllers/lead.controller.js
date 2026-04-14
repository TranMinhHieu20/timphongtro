import Lead from "../modules/Lead.js";

export const createOrUpdateLead = async (req, res) => {
    try {
        const { roomId, customerPhone, appointment } = req.body;
        const userId = req.user._id;

        // Upsert: Find if user already has a lead for this room
        let lead = await Lead.findOne({ userId, roomId });

        if (lead) {
            lead.customerPhone = customerPhone;
            lead.appointment = appointment;
            lead.status = "pending"; // Reset status to pending if they edit
            await lead.save();
        } else {
            lead = await Lead.create({
                userId,
                roomId,
                customerPhone,
                appointment,
                status: "pending"
            });
        }

        res.status(200).json({ success: true, lead });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getUserLeadForRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const lead = await Lead.findOne({ userId, roomId });
        res.status(200).json(lead);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getLeads = async (req, res) => {
    try {
        const leads = await Lead.find()
            .populate("userId", "username email")
            .populate("roomId", "code address price")
            .sort({ createdAt: -1 });
        res.status(200).json(leads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getPendingCount = async (req, res) => {
    try {
        const count = await Lead.countDocuments({ status: "pending" });
        res.status(200).json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        const lead = await Lead.findByIdAndUpdate(
            id,
            { status, note },
            { new: true }
        );

        if (!lead) return res.status(404).json({ message: "Lead not found" });

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
        res.status(200).json({ success: true, message: "Lead deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
