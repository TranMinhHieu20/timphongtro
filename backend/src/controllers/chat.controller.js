import Conversation from '../modules/Conversation.js';
import Message from '../modules/Message.js';
import User from '../modules/User.js';
import { io } from '../server.js';
import { uploadImage } from '../lib/cloudinary.js';

// Gửi tin nhắn
export const sendMessage = async (req, res) => {
    try {
        let { text, receiverId } = req.body;
        const senderId = req.user.id;
        const senderRole = req.user.role;
        let imageUrl = null;

        // Xử lý upload ảnh nếu có
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString("base64");
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;
            const uploadRes = await uploadImage(dataURI);
            imageUrl = uploadRes.secure_url;
        }

        if (!text && !imageUrl) {
            return res.status(400).json({ message: "Tin nhắn không được để trống" });
        }

        // Quy tắc: User chỉ có thể nhắn cho Admin
        if (senderRole === 'user' && receiverId === 'admin') {
            const admin = await User.findOne({ role: 'admin' });
            if (!admin) return res.status(404).json({ message: "Không tìm thấy Admin" });
            receiverId = admin._id;
        } else if (senderRole === 'user' && receiverId !== 'admin') {
            const receiver = await User.findById(receiverId);
            if (receiver?.role !== 'admin') {
                return res.status(403).json({ message: "Bạn chỉ có thể nhắn tin cho Admin" });
            }
        }

        // Quy tắc: Admin không thể nhắn cho Admin khác
        if (senderRole === 'admin') {
            const receiver = await User.findById(receiverId);
            if (!receiver) return res.status(404).json({ message: "Người nhận không tồn tại" });
            if (receiver.role === 'admin' && senderId !== receiverId.toString()) {
                return res.status(403).json({ message: "Admin không thể nhắn tin cho Admin khác" });
            }
            receiverId = receiver._id; // Ensure it's an ObjectId/string
        }

        // Tìm hoặc tạo Conversation
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [senderId, receiverId]
            });
            await conversation.save();
        }

        const newMessage = new Message({
            conversationId: conversation._id,
            sender: senderId,
            text,
            image: imageUrl
        });

        await newMessage.save();

        // Cập nhật tin nhắn cuối cùng trong Conversation
        conversation.lastMessage = newMessage._id;
        if (newMessage.sender.toString() !== senderId.toString()) {
             // Logic unread: Usually we increment for the OTHER person
             // But here we'll just track if it was an admin incoming
        }
        conversation.unreadCount += 1; 
        await conversation.save();

        // Emit realtime event to the receiver's room
        const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'username avatar role');
        io.to(receiverId.toString()).emit('newMessage', populatedMessage);
        
        // Phát thông báo cho người nhận (để hiện toast/alert)
        io.to(receiverId.toString()).emit('newMessageNotification', {
            sender: req.user.username,
            text: text || "Đã gửi một ảnh 📷",
            conversationId: conversation._id
        });

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error("SendMessage Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Tìm cứu người dùng (Dành cho Admin chủ động nhắn tin)
export const searchUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ message: "Chỉ Admin mới có quyền này" });
        
        const { query } = req.query;
        const users = await User.find({
            $and: [
                { role: 'user' },
                {
                    $or: [
                        { username: { $regex: query, $options: 'i' } },
                        { email: { $regex: query, $options: 'i' } }
                    ]
                }
            ]
        }).limit(20).select('username email role avatar');

        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy lịch sử chat giữa 2 người
export const getMessages = async (req, res) => {
    try {
        let { otherUserId } = req.params;
        const userId = req.user.id;

        // Nếu client gửi 'admin', ta tìm ID của admin thực tế
        if (otherUserId === 'admin') {
            const admin = await User.findOne({ role: 'admin' });
            if (!admin) return res.status(200).json([]);
            otherUserId = admin._id;
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [userId, otherUserId] }
        });

        // Fallback: Nếu không tìm thấy theo ID, tìm hội thoại của User này với bất kỳ Admin nào
        if (!conversation && otherUserId.toString() === (await User.findOne({role: 'admin'}))?._id?.toString()) {
            const adminUser = await User.findOne({ role: 'admin' });
            if (adminUser) {
                conversation = await Conversation.findOne({
                    participants: { $all: [userId, adminUser._id] }
                });
            }
        }

        if (!conversation) return res.status(200).json([]);

        const messages = await Message.find({
            conversationId: conversation._id
        }).sort({ createdAt: 1 });

        // Đánh dấu là đã đọc if the receiver is you
        await Message.updateMany(
            { conversationId: conversation._id, sender: otherUserId, isRead: false },
            { isRead: true }
        );
        
        // Reset unread count for this conversation if admin is checking
        if (req.user.role === 'admin') {
            conversation.unreadCount = 0;
            await conversation.save();
            
            // Thông báo cho Sidebar cập nhật lại tổng số tin nhắn chưa đọc
            io.to(userId.toString()).emit('unreadCountUpdate');
        }

        res.status(200).json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy danh sách hội thoại (Cho Admin)
export const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id
        })
        .populate('participants', 'username email role avatar')
        .populate('lastMessage')
        .sort({ updatedAt: -1 });

        res.status(200).json(conversations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Lấy tổng số tin nhắn chưa đọc cho Admin
export const getUnreadTotal = async (req, res) => {
    try {
        if (req.user.role !== 'admin') return res.status(200).json({ count: 0 });

        const conversations = await Conversation.find({
            participants: req.user.id,
            unreadCount: { $gt: 0 }
        });

        const total = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
        res.status(200).json({ count: total });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
