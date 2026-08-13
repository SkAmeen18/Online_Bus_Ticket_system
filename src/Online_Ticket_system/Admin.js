import React, { useState, useEffect, useMemo } from 'react';
import {
  Bus,
  PlusCircle,
  Users,
  Ticket,
  TrendingUp,
  User as UserIcon,
  CreditCard,
  Trash2,
  X,
  Shield,
  Key,
  DollarSign,
  Lock,
  Phone,
  Mail,
  UserCheck,
  History,
  Image as ImageIcon,
  Clock,
  Hash,
  ArrowRight,
  Info,
  ShieldCheck,
  Sparkles,
  Edit3,
  Download,
  Calendar,
  CheckCircle,
  AlertCircle,
  MapPin,
  Receipt,
  CheckCircle2,
  Search
} from 'lucide-react';

const API_BASE = 'https://online-bus-ticket-system-81tt.onrender.com/api';

const BANGLADESH_DISTRICTS = [
  'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola', 'Bogra', 'Brahmanbaria', 'Chandpur',
  'Chittagong', 'Chuadanga', 'Comilla', 'Cox\'s Bazar', 'Dhaka', 'Dinajpur', 'Faridpur', 'Feni',
  'Gaibandha', 'Gazipur', 'Gopalganj', 'Habiganj', 'Jamalpur', 'Jessore', 'Jhalokati', 'Jhenaidah',
  'Joypurhat', 'Khagrachhari', 'Khulna', 'Kishoreganj', 'Kurigram', 'Kushtia', 'Lakshmipur', 'Lalmonirhat',
  'Madaripur', 'Magura', 'Manikganj', 'Meherpur', 'Moulvibazar', 'Munshiganj', 'Mymensingh', 'Naogaon',
  'Narail', 'Narayanganj', 'Narsingdi', 'Natore', 'Nawabganj', 'Netrokona', 'Nilphamari', 'Noakhali',
  'Pabna', 'Panchagarh', 'Patuakhali', 'Pirojpur', 'Rajbari', 'Rajshahi', 'Rangamati', 'Rangpur',
  'Satkhira', 'Shariatpur', 'Sherpur', 'Sirajganj', 'Sunamganj', 'Sylhet', 'Tangail', 'Thakurgaon'
];

const BUS_TYPES = [
  'Sleeper Class AC Coach',
  'Business / VIP Class AC Coach',
  'Premium Recliner AC Coach',
  'Standard Executive AC Coach',
  'BRTC Double-Decker Highway Bus',
  'Standard Non-AC Highway Coach',
  'Economy / High-Density Non-AC Bus',
  'Mini / Hilly Route Regional Coach'
];

const SEAT_OPTIONS = [20, 24, 28, 32, 36, 40, 52];

const INITIAL_FORM_STATE = {
  name: '',
  busNumber: '',
  from: '',
  to: '',
  busType: '',
  fare: '',
  seats: '36',
  arrivalTime: '',
  departureTime: '',
  estimatedHours: '',
  images: []
};

