import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiChevronDown, FiUser, FiUsers } from 'react-icons/fi';
import './Navigation.css';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const evalRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;
  const isEvalActive =
    location.pathname === '/evaluate' ||
    location.pathname === '/EvaluateBatch';

  // ✅ Check for user in localStorage (FIXED)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing user:", error);
        // Fallback to token check
        const token = localStorage.getItem("token");
        if (token) {
          setUser({ name: "User" });
        }
      }
    } else {
      // If no user object but token exists
      const token = localStorage.getItem("token");
      if (token) {
        setUser({ name: "User" });
      }
    }
  }, []);

  // close profile dropdown
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // close eval dropdown
  useEffect(() => {
    const handler = (e) => {
      if (evalRef.current && !evalRef.current.contains(e.target)) {
        setIsEvalOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsProfileOpen(false);
    navigate("/");
    window.location.reload(); // Optional: force reload to reset all states
  };

  const handleMobileClose = () => {
    setIsMobileMenuOpen(false);
    setIsEvalOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">

        <Link to="/" className="navbar-logo" onClick={handleMobileClose}>
          <span className="logo-icon">📝</span>
          AI Examiner
        </Link>

        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>

        <ul className={`nav-menu ${isMobileMenuOpen ? 'active' : ''}`}>

          {/* Home */}
          <li className="nav-item">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={handleMobileClose}>
              Home
            </Link>
          </li>

          {/* Logged in menu */}
          {user && (
            <>
              <li className="nav-item">
                <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} onClick={handleMobileClose}>
                  Dashboard
                </Link>
              </li>

              <li className="nav-item">
                <Link to="/management" className={`nav-link ${isActive('/management') ? 'active' : ''}`} onClick={handleMobileClose}>
                  Management
                </Link>
              </li>

              <li className="nav-item">
                <Link to="/history" className={`nav-link ${isActive('/history') ? 'active' : ''}`} onClick={handleMobileClose}>
                  History
                </Link>
              </li>

              {/* Evaluate Dropdown */}
              <li className="nav-item eval-item" ref={evalRef}>
                <button
                  className={`nav-link nav-link-primary eval-desktop-btn ${isEvalActive ? 'active' : ''}`}
                  onClick={() => setIsEvalOpen(!isEvalOpen)}
                >
                  Evaluate Now
                  <FiChevronDown size={14} className={`eval-chevron ${isEvalOpen ? 'open' : ''}`} />
                </button>

                {isEvalOpen && (
                  <div className="eval-dropdown">
                    <div className="eval-dd-header">Choose evaluation mode</div>
                    
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
                        <div className="eval-dd-title">Single Student</div>
                        <div className="eval-dd-sub">Evaluate one answer sheet</div>
                      </div>
                    </button>

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
                          Entire Class <span className="eval-badge">Batch</span>
                        </div>
                        <div className="eval-dd-sub">Bulk upload all students</div>
                      </div>
                    </button>
                  </div>
                )}

                {/* Mobile View Links */}
                <div className="eval-mobile-links">
                  <Link
                    to="/evaluate"
                    className="eval-mobile-single"
                    onClick={handleMobileClose}
                  >
                    <FiUser size={14} /> Single Student
                  </Link>
                  <Link
                    to="/EvaluateBatch"
                    className="eval-mobile-batch"
                    onClick={handleMobileClose}
                  >
                    <FiUsers size={14} /> Entire Class
                    <span className="eval-badge">Batch</span>
                  </Link>
                </div>
              </li>
            </>
          )}

          {/* Not logged in */}
          {!user && (
            <li className="nav-item">
              <button 
                className="nav-link nav-link-primary"
                onClick={() => navigate("./login")}
              >
                Login
              </button>
            </li>
          )}

          {/* Profile Dropdown */}
          {user && (
            <li className="nav-item profile-item" ref={profileRef}>
              <div className="profile-trigger" onClick={() => setIsProfileOpen(!isProfileOpen)}>
                👤 {user.name}
                <FiChevronDown size={12} className={`profile-chevron ${isProfileOpen ? 'open' : ''}`} />
              </div>

              {isProfileOpen && (
                <div className="profile-dropdown">
                  <div className="profile-header">
                    Welcome back! 👋
                    <div className="profile-email">{user.email || user.name}</div>
                  </div>
                  
                  <button className="profile-item-btn" onClick={() => navigate('/settings')}>
                    Settings ⚙️
                  </button>

                  <button className="profile-item-btn logout" onClick={handleLogout}>
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