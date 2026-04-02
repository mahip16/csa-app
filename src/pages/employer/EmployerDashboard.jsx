import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebase/firebase';

const T = {
  pageBg: 'linear-gradient(135deg, #dff0f7 0%, #eef4fb 30%, #fdf9ee 70%, #fef8e1 100%)',
  blue: '#3b4fa8', blueLight: 'rgba(59,79,168,0.07)', blueBorder: 'rgba(59,79,168,0.18)',
  yellow: '#f5a623', yellowLight: 'rgba(245,166,35,0.1)', yellowBorder: 'rgba(245,166,35,0.35)',
  textDark: '#0f1f4b', textMid: '#4a5568', textMuted: '#8a95a8',
  card: '#ffffff', cardBorder: '#e8edf5', cardShadow: '0 2px 12px rgba(0,0,0,0.06)',
  success: '#16a34a', successBg: 'rgba(22,163,74,0.08)', successBorder: 'rgba(22,163,74,0.22)',
  danger: '#dc2626', dangerBg: 'rgba(220,38,38,0.07)', dangerBorder: 'rgba(220,38,38,0.2)',
  warning: '#d97706', warningBg: 'rgba(217,119,6,0.08)', warningBorder: 'rgba(217,119,6,0.22)',
  purple: '#7c3aed', purpleBg: 'rgba(124,58,237,0.08)', purpleBorder: 'rgba(124,58,237,0.2)',
};

function ClipboardIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M17 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>;
}
function CheckIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function ReportIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}

// Fixed: unique paths — "Submit Paper Evaluation" deep-links to ?mode=pdf
// Fixed: key by label so React never sees duplicate keys
const NAV_PAGES = [
  { label: 'Online Evaluation',       sub: 'Submit digital evaluation form for student', accent: T.blue,    path: '/employer/evaluation',          icon: <ReportIcon /> },
  { label: 'Submit Paper Evaluation', sub: 'Scan paper report evaluations',              accent: T.success, path: '/employer/evaluation?mode=pdf', icon: <ClipboardIcon /> },
  { label: 'View Students',           sub: 'Review list of co-op students',              accent: T.purple,  path: '/employer/my-students',         icon: <CheckIcon /> },
];

function StatCard({ label, value, accent, loading }) {
  return (
    <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderTop: `3px solid ${accent}`, borderRadius: '12px', padding: '1.25rem 1.5rem', boxShadow: T.cardShadow }}>
      <div style={{ fontSize: '2rem', fontWeight: '700', color: T.textDark, lineHeight: 1 }}>{loading ? '—' : value}</div>
      <div style={{ fontSize: '0.78rem', fontWeight: '600', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.4rem' }}>{label}</div>
    </div>
  );
}

