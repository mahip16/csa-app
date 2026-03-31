import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const pageBg = 'linear-gradient(135deg, #dff0f7 0%, #eef4fb 30%, #fdf9ee 70%, #fef8e1 100%)'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState('')

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(err.code)) {
        setError('Invalid email or password.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.')
      } else if (err.code === 'auth/user-disabled') {
        setError('This account has been disabled.')
      } else {
        setError('Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
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
  })

  return (
    <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: '1rem' }}>
      <div style={{ backgroundColor: '#fff', border: '2px solid #3b4fa8', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '420px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)' }}>

        {/* Icon */}
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#eef2fb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b4fa8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#0f1f4b', marginBottom: '0.3rem' }}>Student login</h1>
        <p style={{ fontSize: '0.9rem', color: '#8a95a8', marginBottom: '1.75rem' }}>Access your co-op portal and track your application.</p>

        {error && (
          <div style={{ backgroundColor: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px', padding: '0.7rem 1rem', fontSize: '0.82rem', color: '#dc2626', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#0f1f4b', marginBottom: '0.4rem' }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused('')}
              style={inputStyle('email')}
              placeholder="jane@torontomu.ca"
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#0f1f4b', marginBottom: '0.4rem' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused('')}
              style={inputStyle('password')}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none',
              backgroundColor: loading || !email || !password ? '#9baee0' : '#3b4fa8',
              color: '#fff', fontSize: '1rem', fontWeight: '700', fontFamily: 'inherit',
              cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid #e8edf5', marginTop: '1.5rem', paddingTop: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: '#8a95a8' }}>
            No account yet?{' '}
            <span onClick={() => navigate('/register')} style={{ color: '#3b4fa8', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}>
              Apply for co-op
            </span>
          </span>
        </div>

        <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
          <span onClick={() => navigate('/')} style={{ fontSize: '0.82rem', color: '#8a95a8', cursor: 'pointer', textDecoration: 'underline' }}>
            Back to home
          </span>
        </div>
      </div>
    </div>
  )
}