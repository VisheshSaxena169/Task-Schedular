const Board = require('../models/boards.model');

const createBoard = async (boardData) => {
    const board = new Board(boardData);
    return await board.save();
};


// ... existing createBoard function ...

const findBoardsByWorkspaceId = async (workspaceId) => {
    return await Board.find({ workspaceId })
        .populate('createdBy', 'name email') // Gets the creator's name and email
        .sort({ createdAt: -1 }); // Sorts by newest first
};

// Add this inside repositories/board.repository.js
const findBoardById = async (boardId) => {
    return await Board.findById(boardId);
};
// Make sure to add it to module.exports!

module.exports = {
    createBoard,
    findBoardsByWorkspaceId, // Export the new function
    findBoardById 
};

