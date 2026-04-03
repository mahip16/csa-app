import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { validateEmail, validatePassword, validateStudentId } from '../../utils/validation'

const pageBg = 'linear-gradient(135deg, #dff0f7 0%, #eef4fb 30%, #fdf9ee 70%, #fef8e1 100%)'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()

  const [form, setForm] = useState({ name: '', studentId: '', email: '', password: '', confirmPassword: '', program: '', gpa: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState('')

  function set(key) {
    return (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.name.trim()) return setError('Full name is required.')
    if (!validateStudentId(form.studentId)) return setError('Student ID must be exactly 9 digits.')
    if (!validateEmail(form.email)) return setError('Please enter a valid email address.')
    if (!validatePassword(form.password)) return setError('Password must be at least 6 characters.')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
    if (!form.program.trim()) return setError('Program is required.')
    const gpaNum = parseFloat(form.gpa)
    if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4.0) return setError('GPA must be a number between 0 and 4.0.')

    setLoading(true)
    try {
      await register(form.email, form.password, form.name, form.studentId, form.program, form.gpa)
      navigate('/dashboard')
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists.')
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters.')
      } else {
        setError('Registration failed. Please try again.')
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
    marginBottom: 0,
  })

  const fields = [
    { key: 'name',            label: 'Full name',        type: 'text',     placeholder: 'Jane Smith' },
    { key: 'studentId',       label: 'Student ID',       type: 'text',     placeholder: '500123456 (9 digits)' },
    { key: 'email',           label: 'Email address',    type: 'email',    placeholder: 'jane@torontomu.ca' },
    { key: 'program',         label: 'Program',          type: 'text',     placeholder: 'e.g. Computer Science' },
    { key: 'gpa',             label: 'GPA',              type: 'number',   placeholder: 'e.g. 3.5' },
    { key: 'password',        label: 'Password',         type: 'password', placeholder: 'At least 6 characters' },
    { key: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: 'Re-enter password' },
  ]

  const allFilled = Object.values(form).every(v => v.toString().trim() !== '')

  return (
    <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: '2rem 1rem' }}>
      <div style={{ backgroundColor: '#fff', border: '2px solid #3b4fa8', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '440px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)' }}>

        {/* Icon */}
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#eef2fb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b4fa8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
          </svg>
        </div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: '#0f1f4b', marginBottom: '0.3rem' }}>Apply for co-op</h1>
        <p style={{ fontSize: '0.9rem', color: '#8a95a8', marginBottom: '1.75rem' }}>Create your account to submit a co-op application.</p>

        {error && (
          <div style={{ backgroundColor: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '8px', padding: '0.7rem 1rem', fontSize: '0.82rem', color: '#dc2626', marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {fields.map(f => (
            <div key={f.key} style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#0f1f4b', marginBottom: '0.4rem' }}>{f.label}</label>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={set(f.key)}
                onFocus={() => setFocused(f.key)}
                onBlur={() => setFocused('')}
                style={inputStyle(f.key)}
                placeholder={f.placeholder}
                step={f.key === 'gpa' ? '0.01' : undefined}
                min={f.key === 'gpa' ? '0' : undefined}
                max={f.key === 'gpa' ? '4.0' : undefined}
                required
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading || !allFilled}
            style={{
              width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none', marginTop: '0.5rem',
              backgroundColor: loading || !allFilled ? '#9baee0' : '#3b4fa8',
              color: '#fff', fontSize: '1rem', fontWeight: '700', fontFamily: 'inherit',
              cursor: loading || !allFilled ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {loading ? 'Submitting...' : 'Submit application'}
          </button>
        </form>

        <div style={{ borderTop: '1px solid #e8edf5', marginTop: '1.5rem', paddingTop: '1.25rem', textAlign: 'center' }}>
          <span style={{ fontSize: '0.82rem', color: '#8a95a8' }}>
            Already have an account?{' '}
            <span onClick={() => navigate('/login')} style={{ color: '#3b4fa8', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}>
              Sign in
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