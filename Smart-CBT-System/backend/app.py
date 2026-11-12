
import re

from flask import Flask, jsonify
from flask_cors import CORS

from models.question import Question
from models.exam import Exam
from routes.results import result_bp

from routes.questions import question_bp

from routes.exams import exam_bp

from routes.student_exam import student_exam_bp

from routes.admin_auth import admin_auth_bp
from routes.admin_dashboard import admin_dashboard_bp
from config import Config
from extensions import db
from models.admin import Admin
from models.student import Student

from models.attempt import ExamAttempt, AttemptAnswer
from flask_jwt_extended import JWTManager
from routes.auth import auth_bp

app = Flask(__name__)

# Application configuration
app.config.from_object(Config)

# Enable frontend communication
CORS(app, resources={
    r"/api/*": {
        "origins": re.compile(
            r"^https?://(?:localhost|127\.0\.0\.1)(?::\d+)?$"
        )
    }
})

# Initialize database
db.init_app(app)

jwt = JWTManager(app)

app.register_blueprint(auth_bp)
app.register_blueprint(admin_auth_bp)
app.register_blueprint(admin_dashboard_bp)
app.register_blueprint(question_bp)
app.register_blueprint(exam_bp)
app.register_blueprint(student_exam_bp)
app.register_blueprint(result_bp)

@app.route("/")
def home():
    return jsonify({
        "message": "Smart CBT Examination System",
        "status": "Backend Running"
    })


@app.route("/api/health")
def health():
    return jsonify({
        "status": "success",
        "message": "Backend is working properly"
    })


@app.route("/api/database-status")
def database_status():
    try:
        db.session.execute(db.text("SELECT 1"))

        return jsonify({
            "status": "success",
            "message": "Database connected successfully"
        })

    except Exception as error:
        db.session.rollback()

        return jsonify({
            "status": "error",
            "message": "Database connection failed"
        }), 500


# Create database tables
with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
