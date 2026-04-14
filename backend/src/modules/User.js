import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room"
    }],
    resetPasswordOTP: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    otpRequestsCount: {
        type: Number,
        default: 0
    },
    otpLockUntil: {
        type: Date
    }
}, {timestamps: true})

const User = mongoose.model("User", UserSchema)

export default User