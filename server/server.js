require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// MONGOOSE SCHEMAS & MODELS
// ------------------------------------------------------------------

// 1. User Schema (Passenger & Admin)
const userSchema = new mongoose.Schema({
  name: { type: String, default: 'Passenger' },
  email: { type: String, required: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, default: 'passenger' }
}, { strict: false });

const User = mongoose.model('User', userSchema);

// 2. Bus Schema
const busSchema = new mongoose.Schema({
  id: Number,
  name: { type: String, required: true },
  busNumber: String,
  route: String,
  from: String,
  to: String,
  departureTime: String,
  arrivalTime: String,
  fare: mongoose.Schema.Types.Mixed,
  seats: { type: Number, default: 40 },
  busType: String,
  bookedSeats: { type: [String], default: [] },
  images: [String]
});

const Bus = mongoose.model('Bus', busSchema);

// 3. Ticket Schema (Lenient format to prevent validation errors)
const ticketSchema = new mongoose.Schema({
  id: { type: String, default: () => `TICK-${Math.floor(100000 + Math.random() * 900000)}` },
  busId: { type: mongoose.Schema.Types.Mixed },
  userEmail: { type: String, default: 'guest@example.com' },
  passengerEmail: { type: String, default: 'guest@example.com' },
  passengerPhone: { type: String, default: 'N/A' },
  passengerName: { type: String, default: 'Passenger' },
  busName: { type: String, default: 'Bus Service' },
  operator: { type: String, default: 'Bus Service' },
  from: { type: String, default: '' },
  to: { type: String, default: '' },
  seats: { type: [String], default: [] },
  seatNumber: { type: String, default: '' },
  fare: { type: mongoose.Schema.Types.Mixed, default: 0 },
  price: { type: mongoose.Schema.Types.Mixed, default: 0 },
  paymentMethod: { type: String, default: 'bKash' },
  trxId: { type: String, default: () => `TRX-${Math.floor(10000000 + Math.random() * 90000000)}` },
  purchaseDate: { type: String, default: () => new Date().toLocaleString() },
  date: { type: Date, default: Date.now }
}, { strict: false });

const Ticket = mongoose.model('Ticket', ticketSchema);

// Helper function to query bus by ObjectId or Numeric ID
const getBusQuery = (busId) => {
  if (!busId) return null;
  if (mongoose.Types.ObjectId.isValid(busId)) {
    return { _id: busId };
  }
  const numId = Number(busId);
  if (!isNaN(numId)) {
    return { $or: [{ id: numId }, { _id: busId }] };
  }
  return { id: busId };
};

// ------------------------------------------------------------------
// AUTHENTICATION ENDPOINTS
// ------------------------------------------------------------------

// Login Handler (Supports Email / Mobile Number Sign In)
const handleLogin = async (req, res) => {
  try {
    const { email, phone, identifier, password } = req.body;
    const loginInput = (email || identifier || phone || '').toString().trim().toLowerCase();

    if (!loginInput || !password) {
      return res.status(400).json({ message: 'Email/Mobile and password are required.' });
    }

    // Find user by email or phone
    const user = await User.findOne({
      $or: [
        { email: new RegExp(`^${loginInput}$`, 'i') },
        { phone: loginInput }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid login credentials.' });
    }

    // Direct password match
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid login credentials.' });
    }

    return res.json({
      message: 'Sign in successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || 'passenger'
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during sign in', error: error.message });
  }
};

// Registered routes to cover all frontend path variations
app.post('/api/signin', handleLogin);
app.post('/api/users/signin', handleLogin);
app.post('/api/login', handleLogin);
app.post('/api/users/login', handleLogin);
app.post('/api/auth/login', handleLogin);

// Signup Handler
const handleSignup = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists.' });
    }

    const newUser = new User({
      name: name || 'Passenger',
      email: email.toLowerCase(),
      phone: phone || '',
      password: password,
      role: role || 'passenger'
    });

    await newUser.save();
    return res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

app.post('/api/users/register', handleSignup);
app.post('/api/register', handleSignup);
app.post('/api/signup', handleSignup);

// ------------------------------------------------------------------
// BUS & TICKET ENDPOINTS
// ------------------------------------------------------------------

// GET /api/buses
app.get('/api/buses', async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = {};

    if (from && from !== 'Select District') filter.from = from;
    if (to && to !== 'Select District') filter.to = to;

    const buses = await Bus.find(filter);
    res.json(buses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching buses', error: error.message });
  }
});

// PUT /api/buses/:id
app.put('/api/buses/:id', async (req, res) => {
  try {
    const busId = req.params.id;
    const { bookedSeats } = req.body;
    const query = getBusQuery(busId);

    const updatedBus = await Bus.findOneAndUpdate(
      query,
      { bookedSeats },
      { new: true }
    );

    if (!updatedBus) {
      return res.status(404).json({ message: 'Bus not found' });
    }

    res.json(updatedBus);
  } catch (error) {
    res.status(500).json({ message: 'Error updating bus seats', error: error.message });
  }
});

// GET /api/tickets
app.get('/api/tickets', async (req, res) => {
  try {
    const { email } = req.query;
    const filter = email ? {
      $or: [
        { userEmail: new RegExp(`^${email}$`, 'i') },
        { passengerEmail: new RegExp(`^${email}$`, 'i') }
      ]
    } : {};

    const tickets = await Ticket.find(filter).sort({ date: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tickets', error: error.message });
  }
});

// POST /api/tickets
app.post('/api/tickets', async (req, res) => {
  try {
    const payload = req.body || {};

    const seatArray = Array.isArray(payload.seats) && payload.seats.length > 0
      ? payload.seats
      : (payload.seatNumber ? payload.seatNumber.split(',').map(s => s.trim()) : []);

    const rawFare = payload.fare || payload.price || 0;
    const cleanFare = parseInt(rawFare.toString().replace(/\D/g, ''), 10) || 0;

    const ticketData = {
      ...payload,
      id: payload.id || `TICK-${Math.floor(100000 + Math.random() * 900000)}`,
      seats: seatArray,
      seatNumber: seatArray.join(', '),
      fare: cleanFare,
      price: cleanFare,
      userEmail: payload.userEmail || payload.passengerEmail || 'guest@example.com',
      passengerEmail: payload.passengerEmail || payload.userEmail || 'guest@example.com',
      trxId: payload.trxId || `TRX-${Math.floor(10000000 + Math.random() * 90000000)}`,
      purchaseDate: payload.purchaseDate || new Date().toLocaleString()
    };

    const newTicket = new Ticket(ticketData);
    const savedTicket = await newTicket.save();

    // Lock bookedSeats on the corresponding Bus
    if (payload.busId && seatArray.length > 0) {
      const busQuery = getBusQuery(payload.busId);
      if (busQuery) {
        await Bus.findOneAndUpdate(busQuery, {
          $addToSet: { bookedSeats: { $each: seatArray } }
        });
      }
    }

    res.status(201).json(savedTicket);
  } catch (error) {
    console.error('❌ TICKET CREATION ERROR:', error);
    res.status(500).json({ message: 'Failed to process ticket booking', error: error.message });
  }
});

// ------------------------------------------------------------------
// SERVER INITIALIZATION
// ------------------------------------------------------------------
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb+srv://ameenali1801_db_user:maugxMR5bo13wsJ9@onlinebusticket.13ahrnm.mongodb.net/bus_booking_db?retryWrites=true&w=majority";
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas successfully!');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));