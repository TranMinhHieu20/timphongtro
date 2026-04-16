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
    customerName: {
        type: String,
    },
    customerPhone: {
        type: String,
        required: true
    },
    appointment: {
        type: String, // Preferred viewing time
    },
    status: {
        type: String,
        enum: ["pending", "contacted", "contracted", "completed", "cancelled"],
        default: "pending"
    },
    note: {
        type: String
    }
}, { timestamps: true });

// TTL Index: Auto-delete data after 30 days (2,592,000 seconds)
LeadSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Lead = mongoose.model("Lead", LeadSchema);

export default Lead;
