const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- MongoDB Connection ---
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/bus_booking';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error('MongoDB Connection Error:', err));

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

    const query = [{ email: email.toLowerCase() }];
    if (phone) query.push({ phone: phone });

    const existingUser = await User.findOne({ $or: query });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email or phone number.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email: email.toLowerCase(),
      phone: phone || '',
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
        role: newUser.role,
        joined: newUser.joined
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

    const formattedInput = email.trim();
    const user = await User.findOne({
      $or: [{ email: formattedInput.toLowerCase() }, { phone: formattedInput }]
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
        role: user.role,
        joined: user.joined
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error during signin', error: error.message });
  }
});

// 3. Get All Users (For Admin Dashboard & Synchronization)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // Exclude password field for security
    res.status(200).json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'Failed to fetch registered users.' });
  }
});

// 4. Bus Management Routes
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

// 5. Ticket Management Routes
app.get('/api/tickets', async (req, res) => {
  try {
    const { email } = req.query;
    const query = email ? { userEmail: email.toLowerCase() } : {};
    const tickets = await Ticket.find(query);
    res.status(200).json(tickets);
  } catch (error) {
    console.error('Fetch tickets error:', error);
    res.status(500).json({ message: 'Failed to fetch ticket records.' });
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const newTicket = new Ticket(req.body);
    await newTicket.save();

    // Optionally update booked seats in corresponding Bus document
    if (req.body.busId && req.body.seats) {
      await Bus.findByIdAndUpdate(req.body.busId, {
        $push: { bookedSeats: { $each: req.body.seats } }
      });
    }

    res.status(201).json({ message: 'Ticket booked successfully!', ticket: newTicket });
  } catch (error) {
    console.error('Book ticket error:', error);
    res.status(500).json({ message: 'Failed to book ticket.' });
  }
});

// Server Initialization
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

process.on('SIGINT', () => {
  console.log('Closing Express server...');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('Closing Express server...');
  server.close(() => process.exit(0));
});