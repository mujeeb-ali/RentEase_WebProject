// ===================================
// RentEase 2.0 - Main Server File
// ===================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
const morgan = require('morgan');
const compression = require('compression');
const connectDB = require('./config/database');
const logger = require('./config/logger');
const { helmetMiddleware, limiter, sanitizeData, preventXSS, httpsRedirect } = require('./middleware/security');

// Import routes
const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Import models
const Message = require('./models/Message');
const User = require('./models/User');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with proper CORS
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'];

const io = socketIO(server, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Connect to Database (non-blocking)
connectDB();

// HTTPS redirect in production
app.use(httpsRedirect);

// Compression middleware
app.use(compression());

// Security Middleware
app.use(helmetMiddleware);
app.use(limiter);
app.use(sanitizeData);
app.use(preventXSS);

// HTTP request logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', { stream: logger.stream }));
}

// Middleware with proper CORS (sends single origin, not comma-separated)
app.use(cors({
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman)
        if (!origin) {
            return callback(null, true);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, origin); // Return the matched origin (single value)
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/messages', messageRoutes);

// Contact form endpoint (placeholder)
app.post('/api/contact', (req, res) => {
    console.log('Contact form submission:', req.body);
    res.status(200).json({
        success: true,
        message: 'Message received successfully'
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Socket.io Connection Handling
const users = new Map(); // Store connected users: userId => { socketId, status }

io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // User joins with their ID
    socket.on('join', async (userId) => {
        users.set(userId, { socketId: socket.id, status: 'online' });
        socket.join(userId);
        console.log(`User ${userId} joined room`);
        
        // Update user online status in database
        try {
            await User.updateOne({ _id: userId }, { isOnline: true, lastSeen: new Date() });
            // Broadcast online status to all users
            io.emit('userStatusChange', { userId, status: 'online' });
        } catch (error) {
            console.error('Error updating user status:', error);
        }
    });

    // Handle sending message
    socket.on('sendMessage', async (message) => {
        try {
            // Check message size (MongoDB BSON limit is 16MB)
            const messageSize = JSON.stringify(message).length;
            const maxSize = 15 * 1024 * 1024; // 15MB to be safe
            
            if (messageSize > maxSize) {
                socket.emit('error', {
                    message: `Message too large (${(messageSize / 1024 / 1024).toFixed(1)}MB). Maximum is 15MB.`
                });
                console.log(`Message rejected: too large (${(messageSize / 1024 / 1024).toFixed(1)}MB)`);
                return;
            }
            
            // Save message to database
            const savedMessage = await Message.create({
                senderId: message.senderId,
                receiverId: message.receiverId,
                text: message.text,
                image: message.image || null,
                mediaType: message.mediaType || null,
                isDelivered: false
            });

            // Get receiver's socket ID
            const receiverData = users.get(message.receiverId);
            
            // Emit to receiver if online
            if (receiverData) {
                // Mark as delivered
                await Message.updateOne({ _id: savedMessage._id }, { isDelivered: true });
                
                io.to(receiverData.socketId).emit('receiveMessage', {
                    ...message,
                    _id: savedMessage._id,
                    createdAt: savedMessage.createdAt,
                    isDelivered: true
                });
                
                // Send delivery confirmation to sender
                socket.emit('messageDelivered', { messageId: savedMessage._id });
                
                console.log(`Message sent from ${message.senderId} to ${message.receiverId}`);
            } else {
                console.log(`User ${message.receiverId} is offline`);
            }

            // Confirm to sender
            socket.emit('messageSent', {
                success: true,
                messageId: savedMessage._id,
                isDelivered: !!receiverData
            });

        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', {
                message: 'Failed to send message: ' + error.message
            });
        }
    });

    // Handle message read event
    socket.on('messageRead', async ({ messageId, senderId, receiverId }) => {
        try {
            await Message.updateOne({ _id: messageId }, { isRead: true });
            
            // Notify sender that message was read
            const senderData = users.get(senderId);
            if (senderData) {
                io.to(senderData.socketId).emit('messageReadConfirm', { messageId, receiverId });
            }
        } catch (error) {
            console.error('Error marking message as read:', error);
        }
    });

    // Handle typing indicator
    socket.on('typing', ({ senderId, receiverId }) => {
        const receiverData = users.get(receiverId);
        if (receiverData) {
            io.to(receiverData.socketId).emit('userTyping', { senderId });
        }
    });

    // Handle stop typing
    socket.on('stopTyping', ({ senderId, receiverId }) => {
        const receiverData = users.get(receiverId);
        if (receiverData) {
            io.to(receiverData.socketId).emit('userStoppedTyping', { senderId });
        }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
        // Remove user from online users and update status
        for (const [userId, userData] of users.entries()) {
            if (userData.socketId === socket.id) {
                users.delete(userId);
                try {
                    await User.updateOne({ _id: userId }, { isOnline: false, lastSeen: new Date() });
                    // Broadcast offline status
                    io.emit('userStatusChange', { userId, status: 'offline', lastSeen: new Date() });
                } catch (error) {
                    console.error('Error updating user offline status:', error);
                }
                console.log(`❌ User ${userId} disconnected`);
                break;
            }
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Start Server
const PORT = process.env.PORT || 5000;

const serverInstance = server.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════╗
    ║   🚀 RentEase 2.0 Server Running     ║
    ║   📡 Port: ${PORT}                       ║
    ║   🌍 Environment: ${process.env.NODE_ENV || 'development'}        ║
    ║   💬 Socket.io: Active                ║
    ╚═══════════════════════════════════════╝
    `);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    serverInstance.close(() => {
        console.log('✅ HTTP server closed');
        
        // Close Socket.io connections
        io.close(() => {
            console.log('✅ Socket.io connections closed');
            
            // Close database connection (no callback in Mongoose 8+)
            require('mongoose').connection.close()
                .then(() => {
                    console.log('✅ MongoDB connection closed');
                    process.exit(0);
                })
                .catch(err => {
                    console.error('❌ Error closing MongoDB:', err);
                    process.exit(1);
                });
        });
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
        console.error('⚠️  Forcing shutdown after timeout');
        process.exit(1);
    }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error(`❌ Unhandled Rejection: ${err.message}`);
    console.error(err);
    // Don't exit in development, but log for debugging
    if (process.env.NODE_ENV === 'production') {
        gracefulShutdown('UNHANDLED_REJECTION');
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error(`❌ Uncaught Exception: ${err.message}`);
    console.error(err);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

module.exports = app;
