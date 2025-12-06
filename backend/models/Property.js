// ===================================
// Property Model
// ===================================

const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Property title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    type: {
        type: String,
        enum: ['house', 'apartment', 'villa', 'commercial', 'land'],
        required: [true, 'Property type is required']
    },
    category: {
        type: String,
        enum: ['rent', 'sale'],
        required: [true, 'Category is required']
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: 0
    },
    area: {
        type: Number,
        required: [true, 'Area is required'],
        min: 0
    },
    bedrooms: {
        type: Number,
        default: 0,
        min: 0
    },
    bathrooms: {
        type: Number,
        default: 0,
        min: 0
    },
    parking: {
        type: Number,
        default: 0,
        min: 0
    },
    address: {
        type: String,
        required: [true, 'Address is required']
    },
    city: {
        type: String,
        required: [true, 'City is required']
    },
    state: {
        type: String,
        required: [true, 'State is required']
    },
    zipcode: {
        type: String,
        required: [true, 'Zipcode is required']
    },
    amenities: [{
        type: String
    }],
    images: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['active', 'pending', 'inactive', 'sold'],
        default: 'active'
    },
    views: {
        type: Number,
        default: 0
    },
    featured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for search
propertySchema.index({ title: 'text', description: 'text', city: 'text' });

module.exports = mongoose.model('Property', propertySchema);
