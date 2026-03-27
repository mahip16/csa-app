// src/pages/employer/EmployerRegister.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc, waitForPendingWrites } from 'firebase/firestore';
import { auth, db } from '../../firebase/firebase';
import { validateEmail, validatePassword } from '../../utils/validation.js';

const pageBg = 'linear-gradient(135deg, #dff0f7 0%, #eef4fb 30%, #fdf9ee 70%, #fef8e1 100%)';

export default function EmployerRegister() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [company, setCompany] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState('');

  async function handleRegister(e) {

    e.preventDefault();
    setError('');

    if (password !== passwordConfirm) {
      setError("Passwords do not match. Please try again");
      return;
    }

    if (!validateEmail(email)) {
    setError('Please enter a valid email address.');
    return;
    }

    if (!validatePassword(password)) {
    setError('Password must be at least 6 characters.');
    return;
  }

    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCred.user.uid), {
        email,
        role: 'employer',
        company,
      });
      navigate('/employer/dashboard');
    } catch (err) {
      if (['auth/email-already-in-use', 'auth/invalid-email'].includes(err.code)) {
        setError('Invalid or already used email.');
      } else if (err.code === 'auth/weak-password') {
        //setError('Password must be at least 6 characters.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = (name) => ({
    width: '100%',
    boxSizing: 'border-box',
    padding: '0.7rem 1rem',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    color: '#0f1f4b',
    backgroundColor: '#f8fafc',
    border: `1.5px solid ${focused === name ? '#3b4fa8' : '#dde3ed'}`,
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.15s',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: pageBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          border: '2px solid #f5a623',
          borderRadius: '16px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.09)',
        }}
      >
        {}
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#fef3d7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
          }}
        >
          {/* <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f5a623"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg> */}

          <svg fill="#f5a623" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve" width="30px" height="30px" stroke="#f5a623" stroke-width="9.728"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M470.948,481.583V0H41.052v481.583H15.209V512h25.842H184.52H327.48h143.468h25.842v-30.417H470.948z M240.791,481.583 h-25.855v-70.117h25.855V481.583z M297.063,481.583h-25.855v-70.117h25.855V481.583z M440.531,481.583H327.48V381.049H184.52 v100.534H71.469V30.417h369.062V481.583z"></path> </g> </g> <g> <g> <rect x="100.114" y="56.779" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="156.386" y="56.779" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="212.657" y="56.779" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="100.114" y="120.32" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="156.386" y="120.32" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="212.657" y="120.32" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="268.929" y="56.779" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="325.201" y="56.779" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="268.929" y="120.32" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="325.201" y="120.32" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="381.473" y="56.779" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="381.473" y="120.32" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="100.114" y="183.852" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="156.386" y="183.852" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="212.657" y="183.852" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="268.929" y="183.852" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="325.201" y="183.852" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="381.473" y="183.852" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="100.114" y="247.393" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="156.386" y="247.393" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="212.657" y="247.393" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="268.929" y="247.393" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="325.201" y="247.393" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="381.473" y="247.393" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="100.114" y="310.935" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="156.386" y="310.935" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="212.657" y="310.935" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="268.929" y="310.935" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="325.201" y="310.935" width="30.417" height="35.821"></rect> </g> </g> <g> <g> <rect x="381.473" y="310.935" width="30.417" height="35.821"></rect> </g> </g> </g></svg>
        </div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#0f1f4b', marginBottom: '0.3rem' }}>
          Employer Register
        </h1>
        <p style={{ fontSize: '0.9rem', color: '#8a95a8', marginBottom: '1.75rem' }}>
          Create your account to submit evaluations
        </p>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(220,38,38,0.07)',
              border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: '8px',
              padding: '0.7rem 1rem',
              fontSize: '0.82rem',
              color: '#dc2626',
              marginBottom: '1.25rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#0f1f4b', marginBottom: '0.4rem' }}>
              Company Name
            </label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onFocus={() => setFocused('company')}
              onBlur={() => setFocused('')}
              style={inputStyle('company')}
              placeholder="Your Company Name"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#0f1f4b', marginBottom: '0.4rem' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused('')}
              style={inputStyle('email')}
              placeholder="employer@university.ca"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#0f1f4b', marginBottom: '0.4rem' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused('')}
              style={inputStyle('password')}
              placeholder="Enter your password"
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#0f1f4b', marginBottom: '0.4rem' }}>
              Confirm Password
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={e => setPasswordConfirm(e.target.value)}
              onFocus={() => setFocused('passwordConfirm')}
              onBlur={() => setFocused('')}
              style={inputStyle('passwordConfirm')}
              placeholder="Re-enter password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password || !company}
            style={{
              width: '100%',
              padding: '0.8rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: loading || !email || !password || !company ? '#f5c96a' : '#f5a623',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '700',
              fontFamily: 'inherit',
              cursor: loading || !email || !password || !company ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid #e8edf5', marginTop: '1.5rem', paddingTop: '1.25rem', textAlign: 'center' }}>
          <span
            onClick={() => navigate('/employer/login')}
            style={{ fontSize: '0.82rem', color: '#8a95a8', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Already have an account? Login
          </span>
        </div>
      </div>
    </div>
  );
}