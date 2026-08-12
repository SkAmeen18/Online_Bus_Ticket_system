import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = 'http://localhost:5000/api';

const User = ({ currentUser = { name: 'John Doe', email: 'user@example.com' } }) => {
  const [buses, setBuses] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('buses'); // 'buses' or 'history'
  
  // Search Filters
  const [fromDistrict, setFromDistrict] = useState('Select District');
  const [toDistrict, setToDistrict] = useState('Select District');

  // Booking Modal & Seat Selection State
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [bookingSuccess, setBookingSuccess] = useState(null);

  // Passenger Form State
  const [passenger, setPassenger] = useState({
    name: currentUser.name || '',
    phone: '',
    email: currentUser.email || '',
    accountNumber: ''
  });

  // Fetch all buses from backend
  const fetchBuses = useCallback(async () => {
    try {
      const query = [];
      if (fromDistrict !== 'Select District') query.push(`from=${encodeURIComponent(fromDistrict)}`);
      if (toDistrict !== 'Select District') query.push(`to=${encodeURIComponent(toDistrict)}`);
      
      const queryString = query.length ? `?${query.join('&')}` : '';
      const res = await fetch(`${API_BASE}/buses${queryString}`);
      if (!res.ok) throw new Error('Failed to fetch buses');
      
      const data = await res.json();
      setBuses(data);
    } catch (err) {
      console.error('Error fetching buses:', err);
    }
  }, [fromDistrict, toDistrict]);

  // Fetch ticket history for current user
  const fetchUserTickets = useCallback(async () => {
    if (!currentUser?.email) return;
    try {
      const res = await fetch(`${API_BASE}/tickets?email=${encodeURIComponent(currentUser.email)}`);
      if (!res.ok) throw new Error('Failed to fetch tickets');
      
      const data = await res.json();
      setTickets(data);
    } catch (err) {
      console.error('Error fetching user tickets:', err);
    }
  }, [currentUser.email]);

  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchUserTickets();
    }
  }, [activeTab, fetchUserTickets]);

  // Handle seat toggling (max 4 seats allowed)
  const handleSeatClick = (seat) => {
    const isBooked = selectedBus?.bookedSeats?.includes(seat);
    if (isBooked) return;

    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seat));
    } else {
      if (selectedSeats.length >= 4) {
        alert('You can only select up to 4 seats per booking.');
        return;
      }
      setSelectedSeats([...selectedSeats, seat]);
    }
  };

  const totalAmount = selectedSeats.length * (selectedBus?.fare || 0);

  // Synchronized confirmation handler
  const handleConfirmBooking = async (e) => {
    e.preventDefault();

    if (!passenger.name || !passenger.phone) {
      alert('Please fill out passenger name and phone number.');
      return;
    }

    if (!passenger.accountNumber) {
      alert(`Please enter your ${paymentMethod} account/card number.`);
      return;
    }

    const busId = selectedBus._id || selectedBus.id;
    const existingBooked = selectedBus.bookedSeats || [];
    const updatedBookedSeats = Array.from(new Set([...existingBooked, ...selectedSeats]));

    try {
      // 1. Lock seats on Bus schema via API
      const resBus = await fetch(`${API_BASE}/buses/${busId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookedSeats: updatedBookedSeats })
      });

      if (!resBus.ok) {
        throw new Error('Failed to update reserved seats on server.');
      }

      // 2. Persist new ticket record to DB via API
      const newTicketRecord = {
        id: 'TICK-' + Math.floor(100000 + Math.random() * 900000),
        busId: busId,
        busName: selectedBus.name,
        operator: selectedBus.name,
        from: selectedBus.from,
        to: selectedBus.to,
        route: selectedBus.route || `${selectedBus.from} to ${selectedBus.to}`,
        seats: [...selectedSeats],
        fare: totalAmount,
        price: totalAmount,
        passengerName: passenger.name,
        passengerPhone: passenger.phone,
        passengerEmail: passenger.email || currentUser.email,
        userEmail: currentUser.email,
        paymentMethod: paymentMethod,
        trxId: 'TRX' + Math.floor(10000000 + Math.random() * 90000000),
        purchaseDate: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      const resTicket = await fetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicketRecord)
      });

      if (!resTicket.ok) {
        throw new Error('Failed to save ticket details.');
      }

      // 3. Refresh live dataset state
      await fetchBuses();
      await fetchUserTickets();

      // 4. Update UI confirmation states
      setBookingSuccess({
        busName: selectedBus.name,
        busNumber: selectedBus.busNumber || 'N/A',
        seats: [...selectedSeats],
        totalPaid: totalAmount,
        trxId: newTicketRecord.trxId,
        paymentMethod,
        passengerName: passenger.name
      });

      setIsCheckoutOpen(false);
      setSelectedSeats([]);
      setSelectedBus((prev) => ({
        ...prev,
        bookedSeats: updatedBookedSeats
      }));

    } catch (err) {
      console.error('Booking Error:', err);
      alert(err.message || 'Transaction failed. Please check your network connection.');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Bus Ticket Reservation System</h1>

      {/* Navigation Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('buses')}
          style={{ padding: '10px 20px', marginRight: '10px', background: activeTab === 'buses' ? '#007bff' : '#ccc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Available Buses
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ padding: '10px 20px', background: activeTab === 'history' ? '#007bff' : '#ccc', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          My Ticket History
        </button>
      </div>

      {/* TAB 1: BUS SEARCH & SELECTION */}
      {activeTab === 'buses' && (
        <div>
          {/* Search Bar */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: '#f5f5f5', padding: '15px', borderRadius: '8px' }}>
            <div>
              <label>From: </label>
              <select value={fromDistrict} onChange={(e) => setFromDistrict(e.target.value)}>
                <option value="Select District">Select District</option>
                <option value="Dhaka">Dhaka</option>
                <option value="Chittagong">Chittagong</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Rajshahi">Rajshahi</option>
              </select>
            </div>
            <div>
              <label>To: </label>
              <select value={toDistrict} onChange={(e) => setToDistrict(e.target.value)}>
                <option value="Select District">Select District</option>
                <option value="Dhaka">Dhaka</option>
                <option value="Chittagong">Chittagong</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Rajshahi">Rajshahi</option>
              </select>
            </div>
            <button onClick={fetchBuses} style={{ padding: '5px 15px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px' }}>Filter</button>
          </div>

          {/* Bus List */}
          <h3>Available Buses</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
            {buses.map((bus) => (
              <div key={bus._id || bus.id} style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '15px', background: '#fff' }}>
                <h4>{bus.name} ({bus.busType || 'AC'})</h4>
                <p><strong>Route:</strong> {bus.from} ➔ {bus.to}</p>
                <p><strong>Departure:</strong> {bus.departureTime || '10:00 AM'}</p>
                <p><strong>Fare:</strong> ৳{bus.fare}</p>
                <button 
                  onClick={() => { setSelectedBus(bus); setSelectedSeats([]); setBookingSuccess(null); }}
                  style={{ padding: '8px 16px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Select Seats
                </button>
              </div>
            ))}
          </div>

          {/* Seat Layout Selection Modal / Section */}
          {selectedBus && (
            <div style={{ marginTop: '30px', borderTop: '2px solid #007bff', paddingTop: '20px' }}>
              <h3>Select Seats for {selectedBus.name}</h3>
              <p>Click on an available seat (Grey) to select it (Green). Red seats are already booked.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 50px)', gap: '10px', margin: '20px 0' }}>
                {['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D1', 'D2', 'D3', 'D4'].map((seat) => {
                  const isBooked = selectedBus.bookedSeats?.includes(seat);
                  const isSelected = selectedSeats.includes(seat);

                  let bg = '#e0e0e0';
                  if (isBooked) bg = '#dc3545';
                  else if (isSelected) bg = '#28a745';

                  return (
                    <button
                      key={seat}
                      disabled={isBooked}
                      onClick={() => handleSeatClick(seat)}
                      style={{
                        width: '50px',
                        height: '50px',
                        backgroundColor: bg,
                        color: isBooked || isSelected ? '#fff' : '#000',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: isBooked ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {seat}
                    </button>
                  );
                })}
              </div>

              <div>
                <p><strong>Selected Seats:</strong> {selectedSeats.join(', ') || 'None'}</p>
                <p><strong>Total Fare:</strong> ৳{totalAmount}</p>
                {selectedSeats.length > 0 && (
                  <button 
                    onClick={() => setIsCheckoutOpen(true)}
                    style={{ padding: '10px 20px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Proceed to Payment
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Checkout & Payment Form Modal */}
          {isCheckoutOpen && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', maxWidth: '400px', width: '100%' }}>
                <h3>Passenger & Payment Details</h3>
                <form onSubmit={handleConfirmBooking}>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Passenger Name:</label>
                    <input 
                      type="text" 
                      required
                      value={passenger.name} 
                      onChange={(e) => setPassenger({ ...passenger, name: e.target.value })} 
                      style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Phone Number:</label>
                    <input 
                      type="tel" 
                      required
                      value={passenger.phone} 
                      onChange={(e) => setPassenger({ ...passenger, phone: e.target.value })} 
                      style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Payment Method:</label>
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '4px' }}>
                      <option value="bKash">bKash</option>
                      <option value="Nagad">Nagad</option>
                      <option value="Credit Card">Credit Card</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <label>{paymentMethod} Account / Card Number:</label>
                    <input 
                      type="text" 
                      required
                      value={passenger.accountNumber} 
                      onChange={(e) => setPassenger({ ...passenger, accountNumber: e.target.value })} 
                      style={{ width: '100%', padding: '8px', marginTop: '4px' }}
                    />
                  </div>
                  <button type="submit" style={{ width: '100%', padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Confirm & Pay ৳{totalAmount}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsCheckoutOpen(false)}
                    style={{ width: '100%', padding: '10px', background: '#dc3545', color: '#fff', border: 'none', borderRadius: '4px', marginTop: '8px', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Successful Ticket Banner */}
          {bookingSuccess && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#d4edda', border: '1px solid #c3e6cb', color: '#155724', borderRadius: '6px' }}>
              <h3>🎉 Booking Confirmed!</h3>
              <p><strong>Passenger:</strong> {bookingSuccess.passengerName}</p>
              <p><strong>Bus:</strong> {bookingSuccess.busName}</p>
              <p><strong>Seats Reserved:</strong> {bookingSuccess.seats.join(', ')}</p>
              <p><strong>Total Paid:</strong> ৳{bookingSuccess.totalPaid}</p>
              <p><strong>Transaction ID:</strong> {bookingSuccess.trxId}</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TICKET HISTORY */}
      {activeTab === 'history' && (
        <div>
          <h3>My Booked Tickets</h3>
          {tickets.length === 0 ? (
            <p>No ticket reservations found.</p>
          ) : (
            <div style={{ display: 'grid', gap: '15px' }}>
              {tickets.map((ticket) => (
                <div key={ticket._id || ticket.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '6px', background: '#fafafa' }}>
                  <p><strong>Ticket ID:</strong> {ticket.id}</p>
                  <p><strong>Operator:</strong> {ticket.busName || ticket.operator}</p>
                  <p><strong>Route:</strong> {ticket.from} ➔ {ticket.to}</p>
                  <p><strong>Seat(s):</strong> {Array.isArray(ticket.seats) ? ticket.seats.join(', ') : ticket.seatNumber}</p>
                  <p><strong>Fare Paid:</strong> ৳{ticket.fare || ticket.price}</p>
                  <p><strong>Trx ID:</strong> {ticket.trxId}</p>
                  <p><strong>Booking Date:</strong> {ticket.purchaseDate}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default User;