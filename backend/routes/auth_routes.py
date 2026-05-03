from flask import Blueprint, request
from controllers.auth_controller import signup, login

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/signup", methods=["POST"])
def signup_route():
    return signup(request.json)

@auth_bp.route("/login", methods=["POST"])
def login_route():
    return login(request.json)