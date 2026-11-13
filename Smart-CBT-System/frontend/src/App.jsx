
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Exam from "./pages/Exam";
import Result from "./pages/Result";
import AdminDashboard from "./pages/AdminDashboard";

function Dashboard({ role }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  function logout() {
    localStorage.clear();
    window.location.href = "/";
  }

  if (role === "admin") {
    return <AdminDashboard onLogout={logout} />;
  }

  return (
    <main className="student-page">
      <header className="student-header">
        <div className="student-header-left">
          <span className="brand-mark" aria-hidden="true">✦</span>
          <span>smartcbt</span>
        </div>
        <div className="student-header-actions">
          <span className="student-user">Hi, {user.name || role}</span>
          <button type="button" className="secondary-button" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <div className="student-content">
        <section className="student-hero">
          <div className="student-hero-copy">
            <p className="eyebrow">Your learning space</p>
            <h1>Small steps.<br />Big progress.</h1>
            <p>Take a breath, trust what you know, and give your next exam your best.</p>
          </div>
          <button
            type="button"
            className="hero-cta"
            onClick={() => window.location.href = "/exam"}
          >
            Explore exams <span aria-hidden="true">→</span>
          </button>
        </section>

        <div className="student-section-heading">
          <h2>Make today count</h2>
          <p>Everything you need to feel ready and do your best.</p>
        </div>
        <section className="feature-grid" aria-label="Your exam tools">
          <article className="feature-card">
            <span className="feature-icon" aria-hidden="true">✎</span>
            <h3>Ready when you are</h3>
            <p>Find your available exams and start when you feel prepared.</p>
          </article>
          <article className="feature-card">
            <span className="feature-icon" aria-hidden="true">◷</span>
            <h3>Stay in your flow</h3>
            <p>Keep an eye on your time and focus on one question at a time.</p>
          </article>
          <article className="feature-card">
            <span className="feature-icon" aria-hidden="true">✦</span>
            <h3>Celebrate your progress</h3>
            <p>See your score and a helpful performance estimate after an exam.</p>
          </article>
        </section>
      </div>
    </main>
  );
}

function ProtectedRoute({ role, children }) {
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("role");

  if (!token || userRole !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute role="student">
              <Dashboard role="student" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <Dashboard role="admin" />
            </ProtectedRoute>
          }
        />

        <Route
          path="/exam"
          element={
            <ProtectedRoute role="student">
              <Exam />
            </ProtectedRoute>
          }
        />

        <Route
          path="/result"
          element={
            <ProtectedRoute role="student">
              <Result />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
