require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./configs/db')
const cookieParser = require('cookie-parser');


const app = express();

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello from Winbid!' });
});

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

connectDB();

require('./models/User');
require('./models/Product');
require('./models/Bid');
require('./models/Winner');
require('./models/Wishlist');
require('./models/Contact');

// Routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

const winnerRoutes = require('./routes/winnerRoutes')
app.use('/api/winners', winnerRoutes);

const bidRouter = require('./routes/bidRoutes');
app.use('/api/bids', bidRouter);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const wishlistRoutes = require('./routes/wishlistRoutes');
app.use('/api/users', wishlistRoutes);

const contactRoutes = require('./routes/contactRoutes');
app.use('/api/contact', contactRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
