import React, { useState, useEffect } from 'react';
import { FiUsers, FiFileText, FiTrendingUp } from 'react-icons/fi';
import { getAllTeachers, getAllStudents, getEvaluations } from '../services/api';
import './Dashboard.css';

const Dashboard = ({ setLoading }) => {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    totalEvaluations: 0
  });
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true, 'Loading dashboard data...');
      const [teachersRes, studentsRes, evaluationsRes] = await Promise.all([
        getAllTeachers(),
        getAllStudents(),
        getEvaluations()
      ]);

      // Debug kar — console mein dekh kya aa raha hai
      console.log('Evaluations Response:', evaluationsRes);

      const teachersList = teachersRes?.teachers || [];
      const studentsList = studentsRes?.students || [];

      // Flexible extraction — jo bhi key ho
      const evalCount = Array.isArray(evaluationsRes) ? evaluationsRes.length : 0;

      setTeachers(teachersList);
      setStudents(studentsList);

      setStats({
        totalTeachers: teachersList.length,
        totalStudents: studentsList.length,
        totalEvaluations: evalCount
      });
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <h1 className="page-title">Dashboard</h1>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon teachers">
              <FiUsers size={32} />
            </div>
            <div className="stat-content">
              <h3>Total Teachers</h3>
              <p className="stat-number">{stats.totalTeachers}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon students">
              <FiFileText size={32} />
            </div>
            <div className="stat-content">
              <h3>Total Students</h3>
              <p className="stat-number">{stats.totalStudents}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon evaluations">
              <FiTrendingUp size={32} />
            </div>
            <div className="stat-content">
              <h3>Evaluations</h3>
              <p className="stat-number">{stats.totalEvaluations}</p>
            </div>
          </div>
        </div>

        {/* Teachers List */}
        <div className="dashboard-section">
          <h2 className="section-heading">Teachers</h2>
          {teachers.length > 0 ? (
            <div className="list-grid">
              {teachers.map(teacher => (
                <div key={teacher._id} className="list-card">
                  <div className="card-header">
                    <div className="avatar">👨‍🏫</div>
                    <h3>{teacher.name}</h3>
                  </div>
                  <p className="card-subtitle">{teacher.subject}</p>
                  <p className="card-text">{teacher.email}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No teachers added yet</p>
            </div>
          )}
        </div>

        {/* Students List */}
        <div className="dashboard-section">
          <h2 className="section-heading">Students</h2>
          {students.length > 0 ? (
            <div className="list-grid">
              {students.map(student => (
                <div key={student._id} className="list-card">
                  <div className="card-header">
                    <div className="avatar">👨‍🎓</div>
                    <h3>{student.name}</h3>
                  </div>
                  <p className="card-subtitle">{student.rollNumber}</p>
                  <p className="card-text">{student.email}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No students added yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;