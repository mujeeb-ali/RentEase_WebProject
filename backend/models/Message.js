// ===================================
// Message Model for Chat
// ===================================

const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: [true, 'Message text is required'],
        trim: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
        default: null
    }
}, {
    timestamps: true
});

// Index for efficient querying
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
