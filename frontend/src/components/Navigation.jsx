import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiChevronDown, FiUser, FiUsers } from 'react-icons/fi';
import './setting';
import './Navigation.css';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isEvalOpen, setIsEvalOpen] = useState(false);

  const profileRef = useRef(null);
  const evalRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  /* =========================
     AUTH STATES
  ========================= */
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     FETCH LOGGED-IN TEACHER
  ========================= */
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setTeacher(null);
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:5000/api/me", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setTeacher(null);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setTeacher(data);
      } catch (err) {
        console.error("Auth Error:", err);
        setTeacher(null);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, []);

  /* =========================
     ACTIVE LINKS
  ========================= */
  const isActive = (path) => location.pathname === path;

  const isEvalActive =
    location.pathname === '/evaluate' ||
    location.pathname === '/EvaluateBatch';

  /* =========================
     CLOSE PROFILE DROPDOWN
  ========================= */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* =========================
     CLOSE EVALUATE DROPDOWN
  ========================= */
  useEffect(() => {
    const handler = (e) => {
      if (evalRef.current && !evalRef.current.contains(e.target)) {
        setIsEvalOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);

    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* =========================
     LOGOUT
  ========================= */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setIsProfileOpen(false);

    navigate("/");

    window.location.reload();
  };

  /* =========================
     MOBILE CLOSE
  ========================= */
  const handleMobileClose = () => {
    setIsMobileMenuOpen(false);
    setIsEvalOpen(false);
  };

  /* =========================
     LOADING
  ========================= */
  if (loading) return null;

  return (
    <nav className="navbar">
      <div className="navbar-container">

        {/* LOGO */}
        <Link
          to="/"
          className="navbar-logo"
          onClick={handleMobileClose}
        >
          <span className="logo-icon">📝</span>
          PaperLens AI
        </Link>

        {/* MOBILE MENU BUTTON */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        {/* NAV MENU */}
        <ul className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>

          {/* HOME */}
          <li className="nav-item">
            <Link
              to="/"
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={handleMobileClose}
            >
              Home
            </Link>
          </li>

          {/* LOGGED IN NAVIGATION */}
          {teacher && (
            <>
              {/* DASHBOARD */}
              <li className="nav-item">
                <Link
                  to="/dashboard"
                  className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                  onClick={handleMobileClose}
                >
                  Dashboard
                </Link>
              </li>

              {/* MANAGEMENT */}
              <li className="nav-item">
                <Link
                  to="/management"
                  className={`nav-link ${isActive('/management') ? 'active' : ''}`}
                  onClick={handleMobileClose}
                >
                  Management
                </Link>
              </li>

              {/* HISTORY */}
              <li className="nav-item">
                <Link
                  to="/history"
                  className={`nav-link ${isActive('/history') ? 'active' : ''}`}
                  onClick={handleMobileClose}
                >
                  History
                </Link>
              </li>

              {/* EVALUATE DROPDOWN */}
              <li className="nav-item eval-item" ref={evalRef}>

                <button
                  className={`nav-link nav-link-primary eval-desktop-btn ${isEvalActive ? 'active' : ''}`}
                  onClick={() => setIsEvalOpen(!isEvalOpen)}
                >
                  Evaluate Now

                  <FiChevronDown
                    size={14}
                    className={`eval-chevron ${isEvalOpen ? 'open' : ''}`}
                  />
                </button>

                {isEvalOpen && (
                  <div className="eval-dropdown">

                    <div className="eval-dd-header">
                      Choose evaluation mode
                    </div>

                    {/* SINGLE */}
                    <button
                      className="eval-dd-item"
                      onClick={() => {
                        navigate('/evaluate');
                        setIsEvalOpen(false);
                        handleMobileClose();
                      }}
                    >
                      <span className="eval-dd-icon single">
                        <FiUser size={15} />
                      </span>

                      <div>
                        <div className="eval-dd-title">
                          Single Student
                        </div>

                        <div className="eval-dd-sub">
                          Evaluate one answer sheet
                        </div>
                      </div>
                    </button>

                    {/* BATCH */}
                    <button
                      className="eval-dd-item"
                      onClick={() => {
                        navigate('/EvaluateBatch');
                        setIsEvalOpen(false);
                        handleMobileClose();
                      }}
                    >
                      <span className="eval-dd-icon batch">
                        <FiUsers size={15} />
                      </span>

                      <div>
                        <div className="eval-dd-title">
                          Entire Class
                          <span className="eval-badge">Batch</span>
                        </div>

                        <div className="eval-dd-sub">
                          Bulk upload all students
                        </div>
                      </div>
                    </button>
                  </div>
                )}

                {/* MOBILE LINKS */}
                <div className="eval-mobile-links">

                  <Link
                    to="/evaluate"
                    className="eval-mobile-single"
                    onClick={handleMobileClose}
                  >
                    <FiUser size={14} />
                    Single Student
                  </Link>

                  <Link
                    to="/EvaluateBatch"
                    className="eval-mobile-batch"
                    onClick={handleMobileClose}
                  >
                    <FiUsers size={14} />
                    Entire Class

                    <span className="eval-badge">
                      Batch
                    </span>
                  </Link>

                </div>
              </li>
            </>
          )}

          {/* NOT LOGGED IN */}
          {!teacher && (
            <li className="nav-item">
              <button
                className="nav-link nav-link-primary"
                onClick={() => navigate("./login")}
              >
                Login
              </button>
            </li>
          )}

          {/* PROFILE */}
          {teacher && (
            <li
              className="nav-item profile-item"
              ref={profileRef}
            >

              <div
                className="profile-trigger"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                👤 {teacher?.name || teacher?.email}

                <FiChevronDown
                  size={12}
                  className={`profile-chevron ${isProfileOpen ? 'open' : ''}`}
                />
              </div>

              {isProfileOpen && (
                <div className="profile-dropdown">

                  <div className="profile-header">
                    Welcome back! 👋

                    <div className="profile-email">
                      {teacher?.email}
                    </div>
                  </div>

                  <button
                    className="profile-item-btn"
                    onClick={() => navigate('/settings')}
                  >
                    Settings ⚙️
                  </button>

                  <button
                    className="profile-item-btn logout"
                    onClick={handleLogout}
                  >
                    Logout 🚪
                  </button>

                </div>
              )}
            </li>
          )}

        </ul>
      </div>
    </nav>
  );
};

export default Navigation;