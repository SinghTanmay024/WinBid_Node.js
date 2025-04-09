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
            // Add these additional options for better handling
            serverSelectionTimeoutMS: 5000,  // Timeout after 5s instead of 30s
            socketTimeoutMS: 45000,         // Close sockets after 45s of inactivity
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;