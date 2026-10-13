const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const stageController = require('../controllers/stage.controller');
const verifytoken = require('../middlewares/verifytoken');

router.use(verifytoken);

// Route 3: Update a specific Stage (Rename or manually reorder columns)
router.patch('/:stageId', stageController.update);

// Route 4: Delete a specific Stage
router.delete('/:stageId', stageController.deleteStage);

// 1. Create a Task inside a specific Stage dynamically
router.post('/:stageId/tasks', taskController.create);

// 2. List all Tasks inside a Board (Your service should group these by stageId)
router.get('/:stageId/tasks', taskController.list);


module.exports = router;