// ===================================
// Property Controller
// ===================================

const Property = require('../models/Property');

// @desc    Get all properties
// @route   GET /api/properties
// @access  Public
exports.getAllProperties = async (req, res) => {
    try {
        const { type, category, city, minPrice, maxPrice } = req.query;
        
        let query = {};
        
        if (type) query.type = type;
        if (category) query.category = category;
        if (city) query.city = new RegExp(city, 'i');
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = Number(minPrice);
            if (maxPrice) query.price.$lte = Number(maxPrice);
        }

        const properties = await Property.find(query)
            .populate('owner', 'fullName email phone rating')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: properties.length,
            properties
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Get single property
// @route   GET /api/properties/:id
// @access  Public
exports.getProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id)
            .populate('owner', 'fullName email phone rating');

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        // Increment views
        property.views += 1;
        await property.save();

        res.status(200).json({
            success: true,
            property
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Create property
// @route   POST /api/properties
// @access  Private (Owner only)
exports.createProperty = async (req, res) => {
    try {
        console.log('Create property request:', { userId: req.user.id, body: req.body });
        
        req.body.owner = req.user.id;
        
        // Handle uploaded images from Cloudinary
        if (req.files && req.files.length > 0) {
            req.body.images = req.files.map(file => file.path);
        }
        
        const property = await Property.create(req.body);        console.log('Property created successfully:', property._id);

        res.status(201).json({
            success: true,
            message: 'Property created successfully',
            property
        });
    } catch (error) {
        console.error('Error creating property:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Update property
// @route   PUT /api/properties/:id
// @access  Private (Owner only)
exports.updateProperty = async (req, res) => {
    try {
        let property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        // Check ownership
        if (property.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this property'
            });
        }

        property = await Property.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: 'Property updated successfully',
            property
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Delete property
// @route   DELETE /api/properties/:id
// @access  Private (Owner only)
exports.deleteProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        // Check ownership
        if (property.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this property'
            });
        }

        await property.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Property deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};

// @desc    Get user properties
// @route   GET /api/properties/user/:userId
// @access  Private
exports.getUserProperties = async (req, res) => {
    try {
        console.log('Get user properties request:', { userId: req.params.userId });
        
        const properties = await Property.find({ owner: req.params.userId })
            .sort({ createdAt: -1 });

        console.log('Found properties for user:', { count: properties.length, userId: req.params.userId });

        res.status(200).json({
            success: true,
            count: properties.length,
            properties
        });
    } catch (error) {
        console.error('Error getting user properties:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error'
        });
    }
};
