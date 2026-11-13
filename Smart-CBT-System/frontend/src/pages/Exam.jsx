
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://localhost:5000";

function secondsUntil(expiresAt) {
  return Math.max(
    0,
    Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000)
  );
}

export default function Exam() {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [expiresAt, setExpiresAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loadingExams, setLoadingExams] = useState(true);
  const submittingRef = useRef(false);

  const token = localStorage.getItem("token");

  const api = useCallback(async (url, options = {}) => {
    const response = await fetch(API + url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  }, [token]);

  const fetchExams = useCallback(async () => {
    const data = await api("/api/student/exams/");
    return data.exams || [];
  }, [api]);

  useEffect(() => {
    let active = true;
    fetchExams()
      .then(availableExams => {
        if (active) setExams(availableExams);
      })
      .catch(error => {
        if (active) setMessage(error.message);
      })
      .finally(() => {
        if (active) setLoadingExams(false);
      });

    return () => {
      active = false;
    };
  }, [fetchExams]);

  async function refreshExams() {
    setLoadingExams(true);
    setMessage("");

    try {
      setExams(await fetchExams());
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoadingExams(false);
    }
  }

  async function startExam(id) {
    try {
      const started = await api(`/api/student/exams/${id}/start`, {
        method: "POST"
      });

      const data = await api(
        `/api/student/exams/attempt/${started.attempt_id}`
      );

      setQuestions(data.questions || []);
      setAnswers({});
      setExpiresAt(data.expires_at);

      setTimeLeft(secondsUntil(data.expires_at));
      setAttemptId(started.attempt_id);
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function saveAnswer(questionId, option) {
    setAnswers(previous => ({ ...previous, [questionId]: option }));
    setMessage("");

    try {
      await api(`/api/student/exams/attempt/${attemptId}/answer`, {
        method: "POST",
        body: JSON.stringify({
          question_id: questionId,
          selected_option: option
        })
      });
    } catch (error) {
      setMessage(error.message);
    }
  }

  const submitExam = useCallback(async () => {
    if (!attemptId || submittingRef.current) return;

    submittingRef.current = true;
    setSubmitting(true);

    try {
      const result = await api(
        `/api/student/exams/attempt/${attemptId}/submit`,
        { method: "POST" }
      );

      localStorage.setItem("lastResult", JSON.stringify(result));
      navigate("/result");
    } catch (error) {
      setMessage(error.message);
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [api, attemptId, navigate]);

  useEffect(() => {
    if (!attemptId || !expiresAt) return;

    const timer = window.setInterval(() => {
      const remaining = secondsUntil(expiresAt);
      setTimeLeft(remaining);

      if (remaining === 0) {
        window.clearInterval(timer);
        void submitExam();
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [attemptId, expiresAt, submitExam]);

  const formatTime = seconds =>
    `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <main className="exam-page">
      <header className="exam-heading">
        <p className="eyebrow" style={{ color: "var(--purple)" }}>Your learning space</p>
        <h1>{attemptId ? "You’ve got this." : "Available exams"}</h1>
        <p>{attemptId
          ? "Take your time and choose the answer that feels right."
          : "Choose an exam when you’re ready to begin."}</p>
      </header>
      {message && <p className="exam-alert" role="alert">{message}</p>}

      {!attemptId && exams.map(exam => (
        <article key={exam.id} className="exam-card">
          <h2>{exam.title}</h2>
          <div className="exam-meta">
            <span className="exam-chip">{exam.subject}</span>
            <span className="exam-chip">{exam.duration_minutes} minutes</span>
            <span className="exam-chip">{exam.total_questions} questions</span>
          </div>
          <button className="exam-start" onClick={() => startExam(exam.id)}>
            Start exam <span aria-hidden="true">→</span>
          </button>
        </article>
      ))}

      {!attemptId && loadingExams && (
        <section className="exam-card"><p>Loading available exams...</p></section>
      )}

      {!attemptId && !loadingExams && exams.length === 0 && (
        <section className="exam-card">
          <h2>No exams just yet</h2>
          <p>No active exams are available yet. Ask your admin to create an exam.</p>
          <button className="exam-start" onClick={refreshExams}>Refresh exams</button>
        </section>
      )}

      {attemptId && (
        <>
          <div className="exam-timer" aria-live="polite">
            <span aria-hidden="true">◷</span>
            Time remaining: {formatTime(timeLeft)}
          </div>

          {questions.map((q, index) => (
            <section key={q.id} className="exam-question">
              <p className="eyebrow" style={{ color: "var(--purple)" }}>
                Question {index + 1} of {questions.length}
              </p>
              <h3>{q.question_text}</h3>

              {["A", "B", "C", "D"].map(option => (
                <label key={option} className="exam-option">
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    checked={answers[q.id] === option}
                    onChange={() => saveAnswer(q.id, option)}
                  />
                  <span>{q[`option_${option.toLowerCase()}`]}</span>
                </label>
              ))}
            </section>
          ))}

          <button className="exam-start exam-submit" onClick={submitExam} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>
        </>
      )}
    </main>
  );
}
