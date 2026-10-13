const Workspace = require('../models/Workspace.model'); // Adjust path to your model
const workspaceRepository = require('../repositories/workspace.repository');

// Import the userRepository at the top of the file!
const userRepository = require('../repositories/user.repository');

const createWorkspace = async ({ name, ownerId }) => {
    // 1. Create the new workspace
    const newWorkspace = new Workspace({
        name,
        owner: ownerId,
        members: [
            {
                user: ownerId,
                role: 'owner' // Make the creator the owner automatically
            }
        ]
    });

    // 2. Save it to the database
    await newWorkspace.save();

    // 3. Return the created workspace
    return newWorkspace;
};

const listMyWorkspaces = async (userId) => {
    // Call the repository to fetch data from MongoDB
    const workspaces = await workspaceRepository.findWorkspacesByUserId(userId);
    return workspaces;
};

// ... existing createWorkspace and listMyWorkspaces functions ...

const getWorkspace = async (workspaceId, userId) => {
    // 1. Fetch from repository
    const workspace = await workspaceRepository.findWorkspaceById(workspaceId);

    // 2. Check if it exists
    if (!workspace) {
        throw new Error("Workspace not found");
    }

    // 3. Security Check: Is the user inside the members array?
    // We convert both IDs to strings to ensure they match exactly
    const isMember = workspace.members.some(
        (member) => member.user._id.toString() === userId.toString()
    );

    if (!isMember) {
        throw new Error("Access denied: You are not a member of this workspace");
    }

    return workspace;
};





const updateWorkspace = async ({ workspaceId, name, userId }) => {
    // 1. Fetch the workspace
    const workspace = await workspaceRepository.findWorkspaceById(workspaceId);

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    // 2. Find the user in the members array
    const member = workspace.members.find(
        (m) => m.user._id.toString() === userId.toString()
    );

    // 3. Security & Role Checks
    if (!member) {
        throw new Error("Access denied: You are not a member of this workspace");
    }

    // Only owners and admins can rename the workspace
    if (member.role !== 'owner' && member.role !== 'admin') {
        throw new Error("Access denied: You do not have permission to update this workspace");
    }

    // 4. Update via repository
    const updatedWorkspace = await workspaceRepository.updateWorkspaceName(workspaceId, name);
    
    return updatedWorkspace;
};


// ... existing functions ...

const deleteWorkspace = async ({ workspaceId, userId }) => {
    // 1. Fetch the workspace
    const workspace = await workspaceRepository.findWorkspaceById(workspaceId);

    if (!workspace) {
        throw new Error("Workspace not found");
    }

    // 2. Find the user in the members array
    const member = workspace.members.find(
        (m) => m.user._id.toString() === userId.toString()
    );

    // 3. Security & Role Checks
    if (!member) {
        throw new Error("Access denied: You are not a member of this workspace");
    }

    // STRICT CHECK: Only the owner can delete the entire workspace
    if (member.role !== 'owner') {
        throw new Error("Access denied: Only the workspace owner can delete it");
    }

    // 4. Delete via repository
    await workspaceRepository.deleteWorkspaceById(workspaceId);
    
    return true; // Return true to indicate success
};






// ... existing functions ...

