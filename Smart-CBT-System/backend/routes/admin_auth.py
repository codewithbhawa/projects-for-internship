
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from werkzeug.security import check_password_hash

from models.admin import Admin

admin_auth_bp = Blueprint(
    "admin_auth",
    __name__,
    url_prefix="/api/admin"
)


@admin_auth_bp.route("/login", methods=["POST"])
def admin_login():

    data = request.get_json() or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    admin = Admin.query.filter_by(email=email).first()

    if not admin or not check_password_hash(
        admin.password_hash, password
    ):
        return jsonify({
            "status": "error",
            "message": "Invalid admin email or password"
        }), 401

    if not admin.is_active:
        return jsonify({
            "status": "error",
            "message": "Admin account is inactive"
        }), 403

    token = create_access_token(
        identity=str(admin.id),
        additional_claims={"role": "admin"}
    )

    return jsonify({
        "status": "success",
        "message": "Admin login successful",
        "access_token": token,
        "admin": {
            "id": admin.id,
            "name": admin.name,
            "email": admin.email
        }
    }), 200
