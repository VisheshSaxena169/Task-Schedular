const workspaceService = require('../services/workspace.service');
const socketUtil = require('../utils/socket'); // Import the socket utility

const Message = require('../models/Message.model'); // Import the model directly for simplicity here

// Add these imports at the top
const { sendRoleAssignmentEmail } = require('../utils/email.utils');
const Workspace = require('../models/Workspace.model'); // Adjust path as needed


const create = async (req, res) => {
    try {
        const { name } = req.body;
        
        // We get the userId from the verifytoken middleware
        const userId = req.user.userId; 

        if (!name) {
            return res.status(400).json({ 
                success: false, 
                message: "Workspace name is required" 
            });
        }

        // Call the service layer to interact with the database
        const workspace = await workspaceService.createWorkspace({ 
            name, 
            ownerId: userId 
        });

        // Send the response back to the client
        res.status(201).json({ 
            success: true,
            message: "Workspace created successfully",
            workspace 
        });

    } catch (error) {
        console.error("Error in create workspace:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create workspace",
            error: error.message
        });
    }
};


const list = async (req, res) => {
    try {
        // Get the userId from the verifytoken middleware
        const userId = req.user.userId; 

        // Call the service layer
        const workspaces = await workspaceService.listMyWorkspaces(userId);

        res.status(200).json({
            success: true,
            workspaces
        });

    } catch (error) {
        console.error("Error in list workspaces:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch workspaces",
            error: error.message
        });
    }
};


// ... existing create and list functions ...

const getOne = async (req, res) => {
    try {
        const workspaceId = req.params.id; // Extracts the ID from the URL
        const userId = req.user.userId;    // Extracted from verifytoken

        // Call the service layer
        const workspace = await workspaceService.getWorkspace(workspaceId, userId);

        res.status(200).json({
            success: true,
            workspace
        });

    } catch (error) {
        console.error("Error in getOne workspace:", error);
        
        // If the service throws a specific error, we send a 403 (Forbidden) or 404 (Not Found)
        if (error.message.includes('Access denied')) {
            return res.status(403).json({ success: false, message: error.message });
        }
        if (error.message.includes('not found')) {
            return res.status(404).json({ success: false, message: error.message });
        }

        res.status(500).json({
            success: false,
            message: "Failed to fetch workspace",
            error: error.message
        });
    }
};


// ... existing create, list, getOne functions ...

const update = async (req, res) => {
    try {
        const workspaceId = req.params.id;
        const userId = req.user.userId;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ 
                success: false, 
                message: "New workspace name is required" 
            });
        }

        // Call the service layer
        const workspace = await workspaceService.updateWorkspace({
            workspaceId, 
            name, 
            userId
        });

        res.status(200).json({
            success: true,
            message: "Workspace updated successfully",
            workspace
        });

    } catch (error) {
        console.error("Error in update workspace:", error);
        
        if (error.message.includes('Access denied')) {
            return res.status(403).json({ success: false, message: error.message });
        }
        if (error.message.includes('not found')) {
            return res.status(404).json({ success: false, message: error.message });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update workspace",
            error: error.message
        });
    }
};


// ... existing functions ...

const deleteWorkspace = async (req, res) => {
    try {
        const workspaceId = req.params.id;
        const userId = req.user.userId;

        // Call the service layer
        await workspaceService.deleteWorkspace({
            workspaceId, 
            userId
        });

        res.status(200).json({
            success: true,
            message: "Workspace deleted successfully"
        });

    } catch (error) {
        console.error("Error in delete workspace:", error);
        
        if (error.message.includes('Access denied')) {
            return res.status(403).json({ success: false, message: error.message });
        }
        if (error.message.includes('not found')) {
            return res.status(404).json({ success: false, message: error.message });
        }

        res.status(500).json({
            success: false,
            message: "Failed to delete workspace",
            error: error.message
        });
    }
};

// ... existing functions ...

