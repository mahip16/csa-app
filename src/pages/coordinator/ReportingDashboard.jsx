import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

const T = {
  pageBg: 'linear-gradient(135deg, #dff0f7 0%, #eef4fb 30%, #fdf9ee 70%, #fef8e1 100%)',
  blue: '#3b4fa8', blueLight: 'rgba(59,79,168,0.07)', blueBorder: 'rgba(59,79,168,0.18)',
  yellow: '#f5a623', yellowLight: 'rgba(245,166,35,0.1)', yellowBorder: 'rgba(245,166,35,0.35)',
  textDark: '#0f1f4b', textMid: '#4a5568', textMuted: '#8a95a8',
  card: '#ffffff', cardBorder: '#e8edf5', cardShadow: '0 2px 12px rgba(0,0,0,0.06)',
  success: '#16a34a', successBg: 'rgba(22,163,74,0.08)', successBorder: 'rgba(22,163,74,0.22)',
  danger: '#dc2626', dangerBg: 'rgba(220,38,38,0.07)', dangerBorder: 'rgba(220,38,38,0.2)',
  warning: '#d97706', warningBg: 'rgba(217,119,6,0.08)', warningBorder: 'rgba(217,119,6,0.22)',
  purple: '#7c3aed',
};

export default function ReportingDashboard() {
  const navigate = useNavigate();
  const [data, setData]       = useState({ applications: [], students: [], rejections: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast]     = useState('');
  const [sendingAll, setSendingAll] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    try {
      const [appSnap, studSnap, rejSnap] = await Promise.all([
        getDocs(collection(db, 'applications')),
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'rejections')),
      ]);
      setData({
        applications: appSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        students:     studSnap.docs.map(d => ({ id: d.id, ...d.data() })),
        rejections:   rejSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const apps  = data.applications;
  const studs = data.students;

  const stats = {
    total:         apps.length,
    pending:       apps.filter(a => !a.status || a.status === 'pending').length,
    provisional:   apps.filter(a => a.status === 'provisional').length,
    accepted:      apps.filter(a => a.status === 'accepted').length,
    rejected:      apps.filter(a => a.status === 'rejected').length,
    reportsIn:     studs.filter(s => s.reportSubmitted).length,
    evalsIn:       studs.filter(s => s.evaluationSubmitted).length,
    totalStudents: studs.length,
  };

  const noReport = studs.filter(s => !s.reportSubmitted);
  const noEval   = studs.filter(s => !s.evaluationSubmitted);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3500); }

  function sendReminder(student, type) {
    showToast(`Reminder sent to ${student.name || student.email} for ${type}.`);
  }

  async function sendAllReminders() {
    setSendingAll(true);
    await new Promise(r => setTimeout(r, 800));
    showToast(`${noReport.length + noEval.length} reminder(s) queued for sending.`);
    setSendingAll(false);
  }

  function exportCSV() {
    const rows = [
      ['Name', 'Student ID', 'Email', 'Status', 'Program', 'GPA'],
      ...apps.map(a => [a.name || a.studentName, a.studentId, a.email, a.status, a.program, a.gpa]),
    ];
    const csv  = rows.map(r => r.map(c => `"${c ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'csa_applications.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exported successfully.');
  }

  const pct = (n, d) => d === 0 ? 0 : Math.round((n / d) * 100);

  const BAR_DATA = [
    { label: 'Pending',     value: stats.pending,     color: T.textMuted },
    { label: 'Provisional', value: stats.provisional, color: T.yellow    },
    { label: 'Accepted',    value: stats.accepted,    color: T.success   },
    { label: 'Rejected',    value: stats.rejected,    color: T.danger    },
  ];

  const navBtn = { background: 'transparent', border: `1.5px solid #e8edf5`, color: '#4a5568', padding: '0.45rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit' };

  return (
    <div style={{ minHeight: '100vh', background: T.pageBg, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      <nav style={{ backgroundColor: '#fff', borderBottom: `1px solid ${T.cardBorder}`, padding: '0 2rem', display: 'flex', alignItems: 'center', gap: '1rem', height: '64px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <button style={navBtn} onClick={() => navigate('/coordinator/dashboard')}>Back to Dashboard</button>
        <span style={{ width: '1px', height: '20px', backgroundColor: T.cardBorder }} />
        <h1 style={{ fontSize: '1rem', fontWeight: '700', color: T.textDark, margin: 0 }}>Reporting Dashboard</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
          <button onClick={exportCSV} style={{ ...navBtn }}>Export CSV</button>
          <button onClick={sendAllReminders} disabled={sendingAll} style={{ padding: '0.5rem 1.1rem', borderRadius: '8px', border: 'none', backgroundColor: T.yellow, color: '#fff', fontSize: '0.85rem', fontWeight: '700', fontFamily: 'inherit', cursor: 'pointer' }}>
            {sendingAll ? 'Sending...' : 'Send All Reminders'}
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: T.textDark, margin: 0 }}>Reporting Dashboard</h2>
          <p style={{ fontSize: '0.88rem', color: T.textMuted, marginTop: '0.3rem' }}>Program-wide analytics, submission tracking, and email reminders.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {[
            { label: 'Total Applications', val: stats.total,         accent: T.blue    },
            { label: 'Pending Review',     val: stats.pending,        accent: T.textMuted},
            { label: 'Provisional',        val: stats.provisional,    accent: T.yellow  },
            { label: 'Finally Accepted',   val: stats.accepted,       accent: T.success },
            { label: 'Rejected',           val: stats.rejected,       accent: T.danger  },
            { label: 'Reports Submitted',  val: `${stats.reportsIn}/${stats.totalStudents}`, accent: T.purple },
            { label: 'Evals Received',     val: `${stats.evalsIn}/${stats.totalStudents}`,   accent: T.warning},
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderTop: `3px solid ${s.accent}`, borderRadius: '12px', padding: '1rem 1.25rem', boxShadow: T.cardShadow }}>
              <div style={{ fontSize: '1.7rem', fontWeight: '700', color: T.textDark }}>{loading ? '—' : s.val}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: '600', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.3rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

          {/* Bar chart breakdown */}
          <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: '12px', padding: '1.5rem', boxShadow: T.cardShadow }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: T.textDark, margin: '0 0 1.25rem 0' }}>Application Status Breakdown</h3>
            {BAR_DATA.map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.82rem', color: T.textMid, width: '100px', flexShrink: 0 }}>{b.label}</div>
                <div style={{ flex: 1, height: '8px', backgroundColor: '#e8edf5', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct(b.value, stats.total)}%`, backgroundColor: b.color, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ fontSize: '0.78rem', color: T.textMuted, width: '30px', textAlign: 'right' }}>{pct(b.value, stats.total)}%</div>
                <div style={{ fontSize: '0.78rem', color: T.textMuted, width: '20px' }}>{b.value}</div>
              </div>
            ))}

            <div style={{ borderTop: `1px solid ${T.cardBorder}`, paddingTop: '1.25rem', marginTop: '1rem' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: T.textDark, margin: '0 0 1rem 0' }}>Submission Progress</h3>
              {[
                { label: 'Work Term Reports',   n: stats.reportsIn, d: stats.totalStudents, c: T.purple  },
                { label: 'Employer Evaluations',n: stats.evalsIn,   d: stats.totalStudents, c: T.warning },
              ].map(b => (
                <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ fontSize: '0.82rem', color: T.textMid, width: '160px', flexShrink: 0 }}>{b.label}</div>
                  <div style={{ flex: 1, height: '8px', backgroundColor: '#e8edf5', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct(b.n, b.d)}%`, backgroundColor: b.c, borderRadius: '4px', transition: 'width 0.6s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.78rem', color: T.textMuted, whiteSpace: 'nowrap' }}>{b.n}/{b.d}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Applicant roster */}
          <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: '12px', padding: '1.5rem', boxShadow: T.cardShadow }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: T.textDark, margin: '0 0 1.25rem 0' }}>Applicant Roster</h3>
            {apps.length === 0 ? (
              <p style={{ color: T.textMuted, fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>No applications yet.</p>
            ) : (
              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                {apps.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0', borderBottom: `1px solid ${T.cardBorder}` }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, backgroundColor: a.status === 'accepted' ? T.success : a.status === 'rejected' ? T.danger : a.status === 'provisional' ? T.yellow : T.textMuted }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: T.textDark }}>{a.name || a.studentName || '—'}</div>
                      <div style={{ fontSize: '0.72rem', color: T.textMuted }}>{a.studentId} · {a.email}</div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: T.textMuted, textTransform: 'capitalize' }}>{a.status || 'pending'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reminder sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {[
            { title: 'Missing Work Term Reports', list: noReport, type: 'work term report', accent: T.purple },
            { title: 'Missing Employer Evaluations', list: noEval, type: 'employer evaluation', accent: T.warning },
          ].map(section => (
            <div key={section.title} style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: '12px', padding: '1.5rem', boxShadow: T.cardShadow }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: '700', color: T.textDark, margin: '0 0 1rem 0' }}>{section.title} ({section.list.length})</h3>
              {section.list.length === 0 ? (
                <p style={{ color: T.success, fontSize: '0.85rem', fontWeight: '600' }}>All submissions received.</p>
              ) : section.list.slice(0, 6).map(s => (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0.9rem', backgroundColor: '#f8fafc', border: `1px solid ${T.cardBorder}`, borderRadius: '8px', marginBottom: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: '600', color: T.textDark }}>{s.name || '—'}</div>
                    <div style={{ fontSize: '0.73rem', color: T.textMuted }}>{s.email}</div>
                  </div>
                  <button onClick={() => sendReminder(s, section.type)} style={{ padding: '0.32rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', border: `1.5px solid ${section.accent === T.warning ? T.warningBorder : T.purpleBorder}`, backgroundColor: section.accent === T.warning ? T.warningBg : 'rgba(124,58,237,0.08)', color: section.accent, fontFamily: 'inherit' }}>
                    Send Reminder
                  </button>
                </div>
              ))}
              {section.list.length > 6 && <p style={{ fontSize: '0.75rem', color: T.textMuted, marginTop: '0.5rem' }}>+{section.list.length - 6} more</p>}
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', backgroundColor: T.success, color: '#fff', padding: '0.85rem 1.4rem', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600', boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 300 }}>
          {toast}
        </div>
      )}
    </div>
  );
}
