
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
    <div style={{ padding: 30, fontFamily: "Arial" }}>
      <h1>Student Examination</h1>
      {message && <p>{message}</p>}

      {!attemptId && exams.map(exam => (
        <div key={exam.id} style={{ border: "1px solid #ccc", padding: 15, margin: 10 }}>
          <h3>{exam.title}</h3>
          <p>{exam.subject} | {exam.duration_minutes} minutes</p>
          <button onClick={() => startExam(exam.id)}>Start Exam</button>
        </div>
      ))}

      {!attemptId && loadingExams && <p>Loading available exams...</p>}

      {!attemptId && !loadingExams && exams.length === 0 && (
        <div>
          <p>No active exams are available yet. Ask your admin to create an exam.</p>
          <button onClick={refreshExams}>Refresh exams</button>
        </div>
      )}

      {attemptId && (
        <>
          <h2>Time Remaining: {formatTime(timeLeft)}</h2>

          {questions.map((q, index) => (
            <div key={q.id} style={{ border: "1px solid #ddd", padding: 15, margin: 12 }}>
              <h3>{index + 1}. {q.question_text}</h3>

              {["A", "B", "C", "D"].map(option => (
                <label key={option} style={{ display: "block", margin: 8 }}>
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    checked={answers[q.id] === option}
                    onChange={() => saveAnswer(q.id, option)}
                  />
                  {" "}{q[`option_${option.toLowerCase()}`]}
                </label>
              ))}
            </div>
          ))}

          <button onClick={submitExam} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Exam"}
          </button>
        </>
      )}
    </div>
  );
}
