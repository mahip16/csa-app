import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';

const T = {
  pageBg: 'linear-gradient(135deg, #dff0f7 0%, #eef4fb 30%, #fdf9ee 70%, #fef8e1 100%)',
  blue: '#3b4fa8', blueLight: 'rgba(59,79,168,0.07)', blueBorder: 'rgba(59,79,168,0.18)',
  yellow: '#f5a623', textDark: '#0f1f4b', textMid: '#4a5568', textMuted: '#8a95a8',
  card: '#ffffff', cardBorder: '#e8edf5', cardShadow: '0 2px 12px rgba(0,0,0,0.06)',
  success: '#16a34a', successBg: 'rgba(22,163,74,0.08)', successBorder: 'rgba(22,163,74,0.22)',
  warning: '#d97706', warningBg: 'rgba(217,119,6,0.08)', warningBorder: 'rgba(217,119,6,0.22)',
  purple: '#7c3aed'
};

export default function MyStudents() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, 'students'),
        where('employerId', '==', user.uid)
      );

      const snap = await getDocs(q);

      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setStudents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const navBtn = {
    background: 'transparent',
    border: `1.5px solid #e8edf5`,
    color: '#4a5568',
    padding: '0.45rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600'
  };

  const SectionDivider = ({ label, count, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.75rem 0 1rem 0' }}>
      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', backgroundColor: T.cardBorder }} />
      <span style={{
        fontSize: '0.8rem',
        fontWeight: '700',
        color,
        backgroundColor: T.blueLight,
        border: `1px solid ${T.blueBorder}`,
        padding: '0.1rem 0.6rem',
        borderRadius: '20px'
      }}>
        {count}
      </span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: T.pageBg, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* Navbar */}
      <nav style={{
        backgroundColor: '#fff',
        borderBottom: `1px solid ${T.cardBorder}`,
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        height: '64px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
      }}>
        <button style={navBtn} onClick={() => navigate('/employer/dashboard')}>
          Back to Dashboard
        </button>

        <span style={{ width: '1px', height: '20px', backgroundColor: T.cardBorder }} />

        <h1 style={{ fontSize: '1rem', fontWeight: '700', color: T.textDark, margin: 0 }}>
          My Students
        </h1>

        {/* <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: T.textMuted }}>
          {students.length} students
        </span> */}
      </nav>

      {/* Content */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: T.textDark, margin: 0 }}>
            My Students
          </h2>
          <p style={{ fontSize: '0.88rem', color: T.textMuted, marginTop: '0.3rem' }}>
            View and manage students assigned to your organization.
          </p>
        </div>

        {/* List */}
        <SectionDivider label="My Students" count={students.length} color={T.blue} />

        {!loading && students.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: T.textMuted,
            backgroundColor: T.card,
            border: `1px solid ${T.cardBorder}`,
            borderRadius: '12px'
          }}>
            No students assigned to you yet.
          </div>
        )}

        {students.map(student => (
          <div key={student.id} style={{
            backgroundColor: T.card,
            border: `1px solid ${T.cardBorder}`,
            borderRadius: '10px',
            padding: '0.65rem 1rem',
            marginBottom: '0.6rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            boxShadow: T.cardShadow
          }}>

            {/* Avatar */}
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: T.blueLight,
              border: `1.5px solid ${T.blueBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              color: T.blue
            }}>
              {(student.name || '?')[0].toUpperCase()}
            </div>

            {/* Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', color: T.textDark }}>
                {student.name || 'Unknown'}
              </div>

              <div style={{
                fontSize: '0.75rem',
                color: T.textMuted,
                marginTop: '0.15rem',
                display: 'flex',
                gap: '1rem'
              }}>
                <span>{student.studentId}</span>
                <span>{student.email}</span>
                {student.program && <span>{student.program}</span>}
              </div>
            </div>

            Status
            <span style={{
              padding: '0.25rem 0.7rem',
              borderRadius: '20px',
              fontSize: '0.7rem',
              fontWeight: '700',
              backgroundColor: student.evaluationSubmitted ? T.successBg : T.warningBg,
              border: `1px solid ${student.evaluationSubmitted ? T.successBorder : T.warningBorder}`,
              color: student.evaluationSubmitted ? T.success : T.warning
            }}>
              {student.evaluationSubmitted ? 'Evaluated' : 'Pending'}
            </span>

            {/* Action */}
            <button
              onClick={() => navigate(`/employer/evaluations?studentId=${student.id}`)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: T.blue,
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Evaluate
            </button>
          </div>
        ))}

      </div>
    </div>
  );
}