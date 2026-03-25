import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { db, auth } from '../../firebase/firebase';
import { onAuthStateChanged } from 'firebase/auth';

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

const NAV_PAGES = [
  { label: 'Online Evaluation',   sub: 'Submit digital evaluation form for student',    accent: T.blue,    path: '/employer/evaluations', icon: <ReportIcon /> },
  { label: 'Submit Paper Evaluation',  sub: 'Scan paper report evaluations',        accent: T.success, path: '/coordinator/evaluations',  icon: <ClipboardIcon /> },
  //{ label: 'Final Decisions',      sub: 'Confirm accepted students',           accent: T.purple,  path: '/coordinator/final-decisions', icon: <CheckIcon /> },
  //{ label: 'Rejection Tracking',   sub: 'Track rejected placements',           accent: T.danger,  path: '/coordinator/rejections',   icon: <XIcon /> },
  //{ label: 'Reporting Dashboard',  sub: 'Analytics and email reminders',       accent: T.yellow,  path: '/coordinator/reporting',    icon: <ReportIcon /> },
];

function ClipboardIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M17 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>;
}
function ChartIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}
function CheckIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>;
}
function XIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
}
function ReportIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}

function StatCard({ label, value, accent, loading }) {
  return (
    <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderTop: `3px solid ${accent}`, borderRadius: '12px', padding: '1.25rem 1.5rem', boxShadow: T.cardShadow }}>
      <div style={{ fontSize: '2rem', fontWeight: '700', color: T.textDark, lineHeight: 1 }}>{loading ? '—' : value}</div>
      <div style={{ fontSize: '0.78rem', fontWeight: '600', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.4rem' }}>{label}</div>
    </div>
  );
}

function Badge({ type, children }) {
  const map = {
    success: { bg: T.successBg, border: T.successBorder, color: T.success },
    danger:  { bg: T.dangerBg,  border: T.dangerBorder,  color: T.danger  },
    warning: { bg: T.warningBg, border: T.warningBorder, color: T.warning  },
    blue:    { bg: T.blueLight, border: T.blueBorder,     color: T.blue    },
  };
  const c = map[type] || { bg: '#f1f3f7', border: '#dde3ed', color: T.textMuted };
  return (
    <span style={{ display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
      {children}
    </span>
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
    if (user) {
      fetchStats();
    }
  }, [user]);

  async function fetchStats() {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'students'),
        where('employerId', '==', user.uid)
      );

      const [appSnap, studSnap] = await Promise.all([
        getDocs(q)        
      ]);
      //const apps  = appSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const studs = studSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStats({
        total:         studs.length,
        pendingEvals:   studs.filter(s => !s.evaluationSubmitted).length,
        submittedEvals: studs.filter(s => s.evaluationSubmitted).length,
        //rejected:      apps.filter(a => a.status === 'rejected').length,
        //pendingReports: studs.filter(s => !s.reportSubmitted).length,
        //pendingEvals:   studs.filter(s => !s.evaluationSubmitted).length,
      });
      const sorted = [...apps]
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 6)
        .map(a => ({
          name: a.name || a.studentName || 'Unknown',
          action: a.status === 'accepted' ? 'Final acceptance granted' : a.status === 'provisional' ? 'Provisionally accepted' : a.status === 'rejected' ? 'Application rejected' : 'Application submitted',
          type: a.status === 'accepted' ? 'success' : a.status === 'provisional' ? 'blue' : a.status === 'rejected' ? 'danger' : 'warning',
          time: a.createdAt?.toDate ? a.createdAt.toDate().toLocaleDateString() : 'Recently',
        }));
      setRecentActivity(sorted);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function handleLogout() {
    await signOut(auth);
    navigate('/employer/login');
  }

  const STATS = [
    { label: 'My Students',            value: stats.total,         accent: T.blue   },
    { label: 'Evaluations Submitted',  value: stats.submittedEvals,   accent: T.success },
    { label: 'Evaluations Pending',       value: stats.pendingEvals, accent: T.warning},
    //{ label: 'Rejected',               value: stats.rejected,      accent: T.danger },
    //{ label: 'Reports Pending',        value: stats.pendingReports,accent: T.purple },
    //{ label: 'Evaluations Pending',    value: stats.pendingEvals,  accent: T.warning},
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.pageBg, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ backgroundColor: '#fff', borderBottom: `1px solid ${T.cardBorder}`, padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: T.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
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
              <span style={{ fontSize: '0.75rem', color: T.textMuted }}>Latest changes</span>
            </div>
            {recentActivity.length === 0 && !loading ? (
              <p style={{ textAlign: 'center', color: T.textMuted, fontSize: '0.85rem', padding: '2rem 0' }}>No recent activity.</p>
            ) : recentActivity.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: i < recentActivity.length - 1 ? `1px solid ${T.cardBorder}` : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, backgroundColor: a.type === 'success' ? T.success : a.type === 'danger' ? T.danger : a.type === 'blue' ? T.blue : T.warning }} />
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
                <div key={p.path} onClick={() => navigate(p.path)}
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
        {(stats.submittedEvals > 0 || stats.pendingEvals > 0) && (
          <div style={{ backgroundColor: 'rgba(217,119,6,0.07)', border: `1px solid rgba(217,119,6,0.25)`, borderRadius: '10px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.warning} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <p style={{ fontSize: '0.85rem', color: T.warning, margin: 0, flex: 1 }}>
              {stats.pendingReports > 0 && <><strong>{stats.pendingReports}</strong> student(s) have not submitted their work term report. </>}
              {stats.pendingEvals > 0 && <><strong>{stats.pendingEvals}</strong> employer evaluation(s) are outstanding.</>}
            </p>
            <button onClick={() => navigate('/employer/reporting')} style={{ padding: '0.45rem 1rem', borderRadius: '7px', border: `1.5px solid rgba(217,119,6,0.35)`, backgroundColor: 'rgba(217,119,6,0.1)', color: T.warning, fontSize: '0.82rem', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer' }}>
              Send Reminders
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
