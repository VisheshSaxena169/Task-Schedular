
const taskService = require('../services/task.service');
const socketUtil = require('../utils/socket'); // Adjust path if necessary
const redisClient = require('../config/redis');
const { invalidate } = require('../utils/cache');
const taskRepository = require('../repositories/task.repository');

const create = async (req, res) => {
    try {
        const { stageId } = req.params;
        const userId = req.user.userId;
        const { boardId, title, description, assignedTo } = req.body;

        if (!boardId) {
            return res.status(400).json({ success: false, message: "boardId is required in the body" });
        }

        if (!title) {
            return res.status(400).json({ success: false, message: "Task title is required" });
        }

        // Passes stageId instead of a static status. 
        // The service should automatically assign this task the highest 'order' number 
        // in the current stage so it appears at the bottom of the column.
        const task = await taskService.createTask({
            boardId,
            stageId,
            userId,
            title,
            description,
            assignedTo
        });

        await invalidate(`tasks:stage:${stageId}`);

        res.status(201).json({ success: true, message: "Task created successfully", task });
    } catch (error) {
        handleTaskError(res, error, "Failed to create task");
    }
};

// const list = async (req, res) => {
//     try {
//         // const boardId = req.params.boardId;
//         const stageId=req.params.stageId;
//         const userId = req.user.userId;
//         // console.log( "ye hai boardId",boardId);

//         const tasks = await taskService.listTasks({stageId, userId });

//         res.status(200).json({ success: true, tasks });
//     } catch (error) {
//         handleTaskError(res, error, "Failed to fetch tasks");
//     }
// };




// Inside your list tasks controller:
const list = async (req, res) => {
    try {
        const { stageId } = req.params;
        const userId = req.user.userId;
        const cacheKey = `tasks:stage:${stageId}`;

        // 1. Ask Docker Redis if it has the data
        const cachedTasks = await redisClient.get(cacheKey);

        if (cachedTasks) {
            console.log(`⚡ [REDIS HIT] Serving tasks from cache for stage: ${stageId}`);
            return res.status(200).json({ success: true, tasks: JSON.parse(cachedTasks) });
        }

        // 2. If not in Redis, fetch from MongoDB
        console.log(`🐢 [REDIS MISS] Fetching tasks from MongoDB for stage: ${stageId}`);

        // 2. If not, fetch from MongoDB
        const tasks = await taskService.listTasks({ stageId, userId });

        // 3. Save to Docker Redis for 1 hour (3600 seconds)
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(tasks));

        res.status(200).json({ success: true, tasks });
    } catch (error) {
        handleTaskError(res, error, "Failed to fetch tasks");
    }
};



const update = async (req, res) => {
    try {
        const { boardId, taskId } = req.params;
        const userId = req.user.userId;
        
        // Ensure frontend doesn't accidentally trigger a stage move via standard update
        const { stageId, order, ...updateData } = req.body; 

        const task = await taskService.updateTask({
            boardId,
            taskId,
            userId,
            updateData
        });

        // 🗑️ Invalidate cache for the stage this task belongs to
        if (task && task.stageId) {
            await invalidate(`tasks:stage:${task.stageId}`);
        }

        res.status(200).json({ success: true, message: "Task updated successfully", task });
    } catch (error) {
        handleTaskError(res, error, "Failed to update task");
    }
};

// NEW: Dedicated Drag and Drop Controller
// const moveTask = async (req, res) => {
//     try {
//         const { boardId, taskId } = req.params;
//         const userId = req.user.userId;
        
//         // destinationStageId: the stage it was dropped into.
//         // newOrder: the exact index/position it was dropped at.
//         const { destinationStageId, newOrder } = req.body;

//         if (!destinationStageId || newOrder === undefined) {
//             return res.status(400).json({ success: false, message: "destinationStageId and newOrder are required" });
//         }

//         // The service layer must shift the 'order' values of all other tasks in the 
//         // affected stages to make room for this task at its new index.
//         const updatedTask = await taskService.moveTask({
//             boardId,
//             taskId,
//             userId,
//             destinationStageId,
//             newOrder
//         });

//         res.status(200).json({ 
//             success: true, 
//             message: "Task moved successfully", 
//             task: updatedTask 
//         });
//     } catch (error) {
//         handleTaskError(res, error, "Failed to move task");
//     }
// };


const moveTask = async (req, res) => {
    try {
        const { taskId } = req.params;
        const userId = req.user.userId;
        const { destinationStageId, newOrder } = req.body;

        if (!destinationStageId || newOrder === undefined) {
            return res.status(400).json({ success: false, message: "destinationStageId and newOrder are required" });
        }

        // 1. Find the task BEFORE moving it so we know which old stage cache to clear
        const existingTask = await taskRepository.findTaskById(taskId);
        const oldStageId = existingTask ? existingTask.stageId.toString() : null;

        // Update the database
        const updatedTask = await taskService.moveTask({
            taskId, 
            userId,
            destinationStageId,
            newOrder
        });

        // Extract boardId from the newly updated task
        const boardId = updatedTask.boardId.toString();

        // 3. 🗑️ Invalidate BOTH the old stage cache and the new destination stage cache
        if (oldStageId) {
            await invalidate(`tasks:stage:${oldStageId}`);
        }
        await invalidate(`tasks:stage:${destinationStageId}`);

        // --- UPDATED SOCKET EMIT LOGIC ---
        try {
            const io = socketUtil.getIO();
            // Emit specifically to the users sitting in this board's room
            io.to(boardId).emit('task_moved', { 
                taskId, 
                destinationStageId, 
                newOrder 
            });
            console.log(`Live update sent to board room: ${boardId}`);
        } catch (socketError) {
            console.error("Socket error during task move:", socketError);
        }

        res.status(200).json({ 
            success: true, 
            message: "Task moved successfully", 
            task: updatedTask 
        });
    } catch (error) {
        handleTaskError(res, error, "Failed to move task");
    }
};

const deleteTask = async (req, res) => {
    try {
        const {  taskId } = req.params;
        const userId = req.user.userId;
        // 1. Find the task BEFORE deleting it so we know which stage cache to clear
        const taskToDelete = await Task.findById(taskId);

        await taskService.deleteTask({ taskId, userId });

        // 3. 🗑️ Invalidate cache for the stage the task was in
        if (taskToDelete && taskToDelete.stageId) {
            await invalidate(`tasks:stage:${taskToDelete.stageId}`);
        }

        res.status(200).json({ success: true, message: "Task deleted successfully" });
    } catch (error) {
        handleTaskError(res, error, "Failed to delete task");
    }
};

// Helper function to keep controllers DRY
const handleTaskError = (res, error, defaultMessage) => {
    console.error(`[Task Controller Error]:`, error);
    if (error.message.includes('Access denied')) {
        return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message.includes('not found') || error.message.includes('belong to')) {
        return res.status(404).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: defaultMessage, error: error.message });
};

module.exports = {
    create,
    list,
    update,
    moveTask,
    deleteTask
};
