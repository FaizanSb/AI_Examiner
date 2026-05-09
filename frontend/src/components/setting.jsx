import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './setting.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// =========================
// AUTH HEADERS
// =========================
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const Setting = () => {

  const navigate = useNavigate();

  // =========================
  // STATES
  // =========================
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    subject: ''
  });

  const [loading, setLoading] = useState(false);

  // =========================
  // FETCH CURRENT TEACHER
  // =========================
  const fetchTeacher = useCallback(async () => {

    try {

      const res = await fetch(
        `${API}/api/me`,
        {
          headers: authHeaders()
        }
      );

      // unauthorized
      if (res.status === 401) {

        navigate('/');

        return;
      }

      const data = await res.json();

      console.log("Teacher Data:", data);

      // form fill
      setFormData({
        name: data.name || '',
        email: data.email || '',
        password: '',
        subject: data.subject || ''
      });

    } catch (err) {

      console.error("Fetch Teacher Error:", err);

    }

  }, [navigate]);

  // =========================
  // PAGE LOAD
  // =========================
  useEffect(() => {

    fetchTeacher();

  }, [fetchTeacher]);

  // =========================
  // HANDLE INPUT CHANGE
  // =========================
  const handleChange = (e) => {

    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });

  };

  // =========================
  // UPDATE PROFILE
  // =========================
  const handleSubmit = async (e) => {

    e.preventDefault();

    setLoading(true);

    // validation
    if (!formData.name || !formData.email) {

      alert("Please fill all required fields!");

      setLoading(false);

      return;
    }

    try {

      console.log("Updated Data:", formData);

      const res = await fetch(
        `${API}/api/update-profile`,
        {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(formData)
        }
      );

      const data = await res.json();

      // backend error
      if (!res.ok) {

        alert(data.message);

        return;
      }

      alert(data.message);

      // refresh updated data
      fetchTeacher();

    } catch (err) {

      console.error("Update Error:", err);

      alert("Update failed 😢");

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="settings-container">

      <h1 className="title">
        ⚙️ <span className='stng'>Settings</span>
      </h1>

      <form
        className="settings-form"
        onSubmit={handleSubmit}
      >

        {/* NAME */}
        <label>Name *</label>

        <input
          type="text"
          name="name"
          placeholder="Enter your name"
          value={formData.name}
          onChange={handleChange}
        />

        {/* EMAIL */}
        <label>Email *</label>

        <input
          type="email"
          name="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleChange}
        />

        {/* PASSWORD */}
        <label>Password</label>

        <input
          type="password"
          name="password"
          placeholder="New password"
          value={formData.password}
          onChange={handleChange}
        />

        {/* SUBJECT */}
        <label>Subject</label>

        <input
          type="text"
          name="subject"
          placeholder="Enter subject (e.g. Math)"
          value={formData.subject}
          onChange={handleChange}
        />

        {/* BUTTON */}
        <button
          type="submit"
          className="save-btn"
          disabled={loading}
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>

      </form>

    </div>
  );
};

export default Setting;