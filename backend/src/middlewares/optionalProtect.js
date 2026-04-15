import jwt from "jsonwebtoken";
import User from "../modules/User.js";
import { ENV } from "../lib/ENV.js";

/**
 * Optional auth middleware — sets req.user if a valid token exists,
 * but does NOT block the request if there's no token.
 * Used for public routes that need to distinguish admin vs. regular users.
 */
const optionalProtect = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) return next(); // No token → still public access

        const decoded = jwt.verify(token, ENV.JWT_SECRET);
        if (!decoded) return next();

        const user = await User.findById(decoded.userId).select("-password");
        if (user) req.user = user;

        next();
    } catch (error) {
        // Invalid/expired token → still allow public access
        next();
    }
};

export default optionalProtect;
