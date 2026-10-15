const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
// const authMiddleware = require('../middleware/auth.middleware'); // Protect your AI routes!
const { chatWithBot, getUserChats, getChatSession } = require('../controllers/ai.controller');
const verifytoken = require('../middlewares/verifytoken');

router.use(verifytoken);

router.post('/generate', aiController.generateText);
router.post('/chat', aiController.chatWithBot);
router.get('/chats', aiController.getUserChats); // Sidebar list
router.get('/chats/:sessionId',aiController.getChatSession); // Load specific chat

module.exports = router;