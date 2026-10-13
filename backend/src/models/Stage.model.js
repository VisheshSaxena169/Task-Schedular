const mongoose = require('mongoose');

const stageSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true // e.g., "To Do", "In Progress", "Q&A"
        },
        boardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Board',
            required: true
        },
        order: {
            type: Number,
            required: true,
            default: 0 // Tracks the horizontal position of the column (left to right)
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Stage', stageSchema);