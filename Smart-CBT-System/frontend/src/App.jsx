
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
    <div style={{ padding: "35px", fontFamily: "Arial" }}>
      <h1>Smart CBT Examination System</h1>
      <h2>Welcome, {user.name || role}</h2>
      <p>Student Dashboard</p>

      <button onClick={() => window.location.href = "/exam"}>
        Start Examination
      </button>

      <br /><br />
      <button onClick={logout}>Logout</button>
    </div>
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
