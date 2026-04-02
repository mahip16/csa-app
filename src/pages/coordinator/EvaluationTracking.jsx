import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

const T = {
  pageBg: 'linear-gradient(135deg, #dff0f7 0%, #eef4fb 30%, #fdf9ee 70%, #fef8e1 100%)',
  blue: '#3b4fa8', blueLight: 'rgba(59,79,168,0.07)', blueBorder: 'rgba(59,79,168,0.18)',
  yellow: '#f5a623', textDark: '#0f1f4b', textMid: '#4a5568', textMuted: '#8a95a8',
  card: '#ffffff', cardBorder: '#e8edf5', cardShadow: '0 2px 12px rgba(0,0,0,0.06)',
  success: '#16a34a', successBg: 'rgba(22,163,74,0.08)', successBorder: 'rgba(22,163,74,0.22)',
  danger: '#dc2626', dangerBg: 'rgba(220,38,38,0.07)', dangerBorder: 'rgba(220,38,38,0.2)',
  warning: '#d97706', warningBg: 'rgba(217,119,6,0.08)', warningBorder: 'rgba(217,119,6,0.22)',
  purple: '#7c3aed', purpleBg: 'rgba(124,58,237,0.08)', purpleBorder: 'rgba(124,58,237,0.2)',
};

function Badge({ type, children }) {
  const map = {
    success: { bg: T.successBg, border: T.successBorder, color: T.success },
    danger:  { bg: T.dangerBg,  border: T.dangerBorder,  color: T.danger  },
    warning: { bg: T.warningBg, border: T.warningBorder, color: T.warning  },
    muted:   { bg: '#f1f3f7',   border: '#dde3ed',        color: T.textMuted },
  };
  const c = map[type] || map.muted;
  return (
    <span style={{ display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
      {children}
    </span>
  );
}

function PdfModal({ url, name, onClose }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,31,75,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '1.5rem' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ backgroundColor: '#fff', borderRadius: '14px', width: '100%', maxWidth: '900px', height: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 48px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${T.cardBorder}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.purple} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <span style={{ fontSize: '0.92rem', fontWeight: '700', color: T.textDark }}>{name || 'Document'}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <a href={url} target="_blank" rel="noopener noreferrer"
              style={{ padding: '0.4rem 0.9rem', borderRadius: '7px', fontSize: '0.8rem', fontWeight: '600', border: `1.5px solid ${T.purpleBorder}`, backgroundColor: T.purpleBg, color: T.purple, textDecoration: 'none' }}>
              Open in new tab ↗
            </a>
            <button onClick={onClose}
              style={{ padding: '0.4rem 0.9rem', borderRadius: '7px', fontSize: '0.8rem', fontWeight: '600', border: `1.5px solid ${T.cardBorder}`, backgroundColor: 'transparent', color: T.textMid, cursor: 'pointer', fontFamily: 'inherit' }}>
              Close
            </button>
          </div>
        </div>
        <iframe src={url} title={name || 'PDF'} style={{ flex: 1, border: 'none', width: '100%' }} />
      </div>
    </div>
  );
}

