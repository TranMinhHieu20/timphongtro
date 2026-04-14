import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
    },
    amenities: {
        type: [String],
        default: []
    },
    services: {
        electricity: String,
        water: String,
        serviceFee: String,
        internet: String
    },
    notes: {
        type: [String],
        default: []
    },
    commission: {
        type: String, // Keep as string to store "1 triệu" or similar
    },
    cashbackAmount: {
        type: Number, // Calculated: price * 0.09
        required: true
    },
    images: {
        type: [String],
        default: []
    },
    roomNumber: {
        type: String, // E.g., "P404", "Phòng 101"
    },
    availability: {
        type: String, // E.g., "Vào ở luôn", "Cuối tháng"
    },
    contactPhone: {
        type: String, // Owner's or source's phone number
    },
    status: {
        type: String,
        enum: ["available", "rented"],
        default: "available"
    }
}, { timestamps: true });

const Room = mongoose.model("Room", RoomSchema);

export default Room;
