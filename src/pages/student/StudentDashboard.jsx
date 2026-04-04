import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { db, auth } from '../../firebase/firebase'
import { useAuth } from '../../context/AuthContext'
import { useDeadline } from '../../hooks/useDeadline'

const CLOUDINARY_CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const T = {
  pageBg: 'linear-gradient(135deg, #dff0f7 0%, #eef4fb 30%, #fdf9ee 70%, #fef8e1 100%)',
  blue: '#3b4fa8', blueLight: 'rgba(59,79,168,0.07)', blueBorder: 'rgba(59,79,168,0.18)',
  yellow: '#f5a623', yellowLight: 'rgba(245,166,35,0.1)', yellowBorder: 'rgba(245,166,35,0.35)',
  textDark: '#0f1f4b', textMid: '#4a5568', textMuted: '#8a95a8',
  card: '#ffffff', cardBorder: '#e8edf5', cardShadow: '0 2px 12px rgba(0,0,0,0.06)',
  success: '#16a34a', successBg: 'rgba(22,163,74,0.08)', successBorder: 'rgba(22,163,74,0.22)',
  danger: '#dc2626', dangerBg: 'rgba(220,38,38,0.07)', dangerBorder: 'rgba(220,38,38,0.2)',
  warning: '#d97706', warningBg: 'rgba(217,119,6,0.08)', warningBorder: 'rgba(217,119,6,0.22)',
}

const STATUS_CONFIG = {
  pending: {
    label: 'Pending review',
    description: 'Your application has been submitted and is awaiting coordinator review.',
    badgeBg: T.warningBg, badgeBorder: T.warningBorder, badgeColor: T.warning,
    iconBg: T.warningBg, iconColor: T.warning,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  },
  provisional: {
    label: 'Provisionally accepted',
    description: 'Congratulations! You have been provisionally accepted. Final confirmation is pending.',
    badgeBg: T.blueLight, badgeBorder: T.blueBorder, badgeColor: T.blue,
    iconBg: T.blueLight, iconColor: T.blue,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  },
  accepted: {
    label: 'Confirmed — welcome!',
    description: 'You have been fully accepted into the co-op program. Please submit your work term report.',
    badgeBg: T.successBg, badgeBorder: T.successBorder, badgeColor: T.success,
    iconBg: T.successBg, iconColor: T.success,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  },
  rejected: {
    label: 'Application not accepted',
    description: 'Unfortunately your application was not accepted at this time. Please contact the co-op coordinator for more information.',
    badgeBg: T.dangerBg, badgeBorder: T.dangerBorder, badgeColor: T.danger,
    iconBg: T.dangerBg, iconColor: T.danger,
    icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  },
}

