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
};

function Badge({ type, children }) {
  const map = {
    success: { bg: T.successBg, border: T.successBorder, color: T.success },
    danger:  { bg: T.dangerBg,  border: T.dangerBorder,  color: T.danger  },
    warning: { bg: T.warningBg, border: T.warningBorder, color: T.warning  },
    blue:    { bg: T.blueLight, border: T.blueBorder,     color: T.blue    },
    muted:   { bg: '#f1f3f7',   border: '#dde3ed',        color: T.textMuted },
  };
  const c = map[type] || map.muted;
  return (
    <span style={{ display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
      {children}
    </span>
  );
}

const STATUS_FILTERS = ['all', 'pending', 'provisional', 'accepted', 'rejected'];
function statusType(s) {
  return s === 'accepted' ? 'success' : s === 'provisional' ? 'blue' : s === 'rejected' ? 'danger' : 'warning';
}

export default function ApplicationReview() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('all');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState(null);
  const [actionType, setActionType] = useState('');
  const [notes, setNotes]         = useState('');
  const [saving, setSaving]       = useState(false);

  useEffect(() => { fetchApplications(); }, []);

  async function fetchApplications() {
    try {
      const snap = await getDocs(collection(db, 'applications'));
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const filtered = applications.filter(a => {
    const matchFilter = filter === 'all' || a.status === filter;
    const matchSearch = !search || [a.name, a.studentId, a.email].join(' ').toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  async function applyAction() {
    if (!selected) return;
    setSaving(true);
    try {
      const newStatus = actionType === 'provisional' ? 'provisional' : actionType === 'accept' ? 'accepted' : actionType === 'reject' ? 'rejected' : selected.status;
      await updateDoc(doc(db, 'applications', selected.id), { status: newStatus, coordinatorNotes: notes, updatedAt: serverTimestamp() });
      setApplications(prev => prev.map(a => a.id === selected.id ? { ...a, status: newStatus, coordinatorNotes: notes } : a));
      closeModal();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  function openModal(app, type) { setSelected(app); setActionType(type); setNotes(app.coordinatorNotes || ''); }
  function closeModal() { setSelected(null); setActionType(''); setNotes(''); }

  const counts = STATUS_FILTERS.slice(1).reduce((acc, s) => { acc[s] = applications.filter(a => a.status === s).length; return acc; }, {});

  const navBtn = { background: 'transparent', border: `1.5px solid ${T.cardBorder}`, color: T.textMid, padding: '0.45rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit' };
  const inputStyle = { backgroundColor: '#f8fafc', border: `1.5px solid #dde3ed`, color: T.textDark, borderRadius: '8px', padding: '0.5rem 0.9rem', fontSize: '0.85rem', fontFamily: 'inherit', outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: T.pageBg, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ backgroundColor: '#fff', borderBottom: `1px solid ${T.cardBorder}`, padding: '0 2rem', display: 'flex', alignItems: 'center', gap: '1rem', height: '64px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <button style={navBtn} onClick={() => navigate('/coordinator/dashboard')}>Back to Dashboard</button>
        <span style={{ width: '1px', height: '20px', backgroundColor: T.cardBorder }} />
        <h1 style={{ fontSize: '1rem', fontWeight: '700', color: T.textDark, margin: 0 }}>Application Review</h1>
        <div style={{ marginLeft: 'auto' }}>
          <input style={{ ...inputStyle, width: '260px' }} placeholder="Search by name, ID or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </nav>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: T.textDark, margin: 0 }}>Application Review</h2>
          <p style={{ fontSize: '0.88rem', color: T.textMuted, marginTop: '0.3rem' }}>Review applicant eligibility and set provisional or final statuses.</p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${filter === f ? T.blue : '#dde3ed'}`, backgroundColor: filter === f ? T.blueLight : '#fff', color: filter === f ? T.blue : T.textMid, transition: 'all 0.15s' }}>
              {f === 'all' ? `All (${applications.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${counts[f] || 0})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: '12px', boxShadow: T.cardShadow, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f7fb' }}>
                {['Name', 'Student ID', 'Email', 'Applied', 'Status', 'GPA', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1.1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: T.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${T.cardBorder}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: T.textMuted, fontSize: '0.88rem' }}>Loading applications...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: T.textMuted, fontSize: '0.88rem' }}>No applications match your filters.</td></tr>
              ) : filtered.map((app, i) => (
                <tr key={app.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.cardBorder}` : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f7f9ff'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                  <td style={{ padding: '0.9rem 1.1rem' }}>
                    <div style={{ fontWeight: '600', color: T.textDark, fontSize: '0.88rem' }}>{app.name || app.studentName || '—'}</div>
                    {app.program && <div style={{ fontSize: '0.75rem', color: T.textMuted }}>{app.program}</div>}
                  </td>
                  <td style={{ padding: '0.9rem 1.1rem', fontSize: '0.85rem', color: T.textMuted, fontFamily: 'monospace' }}>{app.studentId || '—'}</td>
                  <td style={{ padding: '0.9rem 1.1rem', fontSize: '0.85rem', color: T.textMuted }}>{app.email || '—'}</td>
                  <td style={{ padding: '0.9rem 1.1rem', fontSize: '0.85rem', color: T.textMuted }}>{app.createdAt?.toDate ? app.createdAt.toDate().toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '0.9rem 1.1rem' }}><Badge type={statusType(app.status || 'pending')}>{app.status || 'Pending'}</Badge></td>
                  <td style={{ padding: '0.9rem 1.1rem', fontSize: '0.88rem', fontWeight: '600', color: app.gpa >= 2.7 ? T.success : T.danger }}>{app.gpa ?? '—'}</td>
                  <td style={{ padding: '0.9rem 1.1rem' }}>
                    {app.status !== 'accepted' && app.status !== 'rejected' && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button onClick={() => openModal(app, 'provisional')} style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', border: `1.5px solid ${T.blueBorder}`, backgroundColor: T.blueLight, color: T.blue, fontFamily: 'inherit' }}>Provisional</button>
                        <button onClick={() => openModal(app, 'accept')} style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', border: `1.5px solid ${T.successBorder}`, backgroundColor: T.successBg, color: T.success, fontFamily: 'inherit' }}>Accept</button>
                        <button onClick={() => openModal(app, 'reject')} style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', border: `1.5px solid ${T.dangerBorder}`, backgroundColor: T.dangerBg, color: T.danger, fontFamily: 'inherit' }}>Reject</button>
                      </div>
                    )}
                    {(app.status === 'accepted' || app.status === 'rejected') && (
                      <button onClick={() => openModal(app, 'notes')} style={{ padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '600', cursor: 'pointer', border: `1.5px solid #dde3ed`, backgroundColor: '#f8fafc', color: T.textMid, fontFamily: 'inherit' }}>View Notes</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,31,75,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '460px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)', border: `2px solid ${actionType === 'reject' ? T.dangerBorder : actionType === 'accept' ? T.successBorder : T.blueBorder}` }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: T.textDark, margin: '0 0 0.3rem 0' }}>
              {actionType === 'provisional' ? 'Provisional Acceptance' : actionType === 'accept' ? 'Final Acceptance' : actionType === 'reject' ? 'Reject Application' : 'Coordinator Notes'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: T.textMuted, margin: '0 0 1.25rem 0' }}>{selected.name || selected.studentName} — {selected.studentId}</p>

            <div style={{ backgroundColor: '#f8fafc', border: `1px solid ${T.cardBorder}`, borderRadius: '8px', padding: '0.9rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                <div><span style={{ color: T.textMuted }}>Email: </span><span style={{ color: T.textDark }}>{selected.email}</span></div>
                <div><span style={{ color: T.textMuted }}>GPA: </span><span style={{ color: selected.gpa >= 2.7 ? T.success : T.danger, fontWeight: 600 }}>{selected.gpa ?? 'N/A'}</span></div>
                <div><span style={{ color: T.textMuted }}>Program: </span><span style={{ color: T.textDark }}>{selected.program || 'N/A'}</span></div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: T.textDark, marginBottom: '0.4rem' }}>Notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, width: '100%', height: '90px', resize: 'vertical', boxSizing: 'border-box' }} placeholder="Add notes about this decision..." />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', border: `1.5px solid ${T.cardBorder}`, backgroundColor: 'transparent', color: T.textMid, fontSize: '0.88rem', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button disabled={saving} onClick={applyAction} style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: actionType === 'reject' ? T.danger : actionType === 'accept' ? T.success : T.blue, color: '#fff', fontSize: '0.88rem', fontWeight: '700', fontFamily: 'inherit', cursor: 'pointer' }}>
                {saving ? 'Saving...' : actionType === 'notes' ? 'Save Notes' : actionType === 'provisional' ? 'Confirm Provisional' : actionType === 'accept' ? 'Confirm Acceptance' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
