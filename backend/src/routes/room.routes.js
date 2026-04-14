import express from "express";
import { getAllRooms, getRoomById, importZaloRoom, searchRooms, importExcelRooms, updateRoomStatus, updateRoom, deleteRoom } from "../controllers/room.controller.js";
import protectRoute from "../middlewares/authProtect.js";
import isAdmin from "../middlewares/isAdmin.js";
import multer from "multer";

const router = express.Router();

// Multer setup for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get("/", getAllRooms);
router.get("/search", searchRooms);
router.get("/:id", getRoomById);

// Import route (Admin only)
// For Zalo text + images (multiple images)
router.post("/import", protectRoute, isAdmin, upload.array("images", 10), importZaloRoom);

// For Excel import (file + optional images)
router.post("/import-excel", protectRoute, isAdmin, upload.fields([{ name: 'file', maxCount: 1 }, { name: 'images', maxCount: 50 }]), importExcelRooms);

// Admin Room CRUD
router.patch("/:id/status", protectRoute, isAdmin, updateRoomStatus);
router.put("/:id", protectRoute, isAdmin, updateRoom);
router.delete("/:id", protectRoute, isAdmin, deleteRoom);

export default router;

