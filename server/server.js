const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
// Fix: Checks MONGODB_URI first (matching your .env file)
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bus_booking';

mongoose.connect(MONGO_URI)
  .then(() => console.log(' Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error(' MongoDB Connection Error:', err));

// --- Schemas & Models ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  joined: { type: Date, default: Date.now }
});

const busSchema = new mongoose.Schema({
  name: { type: String, required: true },
  busNumber: { type: String, required: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  route: { type: String },
  fare: { type: String, required: true },
  seats: { type: Number, default: 36 },
  bookedSeats: { type: [String], default: [] },
  busType: { type: String },
  arrivalTime: { type: String },
  departureTime: { type: String },
  estimatedHours: { type: String },
  images: { type: [String], default: [] }
});

const ticketSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  userPhone: { type: String },
  busName: { type: String },
  from: { type: String },
  to: { type: String },
  seats: [String],
  fare: { type: Number },
  paymentMethod: { type: String, default: 'bKash' },
  trxId: { type: String },
  bookingDate: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Bus = mongoose.model('Bus', busSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);

// --- API ROUTES ---

// 1. User Registration (Sign Up)
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { phone: email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or phone number.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'user'
    });

    await newUser.save();

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
});

// 2. User Authentication (Sign In)
app.post('/api/signin', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email/Phone and password are required.' });
    }

    // Fix: Allows login via either Email OR Phone number
    const user = await User.findOne({
      $or: [{ email: email }, { phone: email }]
    });

    if (!user) {
      return res.status(404).json({ message: 'User account not found.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid login password.' });
    }

    if (role && user.role !== role) {
      return res.status(403).json({ message: `Access denied. Incorrect portal role.` });
    }

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error during signin', error: error.message });
  }
});

// 3. Bus Management Routes
app.get('/api/buses', async (req, res) => {
  try {
    const buses = await Bus.find();
    res.json(buses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bus routes.' });
  }
});

app.post('/api/buses', async (req, res) => {
  try {
    const newBus = new Bus(req.body);
    await newBus.save();
    res.status(201).json(newBus);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save new bus route.' });
  }
});

// Server Initialization
const PORT = 5000;
const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Gracefully close server when VS Code or terminal exits
process.on('SIGINT', () => {
  console.log('Closing Express server...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Closing Express server...');
  server.close(() => {
    process.exit(0);
  });
});