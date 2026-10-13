// const mongoose = require('mongoose');

// const taskSchema = new mongoose.Schema(
//     {
//         title: {
//             type: String,
//             required: true,
//             trim: true
//         },
//         description: {
//             type: String,
//             trim: true,
//             default: ""
//         },
//         status: {
//             type: String,
//             enum: ['todo', 'in-progress', 'review', 'done'],
//             default: 'todo'
//         },
//         boardId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'Board',
//             required: true
//         },
//         assignedTo: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'User',
//             default: null // Tasks can be unassigned initially
//         }
//     },
//     {
//         timestamps: true
//     }
// );

// module.exports = mongoose.model('Task', taskSchema);








const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            trim: true,
            default: ""
        },
        boardId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Board',
            required: true
        },
        stageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Stage', // References the dynamic Stage/Column model
            required: true
        },
        order: {
            type: Number,
            required: true,
            default: 0 // Tracks the vertical position within the stage
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null 
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Task', taskSchema);