const invite = async (req, res) => {
    try {
        const workspaceId = req.params.id;
        const inviterId = req.user.userId;
        const { email, role } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: "User email is required to invite them" 
            });
        }

        const assignedRole = role || 'member'; // Default to 'member' if no role is provided
        // Call the service layer
        const member = await workspaceService.inviteMember({
            workspaceId,
            inviterId,
            inviteeEmail: email,
            role: assignedRole // Default to 'member' if no role is provided
        });

        // --- NEW EMAIL NOTIFICATION LOGIC ---
        // Fetch the workspace to get its name for the email template
        try {
            const workspace = await Workspace.findById(workspaceId);
            if (workspace) {
                // We do NOT use 'await' here so the API doesn't wait for the email to send.
                // It sends silently in the background!
                sendRoleAssignmentEmail(
                    email, 
                    workspace.name, 
                    assignedRole
                ).catch(err => console.error("Background email failed:", err));
            }
        } catch (emailTriggerError) {
            console.error("Could not trigger email:", emailTriggerError);
        }


        // 1. Find if the invited user is currently online
        const receiverSocketId = socketUtil.getReceiverSocketId(member.id.toString());
        
        // 2. If they are online, emit the event directly to them
        if (receiverSocketId) {
            const io = socketUtil.getIO();
            io.to(receiverSocketId).emit("new_invite", {
                message: `You have been invited to a new workspace as a ${role}!`,
                workspaceId: workspaceId
            });
        }

        res.status(201).json({
            success: true,
            message: "Member added to workspace successfully",
            member
        });

    } catch (error) {
        console.error("Error in invite member:", error);
        
        if (error.message.includes('Access denied')) {
            return res.status(403).json({ success: false, message: error.message });
        }
        if (error.message.includes('not found') || error.message.includes('must sign up')) {
            return res.status(404).json({ success: false, message: error.message });
        }
        if (error.message.includes('already a member')) {
            return res.status(400).json({ success: false, message: error.message });
        }

        res.status(500).json({
            success: false,
            message: "Failed to invite member",
            error: error.message
        });
    }
};

// ... existing functions ...

const listMembers = async (req, res) => {
    try {
        const workspaceId = req.params.id;
        const userId = req.user.userId;

        // Call the service layer
        const members = await workspaceService.listMembers({
            workspaceId, 
            userId
        });

        res.status(200).json({
            success: true,
            members
        });

    } catch (error) {
        console.error("Error in list members:", error);
        
        if (error.message.includes('Access denied')) {
            return res.status(403).json({ success: false, message: error.message });
        }
        if (error.message.includes('not found')) {
            return res.status(404).json({ success: false, message: error.message });
        }

        res.status(500).json({
            success: false,
            message: "Failed to fetch members",
            error: error.message
        });
    }
};

// ... existing functions ...

const changeRole = async (req, res) => {
    try {
        const workspaceId = req.params.id;
        const targetUserId = req.params.userId;
        const actingUserId = req.user.userId;
        const { role } = req.body; // the new role

        if (!role) {
            return res.status(400).json({ success: false, message: "New role is required" });
        }

        // Call the service layer
        const member = await workspaceService.changeMemberRole({
            workspaceId,
            actingUserId,
            targetUserId,
            newRole: role
        });

        res.status(200).json({
            success: true,
            message: "Member role updated successfully",
            member
        });

    } catch (error) {
        console.error("Error changing role:", error);
        
        if (error.message.includes('Access denied')) {
            return res.status(403).json({ success: false, message: error.message });
        }
        if (error.message.includes('not found')) {
            return res.status(404).json({ success: false, message: error.message });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update member role",
            error: error.message
        });
    }
};

// ... existing functions ...

const removeMember = async (req, res) => {
    try {
        const workspaceId = req.params.id;
        const targetUserId = req.params.userId;
        const actingUserId = req.user.userId;

        // Call the service layer
        await workspaceService.removeMember({
            workspaceId,
            actingUserId,
            targetUserId
        });

        res.status(200).json({
            success: true,
            message: "Member removed from workspace successfully"
        });

    } catch (error) {
        console.error("Error removing member:", error);
        
        if (error.message.includes('Access denied')) {
            return res.status(403).json({ success: false, message: error.message });
        }
        if (error.message.includes('not found')) {
            return res.status(404).json({ success: false, message: error.message });
        }

        res.status(500).json({
            success: false,
            message: "Failed to remove member",
            error: error.message
        });
    }
};




