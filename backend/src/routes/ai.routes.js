const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
// const authMiddleware = require('../middleware/auth.middleware'); // Protect your AI routes!

router.post('/generate', aiController.generateText);
router.post('/chat', aiController.chatWithBot);

module.exports = router;