export default function EmployerDashboard() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, submittedEvals: 0, pendingEvals: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        navigate('/employer/login');
      } else {
        setUser(u);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  async function fetchStats() {
    if (!user) return;
    try {
      // Fixed: query 'evaluations' filtered by employerId (now saved by EvaluationForm)
      // Fixed: query 'users' with role='student' — there is no separate 'students' collection
      const evalsQuery = query(
        collection(db, 'evaluations'),
        where('employerId', '==', user.uid)
      );
      const studentsQuery = query(
        collection(db, 'users'),
        where('role', '==', 'student')
      );

      const [evalSnap, studentSnap] = await Promise.all([
        getDocs(evalsQuery),
        getDocs(studentsQuery),
      ]);

      const evals = evalSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const students = studentSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const evaluatedNames = new Set(evals.map(e => e.studentName?.toLowerCase().trim()));

      setStats({
        total: students.length,
        submittedEvals: evals.length,
        pendingEvals: Math.max(0, students.length - evaluatedNames.size),
      });

      // Recent activity = most recent evaluations this employer submitted
      const sorted = [...evals]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 6)
        .map(e => ({
          name: e.studentName || 'Unknown',
          action: e.submissionType === 'pdf' ? 'PDF evaluation submitted' : 'Online evaluation submitted',
          time: e.createdAt ? new Date(e.createdAt).toLocaleDateString() : 'Recently',
        }));

      setRecentActivity(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
    navigate('/employer/login');
  }

  const STATS = [
    { label: 'My Students',           value: stats.total,          accent: T.blue    },
    { label: 'Evaluations Submitted', value: stats.submittedEvals, accent: T.success },
    { label: 'Evaluations Pending',   value: stats.pendingEvals,   accent: T.warning },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.pageBg, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ backgroundColor: '#fff', borderBottom: `1px solid ${T.cardBorder}`, padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgb(238, 242, 251)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg fill="#3b4fa8" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="20px" height="20px" stroke="#3b4fa8" strokeWidth="9.728">
              <g><g><path d="M470.948,481.583V0H41.052v481.583H15.209V512h25.842H184.52H327.48h143.468h25.842v-30.417H470.948z M240.791,481.583 h-25.855v-70.117h25.855V481.583z M297.063,481.583h-25.855v-70.117h25.855V481.583z M440.531,481.583H327.48V381.049H184.52 v100.534H71.469V30.417h369.062V481.583z"/></g></g>
              <g><g><rect x="100.114" y="56.779" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="156.386" y="56.779" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="212.657" y="56.779" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="100.114" y="120.32" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="156.386" y="120.32" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="212.657" y="120.32" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="268.929" y="56.779" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="325.201" y="56.779" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="268.929" y="120.32" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="325.201" y="120.32" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="381.473" y="56.779" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="381.473" y="120.32" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="100.114" y="183.852" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="156.386" y="183.852" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="212.657" y="183.852" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="268.929" y="183.852" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="325.201" y="183.852" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="381.473" y="183.852" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="100.114" y="247.393" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="156.386" y="247.393" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="212.657" y="247.393" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="268.929" y="247.393" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="325.201" y="247.393" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="381.473" y="247.393" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="100.114" y="310.935" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="156.386" y="310.935" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="212.657" y="310.935" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="268.929" y="310.935" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="325.201" y="310.935" width="30.417" height="35.821"/></g></g>
              <g><g><rect x="381.473" y="310.935" width="30.417" height="35.821"/></g></g>
            </svg>
          </div>
          <span style={{ fontSize: '1rem', fontWeight: '700', color: T.textDark }}>Co-op Employer Portal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.82rem', color: T.textMuted }}>{new Date().toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          <button onClick={handleLogout} style={{ padding: '0.45rem 1.1rem', borderRadius: '8px', border: `1.5px solid ${T.cardBorder}`, backgroundColor: 'transparent', color: T.textMid, fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: T.textDark, margin: 0 }}>Dashboard</h1>
          <p style={{ fontSize: '0.9rem', color: T.textMuted, marginTop: '0.3rem' }}>Welcome back — here is your program overview.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {STATS.map(s => <StatCard key={s.label} {...s} loading={loading} />)}
        </div>

        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

          {/* Recent Activity */}
          <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: '12px', padding: '1.5rem', boxShadow: T.cardShadow }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: T.textDark, margin: 0 }}>Recent Activity</h2>
              <span style={{ fontSize: '0.75rem', color: T.textMuted }}>Latest submissions</span>
            </div>
            {recentActivity.length === 0 && !loading ? (
              <p style={{ textAlign: 'center', color: T.textMuted, fontSize: '0.85rem', padding: '2rem 0' }}>No evaluations submitted yet.</p>
            ) : recentActivity.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: i < recentActivity.length - 1 ? `1px solid ${T.cardBorder}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, backgroundColor: T.success }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: T.textDark }}>{a.name}</div>
                    <div style={{ fontSize: '0.75rem', color: T.textMuted }}>{a.action}</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', color: T.textMuted }}>{a.time}</span>
              </div>
            ))}
          </div>

          {/* Quick Navigation */}
          <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: '12px', padding: '1.5rem', boxShadow: T.cardShadow }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '700', color: T.textDark, margin: '0 0 1.25rem 0' }}>Quick Navigation</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {NAV_PAGES.map(p => (
                <div key={p.label} onClick={() => navigate(p.path)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', border: `1px solid ${T.cardBorder}`, borderLeft: `3px solid ${p.accent}`, borderRadius: '8px', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f4ff'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f8fafc'}>
                  <span style={{ color: p.accent }}>{p.icon}</span>
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: T.textDark }}>{p.label}</div>
                    <div style={{ fontSize: '0.73rem', color: T.textMuted }}>{p.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alert banner */}
        {stats.pendingEvals > 0 && (
          <div style={{ backgroundColor: 'rgba(217,119,6,0.07)', border: `1px solid rgba(217,119,6,0.25)`, borderRadius: '10px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p style={{ fontSize: '0.85rem', color: T.warning, margin: 0, flex: 1 }}>
              <strong>{stats.pendingEvals}</strong> student evaluation(s) may still be outstanding.
            </p>
            <button onClick={() => navigate('/employer/evaluation')} style={{ padding: '0.45rem 1rem', borderRadius: '7px', border: `1.5px solid rgba(217,119,6,0.35)`, backgroundColor: 'rgba(217,119,6,0.1)', color: T.warning, fontSize: '0.82rem', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer' }}>
              Submit Evaluation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}