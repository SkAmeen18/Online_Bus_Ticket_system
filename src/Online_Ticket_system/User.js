import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bus, Ticket, CreditCard, Clock, ArrowRight, X, CheckCircle2, User as UserIcon, 
  Phone, Mail, MapPin, ShieldCheck, Award, Info, Edit3, Lock, Camera, Receipt, 
  RefreshCw 
} from 'lucide-react';

const API_BASE = 'https://online-bus-ticket-system-81tt.onrender.com/api';

const BANGLADESH_DISTRICTS = [
  'Select District', 'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola', 'Bogra', 'Brahmanbaria', 'Chandpur', 
  'Chittagong', 'Chuadanga', 'Comilla', 'Cox\'s Bazar', 'Dhaka', 'Dinajpur', 'Faridpur', 'Feni', 
  'Gaibandha', 'Gazipur', 'Gopalganj', 'Habiganj', 'Jamalpur', 'Jessore', 'Jhalokati', 'Jhenaidah', 
  'Joypurhat', 'Khagrachhari', 'Khulna', 'Kishoreganj', 'Kurigram', 'Kushtia', 'Lakshmipur', 'Lalmonirhat', 
  'Madaripur', 'Magura', 'Manikganj', 'Meherpur', 'Moulvibazar', 'Munshiganj', 'Mymensingh', 'Naogaon', 
  'Narail', 'Narayanganj', 'Narsingdi', 'Natore', 'Nawabganj', 'Netrokona', 'Nilphamari', 'Noakhali', 
  'Pabna', 'Panchagarh', 'Patuakhali', 'Pirojpur', 'Rajbari', 'Rajshahi', 'Rangamati', 'Rangpur', 
  'Satkhira', 'Shariatpur', 'Sherpur', 'Sirajganj', 'Sunamganj', 'Sylhet', 'Tangail', 'Thakurgaon'
];

