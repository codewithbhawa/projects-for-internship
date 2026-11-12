
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

export default function Login() {
  const navigate = useNavigate();

  const [role, setRole] = useState("student");
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        role === "admin"
          ? "/api/admin/login"
          : isRegistering
            ? "/api/auth/register"
            : "/api/auth/login";

      const response = await fetch(API + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Request failed");
      }

      if (isRegistering) {
        setSuccess("Account created. Sign in with your new credentials.");
        setIsRegistering(false);
        setPassword("");
        return;
      }

      const user = role === "admin" ? data.admin : data.student;
      if (!data.access_token || !user) {
        throw new Error("Login response was incomplete. Please try again.");
      }

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("role", role);
      localStorage.setItem("user", JSON.stringify(user));

      navigate(role === "admin" ? "/admin" : "/dashboard");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleRegistration() {
    setError("");
    setSuccess("");
    setIsRegistering(value => !value);
    setRole("student");
  }

  return (
    <div style={styles.page}>
      <form onSubmit={handleLogin} style={styles.card}>
        <h1>Smart CBT</h1>
        <p>Examination Management System</p>

        {!isRegistering && (
          <div style={styles.roles}>
            <button
              type="button"
              onClick={() => {
                setRole("student");
                setSuccess("");
              }}
              style={role === "student" ? styles.active : styles.role}
            >
              Student
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("admin");
                setSuccess("");
              }}
              style={role === "admin" ? styles.active : styles.role}
            >
              Admin
            </button>
          </div>
        )}

        {isRegistering && (
          <>
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={styles.input}
            />
          </>
        )}

        <label htmlFor="email">Email Address</label>
        <input
          id="email"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={styles.input}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          placeholder="Enter your password"
          autoComplete={isRegistering ? "new-password" : "current-password"}
          value={password}
          onChange={e => setPassword(e.target.value)}
          minLength={isRegistering ? 8 : undefined}
          required
          style={styles.input}
        />

        {error && <p style={styles.error}>{error}</p>}
        {success && <p style={styles.success}>{success}</p>}

        <button type="submit" disabled={loading} style={styles.submit}>
          {loading
            ? isRegistering ? "Creating account..." : "Logging in..."
            : isRegistering ? "Create Student Account" : "Login"}
        </button>
        {role === "student" && (
          <button type="button" onClick={toggleRegistration} style={styles.link}>
            {isRegistering ? "Back to student login" : "Create a student account"}
          </button>
        )}
      </form>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#eef2ff",
    fontFamily: "Arial, sans-serif",
    padding: "20px"
  },
  card: {
    background: "white",
    padding: "35px",
    borderRadius: "15px",
    width: "100%",
    maxWidth: "390px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.1)",
    display: "flex",
    flexDirection: "column",
    gap: "13px"
  },
  roles: {
    display: "flex",
    gap: "10px",
    margin: "10px 0"
  },
  role: {
    flex: 1,
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "7px",
    cursor: "pointer"
  },
  active: {
    flex: 1,
    padding: "12px",
    background: "#4338ca",
    color: "white",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer"
  },
  input: {
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "7px"
  },
  submit: {
    padding: "13px",
    background: "#4338ca",
    color: "white",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    marginTop: "10px"
  },
  error: {
    color: "red",
    fontSize: "14px"
  },
  success: {
    color: "#15803d",
    fontSize: "14px"
  },
  link: {
    border: "none",
    background: "transparent",
    color: "#4338ca",
    cursor: "pointer",
    padding: "8px"
  }
};
