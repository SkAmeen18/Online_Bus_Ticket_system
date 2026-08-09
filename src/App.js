import Signin from "./Online_Ticket_system/Signin";
import Footer from "./Online_Ticket_system/Footer";
import Admin from './Online_Ticket_system/Admin';
import User from './Online_Ticket_system/User';
import Header from './Online_Ticket_system/Header';
import React, { useState } from 'react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home'); // Default tab is 'home'
  const [authKey, setAuthKey] = useState(Date.now()); // Forces Signin component to re-mount blank on logout

  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setActiveTab('home'); // Always lands on Home page after Sign In
  };

  const handleLogout = () => {

    localStorage.removeItem('token'); // Clean saved JWT token
    setCurrentUser(null);
    setAuthKey(Date.now()); // Generate a new key to completely wipe the Signin form state
  };

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
};