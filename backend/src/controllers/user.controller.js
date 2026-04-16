import User from "../modules/User.js";
import bcrypt from "bcrypt";
import { io } from "../server.js";

export const toggleFavorite = async (req, res) => {
    try {
        const { roomId } = req.body;
        const user = await User.findById(req.user._id);

        const isFavorite = user.favorites.includes(roomId);

        if (isFavorite) {
            user.favorites = user.favorites.filter(id => id.toString() !== roomId);
        } else {
            user.favorites.push(roomId);
        }

        await user.save();

        // Emit realtime update to all tabs/devices of the same user
        io.to(user._id.toString()).emit('favoriteUpdate', user.favorites);

        res.status(200).json({ success: true, favorites: user.favorites });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('favorites');
        res.status(200).json(user.favorites);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { username, email } = req.body;
        const user = await User.findById(req.user._id);

        if (username) user.username = username;
        if (email) user.email = email;

        await user.save();
        res.status(200).json({ 
            message: "Cập nhật thông tin thành công", 
            user: { username: user.username, email: user.email } 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Mật khẩu cũ không chính xác" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        res.status(200).json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
