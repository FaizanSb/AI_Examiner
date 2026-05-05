from flask import Blueprint, request, jsonify
from utils.auth_helper import get_current_user_id

evaluation_bp = Blueprint("evaluations", __name__)

# Dummy storage
all_evaluations = []

# ✅ Add evaluation
@evaluation_bp.route("/", methods=["POST"])
def add_evaluation():
    user_id = get_current_user_id()

    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401

    data = request.json

    evaluation = {
        "id": len(all_evaluations) + 1,
        "marks": data.get("marks"),
        "student": data.get("student"),
        "teacher_id": user_id   # 🔥 SECURITY
    }

    all_evaluations.append(evaluation)

    return jsonify(evaluation), 201


# ✅ Get evaluations (sirf apni)
@evaluation_bp.route("/", methods=["GET"])
def get_evaluations():
    user_id = get_current_user_id()

    if not user_id:
        return jsonify({"message": "Unauthorized"}), 401

    filtered = [e for e in all_evaluations if e["teacher_id"] == user_id]

    return jsonify(filtered), 200