const formatTimeWithAmPm = (timeStr) => {
  if (!timeStr || timeStr === 'N/A') return 'N/A';
  
  const cleanStr = timeStr.trim();
  if (/am|pm/i.test(cleanStr)) {
    return cleanStr;
  }

  const parts = cleanStr.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].slice(0, 2);
    if (!isNaN(hours)) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${hours}:${minutes} ${ampm}`;
    }
  }
  return cleanStr;
};

export default function User({ activeTab = 'Home', user = {} }) {
  const [buses, setBuses] = useState([]);
  const [loadingBuses, setLoadingBuses] = useState(true);
  const [searchFrom, setSearchFrom] = useState('Select District');
  const [searchTo, setSearchTo] = useState('Select District');
  
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bKash');
  const [passenger, setPassenger] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.emailOrPhone || user?.email || '',
    accountNumber: ''
  });
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const [currentUserData, setCurrentUserData] = useState({
    name: user?.name || 'Passenger User',
    phone: user?.phone || '',
    email: user?.emailOrPhone || user?.email || '',
    avatar: user?.avatar || '',
    role: 'Passenger'
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', avatar: '' });

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [userPaymentHistory, setUserPaymentHistory] = useState([]);

  // Fetch Bus Routes directly from MongoDB API
  const fetchBuses = useCallback(async () => {
    try {
      setLoadingBuses(true);
      let queryParams = [];
      if (searchFrom !== 'Select District') queryParams.push(`from=${encodeURIComponent(searchFrom)}`);
      if (searchTo !== 'Select District') queryParams.push(`to=${encodeURIComponent(searchTo)}`);
      
      const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';
      const res = await fetch(`${API_BASE}/buses${queryString}`);
      
      if (res.ok) {
        const liveBuses = await res.json();
        setBuses(Array.isArray(liveBuses) ? liveBuses : []);
      }
    } catch (err) {
      console.error('Error fetching buses from MongoDB:', err);
    } stroke:
      setLoadingBuses(false);
  }, [searchFrom, searchTo]);

  // Fetch User's Ticket History from MongoDB
  const fetchUserTickets = useCallback(async () => {
    const userEmail = currentUserData.email;
    if (!userEmail) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/tickets?email=${encodeURIComponent(userEmail)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const tickets = await res.json();
        setUserPaymentHistory(Array.isArray(tickets) ? tickets : []);
      }
    } catch (err) {
      console.error('Error fetching ticket history from MongoDB:', err);
    }
  }, [currentUserData.email]);

  useEffect(() => {
    fetchBuses();
  }, [fetchBuses]);

  useEffect(() => {
    const activeEmail = user?.emailOrPhone || user?.email || '';
    const activePhone = user?.phone || '';

    setCurrentUserData({
      name: user?.name || 'Passenger User',
      phone: activePhone,
      email: activeEmail,
      avatar: user?.avatar || '',
      role: 'Passenger'
    });

    setEditForm({
      name: user?.name || '',
      phone: activePhone,
      email: activeEmail,
      avatar: user?.avatar || ''
    });

    setPassenger((prev) => ({
      ...prev,
      name: user?.name || prev.name,
      phone: activePhone || prev.phone,
      email: activeEmail || prev.email
    }));
  }, [user]);

  useEffect(() => {
    if (currentUserData.email) {
      fetchUserTickets();
    }
  }, [currentUserData.email, fetchUserTickets]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('File size must be under 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm((prev) => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        const updated = await res.json();
        setCurrentUserData((prev) => ({ ...prev, ...updated }));
        setIsEditingProfile(false);
        alert('Profile updated successfully in MongoDB!');
      } else {
        alert('Failed to update profile on server.');
      }
    } catch (err) {
      alert('Network error while updating profile.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New password and confirm password do not match!');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          email: currentUserData.email,
          newPassword: passwordForm.newPassword
        })
      });

      if (res.ok) {
        alert('Password updated successfully in MongoDB!');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setIsChangingPassword(false);
      } else {
        alert('Failed to update password.');
      }
    } catch (err) {
      alert('Network error while changing password.');
    }
  };

  const getNumericFare = (fareString) => {
    if (typeof fareString === 'number') return fareString;
    return parseInt(String(fareString || '0').replace(/[^0-9]/g, ''), 10) || 0;
  };

  const perSeatFare = selectedBus ? getNumericFare(selectedBus.fare) : 0;
  const totalAmount = selectedSeats.length * perSeatFare;

  const handleSeatClick = (seatId, isBooked) => {
    if (isBooked) return;
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter((id) => id !== seatId));
    } else {
      setSelectedSeats([...selectedSeats, seatId]);
    }
  };

  const handleOpenBus = (bus) => {
    setSelectedBus(bus);
    setSelectedSeats([]);
    setActiveImageIndex(0);
    setBookingSuccess(null);
  };

  const handleProceedToPayment = () => {
    if (selectedSeats.length === 0) {
      alert('Please select at least one seat to proceed!');
      return;
    }
    setIsCheckoutOpen(true);
  };

  // UPDATED METHOD WITH FULL HEADERS AND AUTHENTICATION
  // UPDATED METHOD WITH FULL API CALLS & ERROR HANDLING
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

    const token = localStorage.getItem('token');
    const busId = selectedBus._id || selectedBus.id;
    const existingBooked = selectedBus.bookedSeats || [];
    const updatedBookedSeats = [...existingBooked, ...selectedSeats];

    try {
      // 1. UPDATE BUS SEATS IN MONGODB
      const resBus = await fetch(`${API_BASE}/buses/${busId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ bookedSeats: updatedBookedSeats })
      });

      if (!resBus.ok) {
        throw new Error('Failed to update reserved seats on MongoDB server.');
      }

      // 2. CREATE TICKET RECORD IN MONGODB
      const newTicketRecord = {
        busId: busId,
        busName: selectedBus.name,
        from: selectedBus.from,
        to: selectedBus.to,
        route: selectedBus.route || `${selectedBus.from} to ${selectedBus.to}`,
        seats: [...selectedSeats],
        fare: totalAmount,
        passengerName: passenger.name,
        passengerPhone: passenger.phone,
        passengerEmail: passenger.email || currentUserData.email,
        userEmail: currentUserData.email || passenger.email,
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
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(newTicketRecord)
      });

      if (!resTicket.ok) {
        throw new Error('Could not save booking details to MongoDB database.');
      }

      const savedTicket = await resTicket.json();
      console.log('Ticket Saved to MongoDB successfully:', savedTicket);

      // 3. REFRESH STATE & SHOW SUCCESS
      fetchBuses();
      fetchUserTickets();

      setBookingSuccess({
        busName: selectedBus.name,
        busNumber: selectedBus.busNumber,
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
      alert(err.message || 'Transaction failed. Please check connection to database.');
    }
  };
  const currentTab = (activeTab || 'Home').toLowerCase();

  return (
    <div style={styles.container}>
      
      {/* 1. HOME TAB */}
      {(currentTab === 'home') && (
        <>
          <div style={styles.searchBanner}>
            <div style={styles.bannerHeader}>
              <h2 style={styles.bannerTitle}>Find & Book Bus Tickets</h2>
              <p style={styles.bannerSub}>Select your preferred route, choose your seat, and pay securely.</p>
            </div>

            <div style={styles.searchRow}>
              <div style={styles.searchField}>
                <label style={styles.searchLabel}><MapPin size={14} color="#dadae0" /> From District</label>
                <select 
                  value={searchFrom} 
                  onChange={(e) => setSearchFrom(e.target.value)}
                  style={styles.selectInput}
                >
                  {BANGLADESH_DISTRICTS.map((dist) => (
                    <option key={`from-${dist}`} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              <div style={styles.searchField}>
                <label style={styles.searchLabel}><MapPin size={14} color="#dadae0" /> To District</label>
                <select 
                  value={searchTo} 
                  onChange={(e) => setSearchTo(e.target.value)}
                  style={styles.selectInput}
                >
                  {BANGLADESH_DISTRICTS.map((dist) => (
                    <option key={`to-${dist}`} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              <button 
                style={styles.resetSearchBtn} 
                onClick={() => { setSearchFrom('Select District'); setSearchTo('Select District'); }}
              >
                Show All Routes
              </button>
            </div>
          </div>

          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Available Bus Routes ({buses.length})</h3>
            <button style={styles.refreshBtn} onClick={fetchBuses}>
              <RefreshCw size={12} className={loadingBuses ? 'spin' : ''} /> Refresh Routes
            </button>
          </div>

          {loadingBuses ? (
            <div style={styles.emptyCard}>
              <RefreshCw size={36} color="#3b82f6" />
              <p style={{ color: '#a1a1aa', marginTop: '12px' }}>Loading routes from MongoDB database...</p>
            </div>
          ) : buses.length === 0 ? (
            <div style={styles.emptyCard}>
              <Bus size={48} color="#71717a" />
              <p style={{ color: '#a1a1aa', margin: '8px 0 0 0' }}>
                No bus routes found for the selected route. Try selecting 'All Districts'.
              </p>
            </div>
          ) : (
            <div style={styles.routeGrid}>
              {buses.map((bus) => {
                const bookedCount = (bus.bookedSeats || []).length;
                const availableCount = (bus.seats || 36) - bookedCount;

                return (
                  <div key={bus._id || bus.id} style={styles.busCard}>
                    <div style={styles.cardImgContainer}>
                      {bus.images && bus.images.length > 0 ? (
                        <img src={bus.images[0]} alt={bus.name} style={styles.cardImg} />
                      ) : (
                        <div style={styles.cardImgPlaceholder}>
                          <Bus size={42} color="#52525b" />
                          <span>No Photo Available</span>
                        </div>
                      )}
                    </div>

                    <div style={styles.cardBody}>
                      <div>
                        <span style={styles.operatorTag}>{bus.name}</span>
                        <div style={styles.routeHeaderRow}>
                          <h4 style={styles.routeTitle}>{bus.route || `${bus.from} to ${bus.to}`}</h4>
                          <span style={styles.busTypeBadgeUnder}>{bus.busType || 'Standard Executive AC Coach'} ({bus.seats || 36} seats)</span>
                        </div>
                        <span style={styles.coachNumber}>Coach No: {bus.busNumber || 'N/A'}</span>
                      </div>

                      <div style={styles.timeInfoRow}>
                        <div style={styles.timeBlock}>
                          <Clock size={13} color="#a1a1aa" />
                          <span>Arrival: <strong>{formatTimeWithAmPm(bus.arrivalTime)}</strong></span>
                        </div>
                        <div style={styles.timeBlock}>
                          <Clock size={13} color="#a1a1aa" />
                          <span>Departure: <strong>{formatTimeWithAmPm(bus.departureTime)}</strong></span>
                        </div>
                      </div>

                      <div style={styles.cardFooter}>
                        <div>
                          <span style={styles.fareLabel}>Fare per seat</span>
                          <div style={styles.fareValue}>{bus.fare}</div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.75rem', color: availableCount > 0 ? '#22c55e' : '#ef4444', fontWeight: '700' }}>
                            {availableCount > 0 ? `${availableCount} Seats Free` : 'Sold Out'}
                          </span>
                          <button 
                            style={styles.viewSeatsBtn}
                            onClick={() => handleOpenBus(bus)}
                          >
                            View Seats <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* 2. ABOUT TAB */}
      {(currentTab === 'about') && (
        <div style={styles.contentSection}>
          <div style={styles.aboutHeader}>
            <Bus size={44} color="#ffffff" />
            <div>
              <h2 style={{ margin: 0, color: '#f4f4f5' }}>About Online Bus Bangladesh</h2>
              <p style={{ margin: '4px 0 0 0', color: '#a1a1aa' }}>
                Bangladesh's premier digitized inter-city transportation and instant ticket reservation portal.
              </p>
            </div>
          </div>

          <div style={styles.aboutBannerBox}>
            <Info size={24} color="#38bdf8" style={{ minWidth: '24px' }} />
            <p style={{ margin: 0, color: '#d4d4d8', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Our platform connects travelers across all 64 districts in Bangladesh with top bus operators. We bring hassle-free booking, transparent seat mapping, real-time ticket availability, and guaranteed payment protection to every journey.
            </p>
          </div>

          <div style={styles.aboutGrid}>
            <div style={styles.aboutCard}>
              <ShieldCheck size={32} color="#22c55e" />
              <h4 style={styles.aboutCardTitle}>100% Verified Fleet Operators</h4>
              <p style={styles.aboutCardText}>Partnered with leading transport services for safe and comfortable express travel.</p>
            </div>

            <div style={styles.aboutCard}>
              <CreditCard size={32} color="#38bdf8" />
              <h4 style={styles.aboutCardTitle}>Instant Digital Payment</h4>
              <p style={styles.aboutCardText}>Instant ticket processing with bKash, Nagad, Rocket, and credit/debit cards.</p>
            </div>

            <div style={styles.aboutCard}>
              <Award size={32} color="#a855f7" />
              <h4 style={styles.aboutCardTitle}>Real-time Seat Selection</h4>
              <p style={styles.aboutCardText}>Choose your exact row, aisle, or window seat with live seat mapping.</p>
            </div>
          </div>
        </div>
      )}

      {/* 3. TICKETS / HISTORY TAB */}
      {(currentTab === 'tickets' || currentTab === 'history') && (
        <div style={styles.contentSection}>
          <div style={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Receipt size={24} color="#38bdf8" />
              <div>
                <h3 style={styles.sectionTitle}>My Ticket History</h3>
                <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>All purchased bus tickets and transaction logs</span>
              </div>
            </div>
            <button style={styles.refreshBtn} onClick={fetchUserTickets}>
              <RefreshCw size={12} /> Refresh History
            </button>
          </div>

          {userPaymentHistory.length === 0 ? (
            <div style={styles.emptyCard}>
              <Ticket size={48} color="#71717a" />
              <p style={{ color: '#a1a1aa', margin: '12px 0 0 0' }}>No ticket bookings recorded yet for this account.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {userPaymentHistory.map((t, idx) => (
                <div key={t._id || t.id || idx} style={styles.ticketCard}>
                  <div style={styles.ticketHeaderRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckCircle2 size={20} color="#22c55e" />
                      <span style={{ color: '#f4f4f5', fontWeight: '700', fontSize: '1rem' }}>
                        {t.busName || 'Express Bus Service'}
                      </span>
                    </div>
                    <span style={styles.ticketStatusBadge}>Confirmed • Paid ৳ {t.fare || t.price || '0'}</span>
                  </div>

                  <div style={styles.ticketGrid}>
                    <div>
                      <span style={styles.ticketLabel}>Route</span>
                      <span style={styles.ticketValue}>{t.route || `${t.from} to ${t.to}`}</span>
                    </div>

                    <div>
                      <span style={styles.ticketLabel}>Reserved Seats</span>
                      <span style={{ ...styles.ticketValue, color: '#38bdf8' }}>
                        {Array.isArray(t.seats) ? t.seats.join(', ') : (t.seats || 'N/A')}
                      </span>
                    </div>

                    <div>
                      <span style={styles.ticketLabel}>Payment Method</span>
                      <span style={styles.ticketValue}>{t.paymentMethod || 'bKash Direct'}</span>
                    </div>

                    <div>
                      <span style={styles.ticketLabel}>Transaction ID</span>
                      <span style={{ ...styles.ticketValue, fontFamily: 'monospace', color: '#22c55e' }}>
                        {t.trxId || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span style={styles.ticketLabel}>Passenger</span>
                      <span style={styles.ticketValue}>{t.passengerName || currentUserData.name}</span>
                    </div>

                    <div>
                      <span style={styles.ticketLabel}>Booking Date</span>
                      <span style={styles.ticketValue}>{t.purchaseDate || 'Recent'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. PROFILE TAB */}
      {(currentTab === 'profile') && (
        <div style={styles.contentSection}>
          <div style={styles.profileCard}>
            <div style={styles.profileHeaderFlex}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={styles.avatarWrap}>
                  {currentUserData.avatar ? (
                    <img src={currentUserData.avatar} alt="User Avatar" style={styles.avatarImage} />
                  ) : (
                    <UserIcon size={36} color="#a1a1aa" />
                  )}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#f4f4f5', fontSize: '1.2rem' }}>{currentUserData.name}</h3>
                  <span style={{ color: '#a1a1aa', fontSize: '0.85rem' }}>{currentUserData.role}</span>
                </div>
              </div>

              <button 
                style={styles.editBtn} 
                onClick={() => setIsEditingProfile(!isEditingProfile)}
              >
                <Edit3 size={14} /> {isEditingProfile ? 'Cancel Edit' : 'Edit Profile'}
              </button>
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} style={styles.profileForm}>
                <div style={styles.fieldGroup}>
                  <label style={styles.inputLabel}><Camera size={14} /> Profile Photo</label>
                  <input type="file" accept="image/*" onChange={handleImageChange} style={{ color: '#a1a1aa', fontSize: '0.85rem' }} />
                </div>

                <div style={styles.formTwoCol}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.inputLabel}><UserIcon size={14} /> Full Name</label>
                    <input 
                      type="text" 
                      value={editForm.name} 
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                      style={styles.textInput} 
                      required 
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.inputLabel}><Phone size={14} /> Phone Number</label>
                    <input 
                      type="text" 
                      value={editForm.phone} 
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} 
                      style={styles.textInput} 
                      required 
                    />
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.inputLabel}><Mail size={14} /> Email Address</label>
                  <input 
                    type="email" 
                    value={editForm.email} 
                    style={{ ...styles.textInput, backgroundColor: '#18181b', color: '#71717a' }} 
                    disabled 
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                  <button type="submit" style={styles.saveBtn}>Save Changes</button>
                  <button type="button" style={styles.cancelBtn} onClick={() => setIsEditingProfile(false)}>Cancel</button>
                </div>
              </form>
            ) : (
              <div style={styles.profileInfoGrid}>
                <div style={styles.infoBox}>
                  <span style={styles.infoLabel}><UserIcon size={13} /> Full Name</span>
                  <span style={styles.infoVal}>{currentUserData.name}</span>
                </div>

                <div style={styles.infoBox}>
                  <span style={styles.infoLabel}><Mail size={13} /> Email</span>
                  <span style={styles.infoVal}>{currentUserData.email || 'N/A'}</span>
                </div>

                <div style={styles.infoBox}>
                  <span style={styles.infoLabel}><Phone size={13} /> Phone</span>
                  <span style={styles.infoVal}>{currentUserData.phone || 'N/A'}</span>
                </div>

                <div style={styles.infoBox}>
                  <span style={styles.infoLabel}><ShieldCheck size={13} /> Status</span>
                  <span style={{ ...styles.infoVal, color: '#22c55e' }}>Active Account</span>
                </div>
              </div>
            )}
          </div>

          <div style={styles.profileCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f4f4f5', fontWeight: '700' }}>
                <Lock size={18} color="#38bdf8" />
                <span>Security & Password</span>
              </div>
              <button 
                style={styles.secondaryBtn} 
                onClick={() => setIsChangingPassword(!isChangingPassword)}
              >
                {isChangingPassword ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {isChangingPassword && (
              <form onSubmit={handleChangePassword} style={styles.profileForm}>
                <div style={styles.formTwoCol}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.inputLabel}>New Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={passwordForm.newPassword} 
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} 
                      style={styles.textInput} 
                      required 
                    />
                  </div>

                  <div style={styles.fieldGroup}>
                    <label style={styles.inputLabel}>Confirm New Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={passwordForm.confirmPassword} 
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} 
                      style={styles.textInput} 
                      required 
                    />
                  </div>
                </div>

                <button type="submit" style={styles.saveBtn}>Update Password</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* SEAT SELECTION MODAL */}
      {selectedBus && (
        <div style={styles.modalOverlay} onClick={() => setSelectedBus(null)}>
          <div style={styles.modalContentLarge} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#f4f4f5', fontSize: '1.3rem' }}>{selectedBus.name}</h3>
                <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>
                  Coach No: {selectedBus.busNumber || 'N/A'} | Route: {selectedBus.route || `${selectedBus.from} to ${selectedBus.to}`}
                </span>
              </div>
              <button style={styles.closeBtn} onClick={() => setSelectedBus(null)}><X size={20} /></button>
            </div>

            {bookingSuccess ? (
              <div style={styles.successReceiptCard}>
                <CheckCircle2 size={48} color="#22c55e" />
                <h3 style={{ margin: '8px 0 0 0', color: '#f4f4f5' }}>Booking Successful!</h3>
                <p style={{ color: '#a1a1aa', fontSize: '0.9rem', margin: '4px 0 16px 0' }}>Your bus seats are reserved and confirmed.</p>

                <div style={styles.receiptDetailsBox}>
                  <div style={styles.receiptRow}><span>Operator:</span><strong>{bookingSuccess.busName}</strong></div>
                  <div style={styles.receiptRow}><span>Coach Number:</span><strong>{bookingSuccess.busNumber}</strong></div>
                  <div style={styles.receiptRow}><span>Passenger:</span><strong>{bookingSuccess.passengerName}</strong></div>
                  <div style={styles.receiptRow}><span>Reserved Seats:</span><strong style={{ color: '#38bdf8' }}>{bookingSuccess.seats.join(', ')}</strong></div>
                  <div style={styles.receiptRow}><span>Total Paid:</span><strong style={{ color: '#22c55e' }}>৳ {bookingSuccess.totalPaid}</strong></div>
                  <div style={styles.receiptRow}><span>Transaction ID:</span><strong style={{ fontFamily: 'monospace' }}>{bookingSuccess.trxId}</strong></div>
                </div>

                <button style={styles.saveBtn} onClick={() => setSelectedBus(null)}>Done</button>
              </div>
            ) : (
              <div style={styles.modalTwoColumn}>
                <div style={styles.leftSeatColumn}>
                  <div style={styles.seatHeaderFlex}>
                    <h4 style={{ margin: 0, color: '#f4f4f5', fontSize: '0.9rem' }}>Select Seat(s)</h4>
                    <div style={styles.legendRow}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ ...styles.legendBox, backgroundColor: '#22c55e' }}></span> Free
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ ...styles.legendBox, backgroundColor: '#38bdf8' }}></span> Selected
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ ...styles.legendBox, backgroundColor: '#52525b' }}></span> Booked
                      </span>
                    </div>
                  </div>

                  <div style={styles.busChassis}>
                    <div style={styles.driverCabinRow}>
                      <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>🚌 Driver Cabin</span>
                      <span>⭕</span>
                    </div>

                    <div style={styles.verticalSeatContainer}>
                      {Array.from({ length: Math.ceil((selectedBus.seats || 36) / 4) }).map((_, rowIndex) => {
                        const rowLetter = String.fromCharCode(65 + rowIndex);
                        const seat1 = `${rowLetter}1`;
                        const seat2 = `${rowLetter}2`;
                        const seat3 = `${rowLetter}3`;
                        const seat4 = `${rowLetter}4`;

                        const isBooked = (sId) => (selectedBus.bookedSeats || []).includes(sId);
                        const isSelected = (sId) => selectedSeats.includes(sId);

                        return (
                          <div key={rowLetter} style={styles.busRowGroup}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              {[seat1, seat2].map((sId) => (
                                <button
                                  key={sId}
                                  type="button"
                                  disabled={isBooked(sId)}
                                  onClick={() => handleSeatClick(sId, isBooked(sId))}
                                  style={{
                                    ...styles.compactSeat,
                                    backgroundColor: isBooked(sId) ? '#52525b' : isSelected(sId) ? '#38bdf8' : '#22c55e',
                                    cursor: isBooked(sId) ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {sId}
                                </button>
                              ))}
                            </div>

                            <div style={{ flex: 1 }} />

                            <div style={{ display: 'flex', gap: '6px' }}>
                              {[seat3, seat4].map((sId) => (
                                <button
                                  key={sId}
                                  type="button"
                                  disabled={isBooked(sId)}
                                  onClick={() => handleSeatClick(sId, isBooked(sId))}
                                  style={{
                                    ...styles.compactSeat,
                                    backgroundColor: isBooked(sId) ? '#52525b' : isSelected(sId) ? '#38bdf8' : '#22c55e',
                                    cursor: isBooked(sId) ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  {sId}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={styles.rightInfoColumn}>
                  <div style={styles.detailCard}>
                    <span style={styles.detailLabel}>Coach & Class</span>
                    <span style={styles.detailValue}>{selectedBus.busType || 'Executive Class'}</span>
                  </div>

                  <div style={styles.detailCard}>
                    <span style={styles.detailLabel}>Departure & Arrival</span>
                    <span style={styles.detailValue}>
                      {formatTimeWithAmPm(selectedBus.departureTime)} ➔ {formatTimeWithAmPm(selectedBus.arrivalTime)}
                    </span>
                  </div>

                  <div style={styles.detailCard}>
                    <span style={styles.detailLabel}>Selected Seat Numbers</span>
                    <span style={{ ...styles.detailValue, color: '#38bdf8' }}>
                      {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}
                    </span>
                  </div>

                  <div style={styles.detailCard}>
                    <span style={styles.detailLabel}>Total Fare Payable</span>
                    <span style={{ ...styles.detailValue, color: '#22c55e', fontSize: '1.2rem' }}>
                      ৳ {totalAmount}
                    </span>
                  </div>

                  <button 
                    style={{ ...styles.saveBtn, marginTop: '8px' }} 
                    onClick={handleProceedToPayment}
                  >
                    Proceed to Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT & PAYMENT MODAL */}
      {isCheckoutOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsCheckoutOpen(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#f4f4f5' }}>Checkout Payment</h3>
                <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Total Amount: ৳ {totalAmount}</span>
              </div>
              <button style={styles.closeBtn} onClick={() => setIsCheckoutOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleConfirmBooking} style={styles.profileForm}>
              <div style={styles.fieldGroup}>
                <label style={styles.inputLabel}>Select Payment Gateway</label>
                <div style={styles.gatewayRadioGrid}>
                  {['bKash', 'Nagad', 'Rocket', 'Card'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      style={{
                        ...styles.gatewayBtn,
                        borderColor: paymentMethod === method ? '#38bdf8' : '#3f3f46',
                        backgroundColor: paymentMethod === method ? '#1e293b' : '#18181b'
                      }}
                      onClick={() => setPaymentMethod(method)}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.inputLabel}>Passenger Full Name</label>
                <input
                  type="text"
                  value={passenger.name}
                  onChange={(e) => setPassenger({ ...passenger, name: e.target.value })}
                  style={styles.textInput}
                  required
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.inputLabel}>Phone Number</label>
                <input
                  type="text"
                  value={passenger.phone}
                  onChange={(e) => setPassenger({ ...passenger, phone: e.target.value })}
                  style={styles.textInput}
                  required
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.inputLabel}>{paymentMethod} Account / Card Number</label>
                <input
                  type="text"
                  placeholder="017XXXXXXXX / 4321..."
                  value={passenger.accountNumber}
                  onChange={(e) => setPassenger({ ...passenger, accountNumber: e.target.value })}
                  style={styles.textInput}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button type="submit" style={styles.saveBtn}>Confirm & Pay ৳ {totalAmount}</button>
                <button type="button" style={styles.cancelBtn} onClick={() => setIsCheckoutOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px', color: '#ffffff' },
  searchBanner: { backgroundColor: '#27272a', padding: '24px', borderRadius: '16px', border: '1px solid #3f3f46' },
  bannerHeader: { marginBottom: '16px' },
  bannerTitle: { margin: 0, fontSize: '1.4rem', color: '#f4f4f5' },
  bannerSub: { margin: '4px 0 0 0', color: '#a1a1aa', fontSize: '0.85rem' },
  searchRow: { display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' },
  searchField: { flex: 1, minWidth: '180px', display: 'flex', flexDirection: 'column', gap: '6px' },
  searchLabel: { fontSize: '0.78rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '4px' },
  selectInput: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#ffffff', outline: 'none' },
  resetSearchBtn: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#a1a1aa', fontSize: '0.85rem', cursor: 'pointer' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { margin: 0, fontSize: '1.2rem', color: '#f4f4f5' },
  refreshBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: '#a1a1aa', fontSize: '0.78rem', cursor: 'pointer' },
  emptyCard: { backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '16px', padding: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  routeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  busCard: { backgroundColor: '#27272a', borderRadius: '16px', border: '1px solid #3f3f46', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
  cardImgContainer: { height: '140px', backgroundColor: '#18181b', position: 'relative' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImgPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#71717a', gap: '6px', fontSize: '0.8rem' },
  cardBody: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'space-between' },
  operatorTag: { fontSize: '0.75rem', color: '#a1a1aa', fontWeight: '700', textTransform: 'uppercase' },
  routeHeaderRow: { margin: '2px 0' },
  routeTitle: { margin: 0, fontSize: '1.05rem', color: '#f4f4f5' },
  busTypeBadgeUnder: { fontSize: '0.72rem', color: '#38bdf8' },
  coachNumber: { fontSize: '0.75rem', color: '#71717a', display: 'block' },
  timeInfoRow: { display: 'flex', gap: '12px', fontSize: '0.78rem', color: '#a1a1aa', backgroundColor: '#18181b', padding: '8px 12px', borderRadius: '8px' },
  timeBlock: { display: 'flex', alignItems: 'center', gap: '4px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '10px', borderTop: '1px solid #3f3f46' },
  fareLabel: { fontSize: '0.7rem', color: '#a1a1aa' },
  fareValue: { fontSize: '1.1rem', fontWeight: '800', color: '#22c55e' },
  viewSeatsBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#38bdf8', color: '#09090b', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer', marginTop: '4px' },
  contentSection: { display: 'flex', flexDirection: 'column', gap: '20px' },
  aboutHeader: { backgroundColor: '#27272a', padding: '24px', borderRadius: '16px', border: '1px solid #3f3f46', display: 'flex', alignItems: 'center', gap: '16px' },
  aboutBannerBox: { backgroundColor: '#18181b', padding: '18px', borderRadius: '12px', border: '1px solid #3f3f46', display: 'flex', gap: '12px', alignItems: 'center' },
  aboutGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' },
  aboutCard: { backgroundColor: '#27272a', padding: '20px', borderRadius: '12px', border: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', gap: '10px' },
  aboutCardTitle: { margin: 0, color: '#f4f4f5', fontSize: '0.95rem' },
  aboutCardText: { margin: 0, color: '#a1a1aa', fontSize: '0.8rem', lineHeight: '1.4' },
  ticketCard: { backgroundColor: '#27272a', padding: '16px', borderRadius: '12px', border: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', gap: '12px' },
  ticketHeaderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #3f3f46', paddingBottom: '10px' },
  ticketStatusBadge: { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' },
  ticketGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' },
  ticketLabel: { fontSize: '0.72rem', color: '#a1a1aa', display: 'block' },
  ticketValue: { fontSize: '0.85rem', color: '#f4f4f5', fontWeight: '600' },
  profileCard: { backgroundColor: '#27272a', padding: '20px', borderRadius: '16px', border: '1px solid #3f3f46' },
  profileHeaderFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' },
  avatarWrap: { width: '56px', height: '56px', borderRadius: '50%', backgroundColor: '#18181b', border: '1px solid #52525b', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', objectFit: 'cover' },
  editBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#f4f4f5', fontSize: '0.8rem', cursor: 'pointer' },
  profileForm: { display: 'flex', flexDirection: 'column', gap: '12px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  inputLabel: { fontSize: '0.78rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '4px' },
  textInput: { padding: '10px 12px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#ffffff', outline: 'none' },
  formTwoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' },
  saveBtn: { padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#22c55e', color: '#09090b', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' },
  cancelBtn: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#a1a1aa', fontSize: '0.85rem', cursor: 'pointer' },
  profileInfoGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' },
  infoBox: { backgroundColor: '#18181b', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', gap: '4px' },
  infoLabel: { fontSize: '0.72rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '4px' },
  infoVal: { fontSize: '0.88rem', color: '#f4f4f5', fontWeight: '600' },
  secondaryBtn: { padding: '6px 12px', borderRadius: '6px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#38bdf8', fontSize: '0.8rem', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '16px', padding: '24px', width: '90%' },
  modalContentLarge: { backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' },
  closeBtn: { background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' },
  modalTwoColumn: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
  leftSeatColumn: { backgroundColor: '#18181b', padding: '16px', borderRadius: '12px', border: '1px solid #3f3f46' },
  seatHeaderFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  legendRow: { display: 'flex', gap: '8px', fontSize: '0.7rem', color: '#a1a1aa' },
  legendBox: { width: '10px', height: '10px', borderRadius: '2px', display: 'inline-block' },
  busChassis: { border: '2px solid #3f3f46', borderRadius: '16px', padding: '12px', backgroundColor: '#09090b', display: 'flex', flexDirection: 'column', gap: '12px' },
  driverCabinRow: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #3f3f46', paddingBottom: '8px' },
  verticalSeatContainer: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' },
  busRowGroup: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  compactSeat: { width: '36px', height: '34px', borderRadius: '6px', border: 'none', color: '#ffffff', fontWeight: '700', fontSize: '0.75rem' },
  rightInfoColumn: { display: 'flex', flexDirection: 'column', gap: '10px' },
  detailCard: { backgroundColor: '#18181b', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', gap: '4px' },
  detailLabel: { fontSize: '0.72rem', color: '#a1a1aa' },
  detailValue: { fontSize: '0.9rem', color: '#f4f4f5', fontWeight: '700' },
  gatewayRadioGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' },
  gatewayBtn: { padding: '10px', borderRadius: '8px', border: '1px solid #3f3f46', color: '#f4f4f5', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem' },
  successReceiptCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' },
  receiptDetailsBox: { backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', padding: '16px', width: '100%', margin: '16px 0', display: 'flex', flexDirection: 'column', gap: '8px' },
  receiptRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#a1a1aa' }
};