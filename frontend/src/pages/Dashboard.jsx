import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers, FiFileText, FiTrendingUp, FiAward,
  FiBook, FiRefreshCw, FiAlertCircle, FiStar,
  FiBarChart2, FiClock, FiCheckCircle
} from 'react-icons/fi';
import './Dashboard.css';

// ─── API base ───────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

// ─── Small helpers ───────────────────────────────────────────
const gradeLabel = (marks, total) => {
  if (!total) return '—';
  const pct = (marks / total) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
};

const gradeColor = (marks, total) => {
  if (!total) return '#6b7280';
  const pct = (marks / total) * 100;
  if (pct >= 80) return '#10b981';
  if (pct >= 60) return '#f59e0b';
  return '#ef4444';
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '';

  // ✅ Fix: agar Z nahi hai string ke end mein toh lagao
  // taake browser UTC samjhe, local time nahi
  const normalized = typeof dateStr === 'string' && !dateStr.endsWith('Z')
    ? dateStr + 'Z'
    : dateStr;

  const diff = Date.now() - new Date(normalized).getTime();

  if (diff < 0) return 'just now';        // clock skew edge case

  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// ────────────────────────────────────────────────────────────
const Dashboard = ({ setLoading }) => {
  const navigate = useNavigate();

  const [teacher, setTeacher] = useState(null);       // logged-in teacher
  const [students, setStudents] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [recentEvals, setRecentEvals] = useState([]);
  const [toppers, setToppers] = useState([]);
  const [avgScore, setAvgScore] = useState(0);
  const [passRate, setPassRate] = useState(0);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // ── fetch logged-in teacher info ──────────────────────────
  const fetchTeacher = async () => {
    try {
      const res = await fetch(`${API}/api/me`, { headers: authHeaders() });
      if (res.status === 401) { navigate('/'); return null; }
      const data = await res.json();
      setTeacher(data);
      return data;
    } catch {
      return null;
    }
  };

  // ── fetch students added by this teacher ──────────────────
  const fetchStudents = async () => {
    const res = await fetch(`${API}/api/students`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Students fetch failed');
    const data = await res.json();
    // backend returns { students: [...] } or just [...]
    return Array.isArray(data) ? data : (data.students || []);
  };

  // ── fetch evaluations done by this teacher ────────────────
  const fetchEvaluations = async () => {
    const res = await fetch(`${API}/api/evaluations`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Evaluations fetch failed');
    const data = await res.json();
    return Array.isArray(data) ? data : (data.evaluations || []);
  };

  // ── derive stats from evaluations ────────────────────────
  const deriveStats = (evals, studs) => {
    if (!evals.length) {
      setToppers([]);
      setAvgScore(0);
      setPassRate(0);
      setRecentEvals([]);
      return;
    }

    // Average score (percentage)
    const scores = evals
      .filter(e => e.max_marks > 0)
      .map(e => (e.marks_awarded / e.max_marks) * 100);
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    setAvgScore(Math.round(avg));

    // Pass rate (>=50%)
    const passed = scores.filter(s => s >= 50).length;
    setPassRate(scores.length ? Math.round((passed / scores.length) * 100) : 0);

    // Top 2 students by latest/highest score
    const studentScoreMap = {};
    evals.forEach(e => {
      const sid = e.student_id || e.student?._id;
      if (!sid) return;
      const pct = e.max_marks > 0 ? (e.marks_awarded / e.max_marks) * 100 : 0;
      if (!studentScoreMap[sid] || pct > studentScoreMap[sid].pct) {
        studentScoreMap[sid] = {
          pct,
          obtained: e.marks_awarded,
          total: e.max_marks,
          evalData: e,
        };
      }
    });

    const sorted = Object.entries(studentScoreMap)
      .sort((a, b) => b[1].pct - a[1].pct)
      .slice(0, 2)
      .map(([sid, info]) => {
        const stu = studs.find(s => s._id === sid || String(s._id) === String(sid));
        return {
          _id: sid,
          name: stu?.name || info.evalData?.student_name || 'Student',
          rollNumber: stu?.rollNumber || stu?.roll_number || '—',
          obtained: info.obtained,
          total: info.total,
          pct: Math.round(info.pct),
        };
      });
    setToppers(sorted);

    // Recent 5 evaluations
    const recent = [...evals]
      .sort((a, b) => new Date(b.created_at || b.date || 0) - new Date(a.created_at || a.date || 0))
      .slice(0, 5);
    setRecentEvals(recent);
  };

  // ── main load ─────────────────────────────────────────────
  const loadData = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading?.(true, 'Loading dashboard...');
      setError('');

      const [t, studs, evals] = await Promise.all([
        fetchTeacher(),
        fetchStudents(),
        fetchEvaluations(),
      ]);

      setStudents(studs);
      setEvaluations(evals);
      deriveStats(evals, studs);
    } catch (err) {
      console.error(err);
      setError('Could not load dashboard data. Please try again.');
    } finally {
      isRefresh ? setRefreshing(false) : setLoading?.(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ─── Render ───────────────────────────────────────────────
  return (
    <div className="db-root">
      <div className="db-container">

        {/* ── Header ── */}
        <div className="db-header">
          <div>
            <p className="db-greeting">Welcome back 👋</p>
            <h1 className="db-title">
              {teacher?.name || 'Teacher'}'s Dashboard
            </h1>
            {teacher?.subject && (
              <span className="db-subject-badge">
                <FiBook size={12} /> {teacher.subject}
              </span>
            )}
          </div>

          <button
            className={`db-refresh-btn ${refreshing ? 'spinning' : ''}`}
            onClick={() => loadData(true)}
            disabled={refreshing}
            title="Refresh"
          >
            <FiRefreshCw size={16} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="db-error">
            <FiAlertCircle size={16} /> {error}
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="db-stats-grid">
          <div className="db-stat-card card-blue">
            <div className="db-stat-icon"><FiUsers size={26} /></div>
            <div className="db-stat-body">
              <span className="db-stat-label">My Students</span>
              <span className="db-stat-num">{students.length}</span>
            </div>
            <div className="db-stat-glow blue-glow" />
          </div>

          <div className="db-stat-card card-purple">
            <div className="db-stat-icon"><FiFileText size={26} /></div>
            <div className="db-stat-body">
              <span className="db-stat-label">Evaluations Done</span>
              <span className="db-stat-num">{evaluations.length}</span>
            </div>
            <div className="db-stat-glow purple-glow" />
          </div>

          <div className="db-stat-card card-green">
            <div className="db-stat-icon"><FiTrendingUp size={26} /></div>
            <div className="db-stat-body">
              <span className="db-stat-label">Avg Score</span>
              <span className="db-stat-num">{avgScore}%</span>
            </div>
            <div className="db-stat-glow green-glow" />
          </div>

          <div className="db-stat-card card-amber">
            <div className="db-stat-icon"><FiCheckCircle size={26} /></div>
            <div className="db-stat-body">
              <span className="db-stat-label">Pass Rate</span>
              <span className="db-stat-num">{passRate}%</span>
            </div>
            <div className="db-stat-glow amber-glow" />
          </div>
        </div>

        {/* ── Two column: Toppers + Recent Evals ── */}
        <div className="db-two-col">

          {/* Toppers */}
          <div className="db-card">
            <div className="db-card-head">
              <FiAward size={18} className="db-card-icon gold" />
              <h2>Top Performers</h2>
            </div>

            {toppers.length === 0 ? (
              <div className="db-empty">
                <FiBarChart2 size={32} />
                <p>No evaluations yet</p>
              </div>
            ) : (
              <div className="db-toppers-list">
                {toppers.map((t, i) => (
                  <div key={t._id} className="db-topper-row">
                    <div className={`db-rank rank-${i + 1}`}>
                      {i === 0 ? '🥇' : '🥈'}
                    </div>
                    <div className="db-topper-info">
                      <span className="db-topper-name">{t.name}</span>
                      <span className="db-topper-roll">{t.rollNumber}</span>
                    </div>
                    <div className="db-topper-score">
                      <span
                        className="db-grade-badge"
                        style={{ background: `${gradeColor(t.obtained, t.total)}22`, color: gradeColor(t.obtained, t.total) }}
                      >
                        {gradeLabel(t.obtained, t.total)}
                      </span>
                      <span className="db-pct">{t.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Evaluations */}
          <div className="db-card">
            <div className="db-card-head">
              <FiClock size={18} className="db-card-icon blue" />
              <h2>Recent Evaluations</h2>
            </div>

            {recentEvals.length === 0 ? (
              <div className="db-empty">
                <FiFileText size={32} />
                <p>No evaluations yet</p>
                <button className="db-cta-btn" onClick={() => navigate('/Evaluate')}>
                  Start Evaluating
                </button>
              </div>
            ) : (
              <div className="db-recent-list">
                {recentEvals.map((e, i) => {
                  const pct = e.max_marks > 0
                    ? Math.round((e.marks_awarded / e.max_marks) * 100)
                    : 0;
                  return (
                    <div key={e._id || i} className="db-recent-row">
                      <div className="db-recent-avatar">
                        {(e.student_name || 'S')[0].toUpperCase()}
                      </div>
                      <div className="db-recent-info">
                        <span className="db-recent-name">
                          {e.student_name || 'Student'}
                        </span>
                        <span className="db-recent-time">
                          {timeAgo(e.created_at || e.date)}
                        </span>
                      </div>
                      <div className="db-recent-score">
                        <div
                          className="db-mini-bar"
                          style={{ '--fill': `${pct}%`, '--clr': gradeColor(e.marks_awarded, e.max_marks) }}
                        >
                          <div className="db-mini-bar-fill" />
                        </div>
                        <span style={{ color: gradeColor(e.marks_awarded, e.max_marks) }}>
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── All Students Table ── */}
        <div className="db-card db-full-card">
          <div className="db-card-head">
            <FiUsers size={18} className="db-card-icon purple" />
            <h2>All My Students</h2>
            <button
              className="db-add-btn"
              onClick={() => navigate('/management')}
            >
              + Add Student
            </button>
          </div>

          {students.length === 0 ? (
            <div className="db-empty">
              <FiUsers size={32} />
              <p>No students added yet</p>
              <button className="db-cta-btn" onClick={() => navigate('/management')}>
                Go to Management
              </button>
            </div>
          ) : (
            <div className="db-table-wrap">
              <table className="db-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Roll No.</th>
                    <th>Email</th>
                    <th>Evaluations</th>
                    <th>Best Score</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => {
                    const stuEvals = evaluations.filter(
                      e => String(e.student_id || e.student?._id) === String(s._id)
                    );
                    const best = stuEvals.length
                      ? Math.max(...stuEvals.map(e =>
                          e.max_marks > 0 ? Math.round((e.marks_awarded / e.max_marks) * 100) : 0
                        ))
                      : null;
                    return (
                      <tr key={s._id}>
                        <td className="db-td-num">{i + 1}</td>
                        <td className="db-td-name">
                          <span className="db-stu-avatar">
                            {s.name?.[0]?.toUpperCase() || '?'}
                          </span>
                          {s.name}
                        </td>
                        <td>{s.rollNumber || s.roll_number || '—'}</td>
                        <td className="db-td-email">{s.email || '—'}</td>
                        <td>
                          <span className="db-eval-count">{stuEvals.length}</span>
                        </td>
                        <td>
                          {best !== null ? (
                            <span
                              className="db-score-pill"
                              style={{
                                background: `${gradeColor(best, 100)}22`,
                                color: gradeColor(best, 100),
                              }}
                            >
                              {best}%
                            </span>
                          ) : (
                            <span className="db-no-eval">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Quick Actions ── */}
        <div className="db-quick-actions">
          <h2 className="db-qa-title">Quick Actions</h2>
          <div className="db-qa-grid">
            <button className="db-qa-card" onClick={() => navigate('/evaluate')}>
              <FiStar size={24} />
              <span>Evaluate Single</span>
            </button>
            <button className="db-qa-card" onClick={() => navigate('/EvaluateBatch')}>
              <FiUsers size={24} />
              <span>Batch Evaluate</span>
            </button>
            <button className="db-qa-card" onClick={() => navigate('/history')}>
              <FiClock size={24} />
              <span>View History</span>
            </button>
            <button className="db-qa-card" onClick={() => navigate('/management')}>
              <FiBook size={24} />
              <span>Manage Students</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;