export default function EvaluationTracking() {
  const navigate = useNavigate();
  const [students,    setStudents]    = useState([]);
  const [evalsByName, setEvalsByName] = useState({}); // map: studentName.toLowerCase() → evaluation doc
  const [loading,     setLoading]     = useState(true);
  const [activeTab,   setActiveTab]   = useState('reports');
  const [search,      setSearch]      = useState('');
  const [pdfModal,    setPdfModal]    = useState(null); // { url, name } | null

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      // Fetch students from users collection
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers  = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(allUsers.filter(u => u.role === 'student'));

      // Fetch all evaluations and index by studentName (lowercased) for easy lookup
      const evalsSnap = await getDocs(collection(db, 'evaluations'));
      const map = {};
      evalsSnap.docs.forEach(d => {
        const data = d.data();
        const key  = (data.studentName || '').toLowerCase().trim();
        if (key) map[key] = { id: d.id, ...data };
      });
      setEvalsByName(map);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function markSubmitted(studentId, field) {
    try {
      await updateDoc(doc(db, 'users', studentId), { [field]: true, updatedAt: serverTimestamp() });
      setStudents(prev => prev.map(s => s.id === studentId ? { ...s, [field]: true } : s));
    } catch (err) { console.error(err); }
  }

  const filtered = students.filter(s =>
    !search || [s.name, s.studentId, s.email].join(' ').toLowerCase().includes(search.toLowerCase())
  );

  const total       = students.length;
  const withReports = students.filter(s => s.reportSubmitted).length;
  // For evaluations received, count students who have a matching evaluation doc
  const withEvals   = students.filter(s => evalsByName[(s.name || '').toLowerCase().trim()]).length;

  const pct = (n, d) => d === 0 ? 0 : Math.round((n / d) * 100);

  const isReportTab  = activeTab === 'reports';
  const submittedKey = isReportTab ? 'reportSubmitted' : 'evaluationSubmitted';
  const deadlineKey  = isReportTab ? 'reportDeadline'  : 'evaluationDeadline';
  const urlKey       = isReportTab ? 'reportUrl'       : 'evaluationUrl';
  const nameKey      = isReportTab ? 'reportName'      : 'evaluationName';

  function isOverdue(s) {
    const dl = s[deadlineKey];
    if (!dl) return false;
    const date = dl?.toDate ? dl.toDate() : new Date(dl);
    return !s[submittedKey] && date < new Date();
  }

  const navBtn = { background: 'transparent', border: `1.5px solid #e8edf5`, color: '#4a5568', padding: '0.45rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit' };

  const STATS = [
    { label: 'Active Students',      value: total,                                                                                             accent: T.blue    },
    { label: 'Reports Submitted',    value: `${withReports} / ${total}`,                                                                       accent: T.success },
    { label: 'Evaluations Received', value: `${withEvals} / ${total}`,                                                                         accent: '#7c3aed' },
    { label: 'Outstanding Items',    value: students.filter(s => !s.reportSubmitted || !evalsByName[(s.name || '').toLowerCase().trim()]).length, accent: T.danger  },
  ];

  return (
    <div style={{ minHeight: '100vh', background: T.pageBg, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      <nav style={{ backgroundColor: '#fff', borderBottom: `1px solid ${T.cardBorder}`, padding: '0 2rem', display: 'flex', alignItems: 'center', gap: '1rem', height: '64px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <button style={navBtn} onClick={() => navigate('/coordinator/dashboard')}>Back to Dashboard</button>
        <span style={{ width: '1px', height: '20px', backgroundColor: T.cardBorder }} />
        <h1 style={{ fontSize: '1rem', fontWeight: '700', color: T.textDark, margin: 0 }}>Evaluation Tracking</h1>
        <div style={{ marginLeft: 'auto' }}>
          <input
            style={{ backgroundColor: '#f8fafc', border: '1.5px solid #dde3ed', color: T.textDark, borderRadius: '8px', padding: '0.5rem 0.9rem', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none', width: '240px' }}
            placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
      </nav>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: T.textDark, margin: 0 }}>Evaluation Tracking</h2>
          <p style={{ fontSize: '0.88rem', color: T.textMuted, marginTop: '0.3rem' }}>Monitor student report and employer evaluation submissions.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderTop: `3px solid ${s.accent}`, borderRadius: '12px', padding: '1.1rem 1.4rem', boxShadow: T.cardShadow }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: T.textDark }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.3rem' }}>{s.label}</div>
              {(s.label === 'Reports Submitted' || s.label === 'Evaluations Received') && (
                <div style={{ marginTop: '0.6rem', height: '4px', backgroundColor: '#e8edf5', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct(parseInt(s.value), total)}%`, backgroundColor: s.accent, borderRadius: '2px', transition: 'width 0.6s ease' }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: `2px solid ${T.cardBorder}` }}>
          {[{ key: 'reports', label: 'Work Term Reports' }, { key: 'evaluations', label: 'Employer Evaluations' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              style={{ padding: '0.65rem 1.4rem', fontSize: '0.88rem', fontWeight: '600', cursor: 'pointer', border: 'none', background: 'transparent', fontFamily: 'inherit', color: activeTab === t.key ? T.blue : T.textMuted, borderBottom: activeTab === t.key ? `2px solid ${T.blue}` : '2px solid transparent', marginBottom: '-2px', transition: 'color 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderTop: 'none', borderRadius: '0 0 12px 12px', boxShadow: T.cardShadow, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f7fb' }}>
                {['Student', 'Student ID', 'Employer', 'Deadline', isReportTab ? 'Report Status' : 'Eval Status', 'PDF', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1.1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: T.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${T.cardBorder}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: T.textMuted, fontSize: '0.88rem' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: T.textMuted, fontSize: '0.88rem' }}>No students found.</td></tr>
              ) : filtered.map((s, i) => {
                const submitted = s[submittedKey];
                const overdue   = isOverdue(s);
                const deadline  = s[deadlineKey];
                const dlStr     = deadline?.toDate ? deadline.toDate().toLocaleDateString() : deadline || '—';

                // For the reports tab: read PDF from the student's user doc (reportUrl/reportName)
                // For the evaluations tab: look up the matching evaluation doc by student name
                let pdfUrl, pdfName;
                if (isReportTab) {
                  pdfUrl  = s[urlKey];
                  pdfName = s[nameKey] || 'work-term-report.pdf';
                } else {
                  const evalDoc = evalsByName[(s.name || '').toLowerCase().trim()];
                  pdfUrl  = evalDoc?.pdfUrl  || null;
                  pdfName = evalDoc?.pdfName || 'employer-evaluation.pdf';
                }

                return (
                  <tr key={s.id}
                    style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.cardBorder}` : 'none' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f7f9ff'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                  >
                    <td style={{ padding: '0.9rem 1.1rem' }}>
                      <div style={{ fontWeight: '600', color: T.textDark, fontSize: '0.88rem' }}>{s.name || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: T.textMuted }}>{s.email}</div>
                    </td>
                    <td style={{ padding: '0.9rem 1.1rem', fontSize: '0.85rem', color: T.textMuted, fontFamily: 'monospace' }}>{s.studentId || '—'}</td>
                    <td style={{ padding: '0.9rem 1.1rem', fontSize: '0.85rem', color: T.textMuted }}>{s.employer || '—'}</td>
                    <td style={{ padding: '0.9rem 1.1rem', fontSize: '0.85rem', color: overdue ? T.danger : T.textMuted }}>
                      {dlStr}
                      {overdue && <div style={{ fontSize: '0.72rem', color: T.danger, marginTop: '0.15rem', fontWeight: '600' }}>Overdue</div>}
                    </td>
                    <td style={{ padding: '0.9rem 1.1rem' }}>
                      {/* For evaluations tab, derive submitted status from the evaluations collection */}
                      {isReportTab ? (
                        <Badge type={submitted ? 'success' : overdue ? 'danger' : 'warning'}>
                          {submitted ? 'Submitted' : overdue ? 'Overdue' : 'Pending'}
                        </Badge>
                      ) : (
                        <Badge type={pdfUrl ? 'success' : overdue ? 'danger' : 'warning'}>
                          {pdfUrl ? 'Received' : overdue ? 'Overdue' : 'Pending'}
                        </Badge>
                      )}
                    </td>

                    {/* PDF column — now reads from evaluations collection for the Evaluations tab */}
                    <td style={{ padding: '0.9rem 1.1rem' }}>
                      {pdfUrl ? (
                        <button
                          onClick={() => setPdfModal({ url: pdfUrl, name: pdfName })}
                          style={{ padding: '0.32rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', border: `1.5px solid ${T.purpleBorder}`, backgroundColor: T.purpleBg, color: T.purple, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                          View PDF
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: T.textMuted, fontStyle: 'italic' }}>No file</span>
                      )}
                    </td>

                    {/* Actions column */}
                    <td style={{ padding: '0.9rem 1.1rem' }}>
                      {isReportTab ? (
                        !submitted ? (
                          <button
                            onClick={() => markSubmitted(s.id, submittedKey)}
                            style={{ padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600', cursor: 'pointer', border: `1.5px solid ${T.blueBorder}`, backgroundColor: T.blueLight, color: T.blue, fontFamily: 'inherit' }}
                          >
                            Mark Received
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.82rem', color: T.success, fontWeight: '600' }}>✓ Received</span>
                        )
                      ) : (
                        // For evaluations tab, status is driven by the evaluations collection — no manual override needed
                        pdfUrl ? (
                          <span style={{ fontSize: '0.82rem', color: T.success, fontWeight: '600' }}>✓ Received</span>
                        ) : (
                          <span style={{ fontSize: '0.82rem', color: T.textMuted }}>Awaiting submission</span>
                        )
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {pdfModal && <PdfModal url={pdfModal.url} name={pdfModal.name} onClose={() => setPdfModal(null)} />}
    </div>
  );
}