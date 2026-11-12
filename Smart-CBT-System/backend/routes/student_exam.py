
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from datetime import datetime, timedelta, timezone

from extensions import db
from models.exam import Exam
from models.attempt import ExamAttempt, AttemptAnswer
from models.question import Question

student_exam_bp = Blueprint(
    "student_exam",
    __name__,
    url_prefix="/api/student/exams"
)


def now_utc():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def utc_isoformat(value):
    return value.replace(tzinfo=timezone.utc).isoformat()


def student_access():
    return get_jwt().get("role") != "admin"


def finish_attempt(attempt):
    exam = db.session.get(Exam, attempt.exam_id)
    score = 0

    for question in exam.questions:
        answer = AttemptAnswer.query.filter_by(
            attempt_id=attempt.id,
            question_id=question.id
        ).first()

        if answer:
            answer.is_correct = (
                answer.selected_option == question.correct_option
            )
            answer.marks_awarded = (
                question.marks if answer.is_correct else 0
            )
            score += answer.marks_awarded

    attempt.score = score
    attempt.total_marks = exam.total_marks
    attempt.status = "submitted"
    attempt.submitted_at = now_utc()
    db.session.commit()


@student_exam_bp.route("/", methods=["GET"])
@jwt_required()
def available_exams():
    if not student_access():
        return jsonify({"message": "Student access required"}), 403

    exams = Exam.query.filter_by(is_active=True).all()

    return jsonify({
        "exams": [
            {
                "id": e.id,
                "title": e.title,
                "subject": e.subject,
                "duration_minutes": e.duration_minutes,
                "total_questions": len(e.questions),
                "total_marks": e.total_marks
            }
            for e in exams
        ]
    })


@student_exam_bp.route("/<int:exam_id>/start", methods=["POST"])
@jwt_required()
def start_exam(exam_id):
    if not student_access():
        return jsonify({"message": "Student access required"}), 403

    student_id = int(get_jwt_identity())
    exam = db.session.get(Exam, exam_id)

    if not exam or not exam.is_active:
        return jsonify({"message": "Exam not available"}), 404

    existing = ExamAttempt.query.filter_by(
        student_id=student_id,
        exam_id=exam_id,
        status="in_progress"
    ).first()

    if existing:
        if now_utc() >= existing.expires_at:
            finish_attempt(existing)
            return jsonify({"message": "Exam time has expired"}), 400

        attempt = existing
    else:
        attempt = ExamAttempt(
            student_id=student_id,
            exam_id=exam_id,
            expires_at=now_utc() + timedelta(
                minutes=exam.duration_minutes
            ),
            total_marks=exam.total_marks
        )
        db.session.add(attempt)
        db.session.commit()

    return jsonify({
        "message": "Exam started",
        "attempt_id": attempt.id,
        "expires_at": utc_isoformat(attempt.expires_at)
    }), 200


@student_exam_bp.route("/attempt/<int:attempt_id>", methods=["GET"])
@jwt_required()
def get_exam_questions(attempt_id):
    if not student_access():
        return jsonify({"message": "Student access required"}), 403

    student_id = int(get_jwt_identity())
    attempt = db.session.get(ExamAttempt, attempt_id)

    if not attempt or attempt.student_id != student_id:
        return jsonify({"message": "Attempt not found"}), 404

    if attempt.status != "in_progress":
        return jsonify({"message": "Exam already submitted"}), 400

    if now_utc() >= attempt.expires_at:
        finish_attempt(attempt)
        return jsonify({"message": "Time expired. Exam submitted automatically."}), 400

    exam = db.session.get(Exam, attempt.exam_id)

    return jsonify({
        "exam_title": exam.title,
        "expires_at": utc_isoformat(attempt.expires_at),
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "option_a": q.option_a,
                "option_b": q.option_b,
                "option_c": q.option_c,
                "option_d": q.option_d,
                "marks": q.marks
            }
            for q in exam.questions
        ]
    }), 200


@student_exam_bp.route("/attempt/<int:attempt_id>/answer", methods=["POST"])
@jwt_required()
def save_answer(attempt_id):
    if not student_access():
        return jsonify({"message": "Student access required"}), 403

    student_id = int(get_jwt_identity())
    attempt = db.session.get(ExamAttempt, attempt_id)

    if not attempt or attempt.student_id != student_id:
        return jsonify({"message": "Attempt not found"}), 404

    if attempt.status != "in_progress":
        return jsonify({"message": "Exam already submitted"}), 400

    if now_utc() >= attempt.expires_at:
        finish_attempt(attempt)
        return jsonify({"message": "Time expired. Exam submitted."}), 400

    data = request.get_json() or {}

    try:
        question_id = int(data.get("question_id"))
    except (TypeError, ValueError):
        return jsonify({"message": "Invalid question ID"}), 400

    selected = str(data.get("selected_option", "")).upper()

    if selected not in ["A", "B", "C", "D", ""]:
        return jsonify({"message": "Invalid selected option"}), 400

    exam = db.session.get(Exam, attempt.exam_id)

    if not any(q.id == question_id for q in exam.questions):
        return jsonify({"message": "Question does not belong to this exam"}), 400

    answer = AttemptAnswer.query.filter_by(
        attempt_id=attempt.id,
        question_id=question_id
    ).first()

    if not answer:
        answer = AttemptAnswer(
            attempt_id=attempt.id,
            question_id=question_id
        )
        db.session.add(answer)

    answer.selected_option = selected or None
    db.session.commit()

    return jsonify({"message": "Answer saved successfully"}), 200


@student_exam_bp.route("/attempt/<int:attempt_id>/submit", methods=["POST"])
@jwt_required()
def submit_exam(attempt_id):
    if not student_access():
        return jsonify({"message": "Student access required"}), 403

    student_id = int(get_jwt_identity())
    attempt = db.session.get(ExamAttempt, attempt_id)

    if not attempt or attempt.student_id != student_id:
        return jsonify({"message": "Attempt not found"}), 404

    if attempt.status == "in_progress":
        finish_attempt(attempt)

    return jsonify({
        "message": "Exam submitted successfully",
        "exam_title": db.session.get(Exam, attempt.exam_id).title,
        "score": attempt.score,
        "percentage": (
            round(attempt.score * 100 / attempt.total_marks, 2)
            if attempt.total_marks else 0
        ),
        "total_marks": attempt.total_marks,
        "status": attempt.status
    }), 200
