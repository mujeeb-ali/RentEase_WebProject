// ===================================
// Message Routes
// ===================================

const express = require('express');
const router = express.Router();
const {
    getChatHistory,
    saveMessage,
    markAsRead,
    getConversations
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

// All routes are protected

// Conversations routes (more specific first)
router.get('/conversations/:userId', protect, getConversations);

// Message routes
router.get('/:userId1/:userId2', protect, getChatHistory);
router.post('/', protect, saveMessage);
router.put('/read/:userId', protect, markAsRead);
router.delete('/:messageId', protect, async (req, res) => {
    try {
        const message = await require('../models/Message').findByIdAndDelete(req.params.messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }
        res.json({ success: true, message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
