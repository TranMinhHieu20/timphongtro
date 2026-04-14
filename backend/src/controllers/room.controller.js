import Room from "../modules/Room.js";
import { parseZaloText, parsePriceValue } from "../lib/zaloParser.js";
import { uploadImage } from "../lib/cloudinary.js";
import xlsx from "xlsx";

// HELPER FOR EXCEL COLUMN MATCHING
const getCellValue = (row, variations) => {
    // Try exact matches first
    for (const v of variations) {
        if (row[v] !== undefined) return row[v];
    }
    // Try fuzzy match (case-insensitive, trimmed, normalized accents)
    const normalizedTargetVariations = variations.map(v => 
        v.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );
    
    for (const key in row) {
        const normalizedKey = key.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (normalizedTargetVariations.includes(normalizedKey)) {
            return row[key];
        }
    }
    return undefined;
};

// GET ALL ROOMS
export const getAllRooms = async (req, res) => {
    try {
        const rooms = await Room.find().sort({ createdAt: -1 });
        res.status(200).json(rooms);
    } catch (error) {
        console.log("Error in getAllRooms: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// GET SINGLE ROOM
export const getRoomById = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) return res.status(404).json({ message: "Room not found" });
        res.status(200).json(room);
    } catch (error) {
        console.log("Error in getRoomById: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// IMPORT ROOM FROM ZALO TEXT
export const importZaloRoom = async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ message: "Text is required" });

        const roomData = parseZaloText(text);
        
        // Handle images if uploaded
        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => {
                // For multer memoryStorage, file.buffer is available. 
                // But cloudinary.uploader.upload needs path or base64.
                // We'll use a dataURI approach or temporary path.
                const b64 = Buffer.from(file.buffer).toString("base64");
                let dataURI = "data:" + file.mimetype + ";base64," + b64;
                return uploadImage(dataURI);
            });

            const uploadResults = await Promise.all(uploadPromises);
            roomData.images = uploadResults.map(result => result.secure_url);
        }

        // Check if code already exists
        const existingRoom = await Room.findOne({ code: roomData.code });
        if (existingRoom) {
            return res.status(400).json({ message: `Room with code ${roomData.code} already exists` });
        }

        const newRoom = new Room(roomData);
        await newRoom.save();

        res.status(201).json({ message: "Room imported successfully", room: newRoom });
    } catch (error) {
        console.log("Error in importZaloRoom: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// IMPORT ROOMS FROM EXCEL
export const importExcelRooms = async (req, res) => {
    try {
        const excelFile = req.files?.['file']?.[0];
        const imageFiles = req.files?.['images'] || [];

        if (!excelFile) {
            return res.status(400).json({ message: "Excel file is required" });
        }

        const workbook = xlsx.read(excelFile.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const row of data) {
            try {
                const code = getCellValue(row, ["Mã", "Code", "Ma", "Mã phòng", "Ma phong"]);
                const address = getCellValue(row, ["Địa chỉ", "Address", "Dia chi", "DiaChi"]);
                const priceValue = getCellValue(row, ["Giá", "Price", "Gia", "Giá thuê", "Gia thue"]);
                
                const missing = [];
                if (!code) missing.push("Mã (Code)");
                if (!address) missing.push("Địa chỉ (Address)");
                if (!priceValue) missing.push("Giá (Price)");

                if (missing.length > 0) {
                    throw new Error(`Thiếu thông tin bắt buộc (${missing.join(", ")}) cho dòng với mã: ${code || "không xác định"}`);
                }

                const price = parsePriceValue(priceValue);
                if (!price || isNaN(price)) {
                    throw new Error(`Giá không hợp lệ cho dòng mã ${code}: "${priceValue}"`);
                }

                const roomData = {
                    code: String(code).trim(),
                    address: String(address).trim(),
                    price: price,
                    description: getCellValue(row, ["Mô tả", "Description", "Mo ta", "Desc"]) || "",
                    amenities: (getCellValue(row, ["Nội thất", "Amenities", "Noi that", "Furniture"]) || "").split(/[,;]/).map(i => i.trim()).filter(i => i),
                    services: {
                        electricity: getCellValue(row, ["Điện", "Electric", "Dien"]) || "",
                        water: getCellValue(row, ["Nước", "Water", "Nuoc"]) || "",
                        serviceFee: getCellValue(row, ["Dịch vụ", "Service", "Dich vu", "Phí", "Phi"]) || "",
                        internet: getCellValue(row, ["Mạng", "Internet", "Wifi", "Mang"]) || ""
                    },
                    notes: (getCellValue(row, ["Lưu ý", "Notes", "Luu y"]) || "").split("\n").map(i => i.trim()).filter(i => i),
                    images: [],
                    roomNumber: String(getCellValue(row, ["Phòng", "Room", "So phong"]) || "").trim(),
                    availability: String(getCellValue(row, ["Trạng thái", "Status", "Ngày ở", "Vào ở", "Availability"]) || "").trim(),
                    contactPhone: String(getCellValue(row, ["SĐT", "Phone", "Liên hệ", "Dien thoai", "Contact"]) || "").replace(/[^0-9]/g, "").trim()
                };

                // MATCH IMAGES BY FILENAME PREFIX
                // E.g. room code "TM01" matches "TM01_1.jpg", "TM01-abc.png", etc.
                const matchingImages = imageFiles.filter(file => {
                    const filename = file.originalname.toLowerCase();
                    const normalizedCode = roomData.code.toLowerCase();
                    return filename.startsWith(normalizedCode);
                });

                if (matchingImages.length > 0) {
                    const uploadPromises = matchingImages.map(file => {
                        const b64 = Buffer.from(file.buffer).toString("base64");
                        let dataURI = "data:" + file.mimetype + ";base64," + b64;
                        return uploadImage(dataURI);
                    });
                    const uploadResults = await Promise.all(uploadPromises);
                    roomData.images = uploadResults.map(res => res.secure_url);
                }

                // Check for existing
                const existing = await Room.findOne({ code: roomData.code });
                if (existing) {
                    throw new Error(`Phòng có mã ${roomData.code} đã tồn tại trên hệ thống`);
                }

                roomData.cashbackAmount = Math.round(roomData.price * 0.09);
                
                const newRoom = new Room(roomData);
                await newRoom.save();
                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push(err.message);
            }
        }

        res.status(200).json({ message: "Excel import completed", results });
    } catch (error) {
        console.log("Error in importExcelRooms: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};


// SEARCH ROOMS
export const searchRooms = async (req, res) => {
    try {
        const { query } = req.query;
        const rooms = await Room.find({
            $or: [
                { address: { $regex: query, $options: "i" } },
                { code: { $regex: query, $options: "i" } }
            ]
        });
        res.status(200).json(rooms);
    } catch (error) {
        console.log("Error in searchRooms: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// UPDATE ROOM STATUS
export const updateRoomStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["available", "rented"].includes(status)) {
            return res.status(400).json({ message: "Invalid status value" });
        }

        const room = await Room.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        res.status(200).json({ message: "Status updated successfully", room });
    } catch (error) {
        console.log("Error in updateRoomStatus: ", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};

// UPDATE ROOM (GENERAL)
export const updateRoom = async (req, res) => {
    try {
        const updateData = { ...req.body };
        
        // Recalculate cashback if price changes
        if (updateData.price) {
            updateData.cashbackAmount = Math.round(updateData.price * 0.09);
        }

        const room = await Room.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!room) return res.status(404).json({ message: "Room not found" });
        res.status(200).json({ message: "Room updated successfully", room });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE ROOM
export const deleteRoom = async (req, res) => {
    try {
        const room = await Room.findByIdAndDelete(req.params.id);
        if (!room) return res.status(404).json({ message: "Room not found" });
        res.status(200).json({ success: true, message: "Room deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
