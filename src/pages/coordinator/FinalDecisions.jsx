import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, updateDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

const T = {
  pageBg: 'linear-gradient(135deg, #dff0f7 0%, #eef4fb 30%, #fdf9ee 70%, #fef8e1 100%)',
  blue: '#3b4fa8', blueLight: 'rgba(59,79,168,0.07)', blueBorder: 'rgba(59,79,168,0.18)',
  yellow: '#f5a623', textDark: '#0f1f4b', textMid: '#4a5568', textMuted: '#8a95a8',
  card: '#ffffff', cardBorder: '#e8edf5', cardShadow: '0 2px 12px rgba(0,0,0,0.06)',
  success: '#16a34a', successBg: 'rgba(22,163,74,0.08)', successBorder: 'rgba(22,163,74,0.22)',
  danger: '#dc2626', dangerBg: 'rgba(220,38,38,0.07)', dangerBorder: 'rgba(220,38,38,0.2)',
  purple: '#7c3aed', purpleBg: 'rgba(124,58,237,0.08)', purpleBorder: 'rgba(124,58,237,0.2)',
};

function Badge({ type, children }) {
  const map = {
    success: { bg: T.successBg, border: T.successBorder, color: T.success },
    blue:    { bg: T.blueLight, border: T.blueBorder,     color: T.blue    },
    muted:   { bg: '#f1f3f7',   border: '#dde3ed',        color: T.textMuted },
  };
  const c = map[type] || map.muted;
  return <span style={{ display: 'inline-block', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.color }}>{children}</span>;
}

