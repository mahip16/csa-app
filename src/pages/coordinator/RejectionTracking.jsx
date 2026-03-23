import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
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

const REJECTION_TYPES = ['Application Rejected', 'Employer Rejected', 'Student Withdrew', 'Placement Cancelled'];

function Badge({ type, children }) {
  const map = {
    danger:  { bg: T.dangerBg,  border: T.dangerBorder,  color: T.danger  },
    warning: { bg: T.warningBg, border: T.warningBorder, color: T.warning  },
    muted:   { bg: '#f1f3f7',   border: '#dde3ed',        color: T.textMuted },
  };
  const c = map[type] || map.muted;
  return <span style={{ display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.color }}>{children}</span>;
}

export default function RejectionTracking() {
  const navigate = useNavigate();
  const [rejections, setRejections] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ studentName: '', studentId: '', email: '', employer: '', type: REJECTION_TYPES[0], reason: '' });
  const [saving, setSaving]     = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [rejSnap, appSnap] = await Promise.all([
        getDocs(collection(db, 'rejections')),
        getDocs(collection(db, 'applications')),
      ]);
      const apps = appSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const appRejected = apps.filter(a => a.status === 'rejected').map(a => ({
        id: a.id, studentName: a.name || a.studentName, studentId: a.studentId,
        email: a.email, type: 'Application Rejected', reason: a.coordinatorNotes || '—',
        date: a.updatedAt, source: 'application',
      }));
      const manual = rejSnap.docs.map(d => ({ id: d.id, ...d.data(), source: 'manual' }));
      setRejections([...appRejected, ...manual]);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  async function addRejection() {
    if (!form.studentName || !form.studentId) return;
    setSaving(true);
    try {
      const ref = await addDoc(collection(db, 'rejections'), { ...form, createdAt: serverTimestamp(), source: 'manual' });
      setRejections(prev => [...prev, { id: ref.id, ...form, source: 'manual' }]);
      setShowModal(false);
      setForm({ studentName: '', studentId: '', email: '', employer: '', type: REJECTION_TYPES[0], reason: '' });
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  const filtered = rejections.filter(r => filter === 'all' || r.type === filter);
  const byType = REJECTION_TYPES.reduce((acc, t) => { acc[t] = rejections.filter(r => r.type === t).length; return acc; }, {});

  function dateStr(d) {
    if (!d) return '—';
    if (d?.toDate) return d.toDate().toLocaleDateString();
    return new Date(d).toLocaleDateString();
  }

  function rejBadgeType(type) {
    return type === 'Application Rejected' ? 'danger' : type === 'Employer Rejected' ? 'warning' : 'muted';
  }

  const navBtn    = { background: 'transparent', border: `1.5px solid #e8edf5`, color: '#4a5568', padding: '0.45rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit' };
  const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #dde3ed', color: T.textDark, borderRadius: '8px', padding: '0.6rem 0.9rem', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: T.pageBg, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      <nav style={{ backgroundColor: '#fff', borderBottom: `1px solid ${T.cardBorder}`, padding: '0 2rem', display: 'flex', alignItems: 'center', gap: '1rem', height: '64px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <button style={navBtn} onClick={() => navigate('/coordinator/dashboard')}>Back to Dashboard</button>
        <span style={{ width: '1px', height: '20px', backgroundColor: T.cardBorder }} />
        <h1 style={{ fontSize: '1rem', fontWeight: '700', color: T.textDark, margin: 0 }}>Rejection Tracking</h1>
        <button onClick={() => setShowModal(true)} style={{ marginLeft: 'auto', padding: '0.5rem 1.1rem', borderRadius: '8px', border: 'none', backgroundColor: T.danger, color: '#fff', fontSize: '0.85rem', fontWeight: '700', fontFamily: 'inherit', cursor: 'pointer' }}>
          Log Rejection
        </button>
      </nav>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: T.textDark, margin: 0 }}>Rejection Tracking</h2>
          <p style={{ fontSize: '0.88rem', color: T.textMuted, marginTop: '0.3rem' }}>Track application rejections, employer rejections, and cancelled placements.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
          {[
            { label: 'Total Rejections',    value: rejections.length,                accent: T.danger  },
            { label: 'Application Rejected',value: byType['Application Rejected'] || 0, accent: T.warning },
            { label: 'Employer Rejected',   value: byType['Employer Rejected'] || 0,    accent: '#7c3aed' },
            { label: 'Student Withdrew',    value: byType['Student Withdrew'] || 0,     accent: T.textMuted },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderTop: `3px solid ${s.accent}`, borderRadius: '12px', padding: '1.1rem 1.4rem', boxShadow: T.cardShadow }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: T.textDark }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.3rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          {['all', ...REJECTION_TYPES].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${filter === f ? T.danger : '#dde3ed'}`, backgroundColor: filter === f ? T.dangerBg : '#fff', color: filter === f ? T.danger : T.textMid, transition: 'all 0.15s' }}>
              {f === 'all' ? `All (${rejections.length})` : `${f} (${byType[f] || 0})`}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: '12px', boxShadow: T.cardShadow, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f7fb' }}>
                {['Student', 'Student ID', 'Email', 'Type', 'Employer', 'Reason', 'Date'].map(h => (
                  <th key={h} style={{ padding: '0.85rem 1.1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '700', color: T.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${T.cardBorder}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: T.textMuted, fontSize: '0.88rem' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: T.textMuted, fontSize: '0.88rem' }}>No rejections recorded.</td></tr>
              ) : filtered.map((r, i) => (
                <tr key={r.id || i} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.cardBorder}` : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f7f9ff'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                  <td style={{ padding: '0.9rem 1.1rem', fontWeight: '600', color: T.textDark, fontSize: '0.88rem' }}>{r.studentName || '—'}</td>
                  <td style={{ padding: '0.9rem 1.1rem', fontSize: '0.85rem', color: T.textMuted, fontFamily: 'monospace' }}>{r.studentId || '—'}</td>
                  <td style={{ padding: '0.9rem 1.1rem', fontSize: '0.85rem', color: T.textMuted }}>{r.email || '—'}</td>
                  <td style={{ padding: '0.9rem 1.1rem' }}><Badge type={rejBadgeType(r.type)}>{r.type}</Badge></td>
                  <td style={{ padding: '0.9rem 1.1rem', fontSize: '0.85rem', color: T.textMuted }}>{r.employer || '—'}</td>
                  <td style={{ padding: '0.9rem 1.1rem', fontSize: '0.85rem', color: T.textMuted, maxWidth: '200px' }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason || '—'}</div>
                  </td>
                  <td style={{ padding: '0.9rem 1.1rem', fontSize: '0.85rem', color: T.textMuted }}>{dateStr(r.date || r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,31,75,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '480px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)', border: `2px solid ${T.dangerBorder}` }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: T.textDark, margin: '0 0 0.3rem 0' }}>Log Rejection</h2>
            <p style={{ fontSize: '0.85rem', color: T.textMuted, margin: '0 0 1.5rem 0' }}>Record a new rejection event.</p>

            {[
              { label: 'Student Name', key: 'studentName', placeholder: 'Full name', type: 'text' },
              { label: 'Student ID',   key: 'studentId',   placeholder: 'e.g. 500123456', type: 'text' },
              { label: 'Email',        key: 'email',       placeholder: 'student@torontomu.ca', type: 'email' },
              { label: 'Employer',     key: 'employer',    placeholder: 'Company name', type: 'text' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: T.textDark, marginBottom: '0.4rem' }}>{f.label}</label>
                <input type={f.type} style={inputStyle} value={form[f.key]} placeholder={f.placeholder} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: T.textDark, marginBottom: '0.4rem' }}>Rejection Type</label>
              <select style={inputStyle} value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {REJECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: T.textDark, marginBottom: '0.4rem' }}>Reason / Notes</label>
              <textarea style={{ ...inputStyle, height: '80px', resize: 'vertical' }} value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} placeholder="Additional context..." />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', border: `1.5px solid ${T.cardBorder}`, backgroundColor: 'transparent', color: T.textMid, fontSize: '0.88rem', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button disabled={saving || !form.studentName || !form.studentId} onClick={addRejection} style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: T.danger, color: '#fff', fontSize: '0.88rem', fontWeight: '700', fontFamily: 'inherit', cursor: 'pointer', opacity: (!form.studentName || !form.studentId) ? 0.5 : 1 }}>
                {saving ? 'Saving...' : 'Log Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
