const boardRepository = require('../repositories/board.repository');
const workspaceRepository = require('../repositories/workspace.repository');

const createBoard = async ({ workspaceId, userId, name, description }) => {
    // 1. Check if the workspace exists
    const workspace = await workspaceRepository.findWorkspaceById(workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    // 2. Security Check: Is the user a member of this workspace?
    const isMember = workspace.members.some(
        (m) => m.user._id.toString() === userId.toString()
    );

    if (!isMember) {
        throw new Error("Access denied: You must be a member of the workspace to create a board");
    }

    // 3. Create the board via repository
    const newBoard = await boardRepository.createBoard({
        workspaceId,
        createdBy: userId,
        name,
        description
    });

    return newBoard;
};


// ... existing createBoard function ...

const listBoards = async ({ workspaceId, userId }) => {
    // 1. Check if the workspace exists
    const workspace = await workspaceRepository.findWorkspaceById(workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    // 2. Security Check: Is the user a member of this workspace?
    const isMember = workspace.members.some(
        (m) => m.user._id.toString() === userId.toString()
    );

    if (!isMember) {
        throw new Error("Access denied: You must be a member of the workspace to view its boards");
    }

    // 3. Fetch all boards for this workspace via repository
    const boards = await boardRepository.findBoardsByWorkspaceId(workspaceId);

    return boards;
};

module.exports = {
    createBoard,
    listBoards // Export the new function
};

