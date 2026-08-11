const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- 1. Connect MongoDB Database ---
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bus_booking';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

// --- 2. User Schema & Model ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  joined: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// --- 3. API Routes ---

// Sign Up Route (Saves new user to MongoDB)
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email address.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      password: hashedPassword,
      role: role || 'user'
    });

    // Save to MongoDB
    await newUser.save();

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        joined: newUser.joined
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
});

// Fetch All Users Route (For Admin Panel Display)
app.get('/api/users', async (req, res) => {
  try {
    // Exclude password field for security
    const users = await User.find({}, '-password').sort({ joined: -1 }); 
    res.status(200).json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'Failed to fetch registered users.' });
  }
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});