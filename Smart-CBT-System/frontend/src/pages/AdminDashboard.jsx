import { useCallback, useEffect, useState } from "react";

const API = "http://localhost:5000";

const emptyQuestion = {
  question_text: "",
  subject: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "A",
  marks: 1
};

const emptyExam = {
  title: "",
  subject: "",
  duration_minutes: 30,
  question_ids: []
};

export default function AdminDashboard({ onLogout }) {
  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [questionForm, setQuestionForm] = useState(emptyQuestion);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [examForm, setExamForm] = useState(emptyExam);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const token = localStorage.getItem("token");

  const request = useCallback(async (url, options = {}) => {
    const response = await fetch(API + url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  }, [token]);

  const fetchData = useCallback(async () => {
    const [questionData, examData, dashboardData] = await Promise.all([
      request("/api/questions/"),
      request("/api/exams/"),
      request("/api/admin/dashboard")
    ]);
    return {
      questions: questionData.questions || [],
      exams: examData.exams || [],
      dashboard: dashboardData
    };
  }, [request]);

  useEffect(() => {
    let active = true;
    fetchData()
      .then(data => {
        if (active) {
          setQuestions(data.questions);
          setExams(data.exams);
          setDashboard(data.dashboard);
        }
      })
      .catch(loadError => {
        if (active) setError(loadError.message);
      });

    return () => {
      active = false;
    };
  }, [fetchData]);

  function updateQuestion(field, value) {
    setQuestionForm(previous => ({ ...previous, [field]: value }));
  }

  function editQuestion(question) {
    setEditingQuestionId(question.id);
    setQuestionForm({
      question_text: question.question_text,
      subject: question.subject,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_option: question.correct_option,
      marks: question.marks
    });
    setError("");
    setMessage(`Editing question ${question.id}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelQuestionEdit() {
    setEditingQuestionId(null);
    setQuestionForm({ ...emptyQuestion });
    setMessage("");
  }

  function toggleExamQuestion(questionId, checked) {
    setExamForm(previous => ({
      ...previous,
      question_ids: checked
        ? [...previous.question_ids, questionId]
        : previous.question_ids.filter(id => id !== questionId)
    }));
  }

  async function addQuestion(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const editing = editingQuestionId !== null;
      await request(
        editing ? `/api/questions/${editingQuestionId}` : "/api/questions/",
        {
        method: editing ? "PUT" : "POST",
        body: JSON.stringify({
          ...questionForm,
          marks: Number(questionForm.marks)
        })
        }
      );
      setQuestionForm({ ...emptyQuestion });
      setEditingQuestionId(null);
      setMessage(editing ? "Question updated successfully." : "Question added successfully.");
      const data = await fetchData();
      setQuestions(data.questions);
      setExams(data.exams);
      setDashboard(data.dashboard);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function createExam(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await request("/api/exams/", {
        method: "POST",
        body: JSON.stringify({
          ...examForm,
          duration_minutes: Number(examForm.duration_minutes)
        })
      });
      setExamForm(emptyExam);
      setMessage("Exam created successfully.");
      const data = await fetchData();
      setQuestions(data.questions);
      setExams(data.exams);
      setDashboard(data.dashboard);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1>Smart CBT Admin</h1>
          <p>Manage questions and create examinations.</p>
        </div>
        <button type="button" onClick={onLogout} style={styles.secondaryButton}>
          Logout
        </button>
      </header>

      {error && <p role="alert" style={styles.error}>{error}</p>}
      {message && <p role="status" style={styles.success}>{message}</p>}

      <section style={styles.summaryGrid} aria-label="System summary">
        {[
          ["Students", dashboard?.summary.students],
          ["Exams", dashboard?.summary.exams],
          ["Questions", dashboard?.summary.questions],
          ["Submitted exams", dashboard?.summary.completed_attempts]
        ].map(([label, value]) => (
          <div key={label} style={styles.summaryCard}>
            <strong>{value ?? "—"}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section style={styles.columns}>
        <form onSubmit={addQuestion} style={styles.card}>
          <h2>{editingQuestionId === null ? "Add a question" : `Edit question ${editingQuestionId}`}</h2>
          <label>
            Question
            <textarea
              value={questionForm.question_text}
              onChange={event => updateQuestion("question_text", event.target.value)}
              required
              style={styles.input}
            />
          </label>
          <label>
            Subject
            <input
              value={questionForm.subject}
              onChange={event => updateQuestion("subject", event.target.value)}
              required
              style={styles.input}
            />
          </label>
          {["a", "b", "c", "d"].map(option => (
            <label key={option}>
              Option {option.toUpperCase()}
              <input
                value={questionForm[`option_${option}`]}
                onChange={event => updateQuestion(`option_${option}`, event.target.value)}
                required
                style={styles.input}
              />
            </label>
          ))}
          <div style={styles.inlineFields}>
            <label>
              Correct option
              <select
                value={questionForm.correct_option}
                onChange={event => updateQuestion("correct_option", event.target.value)}
                style={styles.input}
              >
                {["A", "B", "C", "D"].map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              Marks
              <input
                type="number"
                min="1"
                step="1"
                value={questionForm.marks}
                onChange={event => updateQuestion("marks", event.target.value)}
                required
                style={styles.input}
              />
            </label>
          </div>
          <button type="submit" disabled={saving} style={styles.primaryButton}>
            {editingQuestionId === null ? "Add question" : "Save question"}
          </button>
          {editingQuestionId !== null && (
            <button type="button" onClick={cancelQuestionEdit} style={styles.secondaryButton}>
              Cancel edit
            </button>
          )}
        </form>

        <form onSubmit={createExam} style={styles.card}>
          <h2>Create an exam</h2>
          <label>
            Exam title
            <input
              value={examForm.title}
              onChange={event => setExamForm(previous => ({ ...previous, title: event.target.value }))}
              required
              style={styles.input}
            />
          </label>
          <label>
            Subject
            <input
              value={examForm.subject}
              onChange={event => setExamForm(previous => ({ ...previous, subject: event.target.value }))}
              required
              style={styles.input}
            />
          </label>
          <label>
            Duration (minutes)
            <input
              type="number"
              min="1"
              step="1"
              value={examForm.duration_minutes}
              onChange={event => setExamForm(previous => ({
                ...previous,
                duration_minutes: event.target.value
              }))}
              required
              style={styles.input}
            />
          </label>

          <fieldset style={styles.questionList}>
            <legend>Choose exam questions</legend>
            {questions.length === 0 ? (
              <p>Add at least one question before creating an exam.</p>
            ) : questions.map(question => (
              <label key={question.id} style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={examForm.question_ids.includes(question.id)}
                  onChange={event => toggleExamQuestion(question.id, event.target.checked)}
                />
                {question.question_text}
              </label>
            ))}
          </fieldset>

          <button
            type="submit"
            disabled={saving || examForm.question_ids.length === 0}
            style={styles.primaryButton}
          >
            Create exam
          </button>
        </form>
      </section>

      <section style={styles.card}>
        <h2>Question bank ({questions.length})</h2>
        {questions.length === 0 ? <p>No questions have been added yet.</p> : (
          <ul style={styles.questionBank}>
            {questions.map(question => (
              <li key={question.id} style={styles.questionRow}>
                <div>
                  <strong>{question.subject}</strong>
                  <p>{question.question_text}</p>
                  <small>Correct option: {question.correct_option} · {question.marks} mark(s)</small>
                </div>
                <button
                  type="button"
                  onClick={() => editQuestion(question)}
                  style={styles.secondaryButton}
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={styles.card}>
        <h2>Existing exams</h2>
        {exams.length === 0 ? <p>No exams created yet.</p> : (
          <ul>
            {exams.map(exam => (
              <li key={exam.id}>
                {exam.title} — {exam.subject}, {exam.total_questions} questions,
                {" "}{exam.duration_minutes} minutes
              </li>
            ))}
          </ul>
        )}
      </section>

      <section style={styles.card}>
        <h2>Students and exam marks</h2>
        {!dashboard ? (
          <p>Loading student results...</p>
        ) : dashboard.students.length === 0 ? (
          <p>No students have registered yet.</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.cell}>Student</th>
                  <th style={styles.cell}>Email</th>
                  <th style={styles.cell}>Completed exams</th>
                  <th style={styles.cell}>Average</th>
                  <th style={styles.cell}>Marks by exam</th>
                  <th style={styles.cell}>Account</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.students.map(student => (
                  <tr key={student.id}>
                    <td style={styles.cell}>{student.name}</td>
                    <td style={styles.cell}>{student.email}</td>
                    <td style={styles.cell}>{student.completed_exams}</td>
                    <td style={styles.cell}>
                      {student.average_percentage === null
                        ? "—"
                        : `${student.average_percentage}%`}
                    </td>
                    <td style={styles.cell}>
                      {student.results.length === 0 ? "No results yet" : (
                        student.results.map(result => (
                          <div key={result.attempt_id}>
                            {result.exam_title}: {result.score}/{result.total_marks}
                            {" "}({result.percentage}%)
                          </div>
                        ))
                      )}
                    </td>
                    <td style={styles.cell}>
                      {student.is_active ? "Active" : "Inactive"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

const styles = {
  page: {
    width: "100%",
    boxSizing: "border-box",
    padding: "32px",
    fontFamily: "Arial, sans-serif",
    textAlign: "left"
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "24px"
  },
  columns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "20px"
  },
  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginBottom: "20px"
  },
  summaryCard: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    padding: "16px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    background: "#fff"
  },
  tableWrapper: {
    overflowX: "auto"
  },
  questionBank: {
    listStyle: "none",
    padding: 0,
    margin: 0
  },
  questionRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    padding: "12px 0",
    borderBottom: "1px solid #e5e7eb"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left"
  },
  cell: {
    padding: "10px",
    borderBottom: "1px solid #e5e7eb",
    verticalAlign: "top"
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "22px",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    background: "#fff"
  },
  input: {
    display: "block",
    boxSizing: "border-box",
    width: "100%",
    marginTop: "5px",
    padding: "10px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    font: "inherit"
  },
  inlineFields: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px"
  },
  questionList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxHeight: "220px",
    overflowY: "auto",
    padding: "12px"
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px"
  },
  primaryButton: {
    padding: "11px",
    border: "none",
    borderRadius: "6px",
    color: "#fff",
    background: "#4338ca",
    cursor: "pointer"
  },
  secondaryButton: {
    padding: "10px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    background: "#fff",
    cursor: "pointer"
  },
  error: {
    color: "#b91c1c"
  },
  success: {
    color: "#15803d"
  }
};
