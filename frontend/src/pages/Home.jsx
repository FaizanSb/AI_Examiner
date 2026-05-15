import React, { useState, useEffect } from 'react';
import { FiArrowRight, FiCheckCircle, FiZap, FiBarChart2, FiUser, FiLogOut } from 'react-icons/fi';
import './Home.css';
import Login from './login';
import Signup from './Signup';
// import { redirect } from 'react-router-dom';

const Home = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing user data:", error);
        setUser(null);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <div className="home">
      {showLogin && <Login onClose={() => setShowLogin(false)} onLogin={(userData) => setUser(userData)} />}
      {showSignup && <Signup onClose={() => setShowSignup(false)} onSignup={(userData) => setUser(userData)} />}

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            {user ? (
              <>
                Welcome back, <span className="gradient-text">{user.name}</span> 👋
              </>
            ) : (
              <>
               AI-Based Academic Evaluation & Performance
                <span className="gradient-text"> Analytics</span>
              </>
            )}
          </h1>
          <p className="hero-subtitle">
            Automatically evaluate student answers using advanced AI technology.
            Save time, improve consistency, and get detailed feedback.
          </p>

          {!user ? (
            <div className="hero-buttons">
              <button className="btn btn-primary btn-lg" onClick={() => setShowSignup(true)}>
                Get Started <FiArrowRight />
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => setShowLogin(true)}>
                Login <FiUser />
              </button>
            </div>
          ) : (
            <div className="hero-buttons">
              <button className="btn btn-danger btn-lg" onClick={handleLogout}>
                Logout <FiLogOut />
              </button>
            </div>
          )}
        </div>
        <div className="hero-animation">
          <div className="floating-card card-1">📊</div>
          <div className="floating-card card-2">✨</div>
          <div className="floating-card card-3">🎯</div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2 className="section-title">Why PaperLens AI?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><FiZap size={32} /></div>
            <h3>Lightning Fast</h3>
            <p>Evaluate hundreds of answer sheets in seconds, not hours</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FiCheckCircle size={32} /></div>
            <h3>Consistent Grading</h3>
            <p>Ensure fair and consistent evaluation criteria for all students</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FiBarChart2 size={32} /></div>
            <h3>Detailed Analytics</h3>
            <p>Get comprehensive insights and performance analysis</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI-Powered</h3>
            <p>Leverages state-of-the-art machine learning technology</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Handwriting Recognition</h3>
            <p>Advanced OCR technology to extract handwritten text accurately</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3>Secure & Private</h3>
            <p>Your data is safely stored and protected with encryption</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <h3>Upload Model Answer</h3>
            <p>Upload the correct answer PDF or text</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">2</div>
            <h3>Submit Student Answer(s)</h3>
            <p>Upload a single student answer or a bulk class file for evaluation</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">3</div>
            <h3>AI Evaluation</h3>
            <p>Our AI analyzes and scores the answer</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-number">4</div>
            <h3>Get Results</h3>
            <p>Receive detailed feedback and grades</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="cta-content">
          <h2>Ready to Transform Your Grading Process?</h2>
          <p>Join educators worldwide who are saving time and improving student outcomes</p>

          {!user ? (
            <>
              <button className="btn btn-primary btn-lg btn-cta" onClick={() => setShowSignup(true)}>
                Get Started Now
              </button>
              <p>
                Already have an account?{" "}
                <span
                  style={{ color: "#93c5fd", cursor: "pointer", fontWeight: 600 }}
                  onClick={() => setShowLogin(true)}
                >
                  Login
                </span>
              </p>
            </>
          ) : (
            <button className="btn btn-danger btn-lg btn-cta" onClick={handleLogout}>
              Logout <FiLogOut />
            </button>
          )}

          <p className="cta-note">Copyright © 2026 PaperLens AI. All rights reserved.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;