import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiChevronDown, FiUser, FiUsers } from 'react-icons/fi';
import './Navigation.css';

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEvalOpen, setIsEvalOpen] = useState(false);
  const evalRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => location.pathname === path;
  const isEvalActive = location.pathname === '/evaluate' || location.pathname === '/evaluate/class';

  useEffect(() => {
    const handler = (e) => {
      if (evalRef.current && !evalRef.current.contains(e.target)) {
        setIsEvalOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMobileClose = () => setIsMobileMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
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
          <li className="nav-item">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`} onClick={handleMobileClose}>
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`} onClick={handleMobileClose}>
              Dashboard
            </Link>
          </li>

          {/* ── Evaluate Button + Dropdown ── */}
          <li className="nav-item eval-item" ref={evalRef}>

            {/* Desktop: single button toggles dropdown */}
            <button
              className={`nav-link nav-link-primary eval-desktop-btn ${isEvalActive ? 'active' : ''}`}
              onClick={() => setIsEvalOpen((prev) => !prev)}
            >
              Evaluate Now
              <FiChevronDown
                size={14}
                className={`eval-chevron ${isEvalOpen ? 'open' : ''}`}
              />
            </button>

            {/* Desktop dropdown */}
            {isEvalOpen && !isMobileMenuOpen && (
              <div className="eval-dropdown">
                <div className="eval-dd-header">Choose mode</div>
                <button
                  className="eval-dd-item"
                  onClick={() => { navigate('/evaluate'); setIsEvalOpen(false); }}
                >
                  <span className="eval-dd-icon single"><FiUser size={15} /></span>
                  <div>
                    <div className="eval-dd-title">Single Student</div>
                    <div className="eval-dd-sub">Evaluate one answer sheet</div>
                  </div>
                </button>
                <button
                  className="eval-dd-item"
                  onClick={() => { navigate('/evaluate/class'); setIsEvalOpen(false); }}
                >
                  <span className="eval-dd-icon batch"><FiUsers size={15} /></span>
                  <div>
                    <div className="eval-dd-title">
                      Entire Class <span className="eval-badge">Batch</span>
                    </div>
                    <div className="eval-dd-sub">Bulk upload all students</div>
                  </div>
                </button>
              </div>
            )}

            {/* Mobile: two separate links */}
            <div className="eval-mobile-links">
              <Link to="/evaluate" className="nav-link nav-link-primary eval-mobile-single" onClick={handleMobileClose}>
                <FiUser size={14} /> Single Student
              </Link>
              <Link to="/evaluate/class" className="nav-link eval-mobile-batch" onClick={handleMobileClose}>
                <FiUsers size={14} /> Entire Class <span className="eval-badge">Batch</span>
              </Link>
            </div>
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
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;