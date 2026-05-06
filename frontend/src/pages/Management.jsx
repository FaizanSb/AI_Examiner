import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiPlus, FiX, FiUser, FiHash, FiMail, FiBook, FiAlertCircle, FiCheckCircle, FiSearch } from 'react-icons/fi';
import './Management.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const Management = ({ setLoading }) => {
  const navigate = useNavigate();

  const [students, setStudents]         = useState([]);
  const [showForm, setShowForm]         = useState(false);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [deletingId, setDeletingId]     = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [searchQuery, setSearchQuery]   = useState('');

  const [newStudent, setNewStudent] = useState({
    name: '', email: '', rollNumber: '', class: ''
  });

  // ── Auth check + load ────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      setLoading?.(true, 'Loading students...');
      const res = await fetch(`${API}/api/students`, { headers: authHeaders() });

      if (res.status === 401) { navigate('/'); return; }
      if (!res.ok) throw new Error('Failed to fetch students');

      const data = await res.json();
      setStudents(Array.isArray(data) ? data : (data.students || []));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading?.(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────
  const showMsg = (type, msg) => {
    if (type === 'success') { setSuccess(msg); setError(''); }
    else                    { setError(msg);   setSuccess(''); }
    setTimeout(() => { setSuccess(''); setError(''); }, 3500);
  };

  const resetForm = () => {
    setNewStudent({ name: '', email: '', rollNumber: '', class: '' });
    setShowForm(false);
  };

  // ── Add Student ──────────────────────────────────────────
  const handleAddStudent = async () => {
    if (!newStudent.name.trim() || !newStudent.rollNumber.trim()) {
      showMsg('error', 'Name and Roll Number are required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch(`${API}/api/students`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(newStudent),
      });

      if (res.status === 401) { navigate('/'); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add student');

      setStudents(prev => [...prev, data.student || data]);
      resetForm();
      showMsg('success', `${newStudent.name} added successfully!`);
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete Student ───────────────────────────────────────
  const handleDelete = async (studentId, studentName) => {
    if (!window.confirm(`Delete "${studentName}"? This cannot be undone.`)) return;

    try {
      setDeletingId(studentId);
      const res = await fetch(`${API}/api/students/${studentId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (res.status === 401) { navigate('/'); return; }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }

      setStudents(prev => prev.filter(s => s._id !== studentId));
      showMsg('success', `${studentName} deleted.`);
    } catch (err) {
      showMsg('error', err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Filtered list ────────────────────────────────────────
  const filtered = students.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.rollNumber?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.class?.toLowerCase().includes(q)
    );
  });

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="mgmt-root">
      <div className="mgmt-container">

        {/* ── Page Header ── */}
        <div className="mgmt-page-header">
          <div>
            <h1 className="mgmt-title">Student Management</h1>
            <p className="mgmt-subtitle">Add, view, and manage your students</p>
          </div>
          <button
            className="mgmt-add-btn"
            onClick={() => { setShowForm(f => !f); setError(''); }}
          >
            {showForm ? <><FiX size={16} /> Cancel</> : <><FiPlus size={16} /> Add Student</>}
          </button>
        </div>

        {/* ── Alerts ── */}
        {error && (
          <div className="mgmt-alert mgmt-alert-error">
            <FiAlertCircle size={15} /> {error}
          </div>
        )}
        {success && (
          <div className="mgmt-alert mgmt-alert-success">
            <FiCheckCircle size={15} /> {success}
          </div>
        )}

        {/* ── Add Student Form ── */}
        {showForm && (
          <div className="mgmt-form-card">
            <h3 className="mgmt-form-title">New Student</h3>
            <div className="mgmt-form-grid">

              <div className="mgmt-field">
                <label><FiUser size={12} /> Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ali Hassan"
                  value={newStudent.name}
                  onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="mgmt-input"
                />
              </div>

              <div className="mgmt-field">
                <label><FiHash size={12} /> Roll Number *</label>
                <input
                  type="text"
                  placeholder="e.g. GCUF-2021-CS-001"
                  value={newStudent.rollNumber}
                  onChange={e => setNewStudent({ ...newStudent, rollNumber: e.target.value })}
                  className="mgmt-input"
                />
              </div>

              <div className="mgmt-field">
                <label><FiMail size={12} /> Email (optional)</label>
                <input
                  type="email"
                  placeholder="student@gcuf.edu.pk"
                  value={newStudent.email}
                  onChange={e => setNewStudent({ ...newStudent, email: e.target.value })}
                  className="mgmt-input"
                />
              </div>

              <div className="mgmt-field">
                <label><FiBook size={12} /> Class / Section (optional)</label>
                <input
                  type="text"
                  placeholder="e.g. BSCS-7A"
                  value={newStudent.class}
                  onChange={e => setNewStudent({ ...newStudent, class: e.target.value })}
                  className="mgmt-input"
                />
              </div>
            </div>

            <div className="mgmt-form-actions">
              <button
                className="mgmt-btn-primary"
                onClick={handleAddStudent}
                disabled={submitting}
              >
                {submitting ? 'Adding…' : 'Add Student'}
              </button>
              <button className="mgmt-btn-ghost" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* ── Search + Count Bar ── */}
        <div className="mgmt-toolbar">
          <div className="mgmt-search-wrap">
            <FiSearch size={15} className="mgmt-search-icon" />
            <input
              type="text"
              placeholder="Search by name, roll no, class…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="mgmt-search-input"
            />
          </div>
          <span className="mgmt-count">
            {filtered.length} / {students.length} students
          </span>
        </div>

        {/* ── Students List ── */}
        {filtered.length === 0 ? (
          <div className="mgmt-empty">
            {students.length === 0 ? (
              <>
                <div className="mgmt-empty-icon">👨‍🎓</div>
                <p>No students yet.</p>
                <span>Click "Add Student" to get started.</span>
              </>
            ) : (
              <>
                <div className="mgmt-empty-icon">🔍</div>
                <p>No results for "{searchQuery}"</p>
              </>
            )}
          </div>
        ) : (
          <div className="mgmt-table-wrap">
            <table className="mgmt-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Roll No.</th>
                  <th>Class</th>
                  <th>Email</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s._id} className={deletingId === s._id ? 'row-deleting' : ''}>
                    <td className="mgmt-td-num">{i + 1}</td>

                    <td className="mgmt-td-name">
                      <div className="mgmt-avatar">
                        {s.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span>{s.name}</span>
                    </td>

                    <td>
                      <span className="mgmt-roll-badge">{s.rollNumber || '—'}</span>
                    </td>

                    <td className="mgmt-td-muted">
                      {s.class || <span className="mgmt-dash">—</span>}
                    </td>

                    <td className="mgmt-td-muted">
                      {s.email || <span className="mgmt-dash">—</span>}
                    </td>

                    <td>
                      <button
                        className="mgmt-delete-btn"
                        onClick={() => handleDelete(s._id, s.name)}
                        disabled={deletingId === s._id}
                        title="Delete student"
                      >
                        {deletingId === s._id
                          ? <span className="mgmt-deleting-dot" />
                          : <FiTrash2 size={14} />
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default Management;