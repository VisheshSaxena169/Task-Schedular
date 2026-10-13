const Task = require('../models/Task.model');

const createTask = async (taskData) => {
    const task = new Task(taskData);
    return await task.save();
};



// ... existing createTask function ...

const findTasksByBoardId = async (boardId) => {
    return await Task.find({ boardId })
        .populate('assignedTo', 'name email') // Includes name and email of assignee
        .sort({ createdAt: -1 });
};

// ... existing imports and functions ...

const findTaskById = async (taskId) => {
    return await Task.findById(taskId);
};

const updateTaskById = async (taskId, updateData) => {
    return await Task.findByIdAndUpdate(
        taskId,
        { $set: updateData }, // Updates only the fields provided in the request body
        { new: true }         // Returns the newly updated document
    ).populate('assignedTo', 'name email');
};

// ... existing functions ...

const deleteTaskById = async (taskId) => {
    return await Task.findByIdAndDelete(taskId);
};

module.exports = {
    createTask,
    findTasksByBoardId,
    findTaskById,
    updateTaskById,
    deleteTaskById // Export the new function
};
