const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Schemas & Models
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

const busSchema = new mongoose.Schema({
  busNumber: { type: String, required: true },
  route: { from: String, to: String },
  departureTime: String,
  price: Number,
  totalSeats: Number,
  bookedSeats: { type: [String], default: [] },
  imageUrl: String
}, { timestamps: true });

const ticketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  busId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bus', required: true },
  seats: [{ type: String, required: true }],
  totalPrice: { type: Number, required: true },
  status: { type: String, default: 'CONFIRMED' }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Bus = mongoose.model('Bus', busSchema);
const Ticket = mongoose.model('Ticket', ticketSchema);

// --- AUTH MIDDLEWARE ---
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. Token missing.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword, role });
    
    const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- BUS ROUTES ---
app.get('/api/buses', async (req, res) => {
  try {
    const buses = await Bus.find();
    res.json(buses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin Route: Add Bus
app.post('/api/buses', verifyToken, requireAdmin, async (req, res) => {
  try {
    const bus = await Bus.create(req.body);
    res.status(201).json(bus);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Admin Route: Delete Bus
app.delete('/api/buses/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const bus = await Bus.findByIdAndDelete(req.params.id);
    if (!bus) return res.status(404).json({ message: 'Bus not found' });
    res.json({ message: 'Bus removed successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- ATOMIC SEAT RESERVATION ROUTE ---
app.post('/api/buses/:id/book', verifyToken, async (req, res) => {
  const { seats } = req.body; // Expects array of seat numbers, e.g., ["A1", "A2"]
  const busId = req.params.id;

  if (!seats || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ message: 'No seats specified for booking.' });
  }

  try {
    // Atomic check and update: only proceeds if NONE of requested seats exist in bookedSeats
    const updatedBus = await Bus.findOneAndUpdate(
      {
        _id: busId,
        bookedSeats: { $nin: seats } // Prevents double booking race conditions
      },
      {
        $addToSet: { bookedSeats: { $each: seats } }
      },
      { new: true }
    );

    if (!updatedBus) {
      return res.status(409).json({ message: 'Booking failed: One or more selected seats have already been reserved.' });
    }

    // Create corresponding Ticket transaction
    const ticket = await Ticket.create({
      userId: req.user.id,
      busId: updatedBus._id,
      seats,
      totalPrice: updatedBus.price * seats.length
    });

    res.status(201).json({ message: 'Booking confirmed!', ticket, bus: updatedBus });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin Route: Get All Users
app.get('/api/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));