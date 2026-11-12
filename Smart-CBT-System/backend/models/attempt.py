
from datetime import datetime, timezone
from extensions import db


def utc_now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


class ExamAttempt(db.Model):
    __tablename__ = "exam_attempts"

    id = db.Column(db.Integer, primary_key=True)

    student_id = db.Column(
        db.Integer,
        db.ForeignKey("students.id"),
        nullable=False
    )

    exam_id = db.Column(
        db.Integer,
        db.ForeignKey("exams.id"),
        nullable=False
    )

    started_at = db.Column(db.DateTime, default=utc_now)
    expires_at = db.Column(db.DateTime, nullable=False)
    submitted_at = db.Column(db.DateTime)

    status = db.Column(db.String(20), default="in_progress")
    score = db.Column(db.Integer, default=0)
    total_marks = db.Column(db.Integer, default=0)

    answers = db.relationship(
        "AttemptAnswer",
        backref="attempt",
        cascade="all, delete-orphan"
    )


class AttemptAnswer(db.Model):
    __tablename__ = "attempt_answers"

    id = db.Column(db.Integer, primary_key=True)

    attempt_id = db.Column(
        db.Integer,
        db.ForeignKey("exam_attempts.id"),
        nullable=False
    )

    question_id = db.Column(
        db.Integer,
        db.ForeignKey("questions.id"),
        nullable=False
    )

    selected_option = db.Column(db.String(1))
    is_correct = db.Column(db.Boolean, default=False)
    marks_awarded = db.Column(db.Integer, default=0)

    __table_args__ = (
        db.UniqueConstraint(
            "attempt_id",
            "question_id",
            name="unique_attempt_question"
        ),
    )
