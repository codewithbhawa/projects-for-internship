
from datetime import datetime, timezone
from extensions import db


class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(db.Integer, primary_key=True)

    question_text = db.Column(
        db.Text,
        nullable=False
    )

    option_a = db.Column(db.String(500), nullable=False)
    option_b = db.Column(db.String(500), nullable=False)
    option_c = db.Column(db.String(500), nullable=False)
    option_d = db.Column(db.String(500), nullable=False)

    correct_option = db.Column(
        db.String(1),
        nullable=False
    )

    subject = db.Column(db.String(100), nullable=False)
    topic = db.Column(db.String(100))

    difficulty = db.Column(
        db.String(20),
        default="Medium"
    )

    explanation = db.Column(db.Text)

    marks = db.Column(db.Integer, default=1)

    is_active = db.Column(db.Boolean, default=True)

    created_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc)
    )

    def __repr__(self):
        return f"<Question {self.id}>"
