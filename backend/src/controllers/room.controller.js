import Room from "../modules/Room.js";
import { parseZaloText, parsePriceValue } from "../lib/zaloParser.js";
import { uploadImage, uploadVideo } from "../lib/cloudinary.js";
import xlsx from "xlsx";
import { io } from "../server.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // skip I, O to avoid confusion
const rndLetter = () => LETTERS[Math.floor(Math.random() * LETTERS.length)];

/**
 * Auto-generate a unique, memorable display ID for customers.
 * Format: "PM-232", "KD-319", "AT-876" — 2 letters + dash + 3 digits.
 */
const generateDisplayId = async () => {
    for (let i = 0; i < 30; i++) {
        const id = `${rndLetter()}${rndLetter()}-${Math.floor(Math.random() * 900) + 100}`;
        const exists = await Room.findOne({ displayId: id });
        if (!exists) return id;
    }
    // Fallback: 4-digit suffix
    return `${rndLetter()}${rndLetter()}-${Math.floor(Math.random() * 9000) + 1000}`;
};

/**
 * Auto-calculate all financial fields from price and commissionRate.
 *   cashbackAmount  = price × 9%          (hoàn tiền cho khách)
 *   totalCommission = price × commissionRate%  (tổng hoa hồng)
 *   netProfit       = totalCommission – cashbackAmount
 */
const calcFinancials = (price, commissionRate = 0) => {
    const cashbackAmount  = Math.round(price * 0.09);
    const totalCommission = Math.round(price * commissionRate / 100);
    const netProfit       = totalCommission - cashbackAmount;
    return { cashbackAmount, totalCommission, netProfit };
};

/**
 * Fuzzy column matcher for Excel — case-insensitive, accent-stripped.
 */
const getCellValue = (row, variations) => {
    for (const v of variations) {
        if (row[v] !== undefined) return row[v];
    }
    const norm = (s) => s.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const targets = variations.map(norm);
    for (const key in row) {
        if (targets.includes(norm(key))) return row[key];
    }
    return undefined;
};

/**
 * Strip admin-only fields from a room object for public users.
 * Public see: displayId, price, address, cashbackAmount, status, images, description, availability, roomNumber.
 * Admin see: All + code, commissionRate, totalCommission, netProfit, ownerInfo.
 */
const ADMIN_FIELDS = ["code", "commissionRate", "totalCommission", "netProfit", "commissionRaw", "ownerInfo"];
const toPublicRoom = (room, isAdmin) => {
    const obj = room.toObject ? room.toObject() : { ...room };
    if (!isAdmin) {
        ADMIN_FIELDS.forEach((f) => delete obj[f]);
    }
    return obj;
};

// ─── Controllers ──────────────────────────────────────────────────────────────

