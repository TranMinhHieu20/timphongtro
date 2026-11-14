import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },
    type: {
        type: String,
        enum: ["viewing", "reservation"],
        default: "viewing"
    },
    customerName: {
        type: String,
    },
    customerPhone: {
        type: String,
        required: true
    },
    // Chi tiết lịch xem phòng (viewing)
    viewingDate: {
        type: String, // YYYY-MM-DD
    },
    timeSlot: {
        type: String, // "morning", "afternoon", "evening", or custom
    },
    viewingMethod: {
        type: String,
        enum: ["direct", "videocall"],
        default: "direct"
    },
    peopleCount: {
        type: Number,
        default: 1
    },
    hasPet: {
        type: Boolean,
        default: false
    },
    hasVehicle: {
        type: Boolean,
        default: false
    },
    // Chi tiết cọc giữ chỗ (reservation)
    depositAmount: {
        type: Number,
        default: 0
    },
    paymentMethod: {
        type: String,
        enum: ["vietqr", "contact_later"],
        default: "contact_later"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "refunded"],
        default: "pending"
    },
    holdExpiresAt: {
        type: Date
    },
    moveInDate: {
        type: String // Ngày dự kiến vào ở
    },
    appointment: {
        type: String, // Preferred viewing time (legacy fallback)
    },
    status: {
        type: String,
        enum: ["pending", "contacted", "confirmed", "contracted", "completed", "cancelled"],
        default: "pending"
    },
    note: {
        type: String // Khách ghi chú
    },
    adminNote: {
        type: String // Admin ghi chú nội bộ
    }
}, { timestamps: true });

// TTL Index: Auto-delete data after 60 days
LeadSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 24 * 60 * 60 });

const Lead = mongoose.model("Lead", LeadSchema);

export default Lead;

