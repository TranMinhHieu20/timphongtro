import express from 'express';
import protectRoute  from '../middlewares/authProtect.js';
import { sendMessage, getMessages, getConversations, searchUsers, getUnreadTotal } from '../controllers/chat.controller.js';
import multer from 'multer';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/send', protectRoute, upload.single('image'), sendMessage);
router.get('/search-users', protectRoute, searchUsers);
router.get('/unread-total', protectRoute, getUnreadTotal);
router.get('/messages/:otherUserId', protectRoute, getMessages);
router.get('/conversations', protectRoute, getConversations);

export default router;