// GET ALL ROOMS — supports filters: district, minPrice, maxPrice, sortBy, geo, search
export const getAllRooms = async (req, res) => {
    try {
        const admin = req.user?.role === "admin";
        const { district, minPrice, maxPrice, sortBy, lat, lng, q } = req.query;

        const filter = {};
        if (district) filter.address = { $regex: district, $options: "i" };
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        // Text Search logic
        if (q) {
            filter.$or = [
                { address: { $regex: q, $options: "i" } },
                { displayId: { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } },
                { roomNumber: {$regex: q, $options: 'i'}},
                { notes: {$regex: q, $options: 'i'}},
                ...(admin ? [{ code: { $regex: q, $options: "i" } }] : [])
            ];
        }

        // 1. Logic for Nearest (Spatial Search)
        if (sortBy === "nearest" && lat && lng) {
            filter.location = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    }
                }
            };
            
            // Note: $near automatically sorts by distance starting from version 1.6
            const rooms = await Room.find(filter).limit(100);
            return res.status(200).json(rooms.map((r) => toPublicRoom(r, admin)));
        }

        // 2. Logic for Standard Sorting
        const sortOptions =
            sortBy === "cashback" ? { cashbackAmount: -1 } :
            sortBy === "price_asc" ? { price: 1 } :
            sortBy === "price_desc" ? { price: -1 } :
            { createdAt: -1 };

        const rooms = await Room.find(filter).sort(sortOptions);
        res.status(200).json(rooms.map((r) => toPublicRoom(r, admin)));
    } catch (error) {
        console.error("Error in getAllRooms:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// GET SINGLE ROOM
export const getRoomById = async (req, res) => {
    try {
        const admin = req.user?.role === "admin";
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });
        res.status(200).json(toPublicRoom(room, admin));
    } catch (error) {
        console.error("Error in getRoomById:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// SEARCH ROOMS — by displayId, address/district, description
export const searchRooms = async (req, res) => {
    try {
        const { query } = req.query;
        const admin = req.user?.role === "admin";

        const rooms = await Room.find({
            $or: [
                { address: { $regex: query, $options: "i" } },
                { displayId: { $regex: query, $options: "i" } },
                { description: { $regex: query, $options: "i" } },
                // Admins can also search by internal code
                ...(admin ? [{ code: { $regex: query, $options: "i" } }] : [])
            ]
        });
        res.status(200).json(rooms.map((r) => toPublicRoom(r, admin)));
    } catch (error) {
        console.error("Error in searchRooms:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// IMPORT ROOM FROM ZALO TEXT
export const importZaloRoom = async (req, res) => {
    try {
        const { text, ...manualData } = req.body;
        
        // Nếu có text thì bóc tách, nếu không thì dùng dữ liệu manual từ Form
        let roomData = {};
        if (text) {
            roomData = parseZaloText(text);
        } else if (manualData && manualData.price) {
            //Ưu tiên dữ liệu từ Form gửi lên
            roomData = {
                ...manualData,
                notes: typeof manualData.notes === 'string' ? manualData.notes.split('\n') : manualData.notes
            };
        } else {
            return res.status(400).json({ message: "Vui lòng nhập nội dung hoặc điền Form" });
        }

        const images = [];
        let videoUrl = null;

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const b64 = Buffer.from(file.buffer).toString("base64");
                const dataURI = `data:${file.mimetype};base64,${b64}`;
                
                if (file.mimetype.startsWith('video/')) {
                    const result = await uploadVideo(dataURI);
                    videoUrl = result.secure_url;
                } else {
                    const result = await uploadImage(dataURI);
                    images.push(result.secure_url);
                }
            }
        }

        const finalData = {
            ...roomData,
            images: images.length > 0 ? images : roomData.images,
            videoUrl: videoUrl || roomData.videoUrl,
            displayId: await generateDisplayId()
        };

        const newRoom = new Room(finalData);
        await newRoom.save();

        // Emit realtime event
        io.emit('newRoomCreated', toPublicRoom(newRoom, false));

        res.status(201).json({ message: "Đăng phòng thành công", room: toPublicRoom(newRoom, true) });
    } catch (error) {
        console.error("Error in importZaloRoom:", error.message);
        res.status(400).json({ message: "Lỗi lưu phòng: " + error.message });
    }
};

// IMPORT ROOMS FROM EXCEL
// Columns: Mã | Hoa hồng (%) | Giá | Địa chỉ | Mô tả | Trạng thái | Lưu ý | Thông tin đầu chủ
export const importExcelRooms = async (req, res) => {
    try {
        const excelFile = req.files?.["file"]?.[0];
        const imageFiles = req.files?.["images"] || [];

        if (!excelFile) {
            return res.status(400).json({ message: "File Excel là bắt buộc" });
        }

        const workbook = xlsx.read(excelFile.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        const results = { success: 0, failed: 0, errors: [] };

        for (const row of data) {
            try {
                // ─ Required fields
                // const  commissionRaw = getCellValue(row, ['Hoa hồng', 'Hoa hong']);
                const code     = getCellValue(row, ["Mã", "Code", "Ma", "Mã phòng"]);
                const address  = getCellValue(row, ["Địa chỉ", "Address", "Dia chi"]);
                const priceRaw = getCellValue(row, ["Giá", "Price", "Gia", "Giá thuê"]);

                const missing = [];
                if (!code)     missing.push("Mã");
                if (!address)  missing.push("Địa chỉ");
                if (!priceRaw) missing.push("Giá");
                if (missing.length > 0) {
                    throw new Error(`Thiếu: ${missing.join(", ")} — mã: ${code || "?"}`);
                }

                const price = parsePriceValue(priceRaw);
                if (!price || isNaN(price)) {
                    throw new Error(`Giá không hợp lệ cho mã ${code}: "${priceRaw}"`);
                }

                // ─ Commission
                const commissionRaw = String(getCellValue(row, ["Hoa hồng", "Hoa hong", "Commission", "HH"]) || "").trim();
                const rateMatch = commissionRaw.match(/(\d+(?:\.\d+)?)\s*%/);
                const commissionRate = rateMatch ? parseFloat(rateMatch[1]) : 0;

                // ─ Status
                const statusRaw = String(getCellValue(row, ["Trạng thái", "Status", "Vào ở"]) || "").trim();
                const lower = statusRaw.toLowerCase();
                const status =
                    lower.includes("đã thuê") || lower.includes("rented") ? "rented" :
                    lower.includes("sắp") || lower.includes("coming") ? "coming-soon" :
                    "available";

                // ─ Notes
                const notesRaw = String(getCellValue(row, ["Lưu ý", "Luu y", "Notes"]) || "");
                const notes = notesRaw
                    .split(/[\n;]/)
                    .map((s) => s.replace(/^[-\d.]\s*/, "").trim())
                    .filter(Boolean);

                // ─ Owner info
                const ownerRaw = String(getCellValue(row, ["Thông tin đầu chủ", "Đầu chủ", "Owner", "Chủ nhà"]) || "");
                const ownerPhone = ownerRaw.replace(/[^0-9]/g, "").slice(0, 11);
                const ownerName  = ownerRaw.replace(/[\d\-().\s]+/g, "").trim();

                const roomData = {
                    code: String(code).trim(),
                    address: String(address).trim(),
                    price,
                    roomNumber:    String(getCellValue(row, ["Phòng", "Room", "Số phòng"]) || "").trim(),
                    availability:  statusRaw,
                    status,
                    description:   String(getCellValue(row, ["Mô tả", "Mo ta", "Description"]) || "").trim(),
                    notes,
                    commissionRaw,
                    commissionRate,
                    ownerInfo: { name: ownerName, phone: ownerPhone },
                    images: [],
                    videoUrl: null
                };

                // ─ Match images to this room
                let matchingImages = [];
                if (data.length === 1) {
                    matchingImages = [...imageFiles];
                } else {
                    const norm = roomData.code.toLowerCase().replace(/\s+/g, "");
                    matchingImages = imageFiles.filter((f) =>
                        f.originalname.toLowerCase().includes(norm)
                    );
                }

                if (matchingImages.length > 0) {
                    const uploadedImages = [];
                    for (const file of matchingImages) {
                        const b64 = Buffer.from(file.buffer).toString("base64");
                        const dataURI = `data:${file.mimetype};base64,${b64}`;
                        
                        if (file.mimetype.startsWith('video/')) {
                            const result = await uploadVideo(dataURI);
                            roomData.videoUrl = result.secure_url;
                        } else {
                            const result = await uploadImage(dataURI);
                            uploadedImages.push(result.secure_url);
                        }
                    }
                    roomData.images = uploadedImages;
                }

                roomData.displayId = await generateDisplayId();

                await new Room(roomData).save();
                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push(err.message);
            }
        }

        res.status(200).json({ message: "Excel import hoàn tất", results });
    } catch (error) {
        console.error("Error in importExcelRooms:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// UPDATE ROOM STATUS
export const updateRoomStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["available", "rented", "coming-soon"].includes(status)) {
            return res.status(400).json({ message: "Status không hợp lệ" });
        }
        const room = await Room.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });
        
        // Emit realtime event
        io.emit('roomUpdated', toPublicRoom(room, false));

        res.status(200).json({ message: "Cập nhật thành công", room });
    } catch (error) {
        console.error("Error in updateRoomStatus:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// UPDATE ROOM (GENERAL) — recalculates financials if price/commission changes
export const updateRoom = async (req, res) => {
    try {
        const updateData = { ...req.body };

        if (updateData.price !== undefined || updateData.commissionRate !== undefined) {
            const existing = await Room.findById(req.params.id);
            const price = updateData.price ?? existing?.price ?? 0;
            const commissionRate = updateData.commissionRate ?? existing?.commissionRate ?? 0;
            Object.assign(updateData, calcFinancials(price, commissionRate));
        }

        const room = await Room.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

        // Emit realtime event
        io.emit('roomUpdated', toPublicRoom(room, false));

        res.status(200).json({ message: "Cập nhật thành công", room });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE ROOM
export const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findByIdAndDelete(req.params.id);
        if (!room) return res.status(404).json({ message: "Không tìm thấy phòng" });

        // Emit realtime event
        io.emit('roomDeleted', req.params.id);

        res.status(200).json({ success: true, message: "Xoá phòng thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
