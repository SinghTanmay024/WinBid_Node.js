const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); 
const validator = require('validator');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        minlength: [3, 'Username must be at least 3 characters'],
        maxlength: [20, 'Username must not exceed 20 characters'],
        validate: {
            validator: function(v) {
                // Alphanumeric and underscores only
                return /^[a-zA-Z0-9_]+$/.test(v);
            },
            message: 'Username can only contain letters, numbers, and underscores'
        }
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password should have at least 8 characters'],
        select: false // Never show in output
    },
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    phone: {
        type: String,
        validate: {
            validator: function(v) {
                // Basic international phone number validation
                return /^\+?[\d\s\-\(\)]{7,}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        },
        trim: true
    },
    phoneNumber: {
        type: String,
        validate: {
            validator: function(v) {
                if (!v) return true; // Optional field
                // Basic international phone number validation
                return /^\+?[\d\s\-\(\)]{7,}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        },
        trim: true
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerifiedAt: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    address: {
        street: {
            type: String,
            trim: true
        },
        street2: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        },
        postalCode: {
            type: String,
            trim: true,
            validate: {
                validator: function(v) {
                    // Basic postal code validation (accepts both 12345 and 12345-6789 formats)
                    return /^[a-z0-9\- ]{3,10}$/i.test(v);
                },
                message: props => `${props.value} is not a valid postal code!`
            }
        },
        country: {
            type: String,
            trim: true,
            default: 'US'
        },
        coordinates: {
            // For geolocation if needed
            type: [Number], // [longitude, latitude]
            index: '2dsphere'
        }
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    bids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid'
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

userSchema.pre('save', async function(next) {
    this.updatedAt = Date.now();
    
    if (this.isModified('password')) {
      // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
      const isAlreadyHashed = /^\$2[ayb]\$.{56}$/.test(this.password);
      
      if (!isAlreadyHashed) {
        try {
          const salt = await bcrypt.genSalt(10);
          this.password = await bcrypt.hash(this.password, salt);
        } catch (err) {
          return next(err);
        }
      }
    }
    next();
  });
  
  // Password comparison method
  // Handles both hashed passwords (new) and plaintext passwords (legacy)
  userSchema.methods.comparePassword = async function(candidatePassword) {
    // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
    const isHashed = /^\$2[ayb]\$.{56}$/.test(this.password);
    
    if (isHashed) {
      // Password is hashed, use bcrypt comparison
      return await bcrypt.compare(candidatePassword, this.password);
    } else {
      // Password is plaintext (legacy), compare directly
      if (this.password === candidatePassword) {
        // Auto-upgrade: hash the password now using findOneAndUpdate to bypass pre-save hook
        try {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(this.password, salt);
          // Use this.constructor (the model) to bypass pre-save hook and avoid double-hashing
          await this.constructor.findByIdAndUpdate(this._id, { password: hashedPassword });
          // Update the current instance
          this.password = hashedPassword;
        } catch (err) {
          console.error('Error hashing legacy password:', err);
        }
        return true;
      }
      return false;
    }
  };

// Custom static methods
userSchema.statics.findByEmail = async function(email) {
    return this.findOne({ email });
};

userSchema.statics.existsByEmail = async function(email) {
    const count = await this.countDocuments({ email });
    return count > 0;
};

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
    return `${this.address.street}${this.address.street2 ? ' ' + this.address.street2 : ''}, ${this.address.city}, ${this.address.state} ${this.address.postalCode}, ${this.address.country}`;
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);