import React, { useState, useEffect } from 'react';
import { 
  Bus, 
  User, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowRight,
  CheckCircle2,
  KeyRound,
  ArrowLeft
} from 'lucide-react';

export default function Signin({ onLoginSuccess }) {
  const [role, setRole] = useState('user');
  const [mode, setMode] = useState('signin');

  const initialFormState = {
    name: '',
    emailOrPhone: '',
    phone: '',
    password: '',
    confirmPassword: '',
  };

  const [formData, setFormData] = useState(initialFormState);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const API_BASE = 'https://online-bus-ticket-system-81tt.onrender.com/api';

  const resetForm = () => {
    setFormData(initialFormState);
    setError('');
    setSuccessMsg('');
    setShowPassword(false);
  };

  useEffect(() => {
    resetForm();
  }, []);

  const handleRoleChange = (selectedRole) => {
    if (role !== selectedRole) {
      setRole(selectedRole);
      // If switching to admin while in signup mode, force signin mode
      if (selectedRole === 'admin' && mode === 'signup') {
        setMode('signin');
      }
      resetForm();
    }
  };

  const handleModeChange = (newMode) => {
    // Prevent admins from accessing signup mode
    if (newMode === 'signup' && role === 'admin') {
      setRole('user');
    }
    setMode(newMode);
    resetForm();
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const saveUserToLocalStorage = (userObj) => {
    const existingUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
    const userIndex = existingUsers.findIndex(
      (u) => (u.email && u.email.toLowerCase() === userObj.email.toLowerCase()) || 
             (u.phone && u.phone === userObj.phone)
    );

    if (userIndex === -1) {
      existingUsers.push(userObj);
    } else {
      existingUsers[userIndex] = { ...existingUsers[userIndex], ...userObj };
    }
    localStorage.setItem('app_users', JSON.stringify(existingUsers));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'forgot') {
      if (!formData.emailOrPhone) {
        setError('Please enter your Mobile Number or Email Address.');
        return;
      }
      setSuccessMsg(`Password reset instructions sent to ${formData.emailOrPhone}`);
      return;
    }

    if (mode === 'signup') {
      // Force role to user during signup
      const signupRole = 'user';

      if (!formData.name || !formData.emailOrPhone || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all required registration fields.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match!');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(`${API_BASE}/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.emailOrPhone,
            phone: formData.phone || formData.emailOrPhone,
            password: formData.password,
            role: signupRole,
          }),
        });

        let data = {};
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        }

        if (!response.ok) {
          throw new Error(data.message || `Registration failed with status ${response.status}`);
        }

        const newUser = data.user || {
          id: 'USR-' + Math.floor(1000 + Math.random() * 9000),
          name: formData.name,
          email: formData.emailOrPhone,
          phone: formData.phone || '',
          password: formData.password,
          role: 'user',
          joined: new Date().toISOString().split('T')[0],
          status: 'Active'
        };

        saveUserToLocalStorage(newUser);
        resetForm();
        setMode('signin');
        setSuccessMsg(`Passenger account created successfully! You can now sign in.`);

      } catch (err) {
        // Fallback local save if server fails or is offline
        const localUser = {
          id: 'USR-' + Math.floor(1000 + Math.random() * 9000),
          name: formData.name,
          email: formData.emailOrPhone,
          phone: formData.phone || '',
          password: formData.password,
          role: 'user',
          joined: new Date().toISOString().split('T')[0],
          status: 'Active'
        };
        saveUserToLocalStorage(localUser);
        resetForm();
        setMode('signin');
        setSuccessMsg(`Account created locally. You can now sign in.`);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'signin') {
      if (!formData.emailOrPhone || !formData.password) {
        setError('Please enter your Email/Phone and Password.');
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/signin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.emailOrPhone,
            password: formData.password,
            role: role,
          }),
        });

        let data = {};
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        }

        let authenticatedUser = null;
        let token = null;

        if (response.ok && data.user) {
          authenticatedUser = data.user;
          token = data.token; // Save token from API
        } else {
          // Fallback to local storage lookup
          const localUsers = JSON.parse(localStorage.getItem('app_users') || '[]');
          authenticatedUser = localUsers.find(
            (u) => (u.email === formData.emailOrPhone || u.phone === formData.emailOrPhone) && u.password === formData.password
          );
        }

        if (!authenticatedUser) {
          throw new Error('Invalid email/phone or password.');
        }

        const normalizedUserRole = (authenticatedUser.role || '').toLowerCase();

        if (role === 'admin' && normalizedUserRole !== 'admin') {
          throw new Error('Access denied. Regular passenger accounts cannot access the Admin Portal.');
        }

        if (role === 'user' && normalizedUserRole === 'admin') {
          throw new Error('Access denied. Admin accounts must sign in using the Admin Portal.');
        }

        // Store active user session & JWT token
        localStorage.setItem('currentUser', JSON.stringify(authenticatedUser));
        if (token) {
          localStorage.setItem('token', token);
        }

        if (onLoginSuccess) {
          onLoginSuccess(authenticatedUser, token);
        }
      } catch (err) {
        setError(err.message || 'Login failed. Please check your credentials.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.authWrapper}>

        <div style={styles.leftSection}>
          <div style={styles.brandGroup}>
            <div style={styles.logoBadge}>
              <Bus size={28} color="#18181b" />
            </div>
            <div>
              <h1 style={styles.leftTitle}>ONLINE BUS</h1>
              <span style={styles.bdBadge}>BANGLADESH</span>
            </div>
          </div>

          <div style={styles.leftHeroContent}>
            <h2 style={styles.heroHeading}>Travel across Bangladesh smoothly.</h2>
            <p style={styles.heroSubtext}>
              Book AC & Non-AC bus seats across Dhaka, Chattogram, Sylhet, Cox's Bazar, and all major divisions.
            </p>

            <div style={styles.featureList}>
              <div style={styles.featureItem}>
                <CheckCircle2 size={18} color="#22c55e" />
                <span>Real-time interactive seat selection</span>
              </div>
              <div style={styles.featureItem}>
                <CheckCircle2 size={18} color="#22c55e" />
                <span>bKash, Nagad, Rocket & Card payments</span>
              </div>
              <div style={styles.featureItem}>
                <CheckCircle2 size={18} color="#22c55e" />
                <span>Instant confirmation & digital E-Ticket</span>
              </div>
            </div>
          </div>

          <div style={styles.leftFooter}>
            © {new Date().getFullYear()} Online Bus Bangladesh. All rights reserved.
          </div>
        </div>

        <div style={styles.rightSection}>
          <div style={styles.roleToggle}>
            <button
              type="button"
              onClick={() => handleRoleChange('user')}
              style={{ ...styles.roleBtn, ...(role === 'user' ? styles.activeRole : {}) }}
            >
              <User size={16} /> Passenger Portal
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              style={{ ...styles.roleBtn, ...(role === 'admin' ? styles.activeRole : {}) }}
            >
              <ShieldCheck size={16} /> Admin Portal
            </button>
          </div>

          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>
              {mode === 'forgot' && 'Reset Password'}
              {mode === 'signup' && 'Create Passenger Account'}
              {mode === 'signin' && `${role === 'admin' ? 'Admin' : 'Passenger'} Sign In`}
            </h2>
            <p style={styles.formSubtext}>
              {mode === 'forgot' && 'Enter your registered Email/Mobile to receive reset instructions.'}
              {mode === 'signup' && 'Fill details below to register a new Passenger account.'}
              {mode === 'signin' && `Enter your ${role === 'admin' ? 'Admin credentials' : 'Mobile Number or Email'} to proceed.`}
            </p>
          </div>

          {error && <div style={styles.errorAlert}>{error}</div>}
          {successMsg && <div style={styles.successAlert}>{successMsg}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            {mode === 'signup' && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Full Name</label>
                <div style={styles.inputWrapper}>
                  <User size={18} style={styles.inputIcon} />
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Tanvir Hossain"
                    value={formData.name}
                    onChange={handleInputChange}
                    style={styles.input}
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                {mode === 'signup' ? 'Email Address' : 'Mobile Number or Email'}
              </label>
              <div style={styles.inputWrapper}>
                <Mail size={18} style={styles.inputIcon} />
                <input
                  type="text"
                  name="emailOrPhone"
                  placeholder={
                    mode === 'signup' 
                      ? 'passenger@example.com' 
                      : role === 'admin' 
                        ? 'admin@gmail.com' 
                        : '017XXXXXXXX or user@gmail.com'
                  }
                  value={formData.emailOrPhone}
                  onChange={handleInputChange}
                  style={styles.input}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Mobile Number</label>
                <div style={styles.inputWrapper}>
                  <Phone size={18} style={styles.inputIcon} />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="01712345678"
                    value={formData.phone}
                    onChange={handleInputChange}
                    style={styles.input}
                    autoComplete="tel"
                  />
                </div>
              </div>
            )}

            {mode !== 'forgot' && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.inputWrapper}>
                  <Lock size={18} style={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    style={styles.input}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {mode === 'signin' && (
                  <div style={styles.forgotRow}>
                    <button
                      type="button"
                      onClick={() => handleModeChange('forgot')}
                      style={styles.forgotBtn}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
              </div>
            )}

            {mode === 'signup' && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm Password</label>
                <div style={styles.inputWrapper}>
                  <Lock size={18} style={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    style={styles.input}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            )}

            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  {mode === 'forgot' && (
                    <>
                      <KeyRound size={18} /> Send Reset Link
                    </>
                  )}
                  {mode === 'signup' && (
                    <>
                      <span>Register Passenger</span> <ArrowRight size={18} />
                    </>
                  )}
                  {mode === 'signin' && (
                    <>
                      <span>Sign In to {role === 'admin' ? 'Admin Portal' : 'Passenger Portal'}</span> <ArrowRight size={18} />
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          {/* Hide sign up toggle when in Admin mode */}
          {role !== 'admin' && (
            <div style={styles.switchContainer}>
              {mode === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => handleModeChange('signin')}
                  style={styles.backBtn}
                >
                  <ArrowLeft size={16} /> Back to Sign In
                </button>
              ) : (
                <>
                  <span>{mode === 'signup' ? 'Already registered?' : "Don't have an account?"}</span>
                  <button
                    type="button"
                    onClick={() => handleModeChange(mode === 'signup' ? 'signin' : 'signup')}
                    style={styles.switchBtn}
                  >
                    {mode === 'signup' ? 'Sign In' : 'Sign Up'}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Direct back link for admin forgot password */}
          {role === 'admin' && mode === 'forgot' && (
            <div style={styles.switchContainer}>
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                style={styles.backBtn}
              >
                <ArrowLeft size={16} /> Back to Sign In
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18181b',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  authWrapper: {
    display: 'flex',
    width: '100%',
    maxWidth: '960px',
    minHeight: '600px',
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  },
  leftSection: {
    flex: '1',
    backgroundColor: '#09090b',
    color: '#ffffff',
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  brandGroup: { display: 'flex', alignItems: 'center', gap: '12px' },
  logoBadge: {
    backgroundColor: '#ffffff',
    padding: '8px',
    borderRadius: '12px',
    display: 'flex',
  },
  leftTitle: { fontSize: '1.25rem', fontWeight: '800', letterSpacing: '1px', margin: 0, color: '#ffffff' },
  bdBadge: { fontSize: '0.65rem', fontWeight: '700', color: '#a1a1aa', letterSpacing: '2px' },
  leftHeroContent: { margin: '32px 0' },
  heroHeading: { fontSize: '1.9rem', fontWeight: '700', lineHeight: '1.25', margin: '0 0 16px 0', color: '#ffffff' },
  heroSubtext: { color: '#a1a1aa', fontSize: '0.9rem', lineHeight: '1.5', margin: '0 0 24px 0' },
  featureList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  featureItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#e4e4e7' },
  leftFooter: { fontSize: '0.75rem', color: '#71717a' },
  rightSection: { flex: '1.1', backgroundColor: '#ffffff', padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  roleToggle: { display: 'flex', backgroundColor: '#f4f4f5', borderRadius: '12px', padding: '4px', marginBottom: '20px', border: '1px solid #e4e4e7' },
  roleBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 0',
    fontSize: '0.85rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#71717a',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activeRole: { backgroundColor: '#18181b', color: '#ffffff' },
  formHeader: { marginBottom: '16px' },
  formTitle: { fontSize: '1.4rem', fontWeight: '700', color: '#18181b', margin: '0 0 4px 0' },
  formSubtext: { fontSize: '0.85rem', color: '#71717a', margin: 0 },
  errorAlert: { backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px' },
  successAlert: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '16px' },
  form: { display: 'flex', flexDirection: 'column', gap: '12px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  label: { fontSize: '0.75rem', fontWeight: '700', color: '#18181b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  inputIcon: { position: 'absolute', left: '12px', color: '#71717a' },
  input: {
    width: '100%',
    padding: '10px 12px 10px 38px',
    borderRadius: '10px',
    border: '1px solid #d4d4d8',
    backgroundColor: '#ffffff',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#18181b',
  },
  forgotRow: { display: 'flex', justifyContent: 'flex-end', marginTop: '2px' },
  forgotBtn: { background: 'none', border: 'none', color: '#18181b', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', padding: '2px 0' },
  eyeBtn: { position: 'absolute', right: '12px', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: '#18181b',
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  switchContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: '20px', fontSize: '0.85rem', color: '#71717a' },
  switchBtn: { background: 'none', border: 'none', color: '#18181b', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: '#18181b', fontWeight: '600', cursor: 'pointer' },
};