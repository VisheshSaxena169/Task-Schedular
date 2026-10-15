const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        default: 'New Chat'
    },
    messages: [{
        role: { type: String, enum: ['user', 'model'], required: true },
        text: { type: String, required: true }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Chat', chatSchema);