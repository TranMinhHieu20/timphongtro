import jwt from "jsonwebtoken";
import { ENV } from "./ENV.js";

const generateToken = (userId, res) => {
    const token = jwt.sign({ userId }, ENV.JWT_SECRET, {
        expiresIn: "7d"
    })

    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true, // prevent XSS attacks cross-site scripting attacks
        sameSite: "strict", // CSRF attacks cross-site request forgery attacks
        secure: process.env.NODE_ENV !== "development"
    })

    return token
}

export default generateToken;

