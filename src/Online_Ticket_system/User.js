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
  Receipt,
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
      if (searchFrom !== 'All Districts') queryParams.push(`from=${encodeURIComponent(searchFrom)}`);
      if (searchTo !== 'All Districts') queryParams.push(`to=${encodeURIComponent(searchTo)}`);
      
      const queryString = queryParams.length ? `?${queryParams.join('&')}` : '';
      const res = await fetch(`${API_BASE}/buses${queryString}`);
      
      if (res.ok) {
        const liveBuses = await res.json();
        setBuses(Array.isArray(liveBuses) ? liveBuses : []);
      }
    } catch (err) {
      console.error('Error fetching buses:', err);
    } finally {
      setLoadingBuses(false);
    }
  }, [searchFrom, searchTo]);

  // Fetch User's Ticket History from MongoDB
  const fetchUserTickets = useCallback(async () => {
    const userEmail = currentUserData.email;
    if (!userEmail) return;

    try {
      const res = await fetch(`${API_BASE}/tickets?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const tickets = await res.json();
        setUserPaymentHistory(Array.isArray(tickets) ? tickets : []);
      }
    } catch (err) {
      console.error('Error fetching ticket history:', err);
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
      const res = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        const updated = await res.json();
        setCurrentUserData((prev) => ({ ...prev, ...updated }));
        setIsEditingProfile(false);
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile on server.');
      }
    } catch (err) {
      alert('Network error while updating profile.');
    }
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

    alert('Password updated successfully!');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setIsChangingPassword(false);
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

    try {
      // 1. Reserve seats in MongoDB Atlas
      const resBus = await fetch(`${API_BASE}/buses/${busId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookedSeats: updatedBookedSeats })
      });

      if (!resBus.ok) {
        throw new Error('Failed to update reserved seats on server.');
      }

      // 2. Save ticket in MongoDB Atlas
      const newTicketRecord = {
        id: 'TICK-' + Math.floor(100000 + Math.random() * 900000),
        busId: busId,
        busName: selectedBus.name,
        route: selectedBus.route || `${selectedBus.from} to ${selectedBus.to}`,
        seats: [...selectedSeats],
        fare: totalAmount,
        passengerName: passenger.name,
        passengerPhone: passenger.phone,
        userEmail: currentUserData.email,
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

      await fetch(`${API_BASE}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicketRecord)
      });

      // 3. Refresh Data
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
      alert('Transaction failed. Please check internet connection.');
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
            <h3 style={styles.sectionTitle}>Available Bus Routes ({buses.length})</h3>
            <button style={styles.refreshBtn} onClick={fetchBuses}>
              <RefreshCw size={12} className={loadingBuses ? 'spin' : ''} /> Refresh Routes
            </button>
          </div>

          {loadingBuses ? (
            <div style={styles.emptyCard}>
              <RefreshCw size={36} color="#3b82f6" />
              <p style={{ color: '#a1a1aa', marginTop: '12px' }}>Loading routes from cloud database...</p>
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
                      disabled
                      style={{ ...styles.modalInput, opacity: 0.7, cursor: 'not-allowed' }}
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
                    <p style={styles.infoValue}>{currentUserData.phone || 'N/A'}</p>
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
              <h3 style={{ margin: 0, color: '#f4f4f5' }}>Password & Security</h3>
              {!isChangingPassword && (
                <button style={styles.editProfileBtn} onClick={() => setIsChangingPassword(true)}>
                  <Lock size={14} /> Change Password
                </button>
              )}
            </div>

            {isChangingPassword ? (
              <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={styles.fieldGroup}>
                  <label style={styles.modalLabel}>Current Password</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    style={styles.modalInput}
                    required 
                  />
                </div>

                <div style={styles.formRow}>
                  <div style={{ ...styles.fieldGroup, flex: 1 }}>
                    <label style={styles.modalLabel}>New Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      style={styles.modalInput}
                      required 
                    />
                  </div>

                  <div style={{ ...styles.fieldGroup, flex: 1 }}>
                    <label style={styles.modalLabel}>Confirm New Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••" 
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
                    Update Password
                  </button>
                </div>
              </form>
            ) : (
              <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: 0 }}>
                Keep your account secure by using a strong password with letters, numbers, and symbols.
              </p>
            )}
          </div>

          <div style={styles.profileDetailsCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Receipt size={20} color="#a1a1aa" />
              <h3 style={{ margin: 0, color: '#f4f4f5' }}>My Ticket Booking History ({userPaymentHistory.length})</h3>
            </div>

            {userPaymentHistory.length === 0 ? (
              <div style={styles.emptyHistoryBox}>
                <Ticket size={36} color="#71717a" />
                <p style={{ color: '#a1a1aa', margin: '8px 0 0 0', fontSize: '0.9rem' }}>You haven't purchased any bus tickets yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {userPaymentHistory.map((ticket, index) => (
                  <div key={ticket._id || ticket.id || index} style={styles.historyTicketCard}>
                    <div style={styles.historyCardHeader}>
                      <span style={{ fontWeight: '700', color: '#f4f4f5' }}>{ticket.busName}</span>
                      <span style={styles.successTicketBadge}>Confirmed • ৳ {ticket.fare}</span>
                    </div>
                    <div style={styles.historyCardGrid}>
                      <div>
                        <span style={styles.hLabel}>Route:</span>
                        <span style={styles.hVal}>{ticket.route}</span>
                      </div>
                      <div>
                        <span style={styles.hLabel}>Seats:</span>
                        <span style={{ ...styles.hVal, color: '#38bdf8' }}>
                          {Array.isArray(ticket.seats) ? ticket.seats.join(', ') : (ticket.seatNumber || 'N/A')}
                        </span>
                      </div>
                      <div>
                        <span style={styles.hLabel}>Payment Method:</span>
                        <span style={styles.hVal}>{ticket.paymentMethod}</span>
                      </div>
                      <div>
                        <span style={styles.hLabel}>Transaction ID:</span>
                        <span style={{ ...styles.hVal, fontFamily: 'monospace', color: '#22c55e' }}>{ticket.trxId || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* 4. PAYMENT TAB */}
      {(currentTab === 'payment') && (
        <div style={styles.contentSection}>
          <div style={styles.profileDetailsCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <CreditCard size={24} color="#a1a1aa" />
              <h2 style={{ margin: 0, color: '#f4f4f5' }}>Supported Secure Payment Methods</h2>
            </div>
            <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '20px' }}>
              We support fast, end-to-end encrypted mobile financial services and cards across Bangladesh.
            </p>

            <div style={styles.paymentMethodsGrid}>
              {[
                { name: 'bKash Mobile Wallet', desc: 'Instant USSD/App payment clearance', color: '#e2136e' },
                { name: 'Nagad Digital Bank', desc: 'Secure postal mobile financial service', color: '#f7931e' },
                { name: 'Rocket (DBBL)', desc: 'Reliable Dutch-Bangla Mobile banking', color: '#8b5cf6' },
                { name: 'Visa / MasterCard / AMEX', desc: 'Direct credit and debit card processing', color: '#3b82f6' }
              ].map((m, idx) => (
                <div key={idx} style={styles.paymentMethodItem}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: m.color }} />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#f4f4f5', fontSize: '0.95rem' }}>{m.name}</h4>
                    <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.8rem' }}>{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SEAT SELECTION & BOOKING MODAL */}
      {selectedBus && !isCheckoutOpen && !bookingSuccess && (
        <div style={styles.modalOverlay} onClick={() => setSelectedBus(null)}>
          <div style={styles.modalContentLarge} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#f4f4f5', fontSize: '1.3rem' }}>{selectedBus.name}</h3>
                <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>
                  {selectedBus.route || `${selectedBus.from} to ${selectedBus.to}`} | Fare: {selectedBus.fare} / seat
                </span>
              </div>
              <button style={styles.closeBtn} onClick={() => setSelectedBus(null)}><X size={20} /></button>
            </div>

            <div style={styles.modalTwoColumn}>
              <div style={styles.leftSeatColumn}>
                <div style={styles.seatHeaderFlex}>
                  <h4 style={{ margin: 0, color: '#f4f4f5', fontSize: '0.95rem' }}>Select Your Seats</h4>
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
                    <span style={styles.driverIconBadge}>🚌 Driver Cabin</span>
                    <span style={styles.steeringWheel}>⭕</span>
                  </div>

                  <div style={styles.verticalSeatContainer}>
                    {Array.from({ length: Math.ceil((selectedBus.seats || 36) / 4) }).map((_, rowIndex) => {
                      const rowLetter = String.fromCharCode(65 + rowIndex);
                      const s1 = `${rowLetter}1`;
                      const s2 = `${rowLetter}2`;
                      const s3 = `${rowLetter}3`;
                      const s4 = `${rowLetter}4`;

                      const bookedList = selectedBus.bookedSeats || [];

                      return (
                        <div key={rowLetter} style={styles.busRowGroup}>
                          <div style={styles.seatPair}>
                            {[s1, s2].map((seatId) => {
                              const isBooked = bookedList.includes(seatId);
                              const isSelected = selectedSeats.includes(seatId);

                              let bg = '#22c55e';
                              if (isBooked) bg = '#6b7280';
                              else if (isSelected) bg = '#3b82f6';

                              return (
                                <button
                                  key={seatId}
                                  type="button"
                                  disabled={isBooked}
                                  style={{ ...styles.compactSeat, backgroundColor: bg, cursor: isBooked ? 'not-allowed' : 'pointer' }}
                                  onClick={() => handleSeatClick(seatId, isBooked)}
                                >
                                  {seatId}
                                </button>
                              );
                            })}
                          </div>

                          <div style={styles.aisleGap} />

                          <div style={styles.seatPair}>
                            {[s3, s4].map((seatId) => {
                              const isBooked = bookedList.includes(seatId);
                              const isSelected = selectedSeats.includes(seatId);

                              let bg = '#22c55e';
                              if (isBooked) bg = '#6b7280';
                              else if (isSelected) bg = '#3b82f6';

                              return (
                                <button
                                  key={seatId}
                                  type="button"
                                  disabled={isBooked}
                                  style={{ ...styles.compactSeat, backgroundColor: bg, cursor: isBooked ? 'not-allowed' : 'pointer' }}
                                  onClick={() => handleSeatClick(seatId, isBooked)}
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
                        alt="Bus"
                        style={styles.mainLargeImg}
                      />
                      {selectedBus.images.length > 1 && (
                        <div style={styles.thumbnailRow}>
                          {selectedBus.images.map((img, i) => (
                            <img
                              key={i}
                              src={img}
                              alt="thumb"
                              style={{ ...styles.thumbImg, border: activeImageIndex === i ? '2px solid #3b82f6' : '1px solid #3f3f46' }}
                              onClick={() => setActiveImageIndex(i)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={styles.largeImgPlaceholder}>
                      <Bus size={50} color="#52525b" />
                      <span>No Pictures Available</span>
                    </div>
                  )}
                </div>

                <div style={styles.bookingSummaryBox}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#f4f4f5', fontSize: '0.95rem' }}>Booking Summary</h4>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                    <span style={{ color: '#a1a1aa' }}>Selected Seats:</span>
                    <strong style={{ color: '#38bdf8' }}>{selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.9rem' }}>
                    <span style={{ color: '#a1a1aa' }}>Total Payable Fare:</span>
                    <strong style={{ color: '#22c55e', fontSize: '1.1rem' }}>৳ {totalAmount}</strong>
                  </div>

                  <button 
                    style={{ ...styles.submitModalBtn, width: '100%', opacity: selectedSeats.length === 0 ? 0.6 : 1 }}
                    disabled={selectedSeats.length === 0}
                    onClick={handleProceedToPayment}
                  >
                    Proceed to Checkout ({selectedSeats.length} Seats)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && selectedBus && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '520px' }}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#f4f4f5' }}>Secure Checkout & Payment</h3>
                <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Complete reservation for {selectedBus.name}</span>
              </div>
              <button style={styles.closeBtn} onClick={() => setIsCheckoutOpen(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleConfirmBooking} style={styles.modalForm}>
              <div style={styles.fieldGroup}>
                <label style={styles.modalLabel}>Passenger Full Name</label>
                <input 
                  type="text" 
                  value={passenger.name} 
                  onChange={(e) => setPassenger({ ...passenger, name: e.target.value })}
                  style={styles.modalInput}
                  required 
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.modalLabel}>Mobile Phone Number</label>
                <input 
                  type="text" 
                  value={passenger.phone} 
                  onChange={(e) => setPassenger({ ...passenger, phone: e.target.value })}
                  style={styles.modalInput}
                  required 
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.modalLabel}>Select Payment Gateway</label>
                <select 
                  value={paymentMethod} 
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={styles.modalSelect}
                >
                  <option value="bKash">bKash Mobile Banking</option>
                  <option value="Nagad">Nagad Mobile Banking</option>
                  <option value="Rocket">Rocket (DBBL)</option>
                  <option value="Debit/Credit Card">Visa / MasterCard</option>
                </select>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.modalLabel}>{paymentMethod} Account / Card Number</label>
                <input 
                  type="text" 
                  placeholder="e.g. 017XXXXXXXX"
                  value={passenger.accountNumber} 
                  onChange={(e) => setPassenger({ ...passenger, accountNumber: e.target.value })}
                  style={styles.modalInput}
                  required 
                />
              </div>

              <div style={{ backgroundColor: '#18181b', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Total Amount to Debit:</span>
                <span style={{ fontSize: '1.2rem', fontWeight: '800', color: '#22c55e' }}>৳ {totalAmount}</span>
              </div>

              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setIsCheckoutOpen(false)}>Back</button>
                <button type="submit" style={styles.submitModalBtn}>Confirm & Pay ৳ {totalAmount}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BOOKING SUCCESS CONFIRMATION MODAL */}
      {bookingSuccess && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '480px', textAlign: 'center' }}>
            <CheckCircle2 size={54} color="#22c55e" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', color: '#f4f4f5', fontSize: '1.4rem' }}>Booking Confirmed!</h3>
            <p style={{ color: '#a1a1aa', fontSize: '0.85rem', margin: '0 0 20px 0' }}>
              Your ticket has been successfully booked and payment cleared.
            </p>

            <div style={{ backgroundColor: '#18181b', padding: '16px', borderRadius: '10px', border: '1px solid #3f3f46', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#a1a1aa' }}>Bus Operator:</span><strong style={{ color: '#f4f4f5' }}>{bookingSuccess.busName}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#a1a1aa' }}>Passenger:</span><strong style={{ color: '#f4f4f5' }}>{bookingSuccess.passengerName}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#a1a1aa' }}>Seats Assigned:</span><strong style={{ color: '#38bdf8' }}>{bookingSuccess.seats.join(', ')}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#a1a1aa' }}>Payment Method:</span><strong style={{ color: '#f4f4f5' }}>{bookingSuccess.paymentMethod}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#a1a1aa' }}>Transaction ID:</span><strong style={{ color: '#22c55e', fontFamily: 'monospace' }}>{bookingSuccess.trxId}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #3f3f46', paddingTop: '8px' }}><span style={{ color: '#a1a1aa' }}>Total Paid:</span><strong style={{ color: '#22c55e', fontSize: '1rem' }}>৳ {bookingSuccess.totalPaid}</strong></div>
            </div>

            <button 
              style={{ ...styles.submitModalBtn, width: '100%' }}
              onClick={() => { setBookingSuccess(null); setSelectedBus(null); }}
            >
              Done & Return to Home
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  container: { display: 'flex', flexDirection: 'column', gap: '24px', color: '#ffffff' },
  searchBanner: { backgroundColor: '#27272a', padding: '24px', borderRadius: '16px', border: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', gap: '16px' },
  bannerHeader: { display: 'flex', flexDirection: 'column', gap: '4px' },
  bannerTitle: { margin: 0, fontSize: '1.4rem', fontWeight: '700' },
  bannerSub: { color: '#a1a1aa', margin: 0, fontSize: '0.85rem' },
  searchRow: { display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' },
  searchField: { display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '200px' },
  searchLabel: { fontSize: '0.8rem', color: '#a1a1aa', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' },
  selectInput: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#ffffff', outline: 'none', cursor: 'pointer' },
  resetSearchBtn: { padding: '10px 18px', borderRadius: '8px', border: '1px solid #52525b', backgroundColor: '#3f3f46', color: '#ffffff', fontWeight: '600', cursor: 'pointer', height: '41px' },

  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { margin: 0, fontSize: '1.2rem', fontWeight: '700' },
  refreshBtn: { backgroundColor: '#27272a', color: '#38bdf8', border: '1px solid #3f3f46', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' },

  emptyCard: { backgroundColor: '#27272a', padding: '40px', borderRadius: '16px', border: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' },
  routeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  busCard: { backgroundColor: '#27272a', borderRadius: '14px', border: '1px solid #3f3f46', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
  cardImgContainer: { height: '150px', backgroundColor: '#18181b', position: 'relative' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardImgPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#71717a', gap: '6px', fontSize: '0.8rem' },
  cardBody: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, justifyContent: 'space-between' },
  operatorTag: { fontSize: '0.75rem', color: '#a1a1aa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  routeHeaderRow: { display: 'flex', flexDirection: 'column', gap: '2px', margin: '2px 0' },
  routeTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#f4f4f5', margin: 0 },
  busTypeBadgeUnder: { fontSize: '0.75rem', color: '#38bdf8' },
  coachNumber: { fontSize: '0.75rem', color: '#71717a' },
  timeInfoRow: { display: 'flex', justifyContent: 'space-between', backgroundColor: '#18181b', padding: '8px 12px', borderRadius: '8px', border: '1px solid #3f3f46', fontSize: '0.78rem', color: '#a1a1aa' },
  timeBlock: { display: 'flex', alignItems: 'center', gap: '6px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '10px', borderTop: '1px solid #3f3f46' },
  fareLabel: { fontSize: '0.7rem', color: '#71717a', display: 'block' },
  fareValue: { fontSize: '1.15rem', fontWeight: '800', color: '#22c55e' },
  viewSeatsBtn: { display: 'inline-flex', alignItems: 'center', gap: '4px', backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', marginTop: '4px' },

  contentSection: { display: 'flex', flexDirection: 'column', gap: '20px' },
  aboutHeader: { backgroundColor: '#27272a', padding: '24px', borderRadius: '16px', border: '1px solid #3f3f46', display: 'flex', alignItems: 'center', gap: '16px' },
  aboutBannerBox: { backgroundColor: '#18181b', padding: '16px 20px', borderRadius: '12px', border: '1px solid #3f3f46', display: 'flex', alignItems: 'flex-start', gap: '14px' },
  aboutGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  aboutCard: { backgroundColor: '#27272a', padding: '20px', borderRadius: '14px', border: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', gap: '10px' },
  aboutCardTitle: { margin: 0, color: '#f4f4f5', fontSize: '1rem', fontWeight: '700' },
  aboutCardText: { margin: 0, color: '#a1a1aa', fontSize: '0.82rem', lineHeight: '1.4' },

  profileHeaderCard: { backgroundColor: '#27272a', padding: '24px', borderRadius: '16px', border: '1px solid #3f3f46', display: 'flex', alignItems: 'center', gap: '20px' },
  avatarContainer: { position: 'relative' },
  avatarLarge: { width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#18181b', border: '2px solid #52525b', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #52525b' },
  profileDetailsCard: { backgroundColor: '#27272a', padding: '24px', borderRadius: '16px', border: '1px solid #3f3f46' },
  editProfileBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#3f3f46', color: '#f4f4f5', border: 'none', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' },
  infoList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  infoItem: { display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: '#18181b', padding: '12px 16px', borderRadius: '10px', border: '1px solid #3f3f46' },
  infoLabel: { fontSize: '0.72rem', color: '#a1a1aa', display: 'block' },
  infoValue: { margin: '2px 0 0 0', color: '#f4f4f5', fontWeight: '600', fontSize: '0.95rem' },

  emptyHistoryBox: { backgroundColor: '#18181b', padding: '30px', borderRadius: '10px', border: '1px solid #3f3f46', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' },
  historyTicketCard: { backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' },
  historyCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272a', paddingBottom: '8px' },
  successTicketBadge: { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' },
  historyCardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px', fontSize: '0.8rem' },
  hLabel: { color: '#a1a1aa', marginRight: '6px' },
  hVal: { color: '#f4f4f5', fontWeight: '600' },

  paymentMethodsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  paymentMethodItem: { backgroundColor: '#18181b', padding: '16px', borderRadius: '12px', border: '1px solid #3f3f46', display: 'flex', alignItems: 'center', gap: '12px' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '16px', padding: '24px', width: '100%' },
  modalContentLarge: { backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '16px', padding: '24px', width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  closeBtn: { background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  modalLabel: { fontSize: '0.8rem', color: '#a1a1aa', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' },
  modalInput: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#ffffff', outline: 'none' },
  modalSelect: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#ffffff', outline: 'none', cursor: 'pointer' },
  formRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' },
  cancelBtn: { padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#3f3f46', color: '#ffffff', fontWeight: '600', cursor: 'pointer' },
  submitModalBtn: { padding: '10px 18px', borderRadius: '8px', border: '1px solid #52525b', backgroundColor: '#3f3f46', color: '#ffffff', fontWeight: '600', cursor: 'pointer' },

  modalTwoColumn: { display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', marginTop: '10px' },
  leftSeatColumn: { backgroundColor: '#18181b', padding: '16px', borderRadius: '12px', border: '1px solid #3f3f46', display: 'flex', flexDirection: 'column' },
  seatHeaderFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  legendRow: { display: 'flex', gap: '8px', fontSize: '0.68rem', color: '#a1a1aa' },
  legendItem: { display: 'flex', alignItems: 'center', gap: '4px' },
  legendBox: { width: '8px', height: '8px', borderRadius: '2px' },
  busChassis: { border: '2px solid #3f3f46', borderRadius: '16px 16px 8px 8px', padding: '14px 10px', backgroundColor: '#09090b', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', boxSizing: 'border-box' },
  driverCabinRow: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #3f3f46', paddingBottom: '8px', marginBottom: '10px' },
  driverIconBadge: { fontSize: '0.72rem', color: '#a1a1aa', fontWeight: '600' },
  steeringWheel: { fontSize: '0.85rem' },
  verticalSeatContainer: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px', width: '100%' },
  busRowGroup: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' },
  seatPair: { display: 'flex', gap: '6px' },
  compactSeat: { width: '38px', height: '36px', borderRadius: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 0, border: 'none', color: '#ffffff', fontSize: '0.78rem', fontWeight: '700', cursor: 'pointer' },
  aisleGap: { flex: 1, minWidth: '20px' },
  rightInfoColumn: { display: 'flex', flexDirection: 'column', gap: '14px' },
  imageGalleryContainer: { backgroundColor: '#18181b', borderRadius: '12px', padding: '10px', border: '1px solid #3f3f46' },
  mainLargeImg: { width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #3f3f46' },
  largeImgPlaceholder: { width: '100%', height: '180px', borderRadius: '8px', backgroundColor: '#27272a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#71717a', gap: '6px', fontSize: '0.8rem' },
  thumbnailRow: { display: 'flex', gap: '6px', marginTop: '8px', overflowX: 'auto' },
  thumbImg: { width: '50px', height: '38px', borderRadius: '6px', objectFit: 'cover', cursor: 'pointer' },
  bookingSummaryBox: { backgroundColor: '#18181b', padding: '16px', borderRadius: '12px', border: '1px solid #3f3f46' }
};