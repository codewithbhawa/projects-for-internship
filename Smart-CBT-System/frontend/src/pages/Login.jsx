
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
    <main className="auth-page">
      <section className="auth-showcase" aria-label="Smart CBT introduction">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>smartcbt</span>
        </div>
        <div className="showcase-copy">
          <p className="showcase-kicker">A brighter way to test your best</p>
          <h1>Ready to make your next move <span>count?</span></h1>
          <p className="showcase-description">
            A calmer, clearer space to prepare, take your exams, and celebrate
            every step forward.
          </p>
        </div>
        <p className="showcase-note">Learn at your pace. Show what you know.</p>
      </section>

      <section className="auth-panel">
        <form onSubmit={handleLogin} className="auth-card">
          <p className="eyebrow" style={{ color: "var(--purple)" }}>
            {isRegistering ? "Get started" : "Welcome back"}
          </p>
          <h2>{isRegistering ? "Create your account" : "Sign in to continue"}</h2>
          <p className="auth-subtitle">
            {isRegistering
              ? "Your learning journey starts with a few details."
              : "Pick up right where your learning journey left off."}
          </p>

          {!isRegistering && (
          <div className="role-switch" aria-label="Choose account type">
            <button
              type="button"
              aria-pressed={role === "student"}
              onClick={() => {
                setRole("student");
                setSuccess("");
              }}
              className={`role-option${role === "student" ? " is-active" : ""}`}
            >
              Student
            </button>

            <button
              type="button"
              aria-pressed={role === "admin"}
              onClick={() => {
                setRole("admin");
                setSuccess("");
              }}
              className={`role-option${role === "admin" ? " is-active" : ""}`}
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
              className="auth-input"
            />
          </>
          )}

          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="auth-input"
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
            className="auth-input"
          />

          {error && <p className="form-message is-error" role="alert">{error}</p>}
          {success && <p className="form-message is-success" role="status">{success}</p>}

          <button type="submit" disabled={loading} className="auth-submit">
            {loading
              ? isRegistering ? "Creating account..." : "Signing in..."
              : isRegistering ? "Create student account" : "Sign in"}
          </button>
          {role === "student" && (
            <button type="button" onClick={toggleRegistration} className="auth-link">
              {isRegistering ? "Back to student sign in" : "New here? Create a student account"}
            </button>
          )}
        </form>
      </section>
    </main>
  );
}
