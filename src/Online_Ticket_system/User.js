import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bus,
  Ticket, 
  CreditCard, 
  Clock, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  User as UserIcon, 
  Phone, 
  Mail, 
  MapPin,
  ShieldCheck,
  Award,
  HelpCircle,
  Info,
  Edit3,
  Check,
  Lock,
  Camera,
  Key,
  Receipt
} from 'lucide-react';

const API_BASE = 'https://online-bus-ticket-system-81tt.onrender.com/api';

const BANGLADESH_DISTRICTS = [
  'All Districts', 'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola', 'Bogra', 'Brahmanbaria', 'Chandpur', 
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
  const [searchFrom, setSearchFrom] = useState('All Districts');
  const [searchTo, setSearchTo] = useState('All Districts');
  
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
    phone: user?.phone || '01700000000',
    email: user?.emailOrPhone || user?.email || 'passenger@onlinebus.bd',
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

  // Fetch live buses from database to sync automatically across all devices
  const loadData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/buses`);
      if (res.ok) {
        const liveBuses = await res.json();
        setBuses(Array.isArray(liveBuses) ? liveBuses : []);
        localStorage.setItem('app_buses', JSON.stringify(liveBuses));
      } else {
        const savedBuses = localStorage.getItem('app_buses');
        if (savedBuses) setBuses(JSON.parse(savedBuses));
      }
    } catch (err) {
      console.warn('Backend unavailable, using cached bus data.');
      const savedBuses = localStorage.getItem('app_buses');
      if (savedBuses) setBuses(JSON.parse(savedBuses));
    }

    const loadedUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
    const activeEmail = user?.emailOrPhone || user?.email || 'passenger@onlinebus.bd';
    const activePhone = user?.phone || '01700000000';

    const foundUser = loadedUsers.find(
      (u) => (u.email && u.email.toLowerCase() === activeEmail.toLowerCase()) || 
             (u.phone && u.phone === activePhone)
    );

    const currentUser = {
      name: foundUser?.name || user?.name || 'Passenger User',
      phone: foundUser?.phone || activePhone,
      email: foundUser?.email || activeEmail,
      avatar: foundUser?.avatar || user?.avatar || '',
      role: 'Passenger'
    };

    setCurrentUserData(currentUser);
    setEditForm({
      name: currentUser.name,
      phone: currentUser.phone,
      email: currentUser.email,
      avatar: currentUser.avatar
    });

    const allTickets = JSON.parse(localStorage.getItem('app_tickets') || '[]');
    
    const filteredUserTickets = allTickets.filter((ticket) => {
      const matchEmail = ticket.userEmail && ticket.userEmail.toLowerCase() === currentUser.email.toLowerCase();
      const matchPhone = ticket.passengerPhone && ticket.passengerPhone === currentUser.phone;
      return matchEmail || matchPhone;
    });

    setUserPaymentHistory([...filteredUserTickets].reverse());
  }, [user]);

  useEffect(() => {
    loadData();

    // Auto-refresh every 5 seconds to get newly added admin routes across devices
    const interval = setInterval(() => {
      loadData();
    }, 5000);

    const handleStorage = (e) => {
      if (e.key === 'app_buses' || e.key === 'app_tickets' || e.key === 'app_users') {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [loadData, activeTab]);

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

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const loadedUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
    
    const updatedUsers = loadedUsers.map((u) => {
      if ((u.email && u.email.toLowerCase() === currentUserData.email.toLowerCase()) || u.phone === currentUserData.phone) {
        return { 
          ...u, 
          name: editForm.name, 
          phone: editForm.phone, 
          email: editForm.email,
          avatar: editForm.avatar 
        };
      }
      return u;
    });

    localStorage.setItem('app_users', JSON.stringify(updatedUsers));
    setCurrentUserData((prev) => ({ ...prev, ...editForm }));
    setIsEditingProfile(false);
    alert('Profile updated successfully!');
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New password and confirm password do not match!');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }

    const loadedUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
    const userIndex = loadedUsers.findIndex(
      (u) => (u.email && u.email.toLowerCase() === currentUserData.email.toLowerCase()) || u.phone === currentUserData.phone
    );

    if (userIndex !== -1) {
      if (loadedUsers[userIndex].password && loadedUsers[userIndex].password !== passwordForm.currentPassword) {
        alert('Current password is incorrect!');
        return;
      }
      loadedUsers[userIndex].password = passwordForm.newPassword;
      localStorage.setItem('app_users', JSON.stringify(loadedUsers));
    }

    alert('Password updated successfully!');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsChangingPassword(false);
  };

  const filteredBuses = buses.filter((bus) => {
    const matchesFrom = searchFrom === 'All Districts' || bus.from?.toLowerCase() === searchFrom.toLowerCase();
    const matchesTo = searchTo === 'All Districts' || bus.to?.toLowerCase() === searchTo.toLowerCase();
    return matchesFrom && matchesTo;
  });

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
    const updatedBookedSeats = [...existingBooked, ...selectedSeats];

    // Sync booking state to server
    try {
      await fetch(`${API_BASE}/buses/${busId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookedSeats: updatedBookedSeats })
      });
    } catch (err) {
      console.warn('Backend server sync pending.');
    }

    const updatedBuses = buses.map((bus) => {
      if ((bus._id || bus.id) === busId) {
        return {
          ...bus,
          bookedSeats: updatedBookedSeats
        };
      }
      return bus;
    });

    const newTickets = selectedSeats.map((seatId) => ({
      id: 'TICK-' + Math.floor(100000 + Math.random() * 900000),
      busId: busId,
      busName: selectedBus.name,
      route: selectedBus.route || `${selectedBus.from} to ${selectedBus.to}`,
      seatNumber: seatId,
      fare: perSeatFare,
      passengerName: passenger.name,
      passengerPhone: passenger.phone,
      userEmail: currentUserData.email,
      paymentMethod: paymentMethod,
      purchaseDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }));

    const savedTickets = JSON.parse(localStorage.getItem('app_tickets') || '[]');
    const updatedTickets = [...savedTickets, ...newTickets];

    localStorage.setItem('app_buses', JSON.stringify(updatedBuses));
    localStorage.setItem('app_tickets', JSON.stringify(updatedTickets));

    setBuses(updatedBuses);
    
    const userOnly = updatedTickets.filter(
      (t) => (t.userEmail && t.userEmail.toLowerCase() === currentUserData.email.toLowerCase()) || t.passengerPhone === currentUserData.phone
    );
    setUserPaymentHistory([...userOnly].reverse());

    setBookingSuccess({
      busName: selectedBus.name,
      busNumber: selectedBus.busNumber,
      seats: [...selectedSeats],
      totalPaid: totalAmount,
      trxId: 'TRX' + Math.floor(10000000 + Math.random() * 90000000),
      paymentMethod,
      passengerName: passenger.name
    });

    setIsCheckoutOpen(false);
    setSelectedSeats([]);

    setSelectedBus((prev) => ({
      ...prev,
      bookedSeats: updatedBookedSeats
    }));
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
                <label style={styles.searchLabel}><MapPin size={14} color="#a1a1aa" /> From District</label>
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
                <label style={styles.searchLabel}><MapPin size={14} color="#a1a1aa" /> To District</label>
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
                onClick={() => { setSearchFrom('All Districts'); setSearchTo('All Districts'); }}
              >
                Show All Routes
              </button>
            </div>
          </div>

          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>Available Bus Routes ({filteredBuses.length})</h3>
            <span style={styles.liveSyncBadge}>● Live Real-Time Availability</span>
          </div>

          {filteredBuses.length === 0 ? (
            <div style={styles.emptyCard}>
              <Bus size={48} color="#71717a" />
              <p style={{ color: '#a1a1aa', margin: '8px 0 0 0' }}>
                {buses.length === 0 
                  ? "No routes available. Admin hasn't added any routes yet." 
                  : "No bus routes available for the selected destination."}
              </p>
            </div>
          ) : (
            <div style={styles.routeGrid}>
              {filteredBuses.map((bus) => {
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
                          <div style={styles.fareValue}>{bus.fare.includes('BDT') ? bus.fare : `৳${bus.fare}`}</div>
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
              Our platform connects travelers across all 64 districts in Bangladesh with top bus operators. We strive to bring hassle-free booking, transparent seat mapping, real-time ticket availability, and guaranteed payment protection to every journey.
            </p>
          </div>

          <div style={styles.aboutGrid}>
            <div style={styles.aboutCard}>
              <ShieldCheck size={32} color="#22c55e" />
              <h4 style={styles.aboutCardTitle}>100% Verified Fleet Operators</h4>
              <p style={styles.aboutCardText}>
                We partner with accredited bus companies like Shamoli, Ena, Hanif, and Green Line.
              </p>
            </div>

            <div style={styles.aboutCard}>
              <CreditCard size={32} color="#38bdf8" />
              <h4 style={styles.aboutCardTitle}>Instant Mobile Payment</h4>
              <p style={styles.aboutCardText}>
                Complete transactions in seconds using bKash, Nagad, Rocket, or cards.
              </p>
            </div>

            <div style={styles.aboutCard}>
              <Award size={32} color="#eab308" />
              <h4 style={styles.aboutCardTitle}>Transparent Fare Guarantee</h4>
              <p style={styles.aboutCardText}>
                No hidden service charges or unexpected surge prices at the counter.
              </p>
            </div>

            <div style={styles.aboutCard}>
              <HelpCircle size={32} color="#a855f7" />
              <h4 style={styles.aboutCardTitle}>24/7 Dedicated Support</h4>
              <p style={styles.aboutCardText}>
                Our support team is online round-the-clock to keep your journey smooth.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. PROFILE TAB */}
      {(currentTab === 'profile') && (
        <div style={styles.contentSection}>
          
          <div style={styles.profileHeaderCard}>
            <div style={styles.avatarContainer}>
              {currentUserData.avatar ? (
                <img src={currentUserData.avatar} alt="Profile" style={styles.avatarImg} />
              ) : (
                <div style={styles.avatarLarge}>
                  <UserIcon size={40} color="#a1a1aa" />
                </div>
              )}
            </div>
            <div>
              <h2 style={{ margin: 0, color: '#f4f4f5' }}>{currentUserData.name}</h2>
              <span style={{ fontSize: '0.85rem', color: '#22c55e', fontWeight: '700' }}>
                {currentUserData.role || 'Passenger Account'}
              </span>
            </div>
          </div>

          <div style={styles.profileDetailsCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#f4f4f5' }}>Personal Information</h3>
              {!isEditingProfile && (
                <button style={styles.editProfileBtn} onClick={() => { setEditForm({ ...currentUserData }); setIsEditingProfile(true); }}>
                  <Edit3 size={14} /> Edit Profile
                </button>
              )}
            </div>

            {isEditingProfile ? (
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                <div style={styles.fieldGroup}>
                  <label style={styles.modalLabel}><Camera size={14} color="#a1a1aa" /> Profile Photo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    {editForm.avatar ? (
                      <img src={editForm.avatar} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3f3f46' }} />
                    ) : (
                      <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UserIcon size={24} color="#71717a" />
                      </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange}
                      style={{ color: '#a1a1aa', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.modalLabel}><UserIcon size={14} color="#a1a1aa" /> Full Name</label>
                  <input 
                    type="text" 
                    value={editForm.name} 
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    style={styles.modalInput}
                    required 
                  />
                </div>

                <div style={styles.formRow}>
                  <div style={{ ...styles.fieldGroup, flex: 1 }}>
                    <label style={styles.modalLabel}><Phone size={14} color="#a1a1aa" /> Phone Number</label>
                    <input 
                      type="text" 
                      value={editForm.phone} 
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      style={styles.modalInput}
                      required 
                    />
                  </div>

                  <div style={{ ...styles.fieldGroup, flex: 1 }}>
                    <label style={styles.modalLabel}><Mail size={14} color="#a1a1aa" /> Email Address</label>
                    <input 
                      type="email" 
                      value={editForm.email} 
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      style={styles.modalInput}
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" style={styles.cancelBtn} onClick={() => setIsEditingProfile(false)}>
                    Cancel
                  </button>
                  <button type="submit" style={styles.submitModalBtn}>
                    <Check size={16} /> Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div style={styles.infoList}>
                <div style={styles.infoItem}>
                  <UserIcon size={18} color="#a1a1aa" />
                  <div>
                    <span style={styles.infoLabel}>Full Name</span>
                    <p style={styles.infoValue}>{currentUserData.name}</p>
                  </div>
                </div>

                <div style={styles.infoItem}>
                  <Phone size={18} color="#a1a1aa" />
                  <div>
                    <span style={styles.infoLabel}>Phone Number</span>
                    <p style={styles.infoValue}>{currentUserData.phone}</p>
                  </div>
                </div>

                <div style={styles.infoItem}>
                  <Mail size={18} color="#a1a1aa" />
                  <div>
                    <span style={styles.infoLabel}>Email Address</span>
                    <p style={styles.infoValue}>{currentUserData.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={styles.profileDetailsCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#f4f4f5' }}>Account Security</h3>
                <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Update your secret login password</span>
              </div>
              {!isChangingPassword && (
                <button style={styles.editProfileBtn} onClick={() => setIsChangingPassword(true)}>
                  <Key size={14} /> Change Password
                </button>
              )}
            </div>

            {isChangingPassword ? (
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={styles.fieldGroup}>
                  <label style={styles.modalLabel}><Lock size={14} color="#a1a1aa" /> Current Password</label>
                  <input 
                    type="password" 
                    placeholder="Enter current password"
                    value={passwordForm.currentPassword} 
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    style={styles.modalInput}
                    required 
                  />
                </div>

                <div style={styles.formRow}>
                  <div style={{ ...styles.fieldGroup, flex: 1 }}>
                    <label style={styles.modalLabel}><Lock size={14} color="#a1a1aa" /> New Password</label>
                    <input 
                      type="password" 
                      placeholder="Minimum 6 characters"
                      value={passwordForm.newPassword} 
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      style={styles.modalInput}
                      required 
                    />
                  </div>

                  <div style={{ ...styles.fieldGroup, flex: 1 }}>
                    <label style={styles.modalLabel}><Lock size={14} color="#a1a1aa" /> Confirm New Password</label>
                    <input 
                      type="password" 
                      placeholder="Re-type new password"
                      value={passwordForm.confirmPassword} 
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      style={styles.modalInput}
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" style={styles.cancelBtn} onClick={() => setIsChangingPassword(false)}>
                    Cancel
                  </button>
                  <button type="submit" style={styles.submitModalBtn}>
                    <Check size={16} /> Update Password
                  </button>
                </div>
              </form>
            ) : (
              <div style={styles.infoItem}>
                <Lock size={18} color="#a1a1aa" />
                <div>
                  <span style={styles.infoLabel}>Password</span>
                  <p style={styles.infoValue}>••••••••••••</p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 4. PAYMENT HISTORY TAB */}
      {(currentTab === 'payment') && (
        <div style={styles.contentSection}>
          <div style={styles.sectionHeader}>
            <div>
              <h3 style={styles.sectionTitle}>My Payment & Booking History</h3>
              <p style={{ color: '#a1a1aa', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                Private history of completed ticket bookings for account: <strong style={{ color: '#ffffff' }}>{currentUserData.email}</strong>
              </p>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#22c55e', backgroundColor: '#14532d', padding: '6px 12px', borderRadius: '8px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={12} /> Confidential & Secured
            </span>
          </div>

          {userPaymentHistory.length === 0 ? (
            <div style={styles.emptyCard}>
              <Receipt size={48} color="#71717a" />
              <h4 style={{ color: '#f4f4f5', margin: '12px 0 4px 0' }}>No Payment History Found</h4>
              <p style={{ color: '#a1a1aa', margin: 0, fontSize: '0.85rem' }}>
                You have not booked or paid for any tickets yet. Book your first trip from the Home tab!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {userPaymentHistory.map((item, idx) => (
                <div key={item.id || idx} style={styles.historyCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={styles.historyIconBox}>
                      <Ticket size={22} color="#ffffff" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, color: '#f4f4f5' }}>{item.busName}</h4>
                        <span style={styles.ticketBadge}>{item.id}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
                        Route: {item.route} | Seat: <strong style={{ color: '#22c55e' }}>{item.seatNumber}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: '800', color: '#22c55e', display: 'block' }}>
                      ৳ {item.fare}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#71717a' }}>
                      {item.purchaseDate} via {item.paymentMethod || 'bKash'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SEAT SELECTION MODAL */}
      {selectedBus && (
        <div style={styles.modalOverlay} onClick={() => setSelectedBus(null)}>
          <div style={styles.modalContentLarge} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#f4f4f5', fontSize: '1.3rem' }}>
                  {selectedBus.name}
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>
                  Route: {selectedBus.route || `${selectedBus.from} to ${selectedBus.to}`} | Coach: {selectedBus.busNumber}
                </span>
              </div>
              <button style={styles.closeBtn} onClick={() => setSelectedBus(null)}>
                <X size={20} />
              </button>
            </div>

            {bookingSuccess && (
              <div style={styles.successReceipt}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={24} color="#22c55e" />
                  <div>
                    <h4 style={{ margin: 0, color: '#22c55e' }}>Booking Confirmed & Saved to Your Account!</h4>
                    <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#d4d4d8' }}>
                      Transaction ID: <strong>{bookingSuccess.trxId}</strong> | Paid <strong>৳{bookingSuccess.totalPaid}</strong> via {bookingSuccess.paymentMethod}
                    </p>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginTop: '6px' }}>
                  Seats Issued: <strong>{bookingSuccess.seats.join(', ')}</strong> for passenger <strong>{bookingSuccess.passengerName}</strong>
                </div>
              </div>
            )}

            <div style={styles.modalTwoColumn}>
              <div style={styles.leftSeatColumn}>
                <div style={styles.seatHeaderFlex}>
                  <h4 style={{ margin: 0, color: '#f4f4f5', fontSize: '0.95rem' }}>
                    Select Seats
                  </h4>
                  
                  <div style={styles.legendRow}>
                    <div style={styles.legendItem}>
                      <div style={{ ...styles.legendBox, backgroundColor: '#22c55e' }}></div>
                      <span>Free</span>
                    </div>
                    <div style={styles.legendItem}>
                      <div style={{ ...styles.legendBox, backgroundColor: '#3b82f6' }}></div>
                      <span>Selected</span>
                    </div>
                    <div style={styles.legendItem}>
                      <div style={{ ...styles.legendBox, backgroundColor: '#6b7280' }}></div>
                      <span>Booked</span>
                    </div>
                  </div>
                </div>

                <div style={styles.busChassis}>
                  <div style={styles.driverCabinRow}>
                    <span style={styles.driverIconBadge}>🚌 Driver</span>
                    <div style={styles.steeringWheel}>⭕</div>
                  </div>

                  <div style={styles.verticalSeatContainer}>
                    {Array.from({ length: Math.ceil((selectedBus.seats || 36) / 4) }).map((_, rowIndex) => {
                      const rowLetter = String.fromCharCode(65 + rowIndex);
                      const s1 = `${rowLetter}1`;
                      const s2 = `${rowLetter}2`;
                      const s3 = `${rowLetter}3`;
                      const s4 = `${rowLetter}4`;

                      const isBooked = (seatId) => (selectedBus.bookedSeats || []).includes(seatId);

                      return (
                        <div key={rowLetter} style={styles.busRowGroup}>
                          <div style={styles.seatPair}>
                            {[s1, s2].map((seatId) => {
                              const booked = isBooked(seatId);
                              const selected = selectedSeats.includes(seatId);
                              let seatBg = '#22c55e';
                              if (booked) seatBg = '#6b7280';
                              else if (selected) seatBg = '#3b82f6';

                              return (
                                <button
                                  key={seatId}
                                  type="button"
                                  disabled={booked}
                                  style={{
                                    ...styles.compactSeat,
                                    backgroundColor: seatBg,
                                    cursor: booked ? 'not-allowed' : 'pointer'
                                  }}
                                  onClick={() => handleSeatClick(seatId, booked)}
                                >
                                  {seatId}
                                </button>
                              );
                            })}
                          </div>

                          <div style={styles.aisleGap} />

                          <div style={styles.seatPair}>
                            {[s3, s4].map((seatId) => {
                              const booked = isBooked(seatId);
                              const selected = selectedSeats.includes(seatId);
                              let seatBg = '#22c55e';
                              if (booked) seatBg = '#6b7280';
                              else if (selected) seatBg = '#3b82f6';

                              return (
                                <button
                                  key={seatId}
                                  type="button"
                                  disabled={booked}
                                  style={{
                                    ...styles.compactSeat,
                                    backgroundColor: seatBg,
                                    cursor: booked ? 'not-allowed' : 'pointer'
                                  }}
                                  onClick={() => handleSeatClick(seatId, booked)}
                                >
                                  {seatId}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={styles.rightInfoColumn}>
                <div style={styles.imageGalleryContainer}>
                  {selectedBus.images && selectedBus.images.length > 0 ? (
                    <div>
                      <img
                        src={selectedBus.images[activeImageIndex] || selectedBus.images[0]}
                        alt="Main Bus"
                        style={styles.mainLargeImg}
                      />

                      {selectedBus.images.length > 1 && (
                        <div style={styles.thumbnailRow}>
                          {selectedBus.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt={`Bus preview ${i}`}
                              style={{
                                ...styles.thumbImg,
                                border: activeImageIndex === i ? '2px solid #a1a1aa' : '1px solid #3f3f46'
                              }}
                              onClick={() => setActiveImageIndex(i)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={styles.largeImgPlaceholder}>
                      <Bus size={60} color="#52525b" />
                      <span>No Pictures Uploaded</span>
                    </div>
                  )}
                </div>

                <div style={styles.detailCard}>
                  <span style={styles.detailLabel}>Seats Selected</span>
                  <div style={{ color: '#f4f4f5', fontWeight: '700', fontSize: '1rem' }}>
                    {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}
                  </div>
                </div>

                <div style={styles.detailCard}>
                  <span style={styles.detailLabel}>Total Fare Payable</span>
                  <div style={{ color: '#22c55e', fontWeight: '800', fontSize: '1.2rem' }}>
                    ৳ {totalAmount.toLocaleString()}
                  </div>
                </div>

                <button 
                  style={styles.proceedBtn} 
                  onClick={handleProceedToPayment}
                  disabled={selectedSeats.length === 0}
                >
                  Proceed to Payment <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT / PAYMENT MODAL */}
      {isCheckoutOpen && selectedBus && (
        <div style={styles.modalOverlay} onClick={() => setIsCheckoutOpen(false)}>
          <div style={{ ...styles.modalContent, maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#f4f4f5' }}>Complete Ticket Payment</h3>
                <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
                  Total Amount: <strong style={{ color: '#22c55e' }}>৳{totalAmount}</strong>
                </span>
              </div>
              <button style={styles.closeBtn} onClick={() => setIsCheckoutOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleConfirmBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={styles.fieldGroup}>
                <label style={styles.modalLabel}><UserIcon size={14} color="#a1a1aa" /> Passenger Name</label>
                <input 
                  type="text" 
                  value={passenger.name} 
                  onChange={(e) => setPassenger({ ...passenger, name: e.target.value })}
                  style={styles.modalInput}
                  required 
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.modalLabel}><Phone size={14} color="#a1a1aa" /> Contact Mobile</label>
                <input 
                  type="text" 
                  value={passenger.phone} 
                  onChange={(e) => setPassenger({ ...passenger, phone: e.target.value })}
                  style={styles.modalInput}
                  required 
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.modalLabel}><CreditCard size={14} color="#a1a1aa" /> Select Gateway</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {['bKash', 'Nagad', 'Rocket'].map((gw) => (
                    <button
                      key={gw}
                      type="button"
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        border: paymentMethod === gw ? '2px solid #22c55e' : '1px solid #3f3f46',
                        backgroundColor: paymentMethod === gw ? 'rgba(34, 197, 94, 0.15)' : '#18181b',
                        color: paymentMethod === gw ? '#22c55e' : '#a1a1aa',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                      onClick={() => setPaymentMethod(gw)}
                    >
                      {gw}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.modalLabel}><Lock size={14} color="#a1a1aa" /> {paymentMethod} Account / Card No</label>
                <input 
                  type="text" 
                  placeholder="e.g. 017XXXXXXXX"
                  value={passenger.accountNumber} 
                  onChange={(e) => setPassenger({ ...passenger, accountNumber: e.target.value })}
                  style={styles.modalInput}
                  required 
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" style={styles.cancelBtn} onClick={() => setIsCheckoutOpen(false)}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitModalBtn}>
                  Confirm & Pay ৳{totalAmount}
                </button>
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
  searchBanner: { backgroundColor: '#27272a', padding: '24px', borderRadius: '16px', border: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', gap: '18px' },
  bannerHeader: { display: 'flex', flexDirection: 'column', gap: '4px' },
  bannerTitle: { margin: 0, fontSize: '1.4rem', fontWeight: '800' },
  bannerSub: { margin: 0, fontSize: '0.85rem', color: '#a1a1aa' },
  searchRow: { display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' },
  searchField: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '180px' },
  searchLabel: { fontSize: '0.78rem', color: '#a1a1aa', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' },
  selectInput: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#ffffff', outline: 'none', cursor: 'pointer', fontSize: '0.85rem' },
  resetSearchBtn: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #52525b', backgroundColor: '#3f3f46', color: '#ffffff', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' },
  
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { margin: 0, fontSize: '1.2rem', fontWeight: '700' },
  liveSyncBadge: { fontSize: '0.75rem', color: '#22c55e', backgroundColor: 'rgba(34, 197, 94, 0.15)', padding: '4px 10px', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.3)', fontWeight: '600' },
  
  emptyCard: { backgroundColor: '#27272a', borderRadius: '16px', border: '1px solid #3f3f46', padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  
  routeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  busCard: { backgroundColor: '#18181b', borderRadius: '14px', border: '1px solid #3f3f46', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  cardImgContainer: { position: 'relative', height: '140px', backgroundColor: '#27272a' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImgPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#71717a', gap: '6px', fontSize: '0.8rem' },
  cardBody: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'space-between' },
  operatorTag: { fontSize: '0.75rem', color: '#a1a1aa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  routeHeaderRow: { margin: '2px 0' },
  routeTitle: { margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#f4f4f5' },
  busTypeBadgeUnder: { fontSize: '0.72rem', color: '#38bdf8', display: 'block', marginTop: '2px' },
  coachNumber: { fontSize: '0.75rem', color: '#71717a' },
  timeInfoRow: { display: 'flex', justifyContent: 'space-between', backgroundColor: '#27272a', padding: '8px 12px', borderRadius: '8px', border: '1px solid #3f3f46', fontSize: '0.75rem' },
  timeBlock: { display: 'flex', alignItems: 'center', gap: '6px', color: '#d4d4d8' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '10px', borderTop: '1px solid #27272a' },
  fareLabel: { fontSize: '0.7rem', color: '#71717a', display: 'block' },
  fareValue: { fontSize: '1.1rem', fontWeight: '800', color: '#22c55e' },
  viewSeatsBtn: { marginTop: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#3f3f46', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' },

  contentSection: { display: 'flex', flexDirection: 'column', gap: '20px' },
  aboutHeader: { backgroundColor: '#27272a', borderRadius: '16px', border: '1px solid #3f3f46', padding: '24px', display: 'flex', alignItems: 'center', gap: '18px' },
  aboutBannerBox: { backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #3f3f46', padding: '18px', display: 'flex', gap: '12px', alignItems: 'center' },
  aboutGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  aboutCard: { backgroundColor: '#27272a', padding: '20px', borderRadius: '14px', border: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', gap: '8px' },
  aboutCardTitle: { margin: 0, color: '#f4f4f5', fontSize: '0.95rem' },
  aboutCardText: { margin: 0, color: '#a1a1aa', fontSize: '0.8rem', lineHeight: '1.4' },

  profileHeaderCard: { backgroundColor: '#27272a', borderRadius: '16px', border: '1px solid #3f3f46', padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' },
  avatarContainer: { position: 'relative' },
  avatarImg: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #52525b' },
  avatarLarge: { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#18181b', border: '2px solid #52525b', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  profileDetailsCard: { backgroundColor: '#27272a', borderRadius: '16px', border: '1px solid #3f3f46', padding: '24px' },
  editProfileBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#3f3f46', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' },
  infoList: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
  infoItem: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#18181b', padding: '12px 16px', borderRadius: '10px', border: '1px solid #3f3f46' },
  infoLabel: { fontSize: '0.75rem', color: '#a1a1aa', display: 'block' },
  infoValue: { margin: 0, fontSize: '0.9rem', color: '#f4f4f5', fontWeight: '600' },

  historyCard: { backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  historyIconBox: { width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  ticketBadge: { backgroundColor: '#18181b', border: '1px solid #3f3f46', color: '#38bdf8', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '16px', padding: '24px', width: '100%' },
  modalContentLarge: { backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' },
  closeBtn: { background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' },
  modalTwoColumn: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' },
  leftSeatColumn: { backgroundColor: '#18181b', padding: '16px', borderRadius: '12px', border: '1px solid #3f3f46' },
  seatHeaderFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  legendRow: { display: 'flex', gap: '8px', fontSize: '0.68rem', color: '#a1a1aa' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '4px' },
  legendBox: { width: '10px', height: '10px', borderRadius: '2px' },
  busChassis: { border: '2px solid #3f3f46', borderRadius: '20px 20px 10px 10px', padding: '16px 12px', backgroundColor: '#09090b', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  driverCabinRow: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #3f3f46', paddingBottom: '8px', marginBottom: '12px' },
  driverIconBadge: { fontSize: '0.75rem', color: '#a1a1aa', fontWeight: '600' },
  steeringWheel: { fontSize: '0.9rem' },
  verticalSeatContainer: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '320px', overflowY: 'auto', width: '100%' },
  busRowGroup: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  seatPair: { display: 'flex', gap: '6px' },
  compactSeat: { width: '38px', height: '36px', borderRadius: '6px', border: 'none', color: '#ffffff', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  aisleGap: { flex: 1, minWidth: '20px' },
  rightInfoColumn: { display: 'flex', flexDirection: 'column', gap: '14px' },
  imageGalleryContainer: { backgroundColor: '#18181b', borderRadius: '12px', padding: '12px', border: '1px solid #3f3f46' },
  mainLargeImg: { width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px' },
  largeImgPlaceholder: { width: '100%', height: '180px', borderRadius: '8px', backgroundColor: '#27272a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#71717a', gap: '8px', fontSize: '0.85rem' },
  thumbnailRow: { display: 'flex', gap: '8px', marginTop: '10px' },
  thumbImg: { width: '50px', height: '40px', borderRadius: '6px', objectFit: 'cover', cursor: 'pointer' },
  detailCard: { backgroundColor: '#18181b', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', gap: '4px' },
  detailLabel: { fontSize: '0.75rem', color: '#a1a1aa' },
  proceedBtn: { padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#22c55e', color: '#ffffff', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
  successReceipt: { backgroundColor: 'rgba(34, 197, 94, 0.12)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '10px', padding: '12px', marginBottom: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  modalLabel: { fontSize: '0.8rem', color: '#a1a1aa', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' },
  modalInput: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#ffffff', outline: 'none' },
  formRow: { display: 'flex', gap: '12px' },
  cancelBtn: { padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#3f3f46', color: '#ffffff', fontWeight: '600', cursor: 'pointer' },
  submitModalBtn: { padding: '10px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#22c55e', color: '#ffffff', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }
};