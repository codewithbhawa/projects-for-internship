
from datetime import datetime, timezone
from extensions import db

exam_questions = db.Table(
    "exam_questions",
    db.Column(
        "exam_id",
        db.Integer,
        db.ForeignKey("exams.id"),
        primary_key=True
    ),
    db.Column(
        "question_id",
        db.Integer,
        db.ForeignKey("questions.id"),
        primary_key=True
    )
)


class Exam(db.Model):
    __tablename__ = "exams"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    subject = db.Column(db.String(100), nullable=False)
    instructions = db.Column(db.Text)
    duration_minutes = db.Column(db.Integer, nullable=False)
    total_marks = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)

    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    questions = db.relationship(
        "Question",
        secondary=exam_questions,
        lazy="subquery"
    )

    def __repr__(self):
        return f"<Exam {self.title}>"
