import React, { useState, useEffect } from 'react';
import Signin from "./Online_Ticket_system/Signin";
import Footer from "./Online_Ticket_system/Footer";
import Admin from './Online_Ticket_system/Admin';
import User from './Online_Ticket_system/User';
import Header from './Online_Ticket_system/Header';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // Default tab is 'home'
  const [authKey, setAuthKey] = useState(Date.now()); // Forces Signin component to re-mount blank on logout
  const [loading, setLoading] = useState(true); // Prevents flash of sign-in form during page reload

  // --- Session Verification on Page Reload ---
  useEffect(() => {
    const verifyUserSession = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          const res = await fetch('https://online-bus-ticket-system-81tt.onrender.com/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();

          if (data.success) {
            setCurrentUser(data.user);
          } else {
            // Token expired or invalid
            localStorage.removeItem('token');
          }
        } catch (err) {
          console.error('Session check failed:', err);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    verifyUserSession();
  }, []);

  const handleLoginSuccess = (userData, token) => {
    if (token) {
      localStorage.setItem('token', token);
    }
    setCurrentUser(userData);
    setActiveTab('home'); 
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    setCurrentUser(null);
    setAuthKey(Date.now()); 
  };

  // --- Show Loading Screen while restoring session ---
  if (loading) {
    return (
      <div style={styles.loadingWrapper}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: '16px', color: '#a1a1aa', fontSize: '14px' }}>Restoring session...</p>
      </div>
    );
  }

  // --- Show Signin screen if not logged in ---
  if (!currentUser) {
    return <Signin key={authKey} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={styles.appWrapper}>
      <Header 
        user={currentUser} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
      />
      
      <main style={styles.mainContent}>
        {/* Render Admin.js or User.js based on role */}
        {currentUser.role === 'admin' ? (
          <Admin user={currentUser} activeTab={activeTab} />
        ) : (
          <User user={currentUser} activeTab={activeTab} />
        )}
      </main>

      <Footer/>
    </div>
  );
}

const styles = {
  appWrapper: {
    minHeight: '100vh',
    backgroundColor: '#18181b', // Ash/Dark background
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  mainContent: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  loadingWrapper: {
    minHeight: '100vh',
    backgroundColor: '#18181b',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #27272a',
    borderTop: '3px solid #2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  }
};