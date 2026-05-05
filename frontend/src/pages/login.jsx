import { useState } from "react";
import { login } from "../services/authService";
import { setToken } from "../utils/auth";
import { useNavigate } from "react-router-dom";

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const res = await login(form);
      setToken(res.data.token);

      alert("Login successful 🔥");
      navigate("/dashboard"); // ya home page
    } catch (err) {
      alert("Invalid credentials 😢");
    }
  };

  return (
    <div>
      <h2>Login</h2>

      <input
        placeholder="Email"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <button onClick={handleSubmit}>Login</button>
    </div>
  );
}

export default Login;