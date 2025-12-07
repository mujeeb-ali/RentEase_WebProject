// ===================================
// Message Controller for Chat
// ===================================

const mongoose = require('mongoose');
const Message = require('../models/Message');

// @desc    Get chat history between two users
// @route   GET /api/messages/:userId1/:userId2
// @access  Private
exports.getChatHistory = async (req, res) => {
    try {
        const { userId1, userId2 } = req.params;

        const messages = await Message.find({
            $or: [
                { senderId: userId1, receiverId: userId2 },
                { senderId: userId2, receiverId: userId1 }
            ]
        })
        .sort({ createdAt: 1 })
        .populate('senderId', 'fullName avatar')
        .populate('receiverId', 'fullName avatar');

        res.status(200).json({
            success: true,
            count: messages.length,
            messages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Save new message
// @route   POST /api/messages
// @access  Private
exports.saveMessage = async (req, res) => {
    try {
        const message = await Message.create(req.body);

        const populatedMessage = await Message.findById(message._id)
            .populate('senderId', 'fullName avatar')
            .populate('receiverId', 'fullName avatar');

        res.status(201).json({
            success: true,
            message: populatedMessage
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Mark messages as read
// @route   PUT /api/messages/read/:userId
// @access  Private
exports.markAsRead = async (req, res) => {
    try {
        await Message.updateMany(
            {
                senderId: req.params.userId,
                receiverId: req.user.id,
                isRead: false
            },
            { isRead: true }
        );

        res.status(200).json({
            success: true,
            message: 'Messages marked as read'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Get user conversations
// @route   GET /api/conversations/:userId
// @access  Private
exports.getConversations = async (req, res) => {
    try {
        const userId = req.params.userId;
        const User = require('../models/User');

        // Get unique users who have chatted with current user
        const conversations = await Message.aggregate([
            {
                $match: {
                    $or: [
                        { senderId: new mongoose.Types.ObjectId(userId) },
                        { receiverId: new mongoose.Types.ObjectId(userId) }
                    ]
                }
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$senderId', new mongoose.Types.ObjectId(userId)] },
                            '$receiverId',
                            '$senderId'
                        ]
                    },
                    lastMessage: { $first: '$text' },
                    lastMessageTime: { $first: '$createdAt' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$receiverId', new mongoose.Types.ObjectId(userId)] },
                                        { $eq: ['$isRead', false] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        // Populate user details for each conversation
        const populatedConversations = await Promise.all(
            conversations.map(async (conv) => {
                const user = await User.findById(conv._id).select('fullName avatar email');
                return {
                    userId: conv._id.toString(),
                    name: user?.fullName || 'Unknown User',
                    avatar: user?.avatar || '👤',
                    email: user?.email,
                    lastMessage: conv.lastMessage,
                    lastMessageTime: conv.lastMessageTime,
                    unreadCount: conv.unreadCount
                };
            })
        );

        res.status(200).json({
            success: true,
            conversations: populatedConversations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
