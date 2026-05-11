import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUploadCloud,
  FiCheckCircle,
  FiEdit2,
} from 'react-icons/fi';

import './EvaluateBatch.css';

const API =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const EvaluateBatch = ({ setLoading }) => {

  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  // STEP 1
  const [modelAnswerText, setModelAnswerText] =
    useState('');

  const [modelAnswerFile, setModelAnswerFile] =
    useState(null);

  const [isExtractingPdf, setIsExtractingPdf] =
    useState(false);

  const [totalMarks, setTotalMarks] =
    useState('');

  // STEP 2
  const [batchFile, setBatchFile] =
    useState(null);

  const [isProcessing, setIsProcessing] =
    useState(false);

  // RESULTS
  const [results, setResults] =
    useState([]);

  const [evaluationProgress, setEvaluationProgress] =
    useState(0);

  const [error, setError] =
    useState('');

  const [teacher, setTeacher] =
    useState(null);

  // =========================
  // FETCH TEACHER
  // =========================

  const fetchTeacher = useCallback(async () => {

    try {

      const res = await fetch(
        `${API}/api/me`,
        {
          headers: authHeaders(),
        }
      );

      if (res.status === 401) {

        navigate('/');

        return;
      }

      const data = await res.json();

      setTeacher(data);

    } catch {

      // silent fail

    }

  }, [navigate]);

  useEffect(() => {

    fetchTeacher();

  }, [fetchTeacher]);

  // =========================
  // TEACHER DISPLAY
  // =========================

  const teacherDisplay = () => {

    if (!teacher) return 'Loading...';

    const subjectPart = teacher.subject
      ? ` (${teacher.subject})`
      : '';

    return `${teacher.name}${subjectPart}`;
  };

  // =========================
  // MODEL ANSWER PDF
  // =========================

  const handleModelAnswerUpload = async (e) => {

    const file = e.target.files[0];

    if (!file) return;

    setError('');

    setIsExtractingPdf(true);

    setLoading(
      true,
      'Extracting model answer...'
    );

    try {

      const formData = new FormData();

      formData.append('file', file);

      const res = await fetch(
        `${API}/api/upload-model-answer`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: formData,
        }
      );

      const data = await res.json();

      const text =
        data.model_answer ||
        '';

      if (!text.trim()) {

        throw new Error(
          'Could not extract text from PDF'
        );
      }

      setModelAnswerText(text);

      setModelAnswerFile(file.name);

    } catch (err) {

      setError(
        err.message ||
        'Failed to extract PDF'
      );

      setModelAnswerFile(null);

    } finally {

      setIsExtractingPdf(false);

      setLoading(false);
    }
  };

  // =========================
  // PROCESS PDF + EVALUATE
  // =========================

  const handleBatchUpload = async () => {

    if (!batchFile) return;

    setError('');

    setIsProcessing(true);

    setEvaluationProgress(0);

    setLoading(
      true,
      'Processing class PDF...'
    );

    const progressInterval =
      setInterval(() => {

        setEvaluationProgress((p) =>
          Math.min(p + 10, 90)
        );

      }, 700);

    try {

      const formData = new FormData();

      formData.append('file', batchFile);

      formData.append(
        'model_answer',
        modelAnswerText
      );

      formData.append(
        'total_marks',
        totalMarks
      );

      const res = await fetch(
        `${API}/api/evaluate/bulk`,
        {
          method: 'POST',
          headers: authHeaders(),
          body: formData,
        }
      );

      if (!res.ok) {

        throw new Error(
          `Server Error ${res.status}`
        );
      }

      const data = await res.json();

      console.log(
        'Bulk Evaluation:',
        data
      );

      clearInterval(progressInterval);

      setEvaluationProgress(100);

      if (
        data.success &&
        Array.isArray(data.results)
      ) {

        const formatted =
          data.results.map((s) => ({
            ...s,
            edited: false,
          }));

        setResults(formatted);

        setStep(3);

      } else {

        setError(
          data.message ||
          'Failed processing PDF'
        );
      }

    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        'Server error'
      );

    } finally {

      clearInterval(progressInterval);

      setIsProcessing(false);

      setLoading(false);
    }
  };

  // =========================
  // INLINE EDIT
  // =========================

  const handleEditStudent = (
    index,
    field,
    value
  ) => {

    const updated = [...results];

    updated[index] = {
      ...updated[index],
      [field]: value,
      edited: true,
    };

    setResults(updated);
  };

  // =========================
  // CLASS AVERAGE
  // =========================

  const classAverage =
    results.length > 0
      ? (
          results.reduce(
            (sum, r) =>
              sum +
              Number(
                r.obtained_marks || 0
              ),
            0
          ) / results.length
        ).toFixed(1)
      : 0;

  // =========================
  // RESET
  // =========================

  const resetAll = () => {

    setStep(1);

    setModelAnswerText('');

    setModelAnswerFile(null);

    setTotalMarks('');

    setBatchFile(null);

    setResults([]);

    setEvaluationProgress(0);

    setError('');
  };

  return (
    <div className="evaluate">

      <div className="evaluate-container">

        <h1 className="page-title">
          Batch Evaluation
        </h1>

        {/* ===================== */}
        {/* PROGRESS */}
        {/* ===================== */}

        <div className="progress-bar">

          <div
            className={`progress-step ${
              step >= 1
                ? 'active'
                : ''
            }`}
          >
            <div className="progress-circle">
              1
            </div>

            <p>Setup</p>
          </div>

          <div
            className={`progress-line ${
              step >= 2
                ? 'active'
                : ''
            }`}
          ></div>

          <div
            className={`progress-step ${
              step >= 2
                ? 'active'
                : ''
            }`}
          >
            <div className="progress-circle">
              2
            </div>

            <p>Upload PDF</p>
          </div>

          <div
            className={`progress-line ${
              step >= 3
                ? 'active'
                : ''
            }`}
          ></div>

          <div
            className={`progress-step ${
              step >= 3
                ? 'active'
                : ''
            }`}
          >
            <div className="progress-circle">
              3
            </div>

            <p>Results</p>
          </div>

        </div>

        {/* ===================== */}
        {/* ERROR */}
        {/* ===================== */}

        {error && (
          <div className="error-alert">
            {error}
          </div>
        )}

        {/* ===================== */}
        {/* STEP 1 */}
        {/* ===================== */}

        {step === 1 && (

          <div className="step-content">

            <h2>Exam Setup</h2>

            <p className="step-description">
              Total marks aur model answer
              enter karo
            </p>

            {/* Teacher */}

            <div className="form-section">

              <h3>Teacher</h3>

              <div className="form-group">

                <label>Teacher</label>

                <div className="teacherName">
                  {teacherDisplay()}
                </div>

              </div>

            </div>

            {/* Total Marks */}

            <div className="form-section">

              <h3>Exam Details</h3>

              <div className="form-group">

                <label>
                  Total Marks *
                </label>

                <input
                  type="number"
                  value={totalMarks}
                  onChange={(e) =>
                    setTotalMarks(
                      e.target.value
                    )
                  }
                  placeholder="e.g. 50"
                  className="form-input"
                  min="1"
                />

              </div>

            </div>

            {/* Model Answer */}

            <div className="form-section">

              <h3>Model Answer</h3>

              <div className="upload-area">

                <input
                  type="file"
                  id="modelAnswerFile"
                  accept=".pdf"
                  onChange={
                    handleModelAnswerUpload
                  }
                  className="file-input"
                />

                <label
                  htmlFor="modelAnswerFile"
                  className="upload-label"
                >

                  <FiUploadCloud size={48} />

                  <p className="upload-text">
                    Click or drag PDF file
                    here
                  </p>

                  <p className="upload-hint">
                    or paste text below
                  </p>

                </label>

              </div>

              {modelAnswerFile &&
                !isExtractingPdf && (

                  <div className="file-selected">

                    <FiCheckCircle color="green" />

                    <span>
                      {modelAnswerFile}
                    </span>

                  </div>

                )}

              {isExtractingPdf && (

                <p className="extracting-hint">
                  ⏳ Extracting text from
                  PDF...
                </p>

              )}

              <div className="form-group">

                <label>
                  Or Paste Model Answer:
                </label>

                <textarea
                  value={modelAnswerText}
                  onChange={(e) =>
                    setModelAnswerText(
                      e.target.value
                    )
                  }
                  placeholder="Paste ideal answer..."
                  className="textarea"
                  rows="5"
                />

              </div>

            </div>

            <div className="button-group">

              <span />

              <button
                className="btn btn-primary btn-lg"
                onClick={() =>
                  setStep(2)
                }
                disabled={
                  !totalMarks ||
                  isExtractingPdf
                }
              >
                Next →
              </button>

            </div>

          </div>
        )}

        {/* ===================== */}
        {/* STEP 2 */}
        {/* ===================== */}

        {step === 2 && (

          <div className="step-content">

            <h2>Upload Class PDF</h2>

            <p className="step-description">
              Combined answer sheet PDF
              upload karo
            </p>

            <div className="upload-area">

              <input
                type="file"
                id="batchFile"
                accept=".pdf"
                onChange={(e) => {

                  setBatchFile(
                    e.target.files[0] ||
                    null
                  );

                  setError('');

                }}
                className="file-input"
              />

              <label
                htmlFor="batchFile"
                className="upload-label"
              >

                <FiUploadCloud size={48} />

                <p className="upload-text">
                  Click or drag PDF file
                  here
                </p>

                <p className="upload-hint">
                  Combined class answer
                  sheets
                </p>

              </label>

            </div>

            {batchFile && (

              <div className="file-selected">

                <FiCheckCircle color="green" />

                <span>
                  {batchFile.name}
                </span>

                <small className="file-size">
                  &nbsp;(
                  {(
                    batchFile.size /
                    1024 /
                    1024
                  ).toFixed(2)}{' '}
                  MB)
                </small>

              </div>

            )}

            {isProcessing && (

              <div className="batch-progress-section">

                <p className="batch-progress-label">
                  Processing PDF...
                  {' '}
                  {evaluationProgress}%
                </p>

                <div className="batch-progress-bar">

                  <div
                    className="batch-progress-fill"
                    style={{
                      width:
                        `${evaluationProgress}%`,
                    }}
                  />

                </div>

              </div>

            )}

            <div className="button-group">

              <button
                className="btn btn-secondary"
                onClick={() =>
                  setStep(1)
                }
              >
                ← Back
              </button>

              <button
                className="btn btn-primary btn-lg"
                onClick={
                  handleBatchUpload
                }
                disabled={
                  !batchFile ||
                  isProcessing
                }
              >
                {isProcessing
                  ? 'Processing... ⏳'
                  : '🚀 Start Evaluation'}
              </button>

            </div>

          </div>
        )}

        {/* ===================== */}
        {/* STEP 3 */}
        {/* ===================== */}

        {step === 3 && (

          <div className="step-content results-content">

            <h2>
              ✅ Evaluation Complete
            </h2>

            <p className="step-description">

              Subject:
              {' '}
              <strong>
                {teacher?.subject ||
                  'N/A'}
              </strong>

            </p>

            {/* CARDS */}

            <div className="results-grid">

              <div className="result-card">

                <h3>Total Students</h3>

                <div className="marks-display">

                  <span className="marks-value">
                    {results.length}
                  </span>

                </div>

              </div>

              <div className="result-card">

                <h3>Class Average</h3>

                <div className="marks-display">

                  <span className="marks-value">
                    {classAverage}
                  </span>

                  <span className="marks-max">
                    / {totalMarks}
                  </span>

                </div>

              </div>

              <div className="result-card">

                <h3>Total Marks</h3>

                <div className="marks-display">

                  <span className="marks-value">
                    {totalMarks}
                  </span>

                </div>

              </div>

            </div>

            {/* TABLE */}

            <div className="result-section">

              <h3>Student Results</h3>

              <div className="students-table-wrapper">

                <table className="students-table">

                  <thead>

                    <tr>

                      <th>#</th>

                      <th>Name</th>

                      <th>Roll No</th>

                      <th>Status</th>

                      <th>Obtained</th>

                      <th>%</th>

                      <th>Remarks</th>

                    </tr>

                  </thead>

                  <tbody>

                    {results.map((s, i) => (

                      <tr
                        key={i}
                        className={
                          s.edited
                            ? 'edited-row'
                            : ''
                        }
                      >

                        <td>{i + 1}</td>

                        {/* NAME */}

                        <td>

                          <div className="inline-edit-wrap">

                            <input
                              value={
                                s.name
                              }
                              onChange={(e) =>
                                handleEditStudent(
                                  i,
                                  'name',
                                  e.target
                                    .value
                                )
                              }
                              className="inline-edit"
                            />

                            <FiEdit2
                              size={12}
                              className="edit-icon"
                            />

                          </div>

                        </td>

                        {/* ROLL */}

                        <td>

                          <div className="inline-edit-wrap">

                            <input
                              value={
                                s.roll_no
                              }
                              onChange={(e) =>
                                handleEditStudent(
                                  i,
                                  'roll_no',
                                  e.target
                                    .value
                                )
                              }
                              className="inline-edit"
                            />

                            <FiEdit2
                              size={12}
                              className="edit-icon"
                            />

                          </div>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`status-badge status-${s.status}`}
                          >

                            {s.status ===
                            'found'
                              ? '✅ Registered'
                              : '🆕 New'}

                          </span>

                        </td>

                        {/* MARKS */}

                        <td>

                          <strong className="obtained-marks">
                            {
                              s.obtained_marks
                            }
                          </strong>

                        </td>

                        {/* PERCENTAGE */}

                        <td>

                          {(
                            (s.obtained_marks /
                              totalMarks) *
                            100
                          ).toFixed(1)}
                          %

                        </td>

                        {/* REMARKS */}

                        <td className="remarks-cell">
                          {s.remarks}
                        </td>

                      </tr>

                    ))}

                  </tbody>

                </table>

              </div>

            </div>

            {/* BUTTONS */}

            <div className="button-group">

              <button
                className="btn btn-secondary"
                onClick={resetAll}
              >
                🔄 New Evaluation
              </button>

              <button className="btn btn-primary">
                📥 Export Results
              </button>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default EvaluateBatch;