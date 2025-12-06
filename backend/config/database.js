// ===================================
// Database Configuration
// ===================================

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.log(`\n💡 Quick Fix: Go to https://cloud.mongodb.com`);
        console.log(`   → Network Access → Add IP Address → Allow Access from Anywhere\n`);
        // Don't exit - continue in temporary mode
    }
};

module.exports = connectDB;
