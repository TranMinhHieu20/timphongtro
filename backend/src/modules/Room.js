import mongoose from "mongoose";

const RoomSchema = new mongoose.Schema({

    // ════════════════════════════════════════════════════════════
    // A. THÔNG TIN CÔNG KHAI (User thấy trên Website/Mobile)
    // ════════════════════════════════════════════════════════════

    /** Mã phòng hiển thị — duy nhất, dễ nhớ (e.g. "PM-232", "KD-312")
     *  Dùng để user/khách giao tiếp với môi giới thay cho mã nội bộ.
     *  Tự động sinh khi tạo phòng.
     */
    displayId: {
        type: String,
        unique: true,
        sparse: true
    },

    /** Giá thuê thực tế / tháng (VNĐ) */
    price: {
        type: Number,
        required: true
    },

    /** Địa chỉ — chỉ hiển thị đến cấp Ngõ/Ngách để bảo mật nguồn hàng */
    address: {
        type: String,
        required: true
    },

    /** Mô tả: nội thất, diện tích, tầng, loại thang (bộ/máy), v.v. (freeform) */
    description: {
        type: String,
        default: ""
    },

    /** Lưu ý: quy định đóng tiền, cọc, giờ giấc, PCCC */
    notes: {
        type: [String],
        default: []
    },

    /** Tiền hoàn trả khi ký HĐ thành công — điểm mấu chốt hút khách (9% giá phòng) */
    cashbackAmount: {
        type: Number,
        required: true,
        default: 0
    },

    /** Trạng thái phòng */
    status: {
        type: String,
        enum: ["available", "rented", "coming-soon"],
        default: "available"
        // Trống / Đã thuê / Sắp trống
    },

    /** Chi tiết ngày vào ở (e.g. "Vào ở luôn", "Cuối tháng") */
    availability: {
        type: String,
        default: ""
    },

    /** Số phòng (e.g. "P203") */
    roomNumber: {
        type: String,
        default: ""
    },

    /** Hình ảnh thực tế (Cloudinary URLs) */
    images: {
        type: [String],
        default: []
    },


    // ════════════════════════════════════════════════════════════
    // B. THÔNG TIN NỘI BỘ (Chỉ Admin/Môi giới thấy)
    // ════════════════════════════════════════════════════════════

    /** Mã gốc từ nhóm nguồn (e.g. "TM099") — có thể trùng giữa các nguồn */
    code: {
        type: String,
        required: true,
    },

    /** % Hoa hồng dạng text gốc (e.g. "30%-12th", "50%") */
    commissionRaw: {
        type: String,
        default: ""
    },

    /** % Hoa hồng dạng số (e.g. 30 → 30%) */
    commissionRate: {
        type: Number,
        default: 0
    },

    /** Tổng hoa hồng (VNĐ) = price × commissionRate / 100  [tự tính] */
    totalCommission: {
        type: Number,
        default: 0
    },

    /** Lợi nhuận thực tế = totalCommission − cashbackAmount  [tự tính] */
    netProfit: {
        type: Number,
        default: 0
    },

    /** Thông tin đầu chủ để liên hệ dẫn khách */
    ownerInfo: {
        name:  { type: String, default: "" },
        phone: { type: String, default: "" }
    }

}, { timestamps: true });

const Room = mongoose.model("Room", RoomSchema);
export default Room;
