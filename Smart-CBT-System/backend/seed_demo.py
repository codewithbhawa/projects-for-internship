from app import app
from extensions import db
from models.exam import Exam
from models.question import Question


EXAM_TITLE = "Smart CBT Demo Practice Test"

DEMO_QUESTIONS = [
    {
        "question_text": "What is 2 + 2?",
        "option_a": "3",
        "option_b": "4",
        "option_c": "5",
        "option_d": "6",
        "correct_option": "B",
    },
    {
        "question_text": "Which planet is known as the Red Planet?",
        "option_a": "Venus",
        "option_b": "Jupiter",
        "option_c": "Mars",
        "option_d": "Mercury",
        "correct_option": "C",
    },
    {
        "question_text": "Which is the largest ocean on Earth?",
        "option_a": "Indian Ocean",
        "option_b": "Arctic Ocean",
        "option_c": "Atlantic Ocean",
        "option_d": "Pacific Ocean",
        "correct_option": "D",
    },
    {
        "question_text": "What does HTML stand for?",
        "option_a": "HyperText Markup Language",
        "option_b": "HighText Machine Language",
        "option_c": "Hyper Transfer Markup Link",
        "option_d": "Home Tool Markup Language",
        "correct_option": "A",
    },
    {
        "question_text": "How many bits are in one byte?",
        "option_a": "4",
        "option_b": "8",
        "option_c": "16",
        "option_d": "32",
        "correct_option": "B",
    },
    {
        "question_text": "Which language is used to structure a web page?",
        "option_a": "HTML",
        "option_b": "SQL",
        "option_c": "Python",
        "option_d": "C",
        "correct_option": "A",
    },
    {
        "question_text": "What is the chemical symbol for water?",
        "option_a": "CO2",
        "option_b": "O2",
        "option_c": "H2O",
        "option_d": "NaCl",
        "correct_option": "C",
    },
    {
        "question_text": "How many sides does a hexagon have?",
        "option_a": "5",
        "option_b": "6",
        "option_c": "7",
        "option_d": "8",
        "correct_option": "B",
    },
    {
        "question_text": "Which device is used to point and click on a computer?",
        "option_a": "Monitor",
        "option_b": "Printer",
        "option_c": "Speaker",
        "option_d": "Mouse",
        "correct_option": "D",
    },
    {
        "question_text": "What is the first month of the year?",
        "option_a": "January",
        "option_b": "March",
        "option_c": "June",
        "option_d": "December",
        "correct_option": "A",
    },
]

with app.app_context():
    existing_exam = Exam.query.filter_by(title=EXAM_TITLE).first()
    questions = list(existing_exam.questions) if existing_exam else []

    if not existing_exam:
        existing_exam = Exam(
            title=EXAM_TITLE,
            subject="General Knowledge and Basics",
            instructions="Choose one answer for each question.",
            duration_minutes=10,
        )

    for question_data in DEMO_QUESTIONS:
        if len(questions) >= len(DEMO_QUESTIONS):
            break
        if any(q.question_text == question_data["question_text"] for q in questions):
            continue

        question = Question.query.filter_by(
            question_text=question_data["question_text"]
        ).first()
        if not question:
            question = Question(
                **question_data,
                subject="General Knowledge and Basics",
                marks=1,
            )
            db.session.add(question)
        questions.append(question)

    existing_exam.questions = questions
    existing_exam.total_marks = sum(question.marks or 0 for question in questions)
    db.session.add(existing_exam)
    db.session.commit()
    print(
        f"Demo exam ready (ID: {existing_exam.id}, "
        f"{len(existing_exam.questions)} questions)."
    )
