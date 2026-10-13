// const express = require('express');
// const router = express.Router();
// const taskController = require('../controllers/task.controller');
// const verifytoken = require('../middlewares/verifytoken');

// // Apply authentication
// router.use(verifytoken);

// // Route 1: Create a Task inside a Board
// router.post('/:boardId/tasks', taskController.create);

// // Route 2: List all Tasks inside a Board
// router.get('/:boardId/tasks', taskController.list);

// // Route 3: Update a specific Task (status, details, or assignee)
// router.patch('/:boardId/tasks/:taskId', taskController.update);

// // Route 4: Delete a specific Task
// router.delete('/:boardId/tasks/:taskId', taskController.deleteTask);

// module.exports = router;


const express = require('express');
const router = express.Router();
const stageController = require('../controllers/stage.controller');
const verifytoken = require('../middlewares/verifytoken');

// Apply authentication to all stage routes
router.use(verifytoken);

// Route 1: Create a Stage inside a Board
router.post('/:boardId/stages', stageController.create);

// Route 2: List all Stages for a Board (sorted by order)
router.get('/:boardId/stages', stageController.list);

module.exports = router;