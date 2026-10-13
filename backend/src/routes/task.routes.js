const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const verifytoken = require('../middlewares/verifytoken');

router.use(verifytoken);

// 3. Update standard task details (title, description, or assignee)
router.patch('/:taskId', taskController.update);

// 4. NEW: Drag and Drop - Move a task between stages or reorder within the same stage
router.patch('/:taskId/move', taskController.moveTask);

// 5. Delete a specific Task
router.delete('/:taskId', taskController.deleteTask);

module.exports = router;