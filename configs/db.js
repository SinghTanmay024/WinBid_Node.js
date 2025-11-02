require('dotenv').config();

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Use the MongoDB Atlas URI from .env in production
        // Fall back to local MongoDB URI for development
        const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
        
        if (!mongoURI) {
            throw new Error('MongoDB connection URI not found in environment variables');
        }

        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            dbName: 'Winbid',  // Explicitly specify the database name
            // Add these additional options for better handling
            serverSelectionTimeoutMS: 5000,  // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000,         // Close sockets after 45s of inactivity
        });
        
        // Log connection details
        const dbName = conn.connection.name;
        const dbHost = conn.connection.host;
        console.log(`MongoDB Connected: ${dbHost}`);
        console.log(`Database Name: ${dbName}`);
        
        // Verify collections
        const collections = await conn.connection.db.listCollections().toArray();
        console.log(`Collections found: ${collections.map(c => c.name).join(', ')}`);
        
        // Count documents in each collection
        for (const collection of collections) {
            const count = await conn.connection.db.collection(collection.name).countDocuments();
            console.log(`  - ${collection.name}: ${count} documents`);
        }
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;