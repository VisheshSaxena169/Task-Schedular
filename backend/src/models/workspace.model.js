const mongoose = require('mongoose');

const workspaceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Matches the name of your User model
            required: true
        },
        members: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User',
                    required: true
                },
                role: {
                    type: String,
                    enum: ['owner', 'admin', 'member', 'viewer'], // Defines allowed roles
                    default: 'member'
                }
            }
        ]
    },
    {
        timestamps: true // Automatically adds createdAt and updatedAt fields
    }
);

const Workspace =
  mongoose.models.Workspace ||
  mongoose.model("Workspace", workspaceSchema);

module.exports = Workspace;