const { GoogleGenerativeAI } = require('@google/generative-ai');

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
const chatWithBot = async (req, res) => {
    try {
        const { message, history } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

        // Start a chat session with previous history
        const chat = model.startChat({ history: history || [] });
        const result = await chat.sendMessage(message);
        
        res.status(200).json({ text: result.response.text() });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "AI Bot encountered an error" });
    }
};

module.exports = { generateText, chatWithBot };