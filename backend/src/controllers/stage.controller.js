const Stage = require('../models/Stage.model');
const Task = require('../models/Task.model');

const create = async (req, res) => {
    try {
        const { boardId } = req.params;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: "Stage name is required" });
        }

        // Find the highest 'order' in this board to place the new stage at the end
        const lastStage = await Stage.findOne({ boardId }).sort('-order');
        const newOrder = lastStage ? lastStage.order + 1 : 0;

        const stage = await Stage.create({
            boardId,
            name,
            order: newOrder
        });

        res.status(201).json({ 
            success: true, 
            message: "Stage created successfully", 
            stage 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to create stage", error: error.message });
    }
};

const list = async (req, res) => {
    try {
        const { boardId } = req.params;
        
        // Return stages sorted horizontally by their 'order' index
        const stages = await Stage.find({ boardId }).sort('order');
        
        res.status(200).json({ success: true, stages });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch stages", error: error.message });
    }
};

const update = async (req, res) => {
    try {
        const { boardId, stageId } = req.params;
        const { name, order } = req.body; // order is included here in case you want to drag-and-drop the columns themselves

        const stage = await Stage.findOneAndUpdate(
            { _id: stageId, boardId },
            { name, order },
            { new: true }
        );

        if (!stage) {
            return res.status(404).json({ success: false, message: "Stage not found" });
        }

        res.status(200).json({ success: true, message: "Stage updated successfully", stage });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to update stage", error: error.message });
    }
};

const deleteStage = async (req, res) => {
    try {
        const {  stageId } = req.params;

        const stage = await Stage.findOneAndDelete({ _id: stageId});
        
        if (!stage) {
            return res.status(404).json({ success: false, message: "Stage not found" });
        }

        // Automatically delete all tasks resting inside this column to prevent orphaned data
        await Task.deleteMany({ stageId });

        res.status(200).json({ success: true, message: "Stage deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete stage", error: error.message });
    }
};

module.exports = {
    create,
    list,
    update,
    deleteStage
};