const inviteMember = async ({ workspaceId, inviterId, inviteeEmail, role }) => {
    // 1. Fetch the workspace
    const workspace = await workspaceRepository.findWorkspaceById(workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    // 2. Check Inviter's Permissions (Must be 'owner' or 'admin')
    const inviter = workspace.members.find(
        (m) => m.user._id.toString() === inviterId.toString()
    );

    if (!inviter) throw new Error("Access denied: You are not a member of this workspace");
    if (inviter.role !== 'owner' && inviter.role !== 'admin') {
        throw new Error("Access denied: Only owners and admins can invite new members");
    }

    // 3. Find the Invitee by Email (Using your existing User logic)
    const invitee = await userRepository.findByEmail(inviteeEmail);
    if (!invitee) {
        throw new Error("User with this email not found. They must sign up first.");
    }

    // 4. Check if the invitee is already in the workspace
    const isAlreadyMember = workspace.members.some(
        (m) => m.user._id.toString() === invitee._id.toString()
    );
    
    if (isAlreadyMember) {
        throw new Error("User is already a member of this workspace");
    }

    // 5. Add the member via repository
    await workspaceRepository.addMemberToWorkspace(workspaceId, {
        user: invitee._id,
        role: role
    });

    // Return safe user data
    return {
        id: invitee._id,
        name: invitee.name,
        email: invitee.email,
        role: role
    };
};

// ... existing functions ...

const listMembers = async ({ workspaceId, userId }) => {
    // 1. Fetch the workspace using our existing repository function
    const workspace = await workspaceRepository.findWorkspaceById(workspaceId);
    
    if (!workspace) {
        throw new Error("Workspace not found");
    }

    // 2. Check if the requesting user is actually a member
    const isMember = workspace.members.some(
        (m) => m.user._id.toString() === userId.toString()
    );

    if (!isMember) {
        throw new Error("Access denied: You are not a member of this workspace");
    }

    // 3. Return just the members array
    // (Our repository already populated the user names and emails for us!)
    return workspace.members;
};

// ... existing functions ...

const changeMemberRole = async ({ workspaceId, actingUserId, targetUserId, newRole }) => {
    // 1. Fetch the workspace
    const workspace = await workspaceRepository.findWorkspaceById(workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    // 2. Find both users in the workspace members array
    const actingMember = workspace.members.find(m => m.user._id.toString() === actingUserId.toString());
    const targetMember = workspace.members.find(m => m.user._id.toString() === targetUserId.toString());

    if (!actingMember) throw new Error("Access denied: You are not a member of this workspace");
    if (!targetMember) throw new Error("Target user is not a member of this workspace");

    // 3. Security checks
    if (actingMember.role !== 'owner' && actingMember.role !== 'admin') {
        throw new Error("Access denied: Only owners and admins can change roles");
    }

    if (targetMember.role === 'owner') {
        throw new Error("Access denied: Cannot change the role of the workspace owner");
    }

    if (actingUserId.toString() === targetUserId.toString() && actingMember.role === 'owner') {
        throw new Error("Access denied: Owner cannot demote themselves. Transfer ownership instead.");
    }

    // Validate the new role
    const validRoles = ['admin', 'member', 'viewer']; // Owner is excluded, can't make two owners this way
    if (!validRoles.includes(newRole)) {
        throw new Error("Invalid role provided");
    }

    // 4. Update via repository
    await workspaceRepository.updateMemberRole(workspaceId, targetUserId, newRole);

    return {
        user: targetMember.user._id,
        role: newRole
    };
};

// ... existing functions ...

const removeMember = async ({ workspaceId, actingUserId, targetUserId }) => {
    // 1. Fetch the workspace
    const workspace = await workspaceRepository.findWorkspaceById(workspaceId);
    if (!workspace) throw new Error("Workspace not found");

    // 2. Find both users in the workspace members array
    const actingMember = workspace.members.find(m => m.user._id.toString() === actingUserId.toString());
    const targetMember = workspace.members.find(m => m.user._id.toString() === targetUserId.toString());

    if (!actingMember) throw new Error("Access denied: You are not a member of this workspace");
    if (!targetMember) throw new Error("Target user is not a member of this workspace");

    // 3. Security checks
    // If the user is trying to remove someone ELSE, they must be an admin or owner
    const isRemovingSelf = actingUserId.toString() === targetUserId.toString();
    
    if (!isRemovingSelf && actingMember.role !== 'owner' && actingMember.role !== 'admin') {
        throw new Error("Access denied: Only owners and admins can remove other members");
    }

    // Nobody can remove the owner (the owner must delete the workspace or transfer ownership)
    if (targetMember.role === 'owner') {
        throw new Error("Access denied: Cannot remove the workspace owner");
    }

    // 4. Remove via repository
    await workspaceRepository.removeMemberFromWorkspace(workspaceId, targetUserId);

    return true;
};

module.exports = {
    createWorkspace, listMyWorkspaces, getWorkspace, updateWorkspace, deleteWorkspace, inviteMember, listMembers, changeMemberRole,
    removeMember // Export the new function
};







