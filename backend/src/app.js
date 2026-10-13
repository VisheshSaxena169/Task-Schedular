const express = require("express");
const cors = require("cors")
const connectDB = require("./config/db");
const dns = require('node:dns')
dns.setServers(['1.1.1.1', '8.8.8.8'])
const userRoutes = require('./routes/user.routes');
const workspaceRoutes = require('./routes/workspace.route');
const stageRoutes = require('./routes/stage.route');
const boardRoutes = require('./routes/board.route');
const taskRoutes = require('./routes/task.routes');

const aiRoutes = require('./routes/ai.routes');
require('./config/redis');


const app = express();

// MongoDB Connection   
connectDB();

// Middleware
app.use(express.json());
app.use(cors())

app.use('/api/user', userRoutes);

// Test route
app.get("/", (req, res) => {
    res.send("Server is running successfully!");
});


// Assuming your base URL for this is /api/workspaces
app.use('/api/workspaces', workspaceRoutes);

app.use('/api/boards', boardRoutes);

app.use('/api/stages', stageRoutes)

app.use('/api/tasks', taskRoutes)

app.use('/api/ai', aiRoutes);


module.exports = app;
