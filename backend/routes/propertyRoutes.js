// ===================================
// Property Routes
// ===================================

const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const {
    getAllProperties,
    getProperty,
    createProperty,
    updateProperty,
    deleteProperty,
    getUserProperties
} = require('../controllers/propertyController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getAllProperties);
router.get('/:id', getProperty);

// Protected routes
router.get('/user/:userId', protect, getUserProperties);
router.post('/', protect, authorize('owner'), upload.array('images', 10), createProperty);
router.put('/:id', protect, authorize('owner'), upload.array('images', 10), updateProperty);
router.delete('/:id', protect, authorize('owner'), deleteProperty);

module.exports = router;
