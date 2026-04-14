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
        enum: ["pending", "contacted", "interested", "viewing", "signed", "refunded", "cancelled"],
        default: "pending"
    },
    note: {
        type: String
    }
}, { timestamps: true });

const Lead = mongoose.model("Lead", LeadSchema);

export default Lead;
