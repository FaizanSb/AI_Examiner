from flask import Blueprint, request, jsonify
from utils.auth_helper import get_current_user_id

student_bp = Blueprint("students", __name__)

# Dummy storage (agar DB nahi use kar rahe)
all_students = []

# ✅ Add student
@student_bp.route("/", methods=["POST"])
def add_student():
    user_id = get_current_user_id()

    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401

    data = request.json

    student = {
        "id": len(all_students) + 1,
        "name": data.get("name"),
        "teacher_id": user_id   # 🔥 SECURITY
    }

    all_students.append(student)

    return jsonify(student), 201


# ✅ Get students (sirf apne)
@student_bp.route("/", methods=["GET"])
def get_students():
    user_id = get_current_user_id()

    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401

    filtered = [s for s in all_students if s["teacher_id"] == user_id]

    return jsonify(filtered), 200