export default function Admin({ user = {}, activeTab = 'home' }) {
  const [adminProfile, setAdminProfile] = useState(() => {
    const saved = localStorage.getItem('admin_profile_data');
    if (saved) return JSON.parse(saved);
    return {
      name: user?.name || 'Admin User',
      email: user?.email || user?.emailOrPhone || 'admin@example.com',
      phone: user?.phone || '+880 1700-000000'
    };
  });

  // Zero default routes: Starts empty if nothing is cached
  const [buses, setBuses] = useState(() => {
    const savedBuses = localStorage.getItem('app_buses');
    return savedBuses ? JSON.parse(savedBuses) : [];
  });

  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [ticketSales, setTicketSales] = useState(() => {
    const savedTickets = localStorage.getItem('app_tickets');
    return savedTickets ? JSON.parse(savedTickets) : [];
  });

  const [selectedUserHistory, setSelectedUserHistory] = useState(null);
  const [selectedBusDetails, setSelectedBusDetails] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const [profileImage, setProfileImage] = useState(() => {
    return localStorage.getItem(`avatar_${user?.emailOrPhone || 'admin'}`) || null;
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: adminProfile.name,
    email: adminProfile.email,
    phone: adminProfile.phone,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    photo: profileImage
  });
  const [editMsg, setEditMsg] = useState({ type: '', text: '' });

  // Fetch Buses, Registered Users, and Tickets live from MongoDB Atlas
  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Buses
      try {
        const res = await fetch(`${API_BASE}/buses`);
        if (res.ok) {
          const data = await res.json();
          setBuses(data);
          localStorage.setItem('app_buses', JSON.stringify(data));
        }
      } catch (err) {
        console.warn('Backend unavailable, using cached bus data.');
      }

      // 2. Fetch Live Registered Passengers from MongoDB
      try {
        const res = await fetch(`${API_BASE}/users`);
        if (res.ok) {
          const data = await res.json();
          setRegisteredUsers(data);
          localStorage.setItem('app_users', JSON.stringify(data));
        }
      } catch (err) {
        console.warn('Backend user fetch failed, using local fallback.');
      }

      // 3. Fetch Live Tickets directly from MongoDB
      try {
        const res = await fetch(`${API_BASE}/tickets`);
        if (res.ok) {
          const data = await res.json();
          setTicketSales(data);
          localStorage.setItem('app_tickets', JSON.stringify(data));
        }
      } catch (err) {
        console.warn('Backend ticket fetch failed, using local fallback.');
      }
    };

    fetchData();
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('app_buses', JSON.stringify(buses));
  }, [buses]);

  const totalTicketsSold = ticketSales.length;
  const totalRevenue = useMemo(() => {
    return ticketSales.reduce((acc, item) => {
      const price = typeof item.fare === 'number'
        ? item.fare
        : parseInt(String(item.fare || '0').replace(/[^0-9]/g, ''), 10) || 0;
      return acc + price;
    }, 0);
  }, [ticketSales]);

  // Filter out admin/staff accounts to display only real passenger sign-ups
  const realPassengers = useMemo(() => {
    return registeredUsers.filter((u) => {
      const isRoleAdmin = u.role === 'admin' || u.isAdmin === true;
      const isEmailAdmin = u.email && u.email.toLowerCase().startsWith('admin');
      const isNameAdmin = u.name && u.name.toLowerCase().trim() === 'admin';

      return !isRoleAdmin && !isEmailAdmin && !isNameAdmin;
    });
  }, [registeredUsers]);

  // Search filtering over real passengers
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm.trim()) return realPassengers;
    const term = userSearchTerm.toLowerCase();
    return realPassengers.filter((u) =>
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.emailOrPhone && u.emailOrPhone.toLowerCase().includes(term)) ||
      (u.phone && u.phone.includes(term))
    );
  }, [realPassengers, userSearchTerm]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBus, setNewBus] = useState(INITIAL_FORM_STATE);

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewBus(INITIAL_FORM_STATE);
  };

  const handleBusImagesUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const filePromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then((base64Images) => {
      setNewBus((prev) => ({
        ...prev,
        images: [...prev.images, ...base64Images]
      }));
    });
  };

  const handleRemoveImage = (indexToRemove) => {
    setNewBus((prev) => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Image = reader.result;
        setProfileImage(base64Image);
        localStorage.setItem(`avatar_${user?.emailOrPhone || 'admin'}`, base64Image);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModalPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenEditModal = () => {
    setEditFormData({
      name: adminProfile.name,
      email: adminProfile.email,
      phone: adminProfile.phone,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
      photo: profileImage
    });
    setEditMsg({ type: '', text: '' });
    setIsEditModalOpen(true);
  };

  const handleSaveProfileChanges = (e) => {
    e.preventDefault();
    setEditMsg({ type: '', text: '' });

    if (!editFormData.name || !editFormData.email || !editFormData.phone) {
      setEditMsg({ type: 'error', text: 'Name, Email, and Phone are required.' });
      return;
    }

    if (editFormData.newPassword || editFormData.confirmPassword) {
      if (editFormData.newPassword !== editFormData.confirmPassword) {
        setEditMsg({ type: 'error', text: 'New passwords do not match!' });
        return;
      }
      if (editFormData.newPassword.length < 6) {
        setEditMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
        return;
      }
    }

    const updatedProfile = {
      name: editFormData.name,
      email: editFormData.email,
      phone: editFormData.phone
    };

    setAdminProfile(updatedProfile);
    localStorage.setItem('admin_profile_data', JSON.stringify(updatedProfile));

    if (editFormData.photo) {
      setProfileImage(editFormData.photo);
      localStorage.setItem(`avatar_${user?.emailOrPhone || 'admin'}`, editFormData.photo);
    }

    setIsEditModalOpen(false);
  };

  const handleDeleteBus = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this bus route?')) return;

    try {
      await fetch(`${API_BASE}/buses/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Backend server unavailable, deleting locally.');
    }

    setBuses((prev) => prev.filter((bus) => bus.id !== id && bus._id !== id));
  };

  const handleToggleSeatAdmin = (seatId) => {
    if (!selectedBusDetails) return;

    const currentBooked = selectedBusDetails.bookedSeats || [];
    const isBooked = currentBooked.includes(seatId);

    const updatedBooked = isBooked
      ? currentBooked.filter((s) => s !== seatId)
      : [...currentBooked, seatId];

    const updatedBus = { ...selectedBusDetails, bookedSeats: updatedBooked };

    setSelectedBusDetails(updatedBus);
    setBuses((prevBuses) =>
      prevBuses.map((b) =>
        (b._id || b.id) === (selectedBusDetails._id || selectedBusDetails.id) ? updatedBus : b
      )
    );
  };

  const handleExportUsersCSV = () => {
    if (!realPassengers.length) {
      alert('No passenger data available to export.');
      return;
    }

    const headers = ['User ID', 'Name', 'Email', 'Phone', 'Joined Date'];
    const rows = realPassengers.map((u, idx) => [
      `USR-${String(idx + 1).padStart(3, '0')}`,
      `"${u.name || 'N/A'}"`,
      `"${u.email || u.emailOrPhone || 'N/A'}"`,
      `"${u.phone || 'N/A'}"`,
      `"${u.joined ? String(u.joined).split('T')[0] : 'N/A'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Registered_Passengers_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddBusSubmit = async (e) => {
    e.preventDefault();
    if (!newBus.name || !newBus.busNumber || !newBus.fare || !newBus.from || !newBus.to || !newBus.busType) {
      alert('Please fill out all required route details!');
      return;
    }

    const createdBus = {
      id: Math.floor(100 + Math.random() * 900),
      name: newBus.name,
      busNumber: newBus.busNumber,
      from: newBus.from,
      to: newBus.to,
      route: `${newBus.from} to ${newBus.to}`,
      fare: newBus.fare.includes('BDT') ? newBus.fare : `${newBus.fare} BDT`,
      seats: Number(newBus.seats) || 36,
      bookedSeats: [],
      busType: newBus.busType,
      arrivalTime: newBus.arrivalTime || 'N/A',
      departureTime: newBus.departureTime || 'N/A',
      estimatedHours: newBus.estimatedHours ? `${newBus.estimatedHours} hrs` : 'N/A',
      images: newBus.images
    };

    try {
      const res = await fetch(`${API_BASE}/buses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createdBus)
      });

      if (res.ok) {
        const savedBus = await res.json();
        setBuses((prev) => [...prev, savedBus]);
        alert('Route saved successfully to cloud database!');
      } else {
        setBuses((prev) => [...prev, createdBus]);
        alert('Saved locally. Backend cloud server returned an error.');
      }
    } catch (err) {
      setBuses((prev) => [...prev, createdBus]);
      alert('Saved locally. Could not connect to live MongoDB backend.');
    }

    handleCloseModal();
  };

  const getUserPaymentsAndTickets = (passengerEmail, passengerPhone) => {
    return ticketSales.filter((t) =>
      (t.userEmail && passengerEmail && t.userEmail.toLowerCase() === passengerEmail.toLowerCase()) ||
      (t.userPhone && passengerPhone && t.userPhone === passengerPhone) ||
      (t.passengerEmail && passengerEmail && t.passengerEmail.toLowerCase() === passengerEmail.toLowerCase()) ||
      (t.passengerPhone && passengerPhone && t.passengerPhone === passengerPhone)
    );
  };

  return (
    <div style={styles.container}>
      {/* 1. HOME TAB */}
      {activeTab === 'home' && (
        <>
          <div style={styles.headerRow}>
            <div>
              <h2 style={styles.title}>Admin Panel ({adminProfile.name})</h2>
              <p style={styles.subText}>System Overview & Fleet Management</p>
            </div>
            <button style={styles.addBtn} onClick={() => { setNewBus(INITIAL_FORM_STATE); setIsModalOpen(true); }}>
              <PlusCircle size={18} /> Add Bus Route
            </button>
          </div>

          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIconWrapper}><Bus size={22} color="#a1a1aa" /></div>
              <div>
                <h3 style={styles.statValue}>{buses.length} Active Buses</h3>
                <span style={styles.statLabel}>Operational Fleets</span>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIconWrapper}><Users size={22} color="#a1a1aa" /></div>
              <div>
                <h3 style={styles.statValue}>{realPassengers.length} Real Users</h3>
                <span style={styles.statLabel}>Registered Accounts</span>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIconWrapper}><Ticket size={22} color="#a1a1aa" /></div>
              <div>
                <h3 style={styles.statValue}>{totalTicketsSold} Tickets</h3>
                <span style={styles.statLabel}>Total Tickets Sold</span>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIconWrapper}><TrendingUp size={22} color="#a1a1aa" /></div>
              <div>
                <h3 style={styles.statValue}>৳ {totalRevenue.toLocaleString()}</h3>
                <span style={styles.statLabel}>Total Revenue</span>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.tableHeader}>
              <h3 style={styles.cardTitle}>Active Bus Routes</h3>
              <span style={styles.countBadge}>{buses.length} Routes Configured</span>
            </div>

            {buses.length === 0 ? (
              <div style={styles.emptyBox}>
                <Bus size={36} color="#71717a" />
                <p>No bus routes added yet. Click "+ Add Bus Route" above to create one.</p>
              </div>
            ) : (
              <div style={styles.routeGrid}>
                {buses.map((bus, idx) => (
                  <div
                    key={bus._id || bus.id || idx}
                    style={styles.routeBox}
                    onClick={() => { setSelectedBusDetails(bus); setActiveImageIndex(0); }}
                  >
                    <div style={styles.boxImageArea}>
                      {bus.images && bus.images.length > 0 ? (
                        <img src={bus.images[0]} alt={bus.name} style={styles.boxImg} />
                      ) : (
                        <div style={styles.boxImgPlaceholder}>
                          <Bus size={40} color="#52525b" />
                          <span>No Image Attached</span>
                        </div>
                      )}
                      <span style={styles.boxIdTag}>#{bus.id || String(bus._id || idx).slice(-4)}</span>
                      <button
                        style={styles.boxDeleteBtn}
                        title="Delete Route"
                        onClick={(e) => handleDeleteBus(e, bus._id || bus.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div style={styles.boxBody}>
                      <div style={styles.operatorName}>{bus.name}</div>

                      <div style={styles.boxRouteTitle}>
                        {bus.route || `${bus.from} to ${bus.to}`}
                      </div>

                      <div style={styles.seatSummaryRow}>
                        <span style={styles.seatSummaryText}>
                          Capacity: <strong>{bus.seats} Seats</strong>
                        </span>
                        <span style={styles.bookedCountBadge}>
                          {(bus.bookedSeats || []).length} Booked
                        </span>
                      </div>

                      <div style={styles.boxFooter}>
                        <div>
                          <span style={styles.fareLabel}>Ticket Price</span>
                          <div style={styles.boxFare}>{bus.fare}</div>
                        </div>
                        <span style={styles.viewDetailsHint}>
                          View Layout <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* 2. PROFILE TAB */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid #3f3f46', paddingBottom: '18px', marginBottom: '24px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <UserIcon size={24} color="#a1a1aa" />
                  <h2 style={styles.cardTitle}>Personal Information</h2>
                </div>
                <p style={{ margin: '4px 0 0 0', color: '#a1a1aa', fontSize: '0.85rem' }}>
                  Manage system administrative details and profile settings
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>
                  <CheckCircle size={14} /> System Active
                </span>
                <button
                  onClick={handleOpenEditModal}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#3f3f46', color: '#f4f4f5', border: 'none', padding: '6px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  <Edit3 size={14} /> Edit Info
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '32px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div style={styles.avatarContainer}>
                  <div style={styles.avatarCircle}>
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" style={styles.avatarImg} />
                    ) : (
                      <UserIcon size={52} color="#a1a1aa" />
                    )}
                  </div>
                  <label htmlFor="photo-upload" style={styles.cameraBtn} title="Upload Profile Picture">
                    <ImageIcon size={14} color="#ffffff" />
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                <span style={{ fontSize: '0.75rem', color: '#a1a1aa', textAlign: 'center' }}>
                  Allowed JPG, PNG (Max 2MB)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: '#18181b', padding: '14px 18px', borderRadius: '12px', border: '1px solid #3f3f46' }}>
                  <span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <UserIcon size={14} color="#a1a1aa" /> Full Name
                  </span>
                  <div style={{ color: '#f4f4f5', fontWeight: '700', fontSize: '1rem' }}>
                    {adminProfile.name}
                  </div>
                </div>

                <div style={{ backgroundColor: '#18181b', padding: '14px 18px', borderRadius: '12px', border: '1px solid #3f3f46' }}>
                  <span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Mail size={14} color="#a1a1aa" /> Email Address
                  </span>
                  <div style={{ color: '#f4f4f5', fontWeight: '600', fontSize: '0.95rem' }}>
                    {adminProfile.email}
                  </div>
                </div>

                <div style={{ backgroundColor: '#18181b', padding: '14px 18px', borderRadius: '12px', border: '1px solid #3f3f46' }}>
                  <span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Phone size={14} color="#a1a1aa" /> Phone Contact
                  </span>
                  <div style={{ color: '#f4f4f5', fontWeight: '600', fontSize: '0.95rem' }}>
                    {adminProfile.phone}
                  </div>
                </div>

                <div style={{ backgroundColor: '#18181b', padding: '14px 18px', borderRadius: '12px', border: '1px solid #3f3f46' }}>
                  <span style={{ fontSize: '0.75rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Shield size={14} color="#a1a1aa" /> Assigned Authority
                  </span>
                  <div>
                    <span style={styles.roleBadge}>Super Admin Portal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck size={22} color="#a1a1aa" />
                <div>
                  <h3 style={styles.cardTitle}>Registered Passengers</h3>
                  <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
                    Live user database synchronized directly from MongoDB
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <div style={styles.searchWrapper}>
                  <Search size={14} color="#71717a" style={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search passenger..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>
                <span style={styles.countBadge}>{filteredUsers.length} Active Accounts</span>
                <button
                  onClick={handleExportUsersCSV}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#18181b', color: '#a1a1aa', border: '1px solid #3f3f46', padding: '6px 12px', borderRadius: '8px', fontSize: '0.78rem', cursor: 'pointer' }}
                >
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div style={styles.emptyBox}>
                <Users size={36} color="#71717a" />
                <p>{userSearchTerm ? 'No matching passengers found.' : 'No registered passengers recorded in the database.'}</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #3f3f46' }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={{ backgroundColor: '#18181b' }}>
                      <th style={styles.th}>User ID</th>
                      <th style={styles.th}>Passenger</th>
                      <th style={styles.th}>Email / Account</th>
                      <th style={styles.th}>Phone</th>
                      <th style={styles.th}>Joined</th>
                      <th style={styles.th}>Status</th>
                      <th style={{ ...styles.th, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, index) => {
                      const serialId = `USR-${String(index + 1).padStart(3, '0')}`;
                      return (
                        <tr key={u.id || u._id || index} style={styles.tr}>
                          <td style={styles.td}>
                            <span style={styles.userIdBadge}>#{serialId}</span>
                          </td>
                          <td style={{ ...styles.td, fontWeight: '600', color: '#f4f4f5' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#3f3f46', color: '#f4f4f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700' }}>
                                {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                              </div>
                              {u.name || 'Unnamed Passenger'}
                            </div>
                          </td>
                          <td style={styles.td}>{u.email || u.emailOrPhone || 'N/A'}</td>
                          <td style={styles.td}>{u.phone || '+880 17XXX-XXXXXX'}</td>
                          <td style={styles.td}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#a1a1aa' }}>
                              <Calendar size={12} /> {u.joined ? String(u.joined).split('T')[0] : 'Recent'}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <span style={styles.activeBadge}>
                              Active
                            </span>
                          </td>
                          <td style={{ ...styles.td, textAlign: 'center' }}>
                            <button
                              style={styles.historyBtn}
                              onClick={() => setSelectedUserHistory({ ...u, serialId })}
                            >
                              <History size={14} /> Activity Log
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 3. PAYMENT TAB */}
      {activeTab === 'payment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={styles.card}>
            <div style={styles.flexTitle}>
              <CreditCard size={24} color="#a1a1aa" />
              <h2 style={styles.cardTitle}>Payment Gateway Settlement</h2>
            </div>
            <p style={{ color: '#a1a1aa', marginBottom: '20px' }}>
              Configure merchant credentials and live webhook endpoints for payment clearance in Bangladesh.
            </p>

            <div style={styles.gatewayGrid}>
              {['bKash Direct API', 'Nagad Merchant', 'Rocket Express', 'SSLCommerz Gateway'].map((gw, index) => (
                <div key={index} style={styles.gatewayCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f4f4f5', fontWeight: '600' }}>
                      <DollarSign size={18} color="#a1a1aa" /> {gw}
                    </div>
                    <span style={styles.connectedBadge}>Active</span>
                  </div>
                  <div style={styles.keyRow}>
                    <Key size={14} color="#71717a" />
                    <span style={{ fontSize: '0.8rem', color: '#71717a' }}>Merchant Key: ••••••••••••8892</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. ABOUT TAB */}
      {activeTab === 'about' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{
            backgroundColor: '#27272a',
            borderRadius: '16px',
            border: '1px solid #3f3f46',
            padding: '36px 28px',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)'
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#3f3f46', color: '#f4f4f5', padding: '6px 14px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', marginBottom: '14px', border: '1px solid #52525b' }}>
              <Sparkles size={14} /> Smart Transport Management Platform
            </div>

            <h1 style={{ margin: '0 0 12px 0', fontSize: '1.8rem', fontWeight: '800', color: '#f4f4f5' }}>
              Online Bus Reservation System — Admin Suite
            </h1>

            <p style={{ color: '#a1a1aa', fontSize: '0.95rem', maxWidth: '720px', lineHeight: '1.6', margin: 0 }}>
              Empowering transport operators and administrative teams across Bangladesh to seamlessly manage interstate bus fleets, seat allocations, real-time ticket sales, passenger profiles, and secure financial settlements.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            <div style={styles.card}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: '#18181b', border: '1px solid #3f3f46', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Bus size={22} color="#a1a1aa" />
              </div>
              <h3 style={{ color: '#f4f4f5', margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: '700' }}>Fleet & Route Control</h3>
              <p style={{ color: '#a1a1aa', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                Easily configure express routes across all 64 districts of Bangladesh with customized seat maps and departure times.
              </p>
            </div>

            <div style={styles.card}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Users size={22} color="#38bdf8" />
              </div>
              <h3 style={{ color: '#f4f4f5', margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: '700' }}>Passenger Management</h3>
              <p style={{ color: '#a1a1aa', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                Audit registered passenger activity logs, complete booking records, profile details, and dedicated support history.
              </p>
            </div>

            <div style={styles.card}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(34, 197, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <CreditCard size={22} color="#22c55e" />
              </div>
              <h3 style={{ color: '#f4f4f5', margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: '700' }}>Payment Settlement</h3>
              <p style={{ color: '#a1a1aa', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                Direct integration capability for leading payment gateways including bKash, Nagad, Rocket, and SSLCommerz.
              </p>
            </div>

            <div style={styles.card}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <ShieldCheck size={22} color="#a855f7" />
              </div>
              <h3 style={{ color: '#f4f4f5', margin: '0 0 8px 0', fontSize: '1.05rem', fontWeight: '700' }}>Security & Audit</h3>
              <p style={{ color: '#a1a1aa', fontSize: '0.85rem', lineHeight: '1.5', margin: 0 }}>
                Role-based authorization and real-time state synchronization ensuring persistent data integrity across all terminals.
              </p>
            </div>
          </div>

          <div style={styles.card}>
            <div style={styles.flexTitle}>
              <Info size={22} color="#a1a1aa" />
              <h3 style={styles.cardTitle}>Platform Highlights</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '12px' }}>
              {[
                { title: 'Interactive Seat Layouts', desc: 'Visual 2x2 coach layouts with real-time seat availability status.' },
                { title: 'District Coverage', desc: 'Pre-loaded all 64 district locations for instant origin-destination setup.' },
                { title: 'Image Attachment Engine', desc: 'Support for multiple high-res bus preview photo uploads.' },
                { title: 'Instant Local Sync', desc: 'Persistent state powered by localStorage for rapid offline-first access.' }
              ].map((item, idx) => (
                <div key={idx} style={{ backgroundColor: '#18181b', padding: '16px', borderRadius: '10px', border: '1px solid #3f3f46', display: 'flex', gap: '12px' }}>
                  <CheckCircle size={18} color="#22c55e" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#f4f4f5', fontSize: '0.9rem', fontWeight: '600' }}>{item.title}</h4>
                    <p style={{ margin: 0, color: '#a1a1aa', fontSize: '0.8rem', lineHeight: '1.4' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* EDIT ADMIN INFO MODAL */}
      {isEditModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#f4f4f5', fontSize: '1.25rem' }}>Personal Information</h3>
                <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Update personal details and admin photo</span>
              </div>
              <button style={styles.closeBtn} onClick={() => setIsEditModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {editMsg.text && (
              <div style={{ ...editMsg.type === 'error' ? styles.errorAlert : styles.successAlert, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editMsg.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                {editMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveProfileChanges} style={styles.modalForm}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', backgroundColor: '#18181b', padding: '16px', borderRadius: '12px', border: '1px solid #3f3f46' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '70px', height: '70px', borderRadius: '50%', backgroundColor: '#27272a', border: '2px solid #52525b', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {editFormData.photo ? (
                      <img src={editFormData.photo} alt="Admin Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <UserIcon size={36} color="#a1a1aa" />
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', color: '#f4f4f5', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ImageIcon size={14} color="#a1a1aa" /> Profile Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleModalPhotoChange}
                    style={{ color: '#a1a1aa', fontSize: '0.8rem' }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#71717a' }}>Upload a picture of the Admin</span>
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.modalLabel}>
                  <UserIcon size={14} color="#a1a1aa" /> Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter full name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  style={styles.modalInput}
                  required
                />
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.modalLabel}>
                    <Phone size={14} color="#a1a1aa" /> Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 01784235102341"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
                </div>

                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.modalLabel}>
                    <Mail size={14} color="#a1a1aa" /> Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. abc@gmail.com"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #3f3f46', paddingTop: '16px', marginTop: '8px' }}>
                <h4 style={{ margin: '0 0 12px 0', color: '#f4f4f5', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Lock size={14} /> Change Password (Optional)
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={styles.fieldGroup}>
                    <label style={styles.modalLabel}>Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={editFormData.currentPassword}
                      onChange={(e) => setEditFormData({ ...editFormData, currentPassword: e.target.value })}
                      style={styles.modalInput}
                    />
                  </div>

                  <div style={styles.formRow}>
                    <div style={{ ...styles.fieldGroup, flex: 1 }}>
                      <label style={styles.modalLabel}>New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={editFormData.newPassword}
                        onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                        style={styles.modalInput}
                      />
                    </div>

                    <div style={{ ...styles.fieldGroup, flex: 1 }}>
                      <label style={styles.modalLabel}>Confirm New Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={editFormData.confirmPassword}
                        onChange={(e) => setEditFormData({ ...editFormData, confirmPassword: e.target.value })}
                        style={styles.modalInput}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelBtn} onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitModalBtn}>
                  ✓ Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ROUTE DETAILS MODAL */}
      {selectedBusDetails && (
        <div style={styles.modalOverlay} onClick={() => setSelectedBusDetails(null)}>
          <div style={styles.modalContentLarge} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#f4f4f5', fontSize: '1.4rem' }}>
                  {selectedBusDetails.name}
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>
                  Coach No: {selectedBusDetails.busNumber || 'N/A'} | Route ID: #{selectedBusDetails.id || String(selectedBusDetails._id).slice(-4)}
                </span>
              </div>
              <button style={styles.closeBtn} onClick={() => setSelectedBusDetails(null)}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalTwoColumn}>
              <div style={styles.leftSeatColumn}>
                <div style={styles.seatHeaderFlex}>
                  <h4 style={{ margin: 0, color: '#f4f4f5', fontSize: '0.95rem' }}>
                    Seat Plan ({selectedBusDetails.seats} Seats)
                  </h4>

                  <div style={styles.legendRow}>
                    <div style={styles.legendItem}>
                      <div style={{ ...styles.legendBox, backgroundColor: '#22c55e' }}></div>
                      <span>Free</span>
                    </div>
                    <div style={styles.legendItem}>
                      <div style={{ ...styles.legendBox, backgroundColor: '#6b7280' }}></div>
                      <span>Booked</span>
                    </div>
                  </div>
                </div>

                <div style={styles.adminNoteText}>* Click any seat to toggle reservation status</div>

                <div style={styles.busChassis}>
                  <div style={styles.driverCabinRow}>
                    <span style={styles.driverIconBadge}>🚌 Driver</span>
                    <div style={styles.steeringWheel}>⭕</div>
                  </div>

                  <div style={styles.verticalSeatContainer}>
                    {Array.from({ length: Math.ceil(selectedBusDetails.seats / 4) }).map((_, rowIndex) => {
                      const rowLetter = String.fromCharCode(65 + rowIndex);
                      const s1 = `${rowLetter}1`;
                      const s2 = `${rowLetter}2`;
                      const s3 = `${rowLetter}3`;
                      const s4 = `${rowLetter}4`;

                      const isBooked = (seatId) => (selectedBusDetails.bookedSeats || []).includes(seatId);

                      return (
                        <div key={rowLetter} style={styles.busRowGroup}>
                          <div style={styles.seatPair}>
                            {[s1, s2].map((seatId) => (
                              <button
                                key={seatId}
                                type="button"
                                style={{
                                  ...styles.compactSeat,
                                  backgroundColor: isBooked(seatId) ? '#6b7280' : '#22c55e',
                                }}
                                onClick={() => handleToggleSeatAdmin(seatId)}
                                title={`Click to toggle seat ${seatId}`}
                              >
                                {seatId}
                              </button>
                            ))}
                          </div>

                          <div style={styles.aisleGap} />

                          <div style={styles.seatPair}>
                            {[s3, s4].map((seatId) => (
                              <button
                                key={seatId}
                                type="button"
                                style={{
                                  ...styles.compactSeat,
                                  backgroundColor: isBooked(seatId) ? '#6b7280' : '#22c55e',
                                }}
                                onClick={() => handleToggleSeatAdmin(seatId)}
                                title={`Click to toggle seat ${seatId}`}
                              >
                                {seatId}
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
                <div style={styles.imageGalleryContainer}>
                  {selectedBusDetails.images && selectedBusDetails.images.length > 0 ? (
                    <div>
                      <img
                        src={selectedBusDetails.images[activeImageIndex] || selectedBusDetails.images[0]}
                        alt="Main Bus"
                        style={styles.mainLargeImg}
                      />

                      {selectedBusDetails.images.length > 1 && (
                        <div style={styles.thumbnailRow}>
                          {selectedBusDetails.images.map((img, i) => (
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

                <div style={styles.detailGridStacked}>
                  <div style={styles.detailCard}>
                    <span style={styles.detailLabel}>Route</span>
                    <span style={styles.detailValue}>
                      {selectedBusDetails.route || `${selectedBusDetails.from} to ${selectedBusDetails.to}`}
                    </span>
                  </div>

                  <div style={styles.detailCard}>
                    <span style={styles.detailLabel}>Bus Type</span>
                    <span style={{ ...styles.detailValue, color: '#38bdf8' }}>
                      {selectedBusDetails.busType || 'Standard Class'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ ...styles.detailCard, flex: 1 }}>
                      <span style={styles.detailLabel}>Ticket Fare</span>
                      <span style={{ ...styles.detailValue, color: '#22c55e', fontSize: '1.1rem' }}>
                        {selectedBusDetails.fare}
                      </span>
                    </div>

                    <div style={{ ...styles.detailCard, flex: 1 }}>
                      <span style={styles.detailLabel}>Departure / Arrival</span>
                      <span style={styles.detailValue}>
                        {selectedBusDetails.departureTime || 'N/A'} - {selectedBusDetails.arrivalTime || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button style={styles.cancelBtn} onClick={() => setSelectedBusDetails(null)}>
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE USER PROFILE & PAYMENT HISTORY MODAL */}
      {selectedUserHistory && (() => {
        const userEmail = selectedUserHistory.email || selectedUserHistory.emailOrPhone || 'N/A';
        const userPhone = selectedUserHistory.phone || 'N/A';
        const userPayments = getUserPaymentsAndTickets(userEmail, userPhone);

        return (
          <div style={styles.modalOverlay} onClick={() => setSelectedUserHistory(null)}>
            <div style={{ ...styles.modalContent, maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={{ margin: 0, color: '#f4f4f5', fontSize: '1.3rem' }}>
                    User Activity & Payment Log
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>
                    Serial ID: #{selectedUserHistory.serialId} | Database Sync Active
                  </span>
                </div>
                <button style={styles.closeBtn} onClick={() => setSelectedUserHistory(null)}>
                  <X size={20} />
                </button>
              </div>

              {/* SECTION A: USER PROFILE INFO */}
              <div style={styles.activityProfileSection}>
                <div style={styles.activityProfileHeader}>
                  <UserIcon size={18} color="#a1a1aa" />
                  <span style={{ fontWeight: '700', color: '#f4f4f5', fontSize: '0.95rem' }}>
                    Passenger Profile Details
                  </span>
                </div>

                <div style={styles.activityProfileGrid}>
                  <div style={styles.activityProfileCard}>
                    <span style={styles.actLabel}><UserIcon size={12} /> Full Name</span>
                    <span style={styles.actVal}>{selectedUserHistory.name || 'N/A'}</span>
                  </div>

                  <div style={styles.activityProfileCard}>
                    <span style={styles.actLabel}><Mail size={12} /> Email Address</span>
                    <span style={styles.actVal}>{userEmail}</span>
                  </div>

                  <div style={styles.activityProfileCard}>
                    <span style={styles.actLabel}><Phone size={12} /> Mobile Phone</span>
                    <span style={styles.actVal}>{userPhone}</span>
                  </div>

                  <div style={styles.activityProfileCard}>
                    <span style={styles.actLabel}><Calendar size={12} /> Account Created</span>
                    <span style={styles.actVal}>{selectedUserHistory.joined ? String(selectedUserHistory.joined).split('T')[0] : 'Standard Registration'}</span>
                  </div>

                  <div style={styles.activityProfileCard}>
                    <span style={styles.actLabel}><MapPin size={12} /> Registered Address</span>
                    <span style={styles.actVal}>{selectedUserHistory.address || 'Dhaka, Bangladesh'}</span>
                  </div>

                  <div style={styles.activityProfileCard}>
                    <span style={styles.actLabel}><ShieldCheck size={12} /> Account Status</span>
                    <span style={{ ...styles.actVal, color: '#22c55e', fontWeight: '700' }}>Active Passenger</span>
                  </div>
                </div>
              </div>

              {/* SECTION B: PAYMENT & TRANSACTION LOGS */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f4f4f5', fontWeight: '700', fontSize: '0.95rem' }}>
                    <Receipt size={18} color="#a1a1aa" />
                    Payment & Booking History ({userPayments.length})
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>
                    Auto-matched from live tickets database
                  </span>
                </div>

                {userPayments.length === 0 ? (
                  <div style={styles.emptyBoxCompact}>
                    <CreditCard size={30} color="#52525b" />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>No ticket purchases or payments recorded for this user yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {userPayments.map((payment, idx) => (
                      <div key={payment.id || payment._id || idx} style={styles.paymentCard}>
                        <div style={styles.paymentCardHeader}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle2 size={16} color="#22c55e" />
                            <span style={{ fontWeight: '700', color: '#f4f4f5', fontSize: '0.9rem' }}>
                              {payment.busName || payment.operator || 'Express Bus Service'}
                            </span>
                          </div>
                          <span style={styles.paymentBadgeSuccess}>
                            Paid • ৳ {payment.fare || payment.price || '0'}
                          </span>
                        </div>

                        <div style={styles.paymentDetailsGrid}>
                          <div>
                            <span style={styles.paySubLabel}>Route:</span>
                            <span style={styles.paySubValue}>{payment.from || 'Origin'} ➔ {payment.to || 'Destination'}</span>
                          </div>

                          <div>
                            <span style={styles.paySubLabel}>Seats:</span>
                            <span style={{ ...styles.paySubValue, color: '#f4f4f5', fontWeight: '700' }}>
                              {Array.isArray(payment.seats) ? payment.seats.join(', ') : (payment.seats || 'N/A')}
                            </span>
                          </div>

                          <div>
                            <span style={styles.paySubLabel}>Payment Method:</span>
                            <span style={styles.paySubValue}>{payment.paymentMethod || payment.gateway || 'bKash / Card'}</span>
                          </div>

                          <div>
                            <span style={styles.paySubLabel}>Transaction ID:</span>
                            <span style={{ ...styles.paySubValue, fontFamily: 'monospace', color: '#38bdf8' }}>
                              {payment.trxId || payment.transactionId || `TRX-${100000 + idx * 832}`}
                            </span>
                          </div>

                          <div>
                            <span style={styles.paySubLabel}>Date & Time:</span>
                            <span style={styles.paySubValue}>{payment.date || payment.bookingDate || 'Recent'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button style={styles.cancelBtn} onClick={() => setSelectedUserHistory(null)}>
                  Close Activity Log
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ADD BUS ROUTE MODAL */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={{ margin: 0, color: '#f4f4f5' }}>Add New Bus Route</h3>
                <span style={{ fontSize: '0.8rem', color: '#a1a1aa' }}>Select seat capacity and timing options</span>
              </div>
              <button style={styles.closeBtn} onClick={handleCloseModal}><X size={20} /></button>
            </div>

            <form onSubmit={handleAddBusSubmit} style={styles.modalForm}>
              <div style={styles.fieldGroup}>
                <label style={styles.modalLabel}>
                  <ImageIcon size={14} color="#a1a1aa" /> Upload Bus Pictures
                </label>
                <div style={styles.uploadBox}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBusImagesUpload}
                    id="bus-images-input"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="bus-images-input" style={styles.uploadLabelBtn}>
                    <PlusCircle size={16} /> Choose Bus Photos
                  </label>

                  {newBus.images.length > 0 && (
                    <div style={styles.imagePreviewRow}>
                      {newBus.images.map((img, idx) => (
                        <div key={idx} style={styles.imgBadgeWrapper}>
                          <img src={img} alt={`Bus preview ${idx}`} style={styles.previewThumb} />
                          <button
                            type="button"
                            style={styles.removeImgBtn}
                            onClick={() => handleRemoveImage(idx)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.fieldGroup, flex: 1.5 }}>
                  <label style={styles.modalLabel}>Operator / Bus Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Shyamoli NR Travels"
                    value={newBus.name}
                    onChange={(e) => setNewBus({ ...newBus, name: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
                </div>

                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.modalLabel}>
                    <Hash size={13} color="#a1a1aa" /> Coach / Bus No
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DHAKA-METRO-11"
                    value={newBus.busNumber}
                    onChange={(e) => setNewBus({ ...newBus, busNumber: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.fieldGroup, flex: 1.5 }}>
                  <label style={styles.modalLabel}>Bus Type Category</label>
                  <select
                    value={newBus.busType}
                    onChange={(e) => setNewBus({ ...newBus, busType: e.target.value })}
                    style={styles.modalSelect}
                    required
                  >
                    <option value="" disabled>-- Select Bus Type --</option>
                    {BUS_TYPES.map((type, idx) => (
                      <option key={idx} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.modalLabel}>Seat Capacity Option</label>
                  <select
                    value={newBus.seats}
                    onChange={(e) => setNewBus({ ...newBus, seats: e.target.value })}
                    style={styles.modalSelect}
                    required
                  >
                    {SEAT_OPTIONS.map((seatNum) => (
                      <option key={seatNum} value={seatNum}>{seatNum} Seats</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.modalLabel}>Departure District</label>
                  <select
                    value={newBus.from}
                    onChange={(e) => setNewBus({ ...newBus, from: e.target.value })}
                    style={styles.modalSelect}
                    required
                  >
                    <option value="" disabled>-- Select District --</option>
                    {BANGLADESH_DISTRICTS.map((dist) => (
                      <option key={`from-${dist}`} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.modalLabel}>Arrival District</label>
                  <select
                    value={newBus.to}
                    onChange={(e) => setNewBus({ ...newBus, to: e.target.value })}
                    style={styles.modalSelect}
                    required
                  >
                    <option value="" disabled>-- Select District --</option>
                    {BANGLADESH_DISTRICTS.map((dist) => (
                      <option key={`to-${dist}`} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.modalLabel}>Ticket Fare (BDT)</label>
                  <input
                    type="text"
                    placeholder="e.g. 1100"
                    value={newBus.fare}
                    onChange={(e) => setNewBus({ ...newBus, fare: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
                </div>

                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.modalLabel}><Clock size={12} /> Departure Time</label>
                  <input
                    type="time"
                    value={newBus.departureTime}
                    onChange={(e) => setNewBus({ ...newBus, departureTime: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
                </div>

                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.modalLabel}><Clock size={12} /> Arrival Time</label>
                  <input
                    type="time"
                    value={newBus.arrivalTime}
                    onChange={(e) => setNewBus({ ...newBus, arrivalTime: e.target.value })}
                    style={styles.modalInput}
                    required
                  />
                </div>
              </div>

              <div style={styles.modalActions}>
                <button type="button" style={styles.cancelBtn} onClick={handleCloseModal}>Cancel</button>
                <button type="submit" style={styles.submitModalBtn}>Save Route</button>
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
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { margin: 0, fontSize: '1.5rem', fontWeight: '700' },
  subText: { color: '#a1a1aa', margin: '4px 0 0 0', fontSize: '0.9rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  statCard: { backgroundColor: '#27272a', padding: '20px', borderRadius: '16px', border: '1px solid #3f3f46', display: 'flex', alignItems: 'center', gap: '16px' },
  statIconWrapper: { backgroundColor: '#3f3f46', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statValue: { margin: 0, fontSize: '1.15rem', fontWeight: '700', color: '#f4f4f5' },
  statLabel: { fontSize: '0.8rem', color: '#a1a1aa' },
  card: { backgroundColor: '#27272a', padding: '24px', borderRadius: '16px', border: '1px solid #3f3f46' },
  cardTitle: { margin: 0, fontSize: '1.2rem', fontWeight: '700' },
  flexTitle: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' },
  tableHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  countBadge: { backgroundColor: '#3f3f46', color: '#a1a1aa', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px', fontWeight: '600' },
  addBtn: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#3f3f46', color: '#ffffff', border: '1px solid #52525b', padding: '10px 18px', borderRadius: '10px', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' },

  searchWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: '10px' },
  searchInput: { backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', padding: '6px 12px 6px 30px', color: '#ffffff', fontSize: '0.8rem', outline: 'none', width: '160px' },

  routeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  routeBox: {
    backgroundColor: '#18181b',
    borderRadius: '14px',
    border: '1px solid #3f3f46',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
  boxImageArea: { position: 'relative', height: '140px', backgroundColor: '#27272a' },
  boxImg: { width: '100%', height: '100%', objectFit: 'cover' },
  boxImgPlaceholder: { width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#71717a', gap: '6px', fontSize: '0.8rem' },
  boxIdTag: { position: 'absolute', top: '10px', left: '10px', backgroundColor: 'rgba(24, 24, 27, 0.85)', color: '#d4d4d8', padding: '4px 8px', borderRadius: '6px', fontWeight: '700', fontSize: '0.75rem', backdropFilter: 'blur(4px)' },
  boxDeleteBtn: { position: 'absolute', top: '10px', right: '10px', backgroundColor: 'rgba(239, 68, 68, 0.9)', color: '#ffffff', border: 'none', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  boxBody: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, justifyContent: 'space-between' },
  operatorName: { fontSize: '0.75rem', color: '#a1a1aa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' },
  boxRouteTitle: { fontSize: '1.05rem', fontWeight: '700', color: '#f4f4f5', margin: '2px 0' },
  seatSummaryRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#a1a1aa' },
  seatSummaryText: { color: '#a1a1aa' },
  bookedCountBadge: { backgroundColor: '#3f3f46', color: '#38bdf8', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: '600' },
  boxFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '10px', borderTop: '1px solid #27272a' },
  fareLabel: { fontSize: '0.7rem', color: '#71717a', display: 'block' },
  boxFare: { fontSize: '1.1rem', fontWeight: '800', color: '#22c55e' },
  viewDetailsHint: { fontSize: '0.75rem', color: '#a1a1aa', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' },

  modalContentLarge: {
    backgroundColor: '#27272a',
    border: '1px solid #3f3f46',
    borderRadius: '16px',
    padding: '24px',
    width: '90%',
    maxWidth: '920px',
    maxHeight: '90vh',
    overflowY: 'auto'
  },
  modalTwoColumn: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '24px',
    marginTop: '10px'
  },
  leftSeatColumn: {
    backgroundColor: '#18181b',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #3f3f46',
    display: 'flex',
    flexDirection: 'column'
  },
  seatHeaderFlex: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  adminNoteText: {
    fontSize: '0.68rem',
    color: '#38bdf8',
    fontStyle: 'italic',
    marginBottom: '12px'
  },
  legendRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '0.7rem',
    color: '#a1a1aa'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  legendBox: {
    width: '100px',
    height: '10px',
    borderRadius: '2px'
  },
  busChassis: {
    border: '2px solid #3f3f46',
    borderRadius: '20px 20px 10px 10px',
    padding: '16px 14px',
    backgroundColor: '#09090b',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box'
  },
  driverCabinRow: {
    width: '100%',
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    borderBottom: '1px dashed #3f3f46',
    paddingBottom: '8px',
    marginBottom: '12px'
  },
  driverIconBadge: {
    fontSize: '0.75rem',
    color: '#a1a1aa',
    fontWeight: '600'
  },
  steeringWheel: {
    fontSize: '0.9rem'
  },
  verticalSeatContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '340px',
    overflowY: 'auto',
    paddingRight: '4px',
    width: '100%'
  },
  busRowGroup: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  seatPair: {
    display: 'flex',
    gap: '6px'
  },
  compactSeat: {
    width: '40px',
    height: '38px',
    borderRadius: '8px',
    display: 'flex',
    justify: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: 0,
    margin: 0,
    border: 'none',
    lineHeight: 'normal',
    color: '#ffffff',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.2)',
    userSelect: 'none',
    transition: 'opacity 0.15s ease'
  },
  aisleGap: {
    flex: 1,
    minWidth: '24px'
  },
  rightInfoColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  imageGalleryContainer: {
    backgroundColor: '#18181b',
    borderRadius: '12px',
    padding: '12px',
    border: '1px solid #3f3f46'
  },
  mainLargeImg: {
    width: '100%',
    height: '210px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #3f3f46'
  },
  largeImgPlaceholder: {
    width: '100%',
    height: '210px',
    borderRadius: '8px',
    backgroundColor: '#27272a',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justify: 'center',
    color: '#71717a',
    gap: '8px',
    fontSize: '0.85rem'
  },
  thumbnailRow: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
    overflowX: 'auto',
    paddingBottom: '2px'
  },
  thumbImg: {
    width: '60px',
    height: '45px',
    borderRadius: '6px',
    objectFit: 'cover',
    border: '1px solid #3f3f46',
    cursor: 'pointer'
  },
  detailGridStacked: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  detailCard: {
    backgroundColor: '#18181b',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #3f3f46',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  detailLabel: {
    fontSize: '0.75rem',
    color: '#a1a1aa',
    fontWeight: '600'
  },
  detailValue: {
    fontSize: '0.95rem',
    color: '#f4f4f5',
    fontWeight: '700'
  },

  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  th: { padding: '14px 16px', borderBottom: '1px solid #3f3f46', color: '#a1a1aa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #3f3f46' },
  td: { padding: '14px 16px', fontSize: '0.85rem', color: '#d4d4d8' },
  userIdBadge: { backgroundColor: '#18181b', color: '#d4d4d8', border: '1px solid #3f3f46', padding: '3px 8px', borderRadius: '6px', fontWeight: '700', fontSize: '0.75rem' },
  avatarContainer: { position: 'relative' },
  avatarCircle: { width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#18181b', border: '2px solid #52525b', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cameraBtn: { position: 'absolute', bottom: '2px', right: '2px', backgroundColor: '#3f3f46', border: '1px solid #52525b', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' },
  roleBadge: { backgroundColor: '#3f3f46', color: '#ffffff', border: '1px solid #52525b', fontSize: '0.75rem', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', display: 'inline-block' },
  activeBadge: { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '10px', fontWeight: '600', display: 'inline-block' },
  errorAlert: { backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' },
  successAlert: { backgroundColor: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' },
  emptyBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center', color: '#71717a', gap: '12px' },
  emptyBoxCompact: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', color: '#71717a', gap: '8px', backgroundColor: '#18181b', borderRadius: '10px', border: '1px solid #3f3f46' },
  historyBtn: { display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#3f3f46', color: '#ffffff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer' },

  activityProfileSection: { backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', padding: '16px' },
  activityProfileHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' },
  activityProfileGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' },
  activityProfileCard: { backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' },
  actLabel: { fontSize: '0.72rem', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '4px' },
  actVal: { fontSize: '0.85rem', color: '#f4f4f5', fontWeight: '600' },

  paymentCard: { backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' },
  paymentCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #27272a', paddingBottom: '8px' },
  paymentBadgeSuccess: { backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' },
  paymentDetailsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '0.8rem' },
  paySubLabel: { color: '#a1a1aa', marginRight: '6px' },
  paySubValue: { color: '#f4f4f5', fontWeight: '600' },

  gatewayGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' },
  gatewayCard: { backgroundColor: '#18181b', padding: '18px', borderRadius: '12px', border: '1px solid #3f3f46', display: 'flex', flexDirection: 'column', gap: '12px' },
  connectedBadge: { backgroundColor: '#15803d', color: '#ffffff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' },
  keyRow: { display: 'flex', alignItems: 'center', gap: '6px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '16px', padding: '24px', width: '100%' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' },
  closeBtn: { background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '16px' },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  modalLabel: { fontSize: '0.8rem', color: '#a1a1aa', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' },
  modalInput: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#ffffff', outline: 'none' },
  modalSelect: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: '#ffffff', outline: 'none', cursor: 'pointer' },
  formRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  uploadBox: { backgroundColor: '#18181b', border: '1px dashed #3f3f46', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' },
  uploadLabelBtn: { alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#3f3f46', color: '#ffffff', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' },
  imagePreviewRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  imgBadgeWrapper: { position: 'relative' },
  previewThumb: { width: '50px', height: '50px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #3f3f46' },
  removeImgBtn: { position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' },
  cancelBtn: { padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#3f3f46', color: '#ffffff', fontWeight: '600', cursor: 'pointer' },
  submitModalBtn: { padding: '10px 18px', borderRadius: '8px', border: '1px solid #52525b', backgroundColor: '#3f3f46', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }
};