require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../configs/db');
const User = require('../models/User');

async function hashExistingPasswords() {
    try {
        await connectDB();
        
        console.log('🔍 Checking for plaintext passwords...');
        
        // Get all users (including password field which is normally excluded)
        const users = await User.find({}).select('+password');
        console.log(`Found ${users.length} users to check`);
        
        let updatedCount = 0;
        let alreadyHashedCount = 0;
        
        for (const user of users) {
            const password = user.password;
            
            // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
            const isHashed = /^\$2[ayb]\$.{56}$/.test(password);
            
            if (!isHashed) {
                // Password is plaintext, hash it
                console.log(`  ⚠️  User ${user.email} has plaintext password - hashing now...`);
                
                try {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(password, salt);
                    
                    // Use findOneAndUpdate to bypass pre-save hook (avoid double hashing)
                    await User.findOneAndUpdate(
                        { _id: user._id },
                        { $set: { password: hashedPassword } },
                        { new: true }
                    );
                    
                    updatedCount++;
                    console.log(`  ✅ Password hashed for ${user.email}`);
                } catch (error) {
                    console.error(`  ❌ Error hashing password for ${user.email}:`, error.message);
                }
            } else {
                alreadyHashedCount++;
            }
        }
        
        console.log('\n📊 Summary:');
        console.log(`  ✅ Updated (hashed): ${updatedCount}`);
        console.log(`  ✓ Already hashed: ${alreadyHashedCount}`);
        console.log(`  Total users: ${users.length}`);
        
        await mongoose.connection.close();
        console.log('\n✅ Migration complete!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

hashExistingPasswords();

