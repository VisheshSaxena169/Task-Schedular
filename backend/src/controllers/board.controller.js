const boardService = require('../services/board.service');

const create = async (req, res) => {
    try {
        const workspaceId = req.params.workspaceId;
        const userId = req.user.userId;
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Board name is required" });
        }

        // Call the service layer
        const board = await boardService.createBoard({
            workspaceId,
            userId,
            name,
            description
        });

        res.status(201).json({
            success: true,
            message: "Board created successfully",
            board
        });

    } catch (error) {
        console.error("Error creating board:", error);
        
        if (error.message.includes('Access denied')) {
            return res.status(403).json({ success: false, message: error.message });
        }
        if (error.message.includes('not found')) {
            return res.status(404).json({ success: false, message: error.message });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create board",
            error: error.message
        });
    }
};

// ... existing create function ...

const list = async (req, res) => {
    try {
        const workspaceId = req.params.workspaceId;
        const userId = req.user.userId;

        // Call the service layer
        const boards = await boardService.listBoards({
            workspaceId,
            userId
        });

        res.status(200).json({
            success: true,
            boards
        });

    } catch (error) {
        console.error("Error listing boards:", error);
        
        if (error.message.includes('Access denied')) {
            return res.status(403).json({ success: false, message: error.message });
        }
        if (error.message.includes('not found')) {
            return res.status(404).json({ success: false, message: error.message });
        }

        res.status(500).json({
            success: false,
            message: "Failed to fetch boards",
            error: error.message
        });
    }
};

module.exports = {
    create,
    list // Export the new function
};

