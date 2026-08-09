import React from 'react';
import { 
  Bus, 
  Phone, 
  Mail, 
  MapPin, 
  ShieldCheck, 
  CreditCard, 
  Clock,
  Heart
} from 'lucide-react';

export default function Footer({ setActiveTab }) {
  return (
    <footer style={styles.footer}>
      {/* Top Banner: Value Propositions */}
      <div style={styles.topBanner}>
        <div style={styles.bannerContainer}>
          <div style={styles.featureBox}>
            <ShieldCheck size={28} color="#2563eb" />
            <div>
              <h4 style={styles.featureTitle}>Safe & Secure Payments</h4>
              <p style={styles.featureText}>100% encrypted checkout process</p>
            </div>
          </div>

          <div style={styles.featureBox}>
            <Clock size={28} color="#2563eb" />
            <div>
              <h4 style={styles.featureTitle}>24/7 Customer Support</h4>
              <p style={styles.featureText}>Dedicated team ready to assist you</p>
            </div>
          </div>

          <div style={styles.featureBox}>
            <CreditCard size={28} color="#2563eb" />
            <div>
              <h4 style={styles.featureTitle}>Instant Booking Refund</h4>
              <p style={styles.featureText}>Hassle-free dynamic cancellations</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={styles.mainContainer}>
        <div style={styles.grid}>
          
          {/* Column 1: Brand & Bio */}
          <div style={styles.col}>
            <div style={styles.logoGroup} onClick={() => setActiveTab && setActiveTab('search')}>
              <div style={styles.logoIcon}>
                <Bus size={22} color="#ffffff" />
              </div>
              <span style={styles.logoText}>OnlineBus</span>
            </div>
            <p style={styles.brandDescription}>
              OnlineBus is your trusted platform for online bus ticket reservations. Experience smooth travel, real-time seat selection, and instant e-tickets anytime.
            </p>
            <div style={styles.contactItem}>
              <MapPin size={16} color="#94a3b8" />
              <span>Bangladesh</span>
            </div>
            <div style={styles.contactItem}>
              <Phone size={16} color="#94a3b8" />
              <span>+88000000000</span>
            </div>
            <div style={styles.contactItem}>
              <Mail size={16} color="#94a3b8" />
              <span>support@onlinebus.com</span>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div style={styles.col}>
            <h3 style={styles.colTitle}>Quick Links</h3>
            <ul style={styles.linkList}>
              <li><a href="#search" onClick={() => setActiveTab && setActiveTab('search')} style={styles.link}>Search Routes</a></li>
              <li><a href="#tickets" onClick={() => setActiveTab && setActiveTab('my-tickets')} style={styles.link}>My E-Tickets</a></li>
              <li><a href="#about" style={styles.link}>About OnlineBus</a></li>
              <li><a href="#faq" style={styles.link}>Help & FAQs</a></li>
              <li><a href="#terms" style={styles.link}>Terms & Conditions</a></li>
            </ul>
          </div>

          {/* Column 3: Top Bus Routes */}
          <div style={styles.col}>
            <h3 style={styles.colTitle}>Popular Routes</h3>
            <ul style={styles.linkList}>
              <li style={styles.routeItem}><span>Dhaka</span> → <span>Cox bazaar</span></li>
              <li style={styles.routeItem}><span>Dhaka</span> → <span>Chittagong</span></li>
              <li style={styles.routeItem}><span>Dhaka</span> → <span>Shylet</span></li>
              <li style={styles.routeItem}><span>Cox bazaar</span> → <span>Bandarban</span></li>
              <li style={styles.routeItem}><span>Dhaka</span> → <span>Feni</span></li>
            </ul>
          </div>

          {/* Column 4: Payment Methods & Apps */}
          <div style={styles.col}>
            <h3 style={styles.colTitle}>We Accept</h3>
            <p style={styles.paymentText}>Pay seamlessly with your preferred payment providers:</p>
            <div style={styles.paymentBadges}>
              <span style={styles.badge}>VISA</span>
              <span style={styles.badge}>MasterCard</span>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar: Copyright */}
      <div style={styles.bottomBar}>
        <div style={styles.bottomContainer}>
          <p style={styles.copyright}>
            © {new Date().getFullYear()}Bus Inc. All rights reserved. Built with <Heart size={14} color="#ef4444" style={{ display: 'inline', verticalAlign: 'middle' }} /> for seamless travel.
          </p>
          <div style={styles.bottomLinks}>
            <a href="#privacy" style={styles.subLink}>Privacy Policy</a>
            <span style={{ color: '#475569' }}>•</span>
            <a href="#cookies" style={styles.subLink}>Cookie Settings</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Inline Styles for instant setup
const styles = {
  footer: {
    backgroundColor: '#010205', // Dark Navy slate background
    color: '#94a3b8',
    fontFamily: 'sans-serif',
    marginTop: 'auto', // Pushes footer to bottom in flexible layouts
  },
  topBanner: {
    backgroundColor: '#000102',
    borderBottom: '1px solid #08111d',
    padding: '24px 16px',
  },
  bannerContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
  },
  featureBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: '1 1 250px',
  },
  featureTitle: {
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: '600',
    margin: '0 0 2px 0',
  },
  featureText: {
    color: '#94a3b8',
    fontSize: '0.8rem',
    margin: 0,
  },
  mainContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '48px 24px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '32px',
  },
  col: {
    display: 'flex',
    flexDirection: 'column',
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    marginBottom: '16px',
  },
  logoIcon: {
    backgroundColor: '#2563eb',
    padding: '8px',
    borderRadius: '8px',
    display: 'flex',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  brandDescription: {
    fontSize: '0.875rem',
    lineHeight: '1.5',
    marginBottom: '20px',
    color: '#94a3b8',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    marginBottom: '8px',
    color: '#cbd5e1',
  },
  colTitle: {
    color: '#ffffff',
    fontSize: '1rem',
    fontWeight: '600',
    marginBottom: '16px',
    letterSpacing: '0.5px',
  },
  linkList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  link: {
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '0.875rem',
    transition: 'color 0.2s',
  },
  routeItem: {
    fontSize: '0.875rem',
    color: '#cbd5e1',
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  paymentText: {
    fontSize: '0.85rem',
    marginBottom: '12px',
    lineHeight: '1.4',
  },
  paymentBadges: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  badge: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    color: '#e2e8f0',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    padding: '4px 10px',
    borderRadius: '4px',
  },
  bottomBar: {
    backgroundColor: '#020617',
    borderTop: '1px solid #0c1627',
    padding: '16px 24px',
  },
  bottomContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  copyright: {
    margin: 0,
    fontSize: '0.85rem',
    color: '#64748b',
  },
  bottomLinks: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  subLink: {
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '0.85rem',
  },
};