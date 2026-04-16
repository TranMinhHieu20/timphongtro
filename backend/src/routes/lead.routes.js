import express from "express";
import protectRoute from "../middlewares/authProtect.js";
import isAdmin from "../middlewares/isAdmin.js";
import { 
    createOrUpdateLead, 
    getUserLeadForRoom, 
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

// User routes
router.post("/", protectRoute, createOrUpdateLead);
router.get("/my-lead/:roomId", protectRoute, getUserLeadForRoom);

// Admin routes
router.get("/admin/all", protectRoute, isAdmin, getLeads);
router.get("/admin/count", protectRoute, isAdmin, getPendingCount);
router.patch("/admin/:id/status", protectRoute, isAdmin, updateLeadStatus);
router.delete("/admin/:id", protectRoute, isAdmin, deleteLead);

export default router;
