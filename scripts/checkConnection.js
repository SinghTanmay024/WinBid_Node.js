require('dotenv').config();
const mongoose = require('mongoose');

async function checkConnection() {
    try {
        const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
        
        if (!mongoURI) {
            console.error('❌ MongoDB URI not found in environment variables');
            console.log('Please set MONGO_URI or MONGODB_URI in your .env file');
            return;
        }

        // Extract database name from URI if present
        const dbNameMatch = mongoURI.match(/\/([^/?]+)(\?|$)/);
        const dbNameFromURI = dbNameMatch ? dbNameMatch[1] : 'NOT SPECIFIED (will default to "test")';
        
        console.log('🔍 Checking MongoDB Connection...');
        console.log('=====================================');
        console.log(`Connection URI (hidden): ${mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
        console.log(`Database name in URI: ${dbNameFromURI}`);
        console.log('');

        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        const dbName = conn.connection.name;
        const dbHost = conn.connection.host;
        
        console.log('✅ Connection Successful!');
        console.log(`   Host: ${dbHost}`);
        console.log(`   Database: ${dbName}`);
        console.log('');
        
        // Check if database name matches expected
        const expectedDbName = 'Winbid';
        if (dbName.toLowerCase() !== expectedDbName.toLowerCase()) {
            console.log(`⚠️  WARNING: Connected to database "${dbName}" but expected "${expectedDbName}"`);
            console.log(`   Make sure your connection string ends with /${expectedDbName}`);
        } else {
            console.log(`✅ Database name matches expected: ${expectedDbName}`);
        }
        
        console.log('');
        console.log('📊 Collections and Document Counts:');
        console.log('=====================================');
        
        const collections = await conn.connection.db.listCollections().toArray();
        
        if (collections.length === 0) {
            console.log('⚠️  No collections found in this database');
        } else {
            for (const collection of collections) {
                const count = await conn.connection.db.collection(collection.name).countDocuments();
                console.log(`   ${collection.name}: ${count} documents`);
            }
        }
        
        // Check for expected collections
        console.log('');
        console.log('🔍 Expected Collections Check:');
        console.log('=====================================');
        const expectedCollections = ['users', 'products', 'bids', 'winners'];
        const existingCollectionNames = collections.map(c => c.name.toLowerCase());
        
        for (const expected of expectedCollections) {
            if (existingCollectionNames.includes(expected.toLowerCase())) {
                const count = await conn.connection.db.collection(expected).countDocuments();
                console.log(`✅ ${expected}: found (${count} documents)`);
            } else {
                console.log(`❌ ${expected}: NOT FOUND`);
            }
        }
        
        // Sample data check
        console.log('');
        console.log('📝 Sample Data Check:');
        console.log('=====================================');
        const User = require('../models/User');
        const users = await User.find().limit(1);
        if (users.length > 0) {
            console.log('✅ Sample user found:');
            console.log(`   Email: ${users[0].email}`);
            console.log(`   Username: ${users[0].username}`);
        } else {
            console.log('⚠️  No users found in database');
        }
        
        await mongoose.connection.close();
        console.log('');
        console.log('✅ Diagnostic complete');
        
    } catch (error) {
        console.error('❌ Connection Error:', error.message);
        if (error.message.includes('authentication')) {
            console.log('   Check your username and password in the connection string');
        } else if (error.message.includes('timeout')) {
            console.log('   Check your network connection and IP whitelist in MongoDB Atlas');
        }
        process.exit(1);
    }
}

checkConnection();

