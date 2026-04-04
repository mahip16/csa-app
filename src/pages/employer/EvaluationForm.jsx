import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import { validatePdfFile } from '../../utils/validation';

const pageBg = 'linear-gradient(135deg, #dff0f7 0%, #eef4fb 30%, #fdf9ee 70%, #fef8e1 100%)';

const T = {
  blue: '#3b4fa8', textDark: '#0f1f4b', textMuted: '#8a95a8',
  success: '#16a34a', successBg: 'rgba(22,163,74,0.08)', successBorder: 'rgba(22,163,74,0.22)',
  danger: '#dc2626',
};

export default function EmployerEvaluationForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dropdownRef = useRef(null);

  const [mode, setMode] = useState(searchParams.get('mode') === 'pdf' ? 'pdf' : 'form');

  // --- Student search state ---
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [studentQuery, setStudentQuery]         = useState(searchParams.get('studentName') || '');
  const [selectedStudent, setSelectedStudent]   = useState(null);
  const [showDropdown, setShowDropdown]         = useState(false);

  // form fields
  const [company, setCompany]               = useState('');
  const [rating, setRating]                 = useState(3);
  const [skills, setSkills]                 = useState(3);
  const [communication, setCommunication]   = useState(3);
  const [comments, setComments]             = useState('');

  // pdf upload
  const [uploadState, setUploadState]   = useState('idle');
  const [progress, setProgress]         = useState(0);
  const [dragOver, setDragOver]         = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadError, setUploadError]   = useState('');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError]     = useState('');
  const [focused, setFocused] = useState('');

  // Fetch assigned students on mount
  useEffect(() => {
    async function fetchStudents() {
      try {
        const user = auth.currentUser;
        if (!user) return;
        const snap = await getDocs(query(
          collection(db, 'applications'),
          where('employerId', '==', user.uid),
          where('status', '==', 'accepted')
        ));
        const students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAssignedStudents(students);

        // If arriving from MyStudents with a studentName pre-filled, auto-select
        const prefilledName = searchParams.get('studentName');
        if (prefilledName) {
          const match = students.find(s => s.name?.toLowerCase() === prefilledName.toLowerCase());
          if (match) {
            setSelectedStudent(match);
            setStudentQuery(match.name);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetching(false);
      }
    }
    fetchStudents();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredStudents = assignedStudents.filter(s =>
    s.name?.toLowerCase().includes(studentQuery.toLowerCase())
  );

  function selectStudent(student) {
    setSelectedStudent(student);
    setStudentQuery(student.name);
    setShowDropdown(false);
  }

  function clearStudent() {
    setSelectedStudent(null);
    setStudentQuery('');
    setShowDropdown(false);
  }

  function switchMode(key) {
    setMode(key);
    setUploadState('idle');
    setUploadedFile(null);
    setUploadError('');
    setProgress(0);
    setError('');
  }

  const inputStyle = (name) => ({
    width: '100%', boxSizing: 'border-box', padding: '0.7rem 1rem',
    fontSize: '0.95rem', fontFamily: 'inherit', color: T.textDark,
    backgroundColor: '#f8fafc',
    border: `1.5px solid ${focused === name ? T.blue : '#dde3ed'}`,
    borderRadius: '8px', outline: 'none',
  });

  function handleFile(file) {
    const { valid, error } = validatePdfFile(file);
    if (!valid) { setUploadState('error'); setUploadError(error); return; }

    setUploadState('uploading');
    setProgress(0);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'eval_upload');
    formData.append('folder', 'evaluations');

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.cloudinary.com/v1_1/dpde2xmkz/raw/upload');

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    });

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        if (!data.secure_url) {
          setUploadState('error');
          setUploadError('Upload failed: no URL returned. Check your Cloudinary preset.');
          return;
        }
        setUploadedFile({ url: data.secure_url, name: file.name });
        setUploadState('done');
      } else {
        setUploadState('error');
        setUploadError('Upload failed. Please try again.');
      }
    };

    xhr.onerror = () => { setUploadState('error'); setUploadError('Upload failed. Please try again.'); };
    xhr.send(formData);
  }

  function onInputChange(e) { if (e.target.files[0]) handleFile(e.target.files[0]); }
  function onDrop(e) {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!selectedStudent) {
      setError('Please select a student from the list.');
      return;
    }
    if (!company) {
      setError('Please enter your company name.');
      return;
    }
    if (mode === 'pdf') {
      if (uploadState === 'uploading') { setError('Please wait for the PDF to finish uploading.'); return; }
      if (uploadState !== 'done' || !uploadedFile?.url) { setError('Please upload a PDF evaluation first.'); return; }
    }

    setLoading(true);
    try {
      const employerId = auth.currentUser?.uid || null;
      await addDoc(collection(db, 'evaluations'), {
        studentName:    selectedStudent.name,
        studentId:      selectedStudent.id,   // application doc ID — used for reliable matching
        company,
        employerId,
        submissionType: mode,
        ...(mode === 'form'
          ? { rating, skills, communication, comments }
          : { pdfUrl: uploadedFile.url, pdfName: uploadedFile.name }),
        createdAt: new Date().toISOString(),
      });
      navigate('/employer/dashboard');
    } catch (err) {
      console.error(err);
      setError('Failed to submit evaluation. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: pageBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Inter', 'Segoe UI', sans-serif", padding: '1rem' }}>
      <div style={{ backgroundColor: '#fff', border: '2px solid #3b4fa8', borderRadius: '16px', padding: '2.5rem', width: '100%', maxWidth: '460px', boxShadow: '0 4px 24px rgba(0,0,0,0.09)' }}>
        <h1 style={{ fontSize: '1.5rem', color: T.textDark, fontWeight: 700 }}>Employer Evaluation Form</h1>
        <p style={{ fontSize: '0.9rem', color: T.textMuted, marginBottom: '1.5rem' }}>Submit feedback for a co-op student</p>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', border: '1.5px solid #dde3ed', borderRadius: '10px', padding: '0.3rem' }}>
          {[{ key: 'form', label: 'Fill Out Form' }, { key: 'pdf', label: 'Upload PDF' }].map(opt => (
            <button key={opt.key} type="button" onClick={() => switchMode(opt.key)} style={{ flex: 1, padding: '0.55rem', borderRadius: '7px', border: 'none', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', backgroundColor: mode === opt.key ? T.blue : 'transparent', color: mode === opt.key ? '#fff' : T.textMuted, transition: 'all 0.15s' }}>
              {opt.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', color: T.danger, padding: '0.7rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.82rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* --- Searchable student dropdown --- */}
          <div style={{ marginBottom: '1rem' }} ref={dropdownRef}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: T.textDark }}>Student</label>

            {selectedStudent ? (
              // Selected state — show the chosen student with a clear button
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 1rem', backgroundColor: T.successBg, border: `1.5px solid ${T.successBorder}`, borderRadius: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: T.textDark, fontSize: '0.9rem' }}>{selectedStudent.name}</div>
                  <div style={{ fontSize: '0.75rem', color: T.textMuted }}>{selectedStudent.studentId} · {selectedStudent.program}</div>
                </div>
                <button type="button" onClick={clearStudent} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, fontSize: '1.1rem', lineHeight: 1, padding: '0.1rem' }}>✕</button>
              </div>
            ) : (
              // Search input + dropdown list
              <div style={{ position: 'relative' }}>
                <input
                  value={studentQuery}
                  onChange={e => { setStudentQuery(e.target.value); setShowDropdown(true); }}
                  onFocus={() => { setFocused('student'); setShowDropdown(true); }}
                  onBlur={() => setFocused('')}
                  placeholder={fetching ? 'Loading students...' : 'Type to search assigned students...'}
                  disabled={fetching}
                  style={{ ...inputStyle('student'), borderRadius: showDropdown && filteredStudents.length > 0 ? '8px 8px 0 0' : '8px' }}
                />
                {showDropdown && studentQuery.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', border: '1.5px solid #dde3ed', borderTop: 'none', borderRadius: '0 0 8px 8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', zIndex: 100, maxHeight: '200px', overflowY: 'auto' }}>
                    {filteredStudents.length === 0 ? (
                      <div style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: T.textMuted, fontStyle: 'italic' }}>
                        No matching students found.
                      </div>
                    ) : filteredStudents.map(s => (
                      <div
                        key={s.id}
                        onMouseDown={() => selectStudent(s)}
                        style={{ padding: '0.7rem 1rem', cursor: 'pointer', borderBottom: '1px solid #f1f3f7', transition: 'background 0.1s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f0f4ff'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}
                      >
                        <div style={{ fontWeight: '600', color: T.textDark, fontSize: '0.88rem' }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: T.textMuted }}>{s.studentId} · {s.program}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Company */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: T.textDark }}>Company</label>
            <input style={inputStyle('company')} value={company} onChange={e => setCompany(e.target.value)} onFocus={() => setFocused('company')} onBlur={() => setFocused('')} required />
          </div>

          {/* Form mode fields */}
          {mode === 'form' && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: T.textDark }}>Overall Performance (1–5): {rating}</label>
                <input type="range" min="1" max="5" value={rating} onChange={e => setRating(Number(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: T.textDark }}>Technical Skills (1–5): {skills}</label>
                <input type="range" min="1" max="5" value={skills} onChange={e => setSkills(Number(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: T.textDark }}>Communication (1–5): {communication}</label>
                <input type="range" min="1" max="5" value={communication} onChange={e => setCommunication(Number(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: T.textDark }}>Comments</label>
                <textarea style={{ ...inputStyle('comments'), minHeight: '90px' }} value={comments} onChange={e => setComments(e.target.value)} onFocus={() => setFocused('comments')} onBlur={() => setFocused('')} />
              </div>
            </>
          )}

          {/* PDF mode */}
          {mode === 'pdf' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem', color: T.textDark }}>Upload PDF Evaluation</label>
              {uploadState === 'done' ? (
                <div style={{ backgroundColor: T.successBg, border: `1.5px solid ${T.successBorder}`, borderRadius: '10px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: T.success, fontSize: '0.85rem' }}>PDF uploaded successfully</div>
                    <div style={{ fontSize: '0.75rem', color: T.textMuted }}>{uploadedFile?.name}</div>
                    <a href={uploadedFile?.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: T.blue, textDecoration: 'underline' }}>View PDF</a>
                  </div>
                </div>
              ) : (
                <label htmlFor="eval-pdf-upload"
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.75rem', border: `2px dashed ${dragOver ? T.blue : uploadState === 'error' ? T.danger : '#c5daf0'}`, borderRadius: '10px', cursor: 'pointer', backgroundColor: dragOver ? 'rgba(59,79,168,0.07)' : uploadState === 'error' ? 'rgba(220,38,38,0.07)' : '#f8fafc' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: T.textDark }}>
                    {dragOver ? 'Drop your PDF here' : 'Click or drag to upload PDF'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: T.textMuted }}>PDF only · max 10 MB</span>
                  {uploadState === 'uploading' && (
                    <div style={{ width: '100%', marginTop: '0.5rem', height: '6px', backgroundColor: '#dde3ed', borderRadius: '3px' }}>
                      <div style={{ height: '100%', width: `${progress}%`, backgroundColor: T.blue, borderRadius: '3px' }} />
                    </div>
                  )}
                  {uploadState === 'error' && <span style={{ fontSize: '0.85rem', fontWeight: 600, color: T.danger }}>{uploadError}</span>}
                  <input id="eval-pdf-upload" type="file" accept="application/pdf" style={{ display: 'none' }} onChange={onInputChange} />
                </label>
              )}
            </div>
          )}

          <button type="submit" disabled={loading || uploadState === 'uploading'} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none', backgroundColor: loading || uploadState === 'uploading' ? '#9baee0' : T.blue, color: '#fff', fontSize: '1rem', fontWeight: '700', cursor: loading || uploadState === 'uploading' ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: '0.5rem' }}>
            {loading ? 'Submitting...' : uploadState === 'uploading' ? 'Uploading PDF...' : 'Submit Evaluation'}
          </button>
        </form>

        <div style={{ marginTop: '1.2rem', textAlign: 'center', fontSize: '0.82rem', color: T.textMuted, textDecoration: 'underline', cursor: 'pointer' }} onClick={() => navigate('/employer/dashboard')}>
          Back to dashboard
        </div>
      </div>
    </div>
  );
}