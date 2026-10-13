const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspace.controller');
const verifytoken = require('../middlewares/verifytoken'); // Your auth middleware
// const { validate, createWorkspaceSchema } = require('../middlewares/validate'); // Add this later if you use validation

const boardController = require('../controllers/board.controller'); // Add this import at the top

// Apply authentication to all workspace routes
router.use(verifytoken); 

// Route 1: Create a workspace
router.post('/', workspaceController.create);

// Route 2: Get all workspaces for the logged-in user
router.get('/', workspaceController.list);

// Route 3: Get a single workspace by ID
router.get('/:id', workspaceController.getOne);

// Route 4: Update a workspace (rename)
router.patch('/:id', workspaceController.update);

// Route 5: Delete a workspace entirely
router.delete('/:id', workspaceController.deleteWorkspace);

// Route 6: Invite a member to the workspace
router.post('/:id/members', workspaceController.invite);

// Route 7: List all members of a workspace
router.get('/:id/members', workspaceController.listMembers);

// Route 8: Change a member's role
router.patch('/:id/members/:userId', workspaceController.changeRole);

// Route 9: Remove a member from the workspace
router.delete('/:id/members/:userId', workspaceController.removeMember);

// Route 10: Create a Board inside a Workspace
router.post('/:workspaceId/boards', boardController.create);

// Route 11: List all Boards inside a Workspace
router.get('/:workspaceId/boards', boardController.list);

// Route 12: Get chat history for a workspace
router.get('/:id/messages', workspaceController.getMessages);

// Route 13: Send a new chat message
router.post('/:id/messages', workspaceController.sendMessage);

// Edit a specific message
router.patch('/:id/messages/:msgId', workspaceController.editMessage);

// Delete a specific message
router.delete('/:id/messages/:msgId', workspaceController.deleteMessage);

// Clear all messages in a workspace
router.delete('/:id/messages', workspaceController.clearChat);

module.exports = router;