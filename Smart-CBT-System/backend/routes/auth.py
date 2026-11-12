
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

from extensions import db
from models.student import Student

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({
            "status": "error",
            "message": "Name, email and password are required"
        }), 400

    if len(password) < 8:
        return jsonify({
            "status": "error",
            "message": "Password must be at least 8 characters"
        }), 400

    if Student.query.filter_by(email=email).first():
        return jsonify({
            "status": "error",
            "message": "Email already registered"
        }), 409

    student = Student(
        name=name,
        email=email,
        password_hash=generate_password_hash(password)
    )

    db.session.add(student)
    db.session.commit()

    return jsonify({
        "status": "success",
        "message": "Student registered successfully",
        "student": {
            "id": student.id,
            "name": student.name,
            "email": student.email
        }
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    student = Student.query.filter_by(email=email).first()

    if not student or not check_password_hash(
        student.password_hash, password
    ):
        return jsonify({
            "status": "error",
            "message": "Invalid email or password"
        }), 401

    if not student.is_active:
        return jsonify({
            "status": "error",
            "message": "Account is inactive"
        }), 403

    access_token = create_access_token(
        identity=str(student.id)
    )

    return jsonify({
        "status": "success",
        "message": "Login successful",
        "access_token": access_token,
        "student": {
            "id": student.id,
            "name": student.name,
            "email": student.email
        }
    }), 200
