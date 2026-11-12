import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

export default function Result() {
  const navigate = useNavigate();
  const result = JSON.parse(localStorage.getItem("lastResult") || "null");
  const token = localStorage.getItem("token");
  const [performance, setPerformance] = useState(null);
  const [predictionError, setPredictionError] = useState("");

  useEffect(() => {
    let active = true;

    fetch(`${API}/api/results/performance`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || "Could not load performance prediction");
        }
        return data;
      })
      .then(data => {
        if (active) setPerformance(data);
      })
      .catch(error => {
        if (active) setPredictionError(error.message);
      });

    return () => {
      active = false;
    };
  }, [token]);

  if (!result) {
    return (
      <main style={styles.page}>
        <h1>Examination Result</h1>
        <p>No submitted exam result was found.</p>
        <button onClick={() => navigate("/dashboard")} style={styles.button}>
          Back to Dashboard
        </button>
      </main>
    );
  }

  const percentage = result.percentage
    ?? (result.total_marks
      ? Math.round((result.score / result.total_marks) * 10000) / 100
      : 0);
  const predictedMarks = performance?.predicted_percentage == null
    ? null
    : Math.round(
      result.total_marks * performance.predicted_percentage / 100
    );

  return (
    <main style={styles.page}>
      <h1>Examination Result</h1>
      <h2>{result.exam_title || "Exam submitted successfully"}</h2>
      <section style={styles.card}>
        <p><strong>Marks obtained:</strong> {result.score} / {result.total_marks}</p>
        <p><strong>Percentage:</strong> {percentage}%</p>
      </section>

      <section style={styles.card}>
        <h2>Performance prediction</h2>
        {performance ? (
          <>
            <p>
              <strong>Estimated marks for a similar exam:</strong>{" "}
              {predictedMarks === null
                ? "Not available yet"
                : `${predictedMarks} / ${result.total_marks}`}
            </p>
            <p>
              Based on {performance.prediction_sample_size} recent completed
              {" "}exam{performance.prediction_sample_size === 1 ? "" : "s"}.
              This is an estimate, not a guaranteed result.
            </p>
            <p><strong>Trend:</strong> {performance.prediction}</p>
            <p>{performance.message}</p>
          </>
        ) : predictionError ? (
          <p role="alert" style={styles.error}>
            Could not load prediction: {predictionError}
          </p>
        ) : (
          <p>Calculating your estimate...</p>
        )}
      </section>

      <button onClick={() => navigate("/dashboard")} style={styles.button}>
        Back to Dashboard
      </button>
    </main>
  );
}

const styles = {
  page: {
    maxWidth: "720px",
    margin: "0 auto",
    padding: "32px",
    fontFamily: "Arial, sans-serif",
    textAlign: "left"
  },
  card: {
    margin: "18px 0",
    padding: "20px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    background: "#fff"
  },
  button: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    background: "#4338ca",
    cursor: "pointer"
  },
  error: {
    color: "#b91c1c"
  }
};
