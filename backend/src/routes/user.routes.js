import express from "express";
import protectRoute from "../middlewares/authProtect.js";
import { toggleFavorite, getFavorites, updateProfile, changePassword } from "../controllers/user.controller.js";

const router = express.Router();

router.post("/favorites", protectRoute, toggleFavorite);
router.get("/favorites", protectRoute, getFavorites);
router.put("/profile", protectRoute, updateProfile);
router.put("/change-password", protectRoute, changePassword);

export default router;
