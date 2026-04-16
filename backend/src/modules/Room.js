import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({
    // ══════════════════════════════════════════════════════
    // A. THÔNG TIN CÔNG KHAI (User thấy)
    // ══════════════════════════════════════════════════════
    displayId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    price: {
        type: Number,
        required: true
    },
    address: {
        type: String, // Chỉ hiển thị Ngõ/Ngách/Quận
        required: true
    },
    cashbackAmount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ["available", "rented", "coming-soon"],
        default: "available"
    },
    availability: String, // Text tự do: "Trống ngay", "Mùng 10 trống"
    description: String,
    notes: [String],
    images: [String],
    roomNumber: String,
    district: String,
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [lng, lat]
            default: [105.8342, 21.0278] // Mặc định Hà Nội
        }
    },

    // ══════════════════════════════════════════════════════
    // B. THÔNG TIN BẢO MẬT (Chỉ Admin thấy)
    // ══════════════════════════════════════════════════════
    code: {
        type: String, // Mã gốc từ Zalo (có thể trùng)
        required: true
    },
    commissionRate: {
        type: Number, // % ví dụ: 50
        default: 0
    },
    totalCommission: {
        type: Number, // Tự động tính = Price * Rate / 100
        default: 0
    },
    netProfit: {
        type: Number, // Lợi nhuận ròng = TotalCommission - CashbackAmount
        default: 0
    },
    commissionRaw: String, // Text gốc từ parser (e.g. "50%-12th")
    ownerInfo: {
        name: String,
        phone: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

// Tự động tính toán tài chính trước khi lưu
RoomSchema.pre("save", async function() {
    // 1. Tự động tính Tiền hoàn khách = 9% Giá phòng (Nếu chưa có)
    if (this.price && (!this.cashbackAmount || this.cashbackAmount === 0)) {
        this.cashbackAmount = Math.round(this.price * 0.09);
    }

    // 2. Tính tổng hoa hồng
    if (this.price && this.commissionRate) {
        this.totalCommission = (this.price * this.commissionRate) / 100;
    }
    
    // 3. Tính lợi nhuận ròng (Lãi)
    this.netProfit = (this.totalCommission || 0) - (this.cashbackAmount || 0);
});

RoomSchema.index({ location: "2dsphere" });

const Room = mongoose.model("Room", RoomSchema);
export default Room;
