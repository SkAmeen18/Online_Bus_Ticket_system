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

// --- 2. Schemas & Models ---
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, default: '' },
  password: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  joined: { type: Date, default: Date.now },
  avatar: { type: String, default: '' }
});

const User = mongoose.model('User', userSchema);

const busSchema = new mongoose.Schema({
  id: Number,
  name: { type: String, required: true },
  busNumber: { type: String, default: '' },
  from: { type: String, required: true },
  to: { type: String, required: true },
  route: { type: String, default: '' },
  fare: { type: String, required: true },
  seats: { type: Number, default: 36 },
  bookedSeats: { type: [String], default: [] },
  busType: { type: String, default: 'AC Executive' },
  arrivalTime: { type: String, default: 'N/A' },
  departureTime: { type: String, default: 'N/A' },
  estimatedHours: { type: String, default: 'N/A' },
  images: { type: [String], default: [] }
}, { timestamps: true });

const Bus = mongoose.model('Bus', busSchema);

const ticketSchema = new mongoose.Schema({
  id: String,
  busId: String,
  userEmail: String,
  userPhone: String,
  passengerEmail: String,
  passengerPhone: String,
  passengerName: String,
  busName: String,
  operator: String,
  from: String,
  to: String,
  route: String,
  seats: [String],
  seatNumber: String,
  fare: mongoose.Schema.Types.Mixed,
  price: mongoose.Schema.Types.Mixed,
  paymentMethod: String,
  trxId: String,
  purchaseDate: { type: String, default: () => new Date().toLocaleString() }
}, { timestamps: true });

const Ticket = mongoose.model('Ticket', ticketSchema);

// --- 3. API Routes ---

// Sign Up Route
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email address.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name: name || 'Passenger',
      email: cleanEmail,
      phone: phone || '',
      password: hashedPassword,
      role: role || 'user'
    });

    await newUser.save();

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: newUser._id,
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        joined: newUser.joined,
        avatar: newUser.avatar
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
});

// Sign In Route
app.post('/api/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ 
      $or: [{ email: cleanEmail }, { phone: email }] 
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid email/phone or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email/phone or password.' });
    }

    res.status(200).json({
      message: 'Sign in successful',
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        joined: user.joined,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ message: 'Server error during signin', error: error.message });
  }
});

// User Profile Update & Password Change Route
app.put('/api/users/profile', async (req, res) => {
  try {
    const { email, name, phone, avatar, newPassword } = req.body;
    if (!email) return res.status(400).json({ message: 'User email is required' });

    const updateFields = { name, phone, avatar };

    if (newPassword && newPassword.trim().length >= 6) {
      updateFields.password = await bcrypt.hash(newPassword, 10);
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: email.trim().toLowerCase() },
      { $set: updateFields },
      { new: true, select: '-password' }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User profile not found.' });
    }

    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user profile', error: error.message });
  }
});

// Fetch All Users Route (Admin Panel)
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password').sort({ joined: -1 }).lean();
    const formattedUsers = users.map(u => ({
      ...u,
      id: u._id,
      emailOrPhone: u.email
    }));
    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'Failed to fetch registered users.' });
  }
});

// Buses Routes
app.get('/api/buses', async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = {};

    if (from && from !== 'Select District' && from !== 'All Districts') {
      query.from = new RegExp(`^${from.trim()}$`, 'i');
    }
    if (to && to !== 'Select District' && to !== 'All Districts') {
      query.to = new RegExp(`^${to.trim()}$`, 'i');
    }

    const buses = await Bus.find(query).sort({ createdAt: -1 });
    res.status(200).json(buses);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch buses' });
  }
});

app.post('/api/buses', async (req, res) => {
  try {
    const busData = req.body;
    if (!busData.route) {
      busData.route = `${busData.from} to ${busData.to}`;
    }
    const newBus = new Bus(busData);
    await newBus.save();
    res.status(201).json(newBus);
  } catch (error) {
    console.error('Create bus error:', error);
    res.status(500).json({ message: 'Failed to add bus route' });
  }
});

// Update Bus / Reserve Seats Route
app.put('/api/buses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let updatedBus;
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      updatedBus = await Bus.findByIdAndUpdate(id, { $set: req.body }, { new: true });
    } else {
      updatedBus = await Bus.findOneAndUpdate({ id: Number(id) }, { $set: req.body }, { new: true });
    }

    if (!updatedBus) {
      return res.status(404).json({ message: 'Bus route not found' });
    }
    res.status(200).json(updatedBus);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update bus seat layout' });
  }
});

app.delete('/api/buses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.Types.ObjectId.isValid(id)) {
      await Bus.findByIdAndDelete(id);
    } else {
      await Bus.deleteOne({ id: Number(id) });
    }
    res.status(200).json({ message: 'Bus deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete bus' });
  }
});

// Tickets Routes
app.get('/api/tickets', async (req, res) => {
  try {
    const { email } = req.query;
    let query = {};
    if (email) {
      query.$or = [
        { userEmail: new RegExp(`^${email.trim()}$`, 'i') },
        { passengerEmail: new RegExp(`^${email.trim()}$`, 'i') }
      ];
    }
    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch tickets' });
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const newTicket = new Ticket(req.body);
    await newTicket.save();
    res.status(201).json(newTicket);
  } catch (error) {
    res.status(500).json({ message: 'Failed to save ticket transaction' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});