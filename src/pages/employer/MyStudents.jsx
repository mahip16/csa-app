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
  const [evaluatedNames, setEvaluatedNames] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Students are in the 'users' collection with role === 'student'
      // If your app sets employerId on the student doc, filter by that too.
      // For now we show all students (coordinator assigns them) — adjust the
      // query below if you add an employerId field to student user docs.
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      );

      // Also fetch evaluations this employer has submitted so we can show status
      const evalsQuery = query(
        collection(db, 'evaluations'),
        where('employerId', '==', user.uid)
      );

      const [studentSnap, evalSnap] = await Promise.all([
        getDocs(studentsQuery),
        getDocs(evalsQuery),
      ]);

      const studentData = studentSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Build a set of student names this employer has already evaluated
      const evaluated = new Set(
        evalSnap.docs.map(d => (d.data().studentName || '').toLowerCase().trim())
      );

      setStudents(studentData);
      setEvaluatedNames(evaluated);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function isEvaluated(student) {
    return evaluatedNames.has((student.name || '').toLowerCase().trim());
  }

  const navBtn = {
    background: 'transparent',
    border: `1.5px solid #e8edf5`,
    color: '#4a5568',
    padding: '0.45rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', background: T.pageBg, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ backgroundColor: '#fff', borderBottom: `1px solid ${T.cardBorder}`, padding: '0 2rem', display: 'flex', alignItems: 'center', gap: '1rem', height: '64px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <button style={navBtn} onClick={() => navigate('/employer/dashboard')}>
          Back to Dashboard
        </button>
        <span style={{ width: '1px', height: '20px', backgroundColor: T.cardBorder }} />
        <h1 style={{ fontSize: '1rem', fontWeight: '700', color: T.textDark, margin: 0 }}>
          My Students
        </h1>
        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: T.textMuted }}>
          {students.length} student{students.length !== 1 ? 's' : ''}
        </span>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>

        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: T.textDark, margin: 0 }}>
            My Students
          </h2>
          <p style={{ fontSize: '0.88rem', color: T.textMuted, marginTop: '0.3rem' }}>
            View and submit evaluations for co-op students.
          </p>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
          {[
            { label: 'Total Students',      value: students.length,                                      accent: T.blue    },
            { label: 'Evaluated',           value: students.filter(isEvaluated).length,                  accent: T.success },
            { label: 'Awaiting Evaluation', value: students.filter(s => !isEvaluated(s)).length,         accent: T.warning },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderTop: `3px solid ${s.accent}`, borderRadius: '12px', padding: '1.1rem 1.4rem', boxShadow: T.cardShadow }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: T.textDark }}>{loading ? '—' : s.value}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.3rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Student list */}
        <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: '12px', boxShadow: T.cardShadow, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f7fb' }}>
                {['Student', 'Student ID', 'Email', 'Program', 'Eval Status', 'Action'].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1.1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: T.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${T.cardBorder}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: T.textMuted, fontSize: '0.88rem' }}>
                    Loading students...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: T.textMuted, fontSize: '0.88rem' }}>
                    No students found.
                  </td>
                </tr>
              ) : students.map((student, i) => {
                const evaluated = isEvaluated(student);
                return (
                  <tr key={student.id}
                    style={{ borderBottom: i < students.length - 1 ? `1px solid ${T.cardBorder}` : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f7f9ff'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>

                    <td style={{ padding: '0.9rem 1.1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: T.blueLight, border: `1.5px solid ${T.blueBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', color: T.blue, fontSize: '0.9rem', flexShrink: 0 }}>
                          {(student.name || '?')[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: '600', color: T.textDark, fontSize: '0.88rem' }}>
                          {student.name || 'Unknown'}
                        </span>
                      </div>
                    </td>

                    <td style={{ padding: '0.9rem 1.1rem', fontSize: '0.85rem', color: T.textMuted, fontFamily: 'monospace' }}>
                      {student.studentId || '—'}
                    </td>

                    <td style={{ padding: '0.9rem 1.1rem', fontSize: '0.85rem', color: T.textMuted }}>
                      {student.email || '—'}
                    </td>

                    <td style={{ padding: '0.9rem 1.1rem', fontSize: '0.85rem', color: T.textMuted }}>
                      {student.program || '—'}
                    </td>

                    <td style={{ padding: '0.9rem 1.1rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        backgroundColor: evaluated ? T.successBg : T.warningBg,
                        border: `1px solid ${evaluated ? T.successBorder : T.warningBorder}`,
                        color: evaluated ? T.success : T.warning,
                      }}>
                        {evaluated ? 'Evaluated' : 'Pending'}
                      </span>
                    </td>

                    <td style={{ padding: '0.9rem 1.1rem' }}>
                      <button
                        onClick={() => navigate(`/employer/evaluation?studentName=${encodeURIComponent(student.name || '')}`)}
                        style={{
                          padding: '0.4rem 0.9rem',
                          borderRadius: '7px',
                          border: evaluated ? `1.5px solid ${T.cardBorder}` : 'none',
                          backgroundColor: evaluated ? 'transparent' : T.blue,
                          color: evaluated ? T.textMid : '#fff',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {evaluated ? 'Re-evaluate' : 'Evaluate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}