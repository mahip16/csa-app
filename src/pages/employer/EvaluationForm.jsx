import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { validatePdfFile } from '../../utils/validation';

const pageBg = 'linear-gradient(135deg, #dff0f7 0%, #eef4fb 30%, #fdf9ee 70%, #fef8e1 100%)';

export default function EmployerEvaluationForm() {
  const navigate = useNavigate();

  const [mode, setMode] = useState('form'); // 'form' or 'pdf'

  // form fields
  const [studentName, setStudentName] = useState('');
  const [company, setCompany] = useState('');
  const [rating, setRating] = useState(3);
  const [skills, setSkills] = useState(3);
  const [communication, setCommunication] = useState(3);
  const [comments, setComments] = useState('');

  // pdf upload
  const [uploadState, setUploadState] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState('');

  const inputStyle = (name) => ({
    width: '100%',
    boxSizing: 'border-box',
    padding: '0.7rem 1rem',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    color: '#0f1f4b',
    backgroundColor: '#f8fafc',
    border: `1.5px solid ${focused === name ? '#3b4fa8' : '#dde3ed'}`,
    borderRadius: '8px',
    outline: 'none',
  });

  function handleFile(file) {
    const { valid, error } = validatePdfFile(file);
    if (!valid) {
      setUploadState('error');
      setUploadError(error);
      return;
    }

    setUploadState('uploading');
    setProgress(0);
    setUploadError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'eval_upload'); // Cloudinary preset
    formData.append('folder', 'evaluations'); // folder in Cloudinary

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://api.cloudinary.com/v1_1/dpde2xmkz/raw/upload');

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        setProgress(percent);
      }
    });

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        setUploadedFile({ url: data.secure_url, name: file.name });
        setUploadState('done');
      } else {
        setUploadState('error');
        setUploadError('Upload failed. Please try again.');
      }
    };

    xhr.onerror = () => {
      setUploadState('error');
      setUploadError('Upload failed. Please try again.');
    };

    xhr.send(formData);
  }

  function onInputChange(e) {
    if (e.target.files[0]) handleFile(e.target.files[0]);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!studentName || !company) {
      setError('Please fill in required fields.');
      return;
    }

    if (mode === 'pdf' && !uploadedFile) {
      setError('Please upload a PDF evaluation first.');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'evaluations'), {
        studentName,
        company,
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
        <h1 style={{ fontSize: '1.5rem', color: '#0f1f4b', fontWeight: 700 }}>Employer Evaluation Form</h1>
        <p style={{ fontSize: '0.9rem', color: '#8a95a8', marginBottom: '1.5rem' }}>Submit feedback for a co-op student</p>

        {/* Toggle */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', backgroundColor: '#f8fafc', border: '1.5px solid #dde3ed', borderRadius: '10px', padding: '0.3rem' }}>
          {[{ key: 'form', label: 'Fill Out Form' }, { key: 'pdf', label: 'Upload PDF' }].map(opt => (
            <button key={opt.key} type="button" onClick={() => setMode(opt.key)} style={{ flex: 1, padding: '0.55rem', borderRadius: '7px', border: 'none', fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', backgroundColor: mode === opt.key ? '#3b4fa8' : 'transparent', color: mode === opt.key ? '#fff' : '#8a95a8', transition: 'all 0.15s' }}>
              {opt.label}
            </button>
          ))}
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', padding: '0.7rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.82rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* shared fields */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>Student Name</label>
            <input style={inputStyle('studentName')} value={studentName} onChange={e => setStudentName(e.target.value)} onFocus={() => setFocused('studentName')} onBlur={() => setFocused('')} required />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>Company</label>
            <input style={inputStyle('company')} value={company} onChange={e => setCompany(e.target.value)} onFocus={() => setFocused('company')} onBlur={() => setFocused('')} required />
          </div>

          {/* form mode */}
          {mode === 'form' && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Overall Performance (1–5): {rating}</label>
                <input type="range" min="1" max="5" value={rating} onChange={e => setRating(Number(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Technical Skills (1–5): {skills}</label>
                <input type="range" min="1" max="5" value={skills} onChange={e => setSkills(Number(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Communication (1–5): {communication}</label>
                <input type="range" min="1" max="5" value={communication} onChange={e => setCommunication(Number(e.target.value))} style={{ width: '100%' }} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>Comments</label>
                <textarea style={{ ...inputStyle('comments'), minHeight: '90px' }} value={comments} onChange={e => setComments(e.target.value)} onFocus={() => setFocused('comments')} onBlur={() => setFocused('')} />
              </div>
            </>
          )}

          {/* pdf mode */}
          {mode === 'pdf' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.4rem' }}>Upload PDF Evaluation</label>

              {uploadState === 'done' ? (
                <div style={{ backgroundColor: 'rgba(22,163,74,0.08)', border: '1.5px solid rgba(22,163,74,0.22)', borderRadius: '10px', padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: '#16a34a', fontSize: '0.85rem' }}>PDF uploaded successfully</div>
                    <div style={{ fontSize: '0.75rem', color: '#8a95a8' }}>{uploadedFile?.name}</div>
                    <a
                      href={uploadedFile?.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.8rem', color: '#3b4fa8', textDecoration: 'underline' }}
                    >
                      View PDF
                    </a>
                  </div>
                </div>
              ) : (
                <label htmlFor="eval-pdf-upload"
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.75rem', border: `2px dashed ${dragOver ? '#3b4fa8' : uploadState === 'error' ? '#dc2626' : '#c5daf0'}`, borderRadius: '10px', cursor: 'pointer', backgroundColor: dragOver ? 'rgba(59,79,168,0.07)' : uploadState === 'error' ? 'rgba(220,38,38,0.07)' : '#f8fafc' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0f1f4b' }}>
                    {dragOver ? 'Drop your PDF here' : 'Click or drag to upload PDF'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#8a95a8' }}>PDF only · max 10 MB</span>
                  {uploadState === 'uploading' && (
                    <div style={{ width: '100%', marginTop: '0.5rem', height: '6px', backgroundColor: '#dde3ed', borderRadius: '3px' }}>
                      <div style={{ height: '100%', width: `${progress}%`, backgroundColor: '#3b4fa8', borderRadius: '3px' }} />
                    </div>
                  )}
                  {uploadState === 'error' && <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#dc2626' }}>{uploadError}</span>}
                  <input id="eval-pdf-upload" type="file" accept="application/pdf" style={{ display: 'none' }} onChange={onInputChange} />
                </label>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: 'none', backgroundColor: loading ? '#9baee0' : '#3b4fa8', color: '#fff', fontSize: '1rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: '0.5rem' }}>
            {loading ? 'Submitting...' : 'Submit Evaluation'}
          </button>
        </form>

        <div style={{ marginTop: '1.2rem', textAlign: 'center', fontSize: '0.82rem', color: '#8a95a8', textDecoration: 'underline', cursor: 'pointer' }} onClick={() => navigate('/employer/dashboard')}>
          Back to dashboard
        </div>
      </div>
    </div>
  );
}