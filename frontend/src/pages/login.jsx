import { useState } from "react";
import { login } from "../services/authService";
import { setToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

function Login({ onClose }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await login(form);
      setToken(res.data.token);
      window.location.reload(); // reload the page to update auth state
      onClose?.();
      navigate("/dashboard");
    } catch (err) {
      alert("Invalid credentials 😢");
    } finally {
      setLoading(false);
    }
  };

  // Overlay click se modal band ho
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>×</button>

        <div className={styles.header}>
          <div style={{ fontSize: "2rem" }}>🔐</div>
          <h2>Welcome Back</h2>
          <p>Sign in to your account</p>
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

        <button
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <p className={styles.footerText}>
          Don't have an account? <a href="/signUp">Sign up</a>
        </p>
      </div>
    </div>
  );
}

export default Login;