const Workspace = require('../models/workspace.model');

const findWorkspacesByUserId = async (userId) => {
    // Find workspaces where the "user" field inside the "members" array matches the userId.
    // We use .populate() to get the actual user details (like name and email) instead of just the ID.
    return await Workspace.find({ 'members.user': userId })
        .populate('owner', 'name email') // Gets the owner's name and email
        .sort({ createdAt: -1 }); // Sorts by newest first
};


const findWorkspaceById = async (workspaceId) => {
    return await Workspace.findById(workspaceId)
        .populate('owner', 'name email') // Get owner's name and email
        .populate('members.user', 'name email'); // Get member details too
};


// ... existing functions ...

const updateWorkspaceName = async (workspaceId, newName) => {
    return await Workspace.findByIdAndUpdate(
        workspaceId,
        { name: newName },
        { new: true } // Returns the modified document instead of the original
    )
    .populate('owner', 'name email')
    .populate('members.user', 'name email');
};

const deleteWorkspaceById = async (workspaceId) => {
    return await Workspace.findByIdAndDelete(workspaceId);
};

// ... existing functions ...

const addMemberToWorkspace = async (workspaceId, memberData) => {
    return await Workspace.findByIdAndUpdate(
        workspaceId,
        { $push: { members: memberData } }, // $push adds an item to an array
        { new: true }
    )
    .populate('owner', 'name email')
    .populate('members.user', 'name email');
};

// ... existing functions ...

const updateMemberRole = async (workspaceId, targetUserId, newRole) => {
    // We match the workspace AND the specific user inside the members array
    // Then we use the positional operator `$` to update that specific member's role
    return await Workspace.findOneAndUpdate(
        { 
            _id: workspaceId, 
            'members.user': targetUserId 
        },
        { 
            $set: { 'members.$.role': newRole } 
        },
        { new: true }
    );
};


// ... existing functions ...

const removeMemberFromWorkspace = async (workspaceId, targetUserId) => {
    // $pull removes the object from the members array where the user ID matches
    return await Workspace.findByIdAndUpdate(
        workspaceId,
        { 
            $pull: { members: { user: targetUserId } } 
        },
        { new: true }
    );
};

module.exports = {
    findWorkspacesByUserId, findWorkspaceById, updateWorkspaceName, deleteWorkspaceById, addMemberToWorkspace, updateMemberRole,
    removeMemberFromWorkspace // Export the new function
};