const getMessages = async (req, res) => {
    try {
        const workspaceId = req.params.id;
        // Fetch all messages for this workspace, sorted from oldest to newest
        const messages = await Message.find({ workspaceId })
            .populate('sender', 'name email')
            .sort({ createdAt: 1 });
            
        res.status(200).json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch messages" });
    }
};

const sendMessage = async (req, res) => {
    try {
        const workspaceId = req.params.id;
        const senderId = req.user.userId;
        const { text } = req.body;

        if (!text) return res.status(400).json({ success: false, message: "Text is required" });

        // 1. Save to database
        const newMessage = await Message.create({
            workspaceId,
            sender: senderId,
            text
        });

        // 2. Populate the sender name so the frontend can display who sent it
        await newMessage.populate('sender', 'name email');

        // 3. Emit the message to EVERYONE currently in this workspace room!
        console.log(`[Socket] Broadcasting message to room: ${workspaceId}`);
        const io = socketUtil.getIO();
        // io.to(workspaceId).emit("receive_chat_message", newMessage);
        io.to(workspaceId.toString()).emit("receive_chat_message", newMessage);

        res.status(201).json({ success: true, message: newMessage });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to send message" });
    }
};


// 1. Edit Message (1 Hour Limit)
const editMessage = async (req, res) => {
    try {
        const { id: workspaceId, msgId } = req.params;
        const senderId = req.user.userId;
        const { text } = req.body;

        const message = await Message.findById(msgId);
        if (!message) return res.status(404).json({ message: "Message not found" });

        // Security: Only the sender can edit their message
        if (message.sender.toString() !== senderId) {
            return res.status(403).json({ message: "Unauthorized to edit this message" });
        }

        // WhatsApp-style: 1 Hour Limit Check
        const ONE_HOUR = 60 * 60 * 1000;
        if (Date.now() - new Date(message.createdAt).getTime() > ONE_HOUR) {
            return res.status(403).json({ message: "Time limit exceeded. You can only edit messages within 1 hour." });
        }

        message.text = text;
        message.isEdited = true; // Optional: Add this boolean to your Mongoose Schema!
        await message.save();
        await message.populate('sender', 'name email');

        // Broadcast the update to the room
        const io = socketUtil.getIO();
        io.to(workspaceId.toString()).emit("message_edited", message);

        res.status(200).json({ success: true, message });
    } catch (error) {
        res.status(500).json({ message: "Failed to edit message" });
    }
};

// 2. Delete Single Message
const deleteMessage = async (req, res) => {
    try {
        const { id: workspaceId, msgId } = req.params;
        const senderId = req.user.userId;

        const message = await Message.findById(msgId);
        if (!message) return res.status(404).json({ message: "Message not found" });

        if (message.sender.toString() !== senderId) {
            return res.status(403).json({ message: "Unauthorized to delete this message" });
        }

        await Message.findByIdAndDelete(msgId);

        // Broadcast the deletion to the room
        const io = socketUtil.getIO();
        io.to(workspaceId.toString()).emit("message_deleted", msgId);

        res.status(200).json({ success: true, msgId });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete message" });
    }
};

// 3. Clear Entire Chat
const clearChat = async (req, res) => {
    try {
        const { id: workspaceId } = req.params;
        
        // Delete all messages belonging to this workspace
        await Message.deleteMany({ workspaceId });

        // Tell all connected clients to wipe their screens
        const io = socketUtil.getIO();
        io.to(workspaceId.toString()).emit("chat_cleared");

        res.status(200).json({ success: true, message: "Chat cleared" });
    } catch (error) {
        res.status(500).json({ message: "Failed to clear chat" });
    }
};


module.exports = { 
    create, list, getOne, update, deleteWorkspace, invite, listMembers, changeRole,
    removeMember,getMessages,
    sendMessage,editMessage,
    deleteMessage,
    clearChat
};








