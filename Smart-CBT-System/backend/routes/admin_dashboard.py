from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt, jwt_required

from models.attempt import ExamAttempt
from models.exam import Exam
from models.question import Question
from models.student import Student

admin_dashboard_bp = Blueprint(
    "admin_dashboard",
    __name__,
    url_prefix="/api/admin"
)


@admin_dashboard_bp.route("/dashboard", methods=["GET"])
@jwt_required()
def dashboard():
    if get_jwt().get("role") != "admin":
        return jsonify({"message": "Admin access required"}), 403

    students = Student.query.order_by(Student.name.asc()).all()
    exams = Exam.query.order_by(Exam.title.asc()).all()
    attempts = ExamAttempt.query.filter_by(
        status="submitted"
    ).order_by(ExamAttempt.submitted_at.desc()).all()
    exams_by_id = {exam.id: exam for exam in exams}
    attempts_by_student = {}

    for attempt in attempts:
        exam = exams_by_id.get(attempt.exam_id)
        percentage = (
            round(attempt.score * 100 / attempt.total_marks, 2)
            if attempt.total_marks else 0
        )
        attempts_by_student.setdefault(attempt.student_id, []).append({
            "attempt_id": attempt.id,
            "exam_title": exam.title if exam else "Deleted exam",
            "score": attempt.score,
            "total_marks": attempt.total_marks,
            "percentage": percentage,
            "submitted_at": (
                attempt.submitted_at.isoformat()
                if attempt.submitted_at else None
            )
        })

    student_rows = []
    for student in students:
        results = attempts_by_student.get(student.id, [])
        average_percentage = (
            round(
                sum(result["percentage"] for result in results) / len(results),
                2
            )
            if results else None
        )
        student_rows.append({
            "id": student.id,
            "name": student.name,
            "email": student.email,
            "is_active": student.is_active,
            "completed_exams": len(results),
            "average_percentage": average_percentage,
            "results": results
        })

    completed_percentages = [
        result["percentage"]
        for student in student_rows
        for result in student["results"]
    ]

    return jsonify({
        "summary": {
            "students": len(students),
            "exams": len(exams),
            "questions": Question.query.count(),
            "completed_attempts": len(attempts),
            "average_percentage": (
                round(sum(completed_percentages) / len(completed_percentages), 2)
                if completed_percentages else None
            )
        },
        "students": student_rows
    }), 200
