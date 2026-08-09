import React from 'react';
import { 
  Bus, 
  Home, 
  Info, 
  User as UserIcon, 
  CreditCard, 
  LogOut, 
  ShieldCheck 
} from 'lucide-react';

export default function Header({ user, activeTab, setActiveTab, onLogout }) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'about', label: 'About', icon: Info },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'payment', label: 'Payment', icon: CreditCard },
  ];

  return (
    <header style={styles.header}>
      {/* Brand Logo */}
      <div style={styles.brand}>
        <div style={styles.logoBadge}>
          <Bus size={22} color="#0f0703" />
        </div>
        <div>
          <span style={styles.title}>ONLINE BUS</span>
          <span style={styles.subTitle}>BANGLADESH</span>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav style={styles.navBar}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isHome = item.id === 'home';


          let buttonStyle = { ...styles.navBtn };
          if (isActive) {
            if (isHome) {
              buttonStyle = { ...buttonStyle, ...styles.defaultActiveNavBtn };
            } else {
              buttonStyle = { ...buttonStyle, ...styles.defaultActiveNavBtn };
            }
          }

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={buttonStyle}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Status & Sign Out */}
      <div style={styles.userSection}>
        <span style={styles.roleBadge}>
          {user.role === 'admin' ? (
            <><ShieldCheck size={14} color="#c4bbb6" /> Admin</>
          ) : (
            <><UserIcon size={14} color="#B2BEB5" /> Passenger</>
          )}
        </span>

        <button onClick={onLogout} style={styles.logoutBtn}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 32px',
    backgroundColor: '#09090b',
    borderBottom: '1px solid #27272a',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoBadge: {
    backgroundColor: '#ffffff',
    padding: '6px',
    borderRadius: '10px',
    display: 'flex',
  },
  title: {
    fontWeight: '800',
    letterSpacing: '1px',
    fontSize: '0.95rem',
    color: '#ffffff',
    display: 'block',
    lineHeight: '1',
  },
  subTitle: {
    fontSize: '0.6rem',
    color: '#a1a1aa',
    letterSpacing: '1.5px',
    fontWeight: '700',
  },
  navBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#18181b',
    padding: '4px 6px',
    borderRadius: '12px',
    border: '1px solid #27272a',
  },
  navBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#a1a1aa',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
  },

  /* Default active state for other tabs */
  defaultActiveNavBtn: {
    backgroundColor: '#27272a',
    color: '#ffffff',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#27272a',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    color: '#e4e4e7',
    fontWeight: '700',
    textTransform: 'uppercase',
    border: '1px solid #3f3f46',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#666D6A',
    border: 'none',
    color: '#ffffff',
    padding: '8px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
  },
};