export default function FinalDecisions() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [employers, setEmployers]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);
  const [workTerm, setWorkTerm]         = useState('');
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [saving, setSaving]             = useState(false);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    try {
      const [appSnap, empSnap] = await Promise.all([
        getDocs(collection(db, 'applications')),
        getDocs(query(collection(db, 'users'), where('role', '==', 'employer'))),
      ]);
      setApplications(appSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setEmployers(empSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const provisional = applications.filter(a => a.status === 'provisional');
  const accepted    = applications.filter(a => a.status === 'accepted');

  async function confirmFinal() {
    if (!selected) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'applications', selected.id), {
        status: 'accepted',
        workTerm,
        employerId:      selectedEmployer?.id      || null,
        employerCompany: selectedEmployer?.company || null,
        finalDecisionAt: serverTimestamp(),
        updatedAt:       serverTimestamp(),
      });
      setApplications(prev => prev.map(a =>
        a.id === selected.id
          ? { ...a, status: 'accepted', workTerm, employerId: selectedEmployer?.id || null, employerCompany: selectedEmployer?.company || null }
          : a
      ));
      closeModal();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  }

  async function revertToProvisional(appId) {
    try {
      await updateDoc(doc(db, 'applications', appId), {
        status: 'provisional',
        employerId: null,
        employerCompany: null,
        updatedAt: serverTimestamp(),
      });
      setApplications(prev => prev.map(a =>
        a.id === appId ? { ...a, status: 'provisional', employerId: null, employerCompany: null } : a
      ));
    } catch (err) { console.error(err); }
  }

  function openModal(app) {
    setSelected(app);
    setWorkTerm(app.workTerm || '');
    setSelectedEmployer(employers.find(e => e.id === app.employerId) || null);
  }

  function closeModal() {
    setSelected(null);
    setWorkTerm('');
    setSelectedEmployer(null);
  }

  const navBtn = { background: 'transparent', border: `1.5px solid #e8edf5`, color: '#4a5568', padding: '0.45rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit' };
  const inputStyle = { width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1.5px solid #dde3ed', color: T.textDark, borderRadius: '8px', padding: '0.6rem 0.9rem', fontSize: '0.88rem', fontFamily: 'inherit', outline: 'none' };

  const SectionDivider = ({ label, count, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.75rem 0 1rem 0' }}>
      <span style={{ fontSize: '0.82rem', fontWeight: '700', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: '1px', backgroundColor: T.cardBorder }} />
      <span style={{ fontSize: '0.8rem', fontWeight: '700', color, backgroundColor: color === T.success ? T.successBg : T.blueLight, border: `1px solid ${color === T.success ? T.successBorder : T.blueBorder}`, padding: '0.1rem 0.6rem', borderRadius: '20px' }}>{count}</span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: T.pageBg, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      <nav style={{ backgroundColor: '#fff', borderBottom: `1px solid ${T.cardBorder}`, padding: '0 2rem', display: 'flex', alignItems: 'center', gap: '1rem', height: '64px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <button style={navBtn} onClick={() => navigate('/coordinator/dashboard')}>Back to Dashboard</button>
        <span style={{ width: '1px', height: '20px', backgroundColor: T.cardBorder }} />
        <h1 style={{ fontSize: '1rem', fontWeight: '700', color: T.textDark, margin: 0 }}>Final Decisions</h1>
        <span style={{ marginLeft: 'auto', fontSize: '0.82rem', color: T.textMuted }}>{provisional.length} awaiting final decision</span>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: T.textDark, margin: 0 }}>Final Decisions</h2>
          <p style={{ fontSize: '0.88rem', color: T.textMuted, marginTop: '0.3rem' }}>Confirm final co-op acceptances and assign an employer to each student.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '0.5rem' }}>
          {[
            { label: 'Awaiting Final Decision', value: provisional.length, accent: T.blue },
            { label: 'Finally Accepted',        value: accepted.length,    accent: T.success },
            { label: 'Total Applications',      value: applications.length,accent: T.purple },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderTop: `3px solid ${s.accent}`, borderRadius: '12px', padding: '1.1rem 1.4rem', boxShadow: T.cardShadow }}>
              <div style={{ fontSize: '1.8rem', fontWeight: '700', color: T.textDark }}>{s.value}</div>
              <div style={{ fontSize: '0.75rem', fontWeight: '600', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.3rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Provisional list */}
        <SectionDivider label="Awaiting Final Decision" count={provisional.length} color={T.blue} />
        {!loading && provisional.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: T.textMuted, backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: '12px', fontSize: '0.88rem' }}>
            No provisionally accepted applicants pending final decision.
          </div>
        )}
        {provisional.map(app => (
          <div key={app.id} style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: T.cardShadow, transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = T.cardShadow}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: T.blueLight, border: `1.5px solid ${T.blueBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: '700', color: T.blue, flexShrink: 0 }}>
              {(app.name || app.studentName || '?')[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', color: T.textDark, fontSize: '0.9rem' }}>{app.name || app.studentName || 'Unknown'}</div>
              <div style={{ fontSize: '0.75rem', color: T.textMuted, marginTop: '0.15rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span>{app.studentId}</span>
                <span>{app.email}</span>
                <span>{app.program}</span>
                {app.gpa && <span style={{ color: app.gpa >= 2.7 ? T.success : T.danger, fontWeight: '600' }}>GPA {app.gpa}</span>}
                {app.employerCompany && <span style={{ color: T.blue, fontWeight: '600' }}>Employer: {app.employerCompany}</span>}
              </div>
            </div>
            <Badge type="blue">Provisional</Badge>
            <button onClick={() => openModal(app)}
              style={{ padding: '0.5rem 1.1rem', borderRadius: '8px', border: 'none', backgroundColor: T.success, color: '#fff', fontSize: '0.85rem', fontWeight: '700', fontFamily: 'inherit', cursor: 'pointer' }}>
              Confirm Final
            </button>
          </div>
        ))}

        {/* Accepted list */}
        <SectionDivider label="Finally Accepted" count={accepted.length} color={T.success} />
        {!loading && accepted.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: T.textMuted, backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: '12px', fontSize: '0.88rem' }}>
            No students have been finally accepted yet.
          </div>
        )}
        {accepted.map(app => (
          <div key={app.id} style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderLeft: `3px solid ${T.success}`, borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: T.cardShadow }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: T.successBg, border: `1.5px solid ${T.successBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', color: T.textDark, fontSize: '0.9rem' }}>{app.name || app.studentName || 'Unknown'}</div>
              <div style={{ fontSize: '0.75rem', color: T.textMuted, marginTop: '0.15rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span>{app.studentId}</span>
                <span>{app.email}</span>
                {app.workTerm && <span style={{ color: T.purple, fontWeight: '600' }}>Work Term: {app.workTerm}</span>}
                {app.employerCompany && <span style={{ color: T.success, fontWeight: '600' }}>Employer: {app.employerCompany}</span>}
              </div>
            </div>
            <Badge type="success">Accepted</Badge>
            <button onClick={() => revertToProvisional(app.id)} style={{ padding: '0.45rem 0.9rem', borderRadius: '8px', border: `1.5px solid ${T.cardBorder}`, backgroundColor: 'transparent', color: T.textMid, fontSize: '0.82rem', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer' }}>
              Revert
            </button>
          </div>
        ))}
      </div>

      {/* Confirm Modal */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,31,75,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '2rem', width: '100%', maxWidth: '460px', boxShadow: '0 8px 40px rgba(0,0,0,0.15)', border: `2px solid ${T.successBorder}` }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: T.textDark, margin: '0 0 0.3rem 0' }}>Confirm Final Acceptance</h2>
            <p style={{ fontSize: '0.85rem', color: T.textMuted, margin: '0 0 1.25rem 0' }}>{selected.name || selected.studentName} — {selected.studentId}</p>

            {/* Student's reported employer info */}
            {selected.employerCompany && (
              <div style={{ backgroundColor: T.blueLight, border: `1px solid ${T.blueBorder}`, borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: '600', color: T.blue, marginBottom: '0.25rem' }}>Student reported employer:</div>
                <div style={{ color: T.textDark }}>{selected.employerCompany}</div>
                {selected.supervisorName  && <div style={{ color: T.textMuted }}>{selected.supervisorName}</div>}
                {selected.supervisorEmail && <div style={{ color: T.textMuted }}>{selected.supervisorEmail}</div>}
              </div>
            )}

            {/* Work term input */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: T.textDark, marginBottom: '0.4rem' }}>Work Term</label>
              <input style={inputStyle} value={workTerm} onChange={e => setWorkTerm(e.target.value)} placeholder="e.g. Winter 2026, Summer 2026" />
            </div>

            {/* Employer assignment dropdown */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: T.textDark, marginBottom: '0.4rem' }}>Assign Employer Account</label>
              {employers.length === 0 ? (
                <div style={{ padding: '0.6rem 0.9rem', backgroundColor: '#f8fafc', border: '1.5px solid #dde3ed', borderRadius: '8px', fontSize: '0.85rem', color: T.textMuted, fontStyle: 'italic' }}>
                  No employer accounts registered yet.
                </div>
              ) : (
                <select
                  style={inputStyle}
                  value={selectedEmployer?.id || ''}
                  onChange={e => setSelectedEmployer(employers.find(emp => emp.id === e.target.value) || null)}
                >
                  <option value="">Select an employer...</option>
                  {employers.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.company} — {emp.email}</option>
                  ))}
                </select>
              )}
              <p style={{ fontSize: '0.75rem', color: T.textMuted, marginTop: '0.35rem', marginBottom: 0 }}>
                The selected employer will see this student in their portal.
              </p>
            </div>

            <div style={{ backgroundColor: T.successBg, border: `1px solid ${T.successBorder}`, borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: T.success, marginBottom: '1.5rem' }}>
              This student will be finally accepted into the co-op program.
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '0.55rem 1.1rem', borderRadius: '8px', border: `1.5px solid ${T.cardBorder}`, backgroundColor: 'transparent', color: T.textMid, fontSize: '0.88rem', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer' }}>Cancel</button>
              <button disabled={saving} onClick={confirmFinal} style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: T.success, color: '#fff', fontSize: '0.88rem', fontWeight: '700', fontFamily: 'inherit', cursor: 'pointer' }}>
                {saving ? 'Confirming...' : 'Confirm Acceptance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}