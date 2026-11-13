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
      <main className="result-page">
        <header className="result-heading">
          <p className="eyebrow" style={{ color: "var(--purple)" }}>Your progress</p>
          <h1>No result to show yet</h1>
          <p>Complete an exam and your results will appear here.</p>
        </header>
        <button onClick={() => navigate("/dashboard")} className="exam-start">
          Back to dashboard
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
    <main className="result-page">
      <header className="result-heading">
        <p className="eyebrow" style={{ color: "var(--purple)" }}>One step further</p>
        <h1>Nicely done!</h1>
        <p>Your exam has been submitted. Here’s how you did.</p>
      </header>
      <section className="result-card">
        <h2>{result.exam_title || "Examination result"}</h2>
        <div className="result-score">
          <p><strong>Marks obtained:</strong> {result.score} / {result.total_marks}</p>
          <p><strong>Percentage:</strong> {percentage}%</p>
        </div>
      </section>

      <section className="result-card">
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
          <p role="alert" className="result-error">
            Could not load prediction: {predictionError}
          </p>
        ) : (
          <p>Calculating your estimate...</p>
        )}
      </section>

      <button onClick={() => navigate("/dashboard")} className="exam-start">
        Back to dashboard
      </button>
    </main>
  );
}
