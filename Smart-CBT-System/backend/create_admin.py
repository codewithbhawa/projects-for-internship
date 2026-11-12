
from getpass import getpass
from app import app
from extensions import db
from models.admin import Admin
from werkzeug.security import generate_password_hash


with app.app_context():
    print("\n--- Create Admin Account ---")

    name = input("Enter admin name: ").strip()
    email = input("Enter admin email: ").strip().lower()
    password = getpass("Enter admin password (minimum 8 characters): ")

    if not name or not email or len(password) < 8:
        print("Please enter valid details. Password must be at least 8 characters.")
    elif Admin.query.filter_by(email=email).first():
        print("This admin email already exists.")
    else:
        admin = Admin(
            name=name,
            email=email,
            password_hash=generate_password_hash(password)
        )

        db.session.add(admin)
        db.session.commit()

        print("Admin account created successfully!")
