const { GoogleGenerativeAI } = require('@google/generative-ai');
const Chat = require('../models/Chat.model');
// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 1. Inline Generator (For @ai command)
const generateText = async (req, res) => {
    try {
        const { prompt } = req.body;
        if (!prompt) {
            return res.status(400).json({ message: "Prompt is required" });
        }
        console.log("Prompt:", prompt);
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
                ``
        const result = await model.generateContent(prompt);
        res.status(200).json({ text: result.response.text() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to generate AI response" });
    }
};

// 2. Conversational Bot (Keeps history)
// const chatWithBot = async (req, res) => {
//     try {
//         const { message, history } = req.body;
//         const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

//         // Start a chat session with previous history
//         const chat = model.startChat({ history: history || [] });
//         const result = await chat.sendMessage(message);
        
//         res.status(200).json({ text: result.response.text() });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: "AI Bot encountered an error" });
//     }
// };



// Make sure you have your genAI initialized here

const chatWithBot = async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        const userId = req.user.userId; // Assuming you have authentication middleware
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

        let chatDoc;
        let history = [];

        // 1. If we have a sessionId, fetch the existing chat
        if (sessionId) {
            chatDoc = await Chat.findOne({ _id: sessionId, userId });
            if (!chatDoc) return res.status(404).json({ message: "Chat not found" });

            // Format history for Gemini API
            history = chatDoc.messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));
        } else {
            // 2. If no sessionId, create a new chat document
            // Generate a short title based on the first message
            const title = message.split(' ').slice(0, 4).join(' ') + '...';
            chatDoc = new Chat({ userId, title, messages: [] });
        }

        // 3. Start Gemini chat and get response
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(message);
        const aiResponseText = result.response.text();

        // 4. Save both messages to the MongoDB document
        chatDoc.messages.push({ role: 'user', text: message });
        chatDoc.messages.push({ role: 'model', text: aiResponseText });
        await chatDoc.save();

        // 5. Send back the response AND the sessionId so React knows which chat this is
        res.status(200).json({ 
            text: aiResponseText, 
            sessionId: chatDoc._id,
            title: chatDoc.title
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "AI Bot encountered an error" });
    }
};

// NEW: Fetch all past chats for the sidebar
const getUserChats = async (req, res) => {
    try {
        const userId = req.user.userId;
        // Fetch chats, sorted by newest first. Only send _id and title to save bandwidth.
        const chats = await Chat.find({ userId }).select('_id title updatedAt').sort({ updatedAt: -1 });
        res.status(200).json({ success: true, chats });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch chat history" });
    }
};

// NEW: Fetch a specific chat's full message history
const getChatSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = req.user.userId;
        const chat = await Chat.findOne({ _id: sessionId, userId });
        
        if (!chat) return res.status(404).json({ message: "Chat not found" });
        res.status(200).json({ success: true, chat });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch session" });
    }
};

module.exports = { generateText,chatWithBot, getUserChats, getChatSession };
