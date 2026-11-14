import express from "express";
import protectRoute from "../middlewares/authProtect.js";
import isAdmin from "../middlewares/isAdmin.js";
import { 
    createOrUpdateLead, 
    getUserLeadForRoom, 
    getMyBookings,
    cancelMyBooking,
    getRoomStats,
    getLeads, 
    getPendingCount,
    updateLeadStatus,
    deleteLead,
    getSuccessStories,
    getGlobalStats
} from "../controllers/lead.controller.js";

const router = express.Router();

// Public routes
router.get("/success-stories", getSuccessStories);
router.get("/stats", getGlobalStats);
router.get("/room-stats/:roomId", getRoomStats);

// User routes
router.post("/", protectRoute, createOrUpdateLead);
router.get("/my-bookings", protectRoute, getMyBookings);
router.patch("/my-bookings/:id/cancel", protectRoute, cancelMyBooking);
router.get("/my-lead/:roomId", protectRoute, getUserLeadForRoom);

// Admin routes
router.get("/admin/all", protectRoute, isAdmin, getLeads);
router.get("/admin/count", protectRoute, isAdmin, getPendingCount);
router.patch("/admin/:id/status", protectRoute, isAdmin, updateLeadStatus);
router.delete("/admin/:id", protectRoute, isAdmin, deleteLead);

export default router;

