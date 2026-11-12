
from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from models.attempt import ExamAttempt
from models.exam import Exam

result_bp = Blueprint(
    "results",
    __name__,
    url_prefix="/api/results"
)


@result_bp.route("/my-results", methods=["GET"])
@jwt_required()
def my_results():

    if get_jwt().get("role") == "admin":
        return jsonify({"message": "Student access required"}), 403

    student_id = int(get_jwt_identity())

    attempts = ExamAttempt.query.filter_by(
        student_id=student_id,
        status="submitted"
    ).order_by(ExamAttempt.id.desc()).all()

    results = []

    for attempt in attempts:
        exam = Exam.query.get(attempt.exam_id)

        percentage = (
            round((attempt.score / attempt.total_marks) * 100, 2)
            if attempt.total_marks else 0
        )

        results.append({
            "exam_title": exam.title if exam else "Deleted Exam",
            "score": attempt.score,
            "total_marks": attempt.total_marks,
            "percentage": percentage,
            "submitted_at": (
                attempt.submitted_at.isoformat()
                if attempt.submitted_at else None
            )
        })

    return jsonify({
        "total_exams": len(results),
        "results": results
    }), 200


@result_bp.route("/performance", methods=["GET"])
@jwt_required()
def performance():

    if get_jwt().get("role") == "admin":
        return jsonify({"message": "Student access required"}), 403

    student_id = int(get_jwt_identity())

    attempts = ExamAttempt.query.filter_by(
        student_id=student_id,
        status="submitted"
    ).order_by(ExamAttempt.id.asc()).all()

    percentages = [
        (a.score / a.total_marks) * 100
        for a in attempts if a.total_marks > 0
    ]

    if not percentages:
        return jsonify({
            "total_exams": 0,
            "average_percentage": 0,
            "predicted_percentage": None,
            "prediction_sample_size": 0,
            "prediction": "Not enough data",
            "message": "Complete exams to see your performance."
        }), 200

    average = round(sum(percentages) / len(percentages), 2)
    recent_percentages = percentages[-3:]
    predicted_percentage = round(
        sum(recent_percentages) / len(recent_percentages),
        2
    )

    if len(percentages) < 3:
        prediction = "Not enough data"
        message = (
            "This is an early estimate. Complete at least 3 exams "
            "for a more reliable trend."
        )

    else:
        if predicted_percentage >= 75:
            prediction = "Good performance trend"
            message = "Your recent average is encouraging. Keep practising."
        elif predicted_percentage >= 50:
            prediction = "Moderate performance trend"
            message = "Regular practice may help improve your results."
        else:
            prediction = "Needs more practice"
            message = "Review difficult topics and practise regularly."

    return jsonify({
        "total_exams": len(percentages),
        "average_percentage": average,
        "predicted_percentage": predicted_percentage,
        "prediction_sample_size": len(recent_percentages),
        "prediction": prediction,
        "message": message,
        "scores": [round(p, 2) for p in percentages]
    }), 200
