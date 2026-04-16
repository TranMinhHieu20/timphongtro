import express from 'express';
import protectRoute  from '../middlewares/authProtect.js';
import { sendMessage, getMessages, getConversations, searchUsers, getUnreadTotal } from '../controllers/chat.controller.js';

const router = express.Router();

router.post('/send', protectRoute, sendMessage);
router.get('/search-users', protectRoute, searchUsers);
router.get('/unread-total', protectRoute, getUnreadTotal);
router.get('/messages/:otherUserId', protectRoute, getMessages);
router.get('/conversations', protectRoute, getConversations);

export default router;
