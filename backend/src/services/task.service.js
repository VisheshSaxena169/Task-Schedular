const taskRepository = require('../repositories/task.repository');
const boardRepository = require('../repositories/board.repository'); // Import existing board repo
const workspaceRepository = require('../repositories/workspace.repository'); // Import existing workspace repo
const Stage = require('../models/Stage.model');
const Task = require('../models/Task.model');

const createTask = async ({ boardId, stageId, userId, title, description, status, assignedTo }) => {
    // 1. Fetch the board to get its workspaceId
    // (You might need to add a findBoardById function to your board.repository if you don't have it)
    const board = await boardRepository.findBoardById(boardId);
    if (!board) throw new Error("Board not found");

    // 2. Fetch the workspace the board belongs to
    const workspace = await workspaceRepository.findWorkspaceById(board.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    // 3. Security Check: Is the user a member of this workspace?
    const isMember = workspace.members.some(
        (m) => m.user._id.toString() === userId.toString()
    );

    if (!isMember) {
        throw new Error("Access denied: You must be a workspace member to add tasks to this board");
    }

    // 4. Create the task via repository
    const newTask = await taskRepository.createTask({
        boardId,
        title,
        stageId,
        description,
        status: status || 'todo',
        assignedTo: assignedTo || null
    });

    return newTask;
};


// ... existing imports and createTask function ...



// ... existing imports ...

const listTasks = async ({ stageId, userId }) => {
    // 1. Fetch the stage to find which board it belongs to
    const stage = await Stage.findById(stageId);
    if (!stage) throw new Error("Stage not found");

    // 2. Fetch board to get its workspaceId
    const board = await boardRepository.findBoardById(stage.boardId);
    if (!board) throw new Error("Board not found");

    // 3. Fetch the workspace
    const workspace = await workspaceRepository.findWorkspaceById(board.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    // 4. Security Check: Is user a member of this workspace?
    const isMember = workspace.members.some(
        (m) => m.user._id.toString() === userId.toString()
    );

    if (!isMember) {
        throw new Error("Access denied: You must be a workspace member to view tasks on this board");
    }

    // 5. Fetch tasks assigned specifically to this stage, sorted by order
    const tasks = await Task.find({ stageId })
        .populate('assignedTo', 'name email')
        .sort('order');

    return tasks;
};

// ... existing imports and functions ...

const updateTask = async ({ boardId, taskId, userId, updateData }) => {
    // 1. Fetch the board to get its workspaceId
    const board = await boardRepository.findBoardById(boardId);
    if (!board) throw new Error("Board not found");

    // 2. Fetch the workspace and verify membership
    const workspace = await workspaceRepository.findWorkspaceById(board.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const isMember = workspace.members.some(
        (m) => m.user._id.toString() === userId.toString()
    );

    if (!isMember) {
        throw new Error("Access denied: You must be a workspace member to update tasks");
    }

    // 3. Fetch the task to ensure it exists and belongs to this board
    const existingTask = await taskRepository.findTaskById(taskId);
    if (!existingTask) throw new Error("Task not found");

    if (existingTask.boardId.toString() !== boardId.toString()) {
        throw new Error("Task does not belong to this board");
    }

    // 4. Update the task via repository
    const updatedTask = await taskRepository.updateTaskById(taskId, updateData);

    return updatedTask;
};

// ... existing functions ...

const deleteTask = async ({ taskId, userId }) => {
    // 1. Fetch the task first to ensure it exists and to extract its boardId
    const existingTask = await taskRepository.findTaskById(taskId);
    if (!existingTask) throw new Error("Task not found");

    const boardId = existingTask.boardId;

    // 2. Fetch the board to get its workspaceId
    const board = await boardRepository.findBoardById(boardId);
    if (!board) throw new Error("Board not found");

    // 3. Fetch the workspace and verify membership
    const workspace = await workspaceRepository.findWorkspaceById(board.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const isMember = workspace.members.some(
        (m) => m.user._id.toString() === userId.toString()
    );

    if (!isMember) {
        throw new Error("Access denied: You must be a workspace member to delete tasks");
    }

    // 4. Delete the task via repository
    await taskRepository.deleteTaskById(taskId);

    return true;
};

// Add this below your existing updateTask / deleteTask functions

// const moveTask = async ({ boardId, taskId, userId, destinationStageId, newOrder }) => {
//     // 1. Fetch the board to get its workspaceId
//     const board = await boardRepository.findBoardById(boardId);
//     if (!board) throw new Error("Board not found");

//     // 2. Fetch the workspace and verify membership
//     const workspace = await workspaceRepository.findWorkspaceById(board.workspaceId);
//     if (!workspace) throw new Error("Workspace not found");

//     const isMember = workspace.members.some(
//         (m) => m.user._id.toString() === userId.toString()
//     );

//     if (!isMember) {
//         throw new Error("Access denied: You must be a workspace member to move tasks");
//     }

//     // 3. Fetch the task to ensure it exists and belongs to this board
//     const task = await Task.findById(taskId);
//     if (!task) throw new Error("Task not found");

//     if (task.boardId.toString() !== boardId.toString()) {
//         throw new Error("Task does not belong to this board");
//     }

//     const sourceStageId = task.stageId;

//     // 4. Determine if it's a move within the same stage or to a different stage
//     if (sourceStageId.toString() === destinationStageId.toString()) {
//         // --- SAME STAGE MOVE ---

//         // Fetch all tasks in this stage, sorted by their current order
//         const tasksInStage = await Task.find({ stageId: sourceStageId }).sort('order');

//         // Remove the task from its old position
//         const taskIndex = tasksInStage.findIndex(t => t._id.toString() === taskId.toString());
//         if (taskIndex > -1) {
//             tasksInStage.splice(taskIndex, 1);
//         }

//         // Insert the task at its new position
//         tasksInStage.splice(newOrder, 0, task);

//         // Prepare bulk update operations to reset all order values sequentially
//         const bulkOps = tasksInStage.map((t, index) => ({
//             updateOne: {
//                 filter: { _id: t._id },
//                 update: { order: index }
//             }
//         }));

//         await Task.bulkWrite(bulkOps);

//     } else {
//         // --- DIFFERENT STAGE MOVE ---

//         // 4a. Fix order in the Source Stage
//         const sourceTasks = await Task.find({ stageId: sourceStageId }).sort('order');
//         const taskIndex = sourceTasks.findIndex(t => t._id.toString() === taskId.toString());
//         if (taskIndex > -1) {
//             sourceTasks.splice(taskIndex, 1); // Remove the task
//         }

//         const sourceBulkOps = sourceTasks.map((t, index) => ({
//             updateOne: {
//                 filter: { _id: t._id },
//                 update: { order: index }
//             }
//         }));
//         if (sourceBulkOps.length > 0) await Task.bulkWrite(sourceBulkOps);

//         // 4b. Insert and fix order in the Destination Stage
//         const destTasks = await Task.find({ stageId: destinationStageId }).sort('order');
//         destTasks.splice(newOrder, 0, task); // Insert at new position

//         const destBulkOps = destTasks.map((t, index) => ({
//             updateOne: {
//                 filter: { _id: t._id },
//                 // Make sure to also update the stageId for the moved task here
//                 update: { stageId: destinationStageId, order: index } 
//             }
//         }));
//         await Task.bulkWrite(destBulkOps);

//         // Update the instance in memory to return accurately
//         task.stageId = destinationStageId;
//     }

//     // 5. Update the task instance's order for the response and return it
//     task.order = newOrder;
//     return task;
// };

const moveTask = async ({ taskId, userId, destinationStageId, newOrder }) => {
    // 1. Fetch the task first to ensure it exists and to get its boardId
    console.log("ye hai taskId", taskId)
    const task = await Task.findById(taskId);
    console.log("ye hai task", task)
    if (!task) throw new Error("Task not found");

    const boardId = task.boardId;

    // 2. Fetch the board to get its workspaceId
    const board = await boardRepository.findBoardById(boardId);
    if (!board) throw new Error("Board not found");

    // 3. Fetch the workspace and verify membership
    const workspace = await workspaceRepository.findWorkspaceById(board.workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    const isMember = workspace.members.some(
        (m) => m.user._id.toString() === userId.toString()
    );

    if (!isMember) {
        throw new Error("Access denied: You must be a workspace member to move tasks");
    }

    const sourceStageId = task.stageId;

    // 4. Determine if it's a move within the same stage or to a different stage
    if (sourceStageId.toString() === destinationStageId.toString()) {
        // --- SAME STAGE MOVE ---

        // Fetch all tasks in this stage, sorted by their current order
        const tasksInStage = await Task.find({ stageId: sourceStageId }).sort('order');

        // Remove the task from its old position
        const taskIndex = tasksInStage.findIndex(t => t._id.toString() === taskId.toString());
        if (taskIndex > -1) {
            tasksInStage.splice(taskIndex, 1);
        }

        // Insert the task at its new position
        tasksInStage.splice(newOrder, 0, task);

        // Prepare bulk update operations to reset all order values sequentially
        const bulkOps = tasksInStage.map((t, index) => ({
            updateOne: {
                filter: { _id: t._id },
                update: { order: index }
            }
        }));

        await Task.bulkWrite(bulkOps);

    } else {
        // --- DIFFERENT STAGE MOVE ---

        // 4a. Fix order in the Source Stage
        const sourceTasks = await Task.find({ stageId: sourceStageId }).sort('order');
        const taskIndex = sourceTasks.findIndex(t => t._id.toString() === taskId.toString());
        if (taskIndex > -1) {
            sourceTasks.splice(taskIndex, 1); // Remove the task
        }

        const sourceBulkOps = sourceTasks.map((t, index) => ({
            updateOne: {
                filter: { _id: t._id },
                update: { order: index }
            }
        }));
        if (sourceBulkOps.length > 0) await Task.bulkWrite(sourceBulkOps);

        // 4b. Insert and fix order in the Destination Stage
        const destTasks = await Task.find({ stageId: destinationStageId }).sort('order');
        destTasks.splice(newOrder, 0, task); // Insert at new position

        const destBulkOps = destTasks.map((t, index) => ({
            updateOne: {
                filter: { _id: t._id },
                // Make sure to also update the stageId for the moved task here
                update: { stageId: destinationStageId, order: index }
            }
        }));
        await Task.bulkWrite(destBulkOps);

        // Update the instance in memory to return accurately
        task.stageId = destinationStageId;
    }

    // 5. Update the task instance's order for the response and return it
    task.order = newOrder;
    return task;
};

module.exports = {
    createTask,
    listTasks,
    updateTask,
    moveTask,
    deleteTask // Export the new function
};










