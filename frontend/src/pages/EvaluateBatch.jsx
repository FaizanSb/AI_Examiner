import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUploadCloud, FiCheckCircle, FiEdit2 } from 'react-icons/fi';
import './EvaluateBatch.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const authJsonHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const EvaluateBatch = ({ setLoading }) => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // Step 1 state
  const [modelAnswerText, setModelAnswerText] = useState('');
  const [modelAnswerFile, setModelAnswerFile] = useState(null);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [subject, setSubject] = useState('');
  const [totalMarks, setTotalMarks] = useState('');

  // Step 2 state
  const [batchFile, setBatchFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Step 3 state
  const [extractedStudents, setExtractedStudents] = useState([]);

  // Step 4 state
  const [results, setResults] = useState([]);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState(0);

  const [error, setError] = useState('');
  const [teacher, setTeacher] = useState(null);

  const fetchTeacher = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/me`, { headers: authHeaders() });
      if (res.status === 401) { navigate('/'); return; }
      const data = await res.json();
      setTeacher(data);
    } catch {
      // silent fail
    }
  }, [navigate]);

  useEffect(() => {
    fetchTeacher();
  }, [fetchTeacher]);

  const teacherDisplay = () => {
    if (!teacher) return 'Loading...';
    const subjectPart = teacher.subject ? ` (${teacher.subject})` : '';
    return `${teacher.name}${subjectPart}`;
  };

  // Step 1: Model answer PDF extract
  const handleModelAnswerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setIsExtractingPdf(true);
    setLoading(true, 'Extracting model answer...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API}/api/upload-model-answer`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });

      const data = await res.json();
      const text = data.model_answer || data.data?.model_answer || '';

      if (!text.trim()) throw new Error('Could not extract text from PDF');

      setModelAnswerText(text);
      setModelAnswerFile(file.name);
    } catch (err) {
      setError(err.message || 'Failed to extract PDF');
      setModelAnswerFile(null);
    } finally {
      setIsExtractingPdf(false);
      setLoading(false);
    }
  };

  // Step 2: Batch PDF upload + extract students
  const handleBatchUpload = async () => {
    if (!batchFile) return;

    setError('');
    setIsProcessing(true);
    setLoading(true, 'Extracting students from PDF...');

    try {
      const formData = new FormData();
      formData.append('file', batchFile);
      formData.append('subject', subject);
      formData.append('total_marks', totalMarks);

      const res = await fetch(`${API}/api/evaluate/bulk`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setExtractedStudents(data.students.map((s) => ({ ...s, edited: false })));
        setStep(3);
      } else {
        setError(data.message || 'Failed to extract students');
      }
    } catch (err) {
      setError(err.message || 'Server error');
    } finally {
      setIsProcessing(false);
      setLoading(false);
    }
  };

  // Step 3: Inline edit student
  const handleEditStudent = (index, field, value) => {
    const updated = [...extractedStudents];
    updated[index] = { ...updated[index], [field]: value, edited: true };
    setExtractedStudents(updated);
  };

  // Step 3 → 4: Evaluate
  const handleEvaluate = async () => {
    setError('');
    setIsEvaluating(true);
    setEvaluationProgress(0);
    setLoading(true, 'Evaluating answers...');

    console.log('Sending to bulk:', {
      students: extractedStudents,
      model_answer: modelAnswerText,
      total_marks: totalMarks,
      subject: subject,
      teacher_id: teacher?._id,
    });

    const progressInterval = setInterval(() => {
      setEvaluationProgress((p) => Math.min(p + 10, 90));
    }, 800);

    try {
      const res = await fetch(`${API}/api/evaluate/bulk`, {
        method: 'POST',
        headers: authJsonHeaders(),
        body: JSON.stringify({
          students: extractedStudents,
          model_answer: modelAnswerText,
          total_marks: totalMarks,
          subject: subject,
          teacher_id: teacher?._id,
        }),
      });

      const data = await res.json();
      clearInterval(progressInterval);
      setEvaluationProgress(100);

      if (data.success) {
        setResults(data.results);
        setTimeout(() => setStep(4), 500);
      } else {
        setError(data.message || 'Evaluation failed');
      }
    } catch (err) {
      clearInterval(progressInterval);
      setError(err.message || 'Server error');
    } finally {
      setIsEvaluating(false);
      setLoading(false);
    }
  };

  const classAverage = results.length
    ? (
      results.reduce((sum, r) => sum + (r.obtained_marks || 0), 0) /
      results.length
    ).toFixed(1)
    : 0;

  const resetAll = () => {
    setStep(1);
    setModelAnswerText('');
    setModelAnswerFile(null);
    setSubject('');
    setTotalMarks('');
    setBatchFile(null);
    setExtractedStudents([]);
    setResults([]);
    setEvaluationProgress(0);
    setError('');
  };

  return (
    <div className="evaluate">
      <div className="evaluate-container">
        <h1 className="page-title">Batch Evaluation</h1>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
            <div className="progress-circle">1</div>
            <p>Setup</p>
          </div>
          <div className={`progress-line ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
            <div className="progress-circle">2</div>
            <p>Upload PDF</p>
          </div>
          <div className={`progress-line ${step >= 3 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="progress-circle">3</div>
            <p>Review</p>
          </div>
          <div className={`progress-line ${step >= 4 ? 'active' : ''}`}></div>
          <div className={`progress-step ${step >= 4 ? 'active' : ''}`}>
            <div className="progress-circle">4</div>
            <p>Results</p>
          </div>
        </div>

        {error && <div className="error-alert">{error}</div>}

        {/* ── STEP 1: Setup ── */}
        {step === 1 && (
          <div className="step-content">
            <h2>Exam Setup</h2>
            <p className="step-description">
              Subject, total marks aur model answer enter karo
            </p>

            <div className="form-section">
              <h3>Teacher</h3>
              <div className="form-group">
                <label>Teacher</label>
                <div className="teacherName">{teacherDisplay()}</div>
              </div>
            </div>

            <div className="form-section">
              <h3>Exam Details</h3>
              <div className="form-group">
                <label>Subject Name *</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Data Structures"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Total Marks *</label>
                <input
                  type="number"
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(e.target.value)}
                  placeholder="e.g. 50"
                  className="form-input"
                  min="1"
                />
              </div>
            </div>

            <div className="form-section">
              <h3>Model Answer</h3>
              <div className="upload-area">
                <input
                  type="file"
                  id="modelAnswerFile"
                  accept=".pdf"
                  onChange={handleModelAnswerUpload}
                  className="file-input"
                />
                <label htmlFor="modelAnswerFile" className="upload-label">
                  <FiUploadCloud size={48} />
                  <p className="upload-text">Click or drag PDF file here</p>
                  <p className="upload-hint">or paste text below</p>
                </label>
              </div>

              {modelAnswerFile && !isExtractingPdf && (
                <div className="file-selected">
                  <FiCheckCircle color="green" />
                  <span>{modelAnswerFile}</span>
                </div>
              )}

              {isExtractingPdf && (
                <p className="extracting-hint">⏳ Extracting text from PDF...</p>
              )}

              <div className="form-group">
                <label>Or Paste Model Answer Text (Optional):</label>
                <textarea
                  value={modelAnswerText}
                  onChange={(e) => setModelAnswerText(e.target.value)}
                  placeholder="Ideal answer paste karo — isse evaluation zyada accurate hogi"
                  className="textarea"
                  rows="5"
                />
              </div>
            </div>

            <div className="button-group">
              <span />
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setStep(2)}
                disabled={!subject.trim() || !totalMarks || isExtractingPdf}
              >
                Next <span>→</span>
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: Upload Batch PDF ── */}
        {step === 2 && (
          <div className="step-content">
            <h2>Upload Class PDF</h2>
            <p className="step-description">
              Poori class ka combined PDF upload karo — system automatically
              students extract karega
            </p>

            <div className="upload-area">
              <input
                type="file"
                id="batchFile"
                accept=".pdf"
                onChange={(e) => {
                  setBatchFile(e.target.files[0] || null);
                  setError('');
                }}
                className="file-input"
              />
              <label htmlFor="batchFile" className="upload-label">
                <FiUploadCloud size={48} />
                <p className="upload-text">Click or drag PDF file here</p>
                <p className="upload-hint">Combined class answer sheets</p>
              </label>
            </div>

            {batchFile && (
              <div className="file-selected">
                <FiCheckCircle color="green" />
                <span>{batchFile.name}</span>
                <small className="file-size">
                  &nbsp;({(batchFile.size / 1024 / 1024).toFixed(2)} MB)
                </small>
              </div>
            )}

            <div className="button-group">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                ← Back
              </button>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleBatchUpload}
                disabled={!batchFile || isProcessing}
              >
                {isProcessing ? 'Processing... ⏳' : 'Extract Students →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Review Extracted Students ── */}
        {step === 3 && (
          <div className="step-content">
            <h2>Review Extracted Students</h2>
            <p className="step-description">
              System ne ye students detect kiye hain — koi galti ho toh edit
              kar sakte ho
            </p>

            <div className="students-table-wrapper">
              <table className="students-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>Pages</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {extractedStudents.map((s, i) => (
                    <tr key={i} className={s.edited ? 'edited-row' : ''}>
                      <td>{i + 1}</td>
                      <td>
                        <div className="inline-edit-wrap">
                          <input
                            value={s.name}
                            onChange={(e) =>
                              handleEditStudent(i, 'name', e.target.value)
                            }
                            className="inline-edit"
                          />
                          <FiEdit2 size={12} className="edit-icon" />
                        </div>
                      </td>
                      <td>
                        <div className="inline-edit-wrap">
                          <input
                            value={s.roll_no}
                            onChange={(e) =>
                              handleEditStudent(i, 'roll_no', e.target.value)
                            }
                            className="inline-edit"
                          />
                          <FiEdit2 size={12} className="edit-icon" />
                        </div>
                      </td>
                      <td className="pages-cell">{s.page_range || 'Auto'}</td>
                      <td>
                        <span className={`status-badge status-${s.status}`}>
                          {s.status === 'found' ? '✅ Registered' : '🆕 New'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {isEvaluating && (
              <div className="batch-progress-section">
                <p className="batch-progress-label">
                  Evaluating students... {evaluationProgress}%
                </p>
                <div className="batch-progress-bar">
                  <div
                    className="batch-progress-fill"
                    style={{ width: `${evaluationProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="button-group">
              <button
                className="btn btn-secondary"
                onClick={() => setStep(2)}
                disabled={isEvaluating}
              >
                ← Back
              </button>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleEvaluate}
                disabled={isEvaluating || extractedStudents.length === 0}
              >
                {isEvaluating
                  ? `Evaluating... ${evaluationProgress}%`
                  : '🚀 Start Evaluation'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Results ── */}
        {step === 4 && (
          <div className="step-content results-content">
            <h2>✅ Evaluation Complete</h2>
            <p className="step-description">
              Subject: <strong>{subject}</strong>
            </p>

            <div className="results-grid">
              <div className="result-card">
                <h3>Total Students</h3>
                <div className="marks-display">
                  <span className="marks-value">{results.length}</span>
                </div>
              </div>
              <div className="result-card">
                <h3>Class Average</h3>
                <div className="marks-display">
                  <span className="marks-value">{classAverage}</span>
                  <span className="marks-max">/ {totalMarks}</span>
                </div>
              </div>
              <div className="result-card">
                <h3>Total Marks</h3>
                <div className="marks-display">
                  <span className="marks-value">{totalMarks}</span>
                </div>
              </div>
            </div>

            <div className="result-section">
              <h3>Student Results</h3>
              <div className="students-table-wrapper">
                <table className="students-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Roll No</th>
                      <th>Obtained</th>
                      <th>Total</th>
                      <th>%</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{r.name}</td>
                        <td>{r.roll_no}</td>
                        <td>
                          <strong className="obtained-marks">
                            {r.obtained_marks}
                          </strong>
                        </td>
                        <td>{totalMarks}</td>
                        <td>
                          {((r.obtained_marks / totalMarks) * 100).toFixed(1)}%
                        </td>
                        <td className="remarks-cell">{r.remarks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="button-group">
              <button className="btn btn-secondary" onClick={resetAll}>
                🔄 New Evaluation
              </button>
              <button className="btn btn-primary">📥 Export Results</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluateBatch;