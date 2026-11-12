
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from extensions import db
from models.exam import Exam
from models.question import Question

exam_bp = Blueprint("exams", __name__, url_prefix="/api/exams")


def admin_required():
    return get_jwt().get("role") == "admin"


@exam_bp.route("/", methods=["POST"])
@jwt_required()
def create_exam():

    if not admin_required():
        return jsonify({"message": "Admin access required"}), 403

    data = request.get_json() or {}

    title = str(data.get("title", "")).strip()
    subject = str(data.get("subject", "")).strip()

    try:
        duration = int(data.get("duration_minutes", 0))
        question_ids = data.get("question_ids", [])

        if not isinstance(question_ids, list):
            raise ValueError

        question_ids = list(dict.fromkeys(int(qid) for qid in question_ids))

    except (TypeError, ValueError):
        return jsonify({"message": "Invalid duration or question IDs"}), 400

    if not title or not subject or duration < 1 or not question_ids:
        return jsonify({
            "message": "Title, subject, duration and questions are required"
        }), 400

    questions = Question.query.filter(
        Question.id.in_(question_ids),
        Question.is_active.is_(True)
    ).all()

    if len(questions) != len(question_ids):
        return jsonify({"message": "Some questions were not found or are inactive"}), 400

    exam = Exam(
        title=title,
        subject=subject,
        instructions=data.get("instructions", ""),
        duration_minutes=duration,
        total_marks=sum(q.marks for q in questions),
        questions=questions
    )

    db.session.add(exam)
    db.session.commit()

    return jsonify({
        "message": "Exam created successfully",
        "exam": {
            "id": exam.id,
            "title": exam.title,
            "subject": exam.subject,
            "duration_minutes": exam.duration_minutes,
            "total_questions": len(exam.questions),
            "total_marks": exam.total_marks
        }
    }), 201


@exam_bp.route("/", methods=["GET"])
@jwt_required()
def get_exams():

    if not admin_required():
        return jsonify({"message": "Admin access required"}), 403

    exams = Exam.query.order_by(Exam.id.desc()).all()

    return jsonify({
        "total": len(exams),
        "exams": [
            {
                "id": exam.id,
                "title": exam.title,
                "subject": exam.subject,
                "duration_minutes": exam.duration_minutes,
                "total_questions": len(exam.questions),
                "total_marks": exam.total_marks,
                "is_active": exam.is_active
            }
            for exam in exams
        ]
    }), 200

