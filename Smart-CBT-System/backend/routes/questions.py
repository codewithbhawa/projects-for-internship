
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from extensions import db
from models.exam import Exam, exam_questions
from models.question import Question

question_bp = Blueprint(
    "questions",
    __name__,
    url_prefix="/api/questions"
)


def admin_required():
    return get_jwt().get("role") == "admin"


def question_data(question):
    return {
        "id": question.id,
        "question_text": question.question_text,
        "option_a": question.option_a,
        "option_b": question.option_b,
        "option_c": question.option_c,
        "option_d": question.option_d,
        "correct_option": question.correct_option,
        "subject": question.subject,
        "topic": question.topic,
        "difficulty": question.difficulty,
        "explanation": question.explanation,
        "marks": question.marks
    }


@question_bp.route("/", methods=["POST"])
@jwt_required()
def add_question():

    if not admin_required():
        return jsonify({"message": "Admin access required"}), 403

    data = request.get_json() or {}

    required = [
        "question_text", "option_a", "option_b",
        "option_c", "option_d", "correct_option", "subject"
    ]

    if any(not str(data.get(field, "")).strip() for field in required):
        return jsonify({"message": "All required fields must be filled"}), 400

    correct = str(data["correct_option"]).upper()

    if correct not in ["A", "B", "C", "D"]:
        return jsonify({"message": "Correct option must be A, B, C or D"}), 400

    question = Question(
        question_text=data["question_text"].strip(),
        option_a=data["option_a"].strip(),
        option_b=data["option_b"].strip(),
        option_c=data["option_c"].strip(),
        option_d=data["option_d"].strip(),
        correct_option=correct,
        subject=data["subject"].strip(),
        topic=data.get("topic"),
        difficulty=data.get("difficulty", "Medium"),
        explanation=data.get("explanation"),
        marks=data.get("marks", 1)
    )

    db.session.add(question)
    db.session.commit()

    return jsonify({
        "message": "Question added successfully",
        "question": question_data(question)
    }), 201


@question_bp.route("/", methods=["GET"])
@jwt_required()
def get_questions():

    if not admin_required():
        return jsonify({"message": "Admin access required"}), 403

    questions = Question.query.order_by(Question.id.desc()).all()

    return jsonify({
        "total": len(questions),
        "questions": [question_data(q) for q in questions]
    }), 200


@question_bp.route("/<int:question_id>", methods=["PUT"])
@jwt_required()
def update_question(question_id):

    if not admin_required():
        return jsonify({"message": "Admin access required"}), 403

    question = db.session.get(Question, question_id)

    if not question:
        return jsonify({"message": "Question not found"}), 404

    data = request.get_json() or {}

    fields = [
        "question_text", "option_a", "option_b",
        "option_c", "option_d", "subject", "topic",
        "difficulty", "explanation"
    ]

    for field in fields:
        if field in data:
            setattr(question, field, data[field])

    if "correct_option" in data:
        correct = str(data["correct_option"]).upper()
        if correct not in ["A", "B", "C", "D"]:
            return jsonify({"message": "Invalid correct option"}), 400
        question.correct_option = correct

    if "marks" in data:
        try:
            marks = int(data["marks"])
            if marks < 1:
                raise ValueError
            question.marks = marks
        except (TypeError, ValueError):
            return jsonify({"message": "Marks must be a positive integer"}), 400

    exam_ids = db.session.query(exam_questions.c.exam_id).filter(
        exam_questions.c.question_id == question.id
    ).all()
    for (exam_id,) in exam_ids:
        exam = db.session.get(Exam, exam_id)
        if exam:
            exam.total_marks = sum(item.marks or 0 for item in exam.questions)

    db.session.commit()

    return jsonify({
        "message": "Question updated successfully",
        "question": question_data(question)
    }), 200


@question_bp.route("/<int:question_id>", methods=["DELETE"])
@jwt_required()
def delete_question(question_id):

    if not admin_required():
        return jsonify({"message": "Admin access required"}), 403

    question = db.session.get(Question, question_id)

    if not question:
        return jsonify({"message": "Question not found"}), 404

    db.session.delete(question)
    db.session.commit()

    return jsonify({
        "message": "Question deleted successfully"
    }), 200
