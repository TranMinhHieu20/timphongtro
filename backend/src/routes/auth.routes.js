import express from "express";
import { loginUser, logoutUser, registerUser, checkAuth, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import protectRoute from "../middlewares/authProtect.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);

router.get("/check", protectRoute, checkAuth);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;