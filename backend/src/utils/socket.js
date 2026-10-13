// utils/socket.js
let io;
// This Map will store connected users. Key: User ID, Value: Socket ID
const userSocketMap = new Map(); 

module.exports = {
    init: (httpServer) => {
        const { Server } = require('socket.io');
        io = new Server(httpServer, {
            cors: {
                origin: "http://localhost:5173", // Your React frontend URL
                methods: ["GET", "POST"]
            }
        });

        io.on('connection', (socket) => {
            // When a user connects from React, they will send their User ID
            const userId = socket.handshake.query.userId;
            if (userId) {
                userSocketMap.set(userId, socket.id);
                console.log(`User ${userId} connected with socket ${socket.id}`);
            }

            // ... existing connection logic ...

socket.on('disconnect', () => {
    if (userSocketMap.get(userId) === socket.id) {
        userSocketMap.delete(userId);
    }
});

// --- NEW ROOM LOGIC ---
// When a user opens a Workspace page in React, they will ask to join this room
socket.on('join_workspace', (workspaceId) => {
    socket.join(workspaceId);
    console.log(`Socket ${socket.id} joined workspace room ${workspaceId}`);
});

// When they leave the page, they leave the room
socket.on('leave_workspace', (workspaceId) => {
    socket.leave(workspaceId);
    console.log(`Socket ${socket.id} left workspace room ${workspaceId}`);
});
        });

        return io;
    },
    getIO: () => {
        if (!io) throw new Error("Socket.io not initialized!");
        return io;
    },
    getReceiverSocketId: (userId) => {
        return userSocketMap.get(userId);
    }
};