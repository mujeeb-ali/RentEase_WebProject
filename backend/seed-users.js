// ===================================
// Seed Test Users for RentEase 2.0
// ===================================

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Test users to create
const testUsers = [
    {
        _id: new mongoose.Types.ObjectId('692aae11b6628ce4f263af47'),
        fullName: 'John Owner',
        email: 'john.owner@test.com',
        phone: '+1234567890',
        password: 'test123',
        role: 'owner'
    },
    {
        _id: new mongoose.Types.ObjectId('692aae12b6628ce4f263af4f'),
        fullName: 'Jane Buyer',
        email: 'jane.buyer@test.com',
        phone: '+1234567891',
        password: 'test123',
        role: 'tenant'
    }
];

// Connect to MongoDB and seed users
const seedUsers = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB Connected');

        // Clear existing test users
        console.log('\n🗑️  Removing existing test users...');
        await User.deleteMany({
            email: { $in: ['john.owner@test.com', 'jane.buyer@test.com'] }
        });
        console.log('✅ Old test users removed');

        // Create new test users
        console.log('\n👤 Creating test users...');
        for (const userData of testUsers) {
            const user = await User.create(userData);
            console.log(`✅ Created: ${user.fullName} (${user.email}) - Role: ${user.role}`);
        }

        console.log('\n🎉 Database seeded successfully!');
        console.log('\n📝 Test Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('Owner Account:');
        console.log('  Email: john.owner@test.com');
        console.log('  Password: test123');
        console.log('  ID: 692aae11b6628ce4f263af47');
        console.log('\nBuyer Account:');
        console.log('  Email: jane.buyer@test.com');
        console.log('  Password: test123');
        console.log('  ID: 692aae12b6628ce4f263af4f');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error.message);
        process.exit(1);
    }
};

// Run the seed script
seedUsers();
