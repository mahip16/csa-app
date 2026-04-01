import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

const pageBg =
  'linear-gradient(135deg, #dff0f7 0%, #eef4fb 30%, #fdf9ee 70%, #fef8e1 100%)';

export default function EmployerEvaluationForm() {
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState('');
  const [company, setCompany] = useState('');
  const [rating, setRating] = useState(3);
  const [skills, setSkills] = useState(3);
  const [communication, setCommunication] = useState(3);
  const [comments, setComments] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState('');

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
  });

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!studentName || !company) {
      setError('Please fill in required fields.');
      return;
    }

    setLoading(true);

    try {
      await addDoc(collection(db, 'evaluations'), {
        studentName,
        company,
        rating,
        skills,
        communication,
        comments,
        createdAt: new Date().toISOString(),
      });

      navigate('/employer/dashboard');
    } catch (err) {
      setError('Failed to submit evaluation. Please try again.');
    } finally {
      setLoading(false);
    }
  }

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
          border: '2px solid #3b4fa8',
          borderRadius: '16px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '460px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.09)',
        }}
      >
        <h1 style={{ fontSize: '1.5rem', color: '#0f1f4b', fontWeight: 700 }}>
          Employer Evaluation Form
        </h1>

        <p style={{ fontSize: '0.9rem', color: '#8a95a8', marginBottom: '1.5rem' }}>
          Submit feedback for a co-op student
        </p>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(220,38,38,0.07)',
              border: '1px solid rgba(220,38,38,0.2)',
              color: '#dc2626',
              padding: '0.7rem 1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.82rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              Student Name
            </label>
            <input
              style={inputStyle('studentName')}
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              onFocus={() => setFocused('studentName')}
              onBlur={() => setFocused('')}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              Company
            </label>
            <input
              style={inputStyle('company')}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              onFocus={() => setFocused('company')}
              onBlur={() => setFocused('')}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>Overall Performance (1-5)</label>
            <input
              type="range"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>Technical Skills (1-5)</label>
            <input
              type="range"
              min="1"
              max="5"
              value={skills}
              onChange={(e) => setSkills(Number(e.target.value))}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label>Communication (1-5)</label>
            <input
              type="range"
              min="1"
              max="5"
              value={communication}
              onChange={(e) => setCommunication(Number(e.target.value))}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              Comments
            </label>
            <textarea
              style={{ ...inputStyle('comments'), minHeight: '90px' }}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              onFocus={() => setFocused('comments')}
              onBlur={() => setFocused('')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.8rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: loading ? '#9baee0' : '#3b4fa8',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Submitting...' : 'Submit Evaluation'}
          </button>
        </form>

        <div
          style={{
            marginTop: '1.2rem',
            textAlign: 'center',
            fontSize: '0.82rem',
            color: '#8a95a8',
            textDecoration: 'underline',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/employer/dashboard')}
        >
          Back to dashboard
        </div>
      </div>
    </div>
  );
}
