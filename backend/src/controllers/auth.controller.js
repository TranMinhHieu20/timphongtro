import User from "../modules/User.js";
import bcrypt from 'bcrypt';
import generateToken from '../lib/generateToken.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

// REGISTER USER
export const registerUser = async (req, res)=>{
    try {
        const {username, email, password, role} = req.body
        if(!username || !email || !password){
            return res.status(400).json({message: "All fields are required"})
        }
        const user = await User.findOne({email})
        if(user){
            return res.status(400).json({message: "User already exists"})
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)    
        const newUser = new User({username, email, password:hashedPassword, role})
        
        await newUser.save()
        generateToken(newUser._id, res)
        
        res.status(201).json({message: "User registered successfully", user: {
            _id: newUser._id,
            username: newUser.username,
            email: newUser.email, 
            role: role
        }})
    } catch (error) {
        console.log('Error registerUser in auth.controller.js', error)
        res.status(500).json({message: "Internal server error"})
    }
}

// LOGIN USER
export const loginUser  = async (req, res)=>{
    try {
        const {email, password} = req.body
        if(!email || !password){
            return res.status(400).json({message: "All fields are required"})
        }
        const user = await User.findOne({email}).select("+password")
        if(!user){
            return res.status(400).json({message: "Invalid email or password "})
        }
        const isPasswordValid = await bcrypt.compare(password, user.password)
        if(!isPasswordValid){
            return res.status(400).json({message: "Invalid email or password "})
        }

        generateToken(user._id, res)

        res.status(200).json({message: "User logged in successfully", user: {
            _id: user._id, 
            username: user.username,
            email: user.email,
        }})
    } catch (error) {
        console.log('Error loginUser in auth.controller.js', error)
        res.status(500).json({message: "Internal server error"})
    }
}

// LOGOUT USER
export const logoutUser = async (req, res) => {
    try {
        res.clearCookie("jwt")
        res.status(200).json({ message: "User logged out successfully" })
    } catch (error) {
        console.log('Error logoutUser in auth.controller.js', error)
        res.status(500).json({ message: "Internal server error" })
    }
}

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user)
    } catch (error) {
        console.log("Error checkAuth in auth.controller.js", error.message)
        res.status(500).json({ message: "Internal server error" })
    }
}

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Vui lòng nhập email" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Email không tồn tại trong hệ thống" });
        }

        // Check Anti-spam Lock
        if (user.otpLockUntil && user.otpLockUntil > Date.now()) {
            return res.status(429).json({ message: "Bạn đã yêu cầu quá nhiều lần. Vui lòng đợi 30 phút." });
        }

        // Check request count
        if (user.otpRequestsCount >= 5) {
            user.otpLockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
            // Reset the count so after 30 mins they get a fresh start
            user.otpRequestsCount = 0;
            await user.save();
            return res.status(429).json({ message: "Bạn đã vượt quá số lần yêu cầu. Vui lòng đợi 30 phút." });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Hash OTP before saving
        const salt = await bcrypt.genSalt(10);
        const hashedOTP = await bcrypt.hash(otp, salt);

        user.resetPasswordOTP = hashedOTP;
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
        user.otpRequestsCount += 1;

        await user.save();

        // Send Email
        await sendPasswordResetEmail(user.email, otp);

        res.status(200).json({ message: "Mã xác nhận đã được gửi đến email của bạn" });
    } catch (error) {
        console.log("Error forgotPassword:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
        }

        const user = await User.findOne({ email });
        if (!user || !user.resetPasswordOTP || !user.resetPasswordExpires) {
            return res.status(400).json({ message: "Yêu cầu không hợp lệ hoặc đã hết hạn" });
        }

        // Check expiry
        if (user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: "Mã OTP đã hết hạn" });
        }

        // Verify OTP
        const isMatch = await bcrypt.compare(otp.toString(), user.resetPasswordOTP);
        if (!isMatch) {
            return res.status(400).json({ message: "Mã OTP không chính xác" });
        }

        // Update Password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear OTP fields
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpires = undefined;
        user.otpRequestsCount = 0; // reset attempts
        user.otpLockUntil = undefined;
        
        await user.save();

        res.status(200).json({ message: "Khôi phục mật khẩu thành công. Bạn có thể đăng nhập ngay." });
    } catch (error) {
        console.log("Error resetPassword:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};