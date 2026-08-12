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

// Bus Schema
const busSchema = new mongoose.Schema({
  id: Number,
  name: { type: String, required: true },
  busNumber: String,
  route: String,
  from: String,
  to: String,
  departureTime: String,
  arrivalTime: String,
  fare: Number,
  seats: { type: Number, default: 40 },
  busType: String,
  bookedSeats: { type: [String], default: [] },
  images: [String]
});

const Bus = mongoose.model('Bus', busSchema);

// Ticket Schema
const ticketSchema = new mongoose.Schema({
  id: { type: String, required: true },
  busId: { type: mongoose.Schema.Types.Mixed, required: true },
  userEmail: { type: String, required: true },
  passengerEmail: String,
  passengerPhone: String,
  passengerName: String,
  busName: String,
  operator: String,
  from: String,
  to: String,
  seats: [String],
  seatNumber: String,
  fare: Number,
  price: Number,
  paymentMethod: String,
  trxId: String,
  purchaseDate: String,
  date: { type: Date, default: Date.now }
});

const Ticket = mongoose.model('Ticket', ticketSchema);

// ------------------------------------------------------------------
// API ENDPOINTS
// ------------------------------------------------------------------

// 1. GET /api/buses - Fetch all buses (with optional district filtering)
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

// 2. PUT /api/buses/:id - Update seat availability for a specific bus
app.put('/api/buses/:id', async (req, res) => {
  try {
    const busId = req.params.id;
    const { bookedSeats } = req.body;

    const query = mongoose.Types.ObjectId.isValid(busId) 
      ? { _id: busId } 
      : { id: Number(busId) };

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

// 3. GET /api/tickets - Fetch tickets with user email filter
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

// 4. POST /api/tickets - Issue new ticket and update booked seats
app.post('/api/tickets', async (req, res) => {
  try {
    const {
      id,
      busId,
      userEmail,
      passengerEmail,
      passengerPhone,
      passengerName,
      busName,
      operator,
      from,
      to,
      seats,
      seatNumber,
      fare,
      price,
      paymentMethod,
      trxId,
      purchaseDate
    } = req.body;

    const seatArray = seats && seats.length > 0 
      ? seats 
      : (seatNumber ? seatNumber.split(',').map(s => s.trim()) : []);

    const numericFare = fare || price || 0;

    // Create new Ticket document
    const newTicket = new Ticket({
      id: id || `TICK-${Math.floor(100000 + Math.random() * 900000)}`,
      busId,
      userEmail: userEmail || passengerEmail,
      passengerEmail: passengerEmail || userEmail,
      passengerPhone,
      passengerName: passengerName || 'Passenger',
      busName: busName || operator,
      operator: operator || busName,
      from,
      to,
      seats: seatArray,
      seatNumber: seatArray.join(', '),
      fare: numericFare,
      price: numericFare,
      paymentMethod: paymentMethod || 'bKash',
      trxId: trxId || `TRX-${Math.floor(10000000 + Math.random() * 90000000)}`,
      purchaseDate: purchaseDate || new Date().toLocaleString()
    });

    const savedTicket = await newTicket.save();

    // Lock seats on corresponding Bus document automatically
    if (busId && seatArray.length > 0) {
      const busQuery = mongoose.Types.ObjectId.isValid(busId) 
        ? { _id: busId } 
        : { id: Number(busId) };

      await Bus.findOneAndUpdate(busQuery, {
        $addToSet: { bookedSeats: { $each: seatArray } }
      });
    }

    res.status(201).json(savedTicket);
  } catch (error) {
    console.error('Ticket booking error:', error);
    res.status(500).json({ message: 'Failed to process ticket booking', error: error.message });
  }
});

// ------------------------------------------------------------------
// SERVER INITIALIZATION
// ------------------------------------------------------------------
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/bus_booking_db';
const PORT = process.env.PORT || 5000;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully!');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));