function StatusCard({ status, coordinatorNotes }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  return (
    <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderLeft: `4px solid ${cfg.badgeColor}`, borderRadius: '12px', padding: '1.5rem', boxShadow: T.cardShadow }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '50%', backgroundColor: cfg.iconBg, border: `1.5px solid ${cfg.badgeBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.iconColor, flexShrink: 0 }}>
          {cfg.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1rem', fontWeight: '700', color: T.textDark }}>Application status</span>
            <span style={{ display: 'inline-block', padding: '0.2rem 0.75rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', letterSpacing: '0.04em', textTransform: 'uppercase', backgroundColor: cfg.badgeBg, border: `1px solid ${cfg.badgeBorder}`, color: cfg.badgeColor }}>
              {cfg.label}
            </span>
          </div>
          <p style={{ fontSize: '0.88rem', color: T.textMuted, margin: 0 }}>{cfg.description}</p>
          {coordinatorNotes && (
            <div style={{ marginTop: '0.85rem', backgroundColor: '#f8fafc', border: `1px solid ${T.cardBorder}`, borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: T.textMid }}>
              <span style={{ fontWeight: '600', color: T.textDark }}>Coordinator note: </span>{coordinatorNotes}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DeadlineBanner({ deadlineDate }) {
  const { label, overdue, daysLeft } = useDeadline(deadlineDate)
  if (!deadlineDate) return null
  const color  = overdue ? T.danger  : daysLeft <= 3 ? T.warning  : T.blue
  const bg     = overdue ? T.dangerBg : daysLeft <= 3 ? T.warningBg : T.blueLight
  const border = overdue ? T.dangerBorder : daysLeft <= 3 ? T.warningBorder : T.blueBorder
  return (
    <div style={{ backgroundColor: bg, border: `1px solid ${border}`, borderRadius: '10px', padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span style={{ fontSize: '0.85rem', color, fontWeight: '600' }}>
        Report deadline: {new Date(deadlineDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })} — <span style={{ fontWeight: '700' }}>{label}</span>
      </span>
    </div>
  )
}

function validatePdfFile(file) {
  if (!file) return { valid: false, error: 'No file selected.' }
  if (file.type !== 'application/pdf') return { valid: false, error: 'Only PDF files are accepted.' }
  if (file.size > 10 * 1024 * 1024) return { valid: false, error: 'File must be under 10 MB.' }
  return { valid: true, error: null }
}

function UploadSection({ userDocId, existingReport, onUploadSuccess }) {
  const [uploadState, setUploadState] = useState('idle')
  const [progress,    setProgress]    = useState(0)
  const [errorMsg,    setErrorMsg]    = useState('')
  const [dragOver,    setDragOver]    = useState(false)

  async function handleFile(file) {
    const { valid, error } = validatePdfFile(file)
    if (!valid) { setUploadState('error'); setErrorMsg(error); return }

    setUploadState('uploading')
    setProgress(0)
    setErrorMsg('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
      formData.append('folder', 'coop_reports')

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
      }

      const cloudRes = await new Promise((resolve, reject) => {
        xhr.onload  = () => xhr.status === 200 ? resolve(JSON.parse(xhr.responseText)) : reject(new Error('Upload failed'))
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.send(formData)
      })

      const reportUrl  = cloudRes.secure_url
      const reportName = file.name

      await updateDoc(doc(db, 'users', userDocId), {
        reportUrl,
        reportName,
        reportSubmitted: true,
        reportSubmittedAt: serverTimestamp(),
      })

      onUploadSuccess({ url: reportUrl, name: reportName })
      setUploadState('done')
    } catch (err) {
      console.error('Upload error:', err)
      setUploadState('error')
      setErrorMsg('Upload failed. Please try again.')
    }
  }

  function onInputChange(e) { if (e.target.files[0]) handleFile(e.target.files[0]) }
  function onDrop(e) {
    e.preventDefault(); setDragOver(false)
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0])
  }

  if (existingReport) {
    return (
      <div style={{ backgroundColor: T.successBg, border: `1.5px solid ${T.successBorder}`, borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', color: T.success, fontSize: '0.88rem' }}>Report submitted successfully</div>
          <div style={{ fontSize: '0.78rem', color: T.textMuted, marginTop: '0.15rem' }}>{existingReport.name}</div>
        </div>
        <a href={existingReport.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: T.success, fontWeight: '600', textDecoration: 'underline' }}>View</a>
      </div>
    )
  }

  return (
    <label
      htmlFor="pdf-upload"
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '2rem', border: `2px dashed ${dragOver ? T.blue : uploadState === 'error' ? T.danger : '#c5daf0'}`, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s', backgroundColor: dragOver ? T.blueLight : uploadState === 'error' ? T.dangerBg : '#f8fafc' }}
    >
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={uploadState === 'error' ? T.danger : T.blue} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 12 15 15"/>
      </svg>
      {uploadState === 'idle' && <>
        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: T.textDark }}>{dragOver ? 'Drop your PDF here' : 'Click or drag to upload PDF'}</span>
        <span style={{ fontSize: '0.78rem', color: T.textMuted }}>PDF only · max 10 MB</span>
      </>}
      {uploadState === 'uploading' && <>
        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: T.blue }}>Uploading... {progress}%</span>
        <div style={{ width: '200px', height: '6px', backgroundColor: '#dde3ed', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, backgroundColor: T.blue, borderRadius: '3px', transition: 'width 0.2s' }} />
        </div>
      </>}
      {uploadState === 'error' && <span style={{ fontSize: '0.88rem', fontWeight: '600', color: T.danger }}>{errorMsg}</span>}
      <input id="pdf-upload" type="file" accept="application/pdf" style={{ display: 'none' }} onChange={onInputChange} />
    </label>
  )
}

export default function StudentDashboard() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const [student,       setStudent]       = useState(null)
  const [application,   setApplication]   = useState(null)
  const [report,        setReport]        = useState(null)
  const [loading,       setLoading]       = useState(true)
  // --- NEW: employer form state ---
  const [employerForm,  setEmployerForm]  = useState({ company: '', supervisorName: '', supervisorEmail: '' })
  const [employerSaved, setEmployerSaved] = useState(false)
  const [employerSaving,setEmployerSaving]= useState(false)

  useEffect(() => { if (currentUser) fetchData() }, [currentUser])

  async function fetchData() {
    try {
      const userSnap = await getDoc(doc(db, 'users', currentUser.uid))
      if (userSnap.exists()) {
        const data = userSnap.data()
        setStudent(data)
        if (data.reportUrl) setReport({ url: data.reportUrl, name: data.reportName || 'report.pdf' })
      }

      const appSnap = await getDoc(doc(db, 'applications', currentUser.uid))
      if (appSnap.exists()) {
        const appData = appSnap.data()
        setApplication(appData)
        // --- NEW: pre-populate employer form if already saved ---
        if (appData.employerCompany) {
          setEmployerForm({
            company:         appData.employerCompany   || '',
            supervisorName:  appData.supervisorName    || '',
            supervisorEmail: appData.supervisorEmail   || '',
          })
          setEmployerSaved(true)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // --- NEW: save employer details to the application doc ---
  async function saveEmployer() {
    if (!employerForm.company.trim()) return
    setEmployerSaving(true)
    try {
      await updateDoc(doc(db, 'applications', currentUser.uid), {
        employerCompany:  employerForm.company,
        supervisorName:   employerForm.supervisorName,
        supervisorEmail:  employerForm.supervisorEmail,
        employerReported: true,
      })
      setEmployerSaved(true)
    } catch (err) {
      console.error(err)
    } finally {
      setEmployerSaving(false)
    }
  }

  async function handleLogout() { await signOut(auth); navigate('/') }

  const status    = application?.status || 'pending'
  const canUpload = status === 'accepted' || status === 'provisional'

  const fieldInputStyle = {
    width: '100%', boxSizing: 'border-box', padding: '0.6rem 0.9rem',
    borderRadius: '8px', border: '1.5px solid #dde3ed', fontSize: '0.88rem',
    fontFamily: 'inherit', outline: 'none', backgroundColor: '#f8fafc', color: T.textDark,
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: T.pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      <div style={{ color: T.textMuted, fontSize: '0.9rem' }}>Loading your dashboard...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: T.pageBg, fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      <nav style={{ backgroundColor: '#fff', borderBottom: `1px solid ${T.cardBorder}`, padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#eef2fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <span style={{ fontSize: '1rem', fontWeight: '700', color: T.textDark }}>Co-op Student Portal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.82rem', color: T.textMuted }}>{student?.name || currentUser?.email}</span>
          <button onClick={handleLogout} style={{ padding: '0.45rem 1.1rem', borderRadius: '8px', border: `1.5px solid ${T.cardBorder}`, backgroundColor: 'transparent', color: T.textMid, fontSize: '0.85rem', fontWeight: '600', fontFamily: 'inherit', cursor: 'pointer' }}>Sign out</button>
        </div>
      </nav>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem' }}>

        <div style={{ marginBottom: '1.75rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: '700', color: T.textDark, margin: 0 }}>Welcome back{student?.name ? `, ${student.name.split(' ')[0]}` : ''}</h1>
          <p style={{ fontSize: '0.9rem', color: T.textMuted, marginTop: '0.3rem' }}>Here is your co-op application overview.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Student ID',     value: student?.studentId || '—',                           accent: T.blue   },
            { label: 'Program status', value: (application?.status || 'pending').replace('_', ' '), accent: T.yellow },
            { label: 'Report',         value: report ? 'Submitted' : 'Not submitted',               accent: report ? T.success : T.warning },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderTop: `3px solid ${s.accent}`, borderRadius: '12px', padding: '1.1rem 1.4rem', boxShadow: T.cardShadow }}>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: T.textDark, textTransform: 'capitalize' }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: '600', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.3rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <StatusCard status={status} coordinatorNotes={application?.coordinatorNotes} />

        {application?.reportDeadline && (
          <div style={{ marginTop: '1rem' }}><DeadlineBanner deadlineDate={application.reportDeadline} /></div>
        )}

        {(status === 'provisional' || status === 'accepted') && (
          <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: '12px', padding: '1.5rem', boxShadow: T.cardShadow, marginTop: '1.5rem' }}>
            <div style={{ marginBottom: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: T.textDark, margin: 0 }}>My Employer</h2>
              <p style={{ fontSize: '0.82rem', color: T.textMuted, marginTop: '0.25rem', marginBottom: 0 }}>
                Enter the details of the employer you have secured your co-op placement with.
              </p>
            </div>

            {[
              { key: 'company',         label: 'Company Name',      placeholder: 'e.g. Acme Corp' },
              { key: 'supervisorName',  label: 'Supervisor Name',   placeholder: 'e.g. Jane Smith' },
              { key: 'supervisorEmail', label: 'Supervisor Email',  placeholder: 'e.g. jane@acme.com' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: T.textDark, marginBottom: '0.3rem' }}>{f.label}</label>
                <input
                  value={employerForm[f.key]}
                  onChange={e => { setEmployerForm(p => ({ ...p, [f.key]: e.target.value })); setEmployerSaved(false) }}
                  placeholder={f.placeholder}
                  style={fieldInputStyle}
                />
              </div>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem' }}>
              <button
                onClick={saveEmployer}
                disabled={employerSaving || !employerForm.company.trim()}
                style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', backgroundColor: employerSaving || !employerForm.company.trim() ? '#9baee0' : T.blue, color: '#fff', fontSize: '0.88rem', fontWeight: '700', fontFamily: 'inherit', cursor: employerSaving || !employerForm.company.trim() ? 'not-allowed' : 'pointer' }}
              >
                {employerSaving ? 'Saving...' : employerSaved ? 'Update Employer' : 'Save Employer'}
              </button>
              {employerSaved && (
                <span style={{ fontSize: '0.82rem', color: T.success, fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Saved
                </span>
              )}
            </div>
          </div>
        )}

        <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: '12px', padding: '1.5rem', boxShadow: T.cardShadow, marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', color: T.textDark, margin: 0 }}>Work term report</h2>
              <p style={{ fontSize: '0.82rem', color: T.textMuted, marginTop: '0.25rem', marginBottom: 0 }}>
                {canUpload ? 'Upload your work term report as a PDF.' : 'Report upload is available once your application is accepted.'}
              </p>
            </div>
            {!canUpload && <span style={{ padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', backgroundColor: '#f1f3f7', border: '1px solid #dde3ed', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Locked</span>}
          </div>

          {canUpload ? (
            <UploadSection userDocId={currentUser.uid} existingReport={report} onUploadSuccess={setReport} />
          ) : (
            <div style={{ padding: '1.5rem', backgroundColor: '#f8fafc', border: `1px solid ${T.cardBorder}`, borderRadius: '8px', textAlign: 'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '0.5rem' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <p style={{ color: T.textMuted, fontSize: '0.85rem', margin: 0 }}>Upload will be unlocked after your application is accepted.</p>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
          <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: '12px', padding: '1.25rem 1.5rem', boxShadow: T.cardShadow }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: T.textDark, margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Your information</h3>
            {[
              { label: 'Name',       value: student?.name      || '—' },
              { label: 'Student ID', value: student?.studentId || '—' },
              { label: 'Email',      value: student?.email || currentUser?.email || '—' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: `1px solid ${T.cardBorder}` }}>
                <span style={{ fontSize: '0.82rem', color: T.textMuted }}>{r.label}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', color: T.textDark }}>{r.value}</span>
              </div>
            ))}
          </div>

          <div style={{ backgroundColor: T.card, border: `1px solid ${T.cardBorder}`, borderRadius: '12px', padding: '1.25rem 1.5rem', boxShadow: T.cardShadow }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: '700', color: T.textDark, margin: '0 0 1rem 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>What's next</h3>
            {status === 'pending'     && <p style={{ fontSize: '0.85rem', color: T.textMid, lineHeight: 1.6, margin: 0 }}>Your application is under review. The co-op coordinator will update your status once a decision has been made. Check back soon.</p>}
            {status === 'provisional' && <p style={{ fontSize: '0.85rem', color: T.textMid, lineHeight: 1.6, margin: 0 }}>You have been provisionally accepted. Please enter your employer details above so the coordinator can confirm your placement.</p>}
            {status === 'accepted'    && <p style={{ fontSize: '0.85rem', color: T.textMid, lineHeight: 1.6, margin: 0 }}>You are confirmed in the co-op program. Please upload your work term report before the deadline using the upload section on this page.</p>}
            {status === 'rejected'    && <p style={{ fontSize: '0.85rem', color: T.textMid, lineHeight: 1.6, margin: 0 }}>Your application was not successful this term. Please contact the co-op coordinator for guidance on next steps or reapplying in a future term.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}