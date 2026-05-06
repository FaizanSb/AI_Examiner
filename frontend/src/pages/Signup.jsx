import { useState } from "react";
import { signup } from "../services/authService";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css"; // same CSS reuse

function Signup({ onClose }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await signup(form);
      onClose?.();
      navigate("/");
      alert("Signup successful!");
    } catch (err) {
      alert("Signup failed 😢");
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>

        <div className={styles.header}>
          <div className={styles.headerIcon}>✨</div>
          <h2>Create Account</h2>
          <p>Join AI Examiner today</p>
        </div>

        <div className={styles.field}>
          <label>Full Name</label>
          <input
            type="text"
            placeholder="Your name"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className={styles.field}>
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <button className={styles.submitBtn} onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className={styles.footerText}>
          Already have an account?{" "}
          <span className={styles.footerLink} onClick={() => { onClose?.(); navigate("/login"); }}>
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}

export default Signup;