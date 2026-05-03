from models.user_model import create_user, find_user_by_email, verify_password
from utils.jwt_helper import generate_token

def signup(data):
    if find_user_by_email(data["email"]):
        return {"message": "User already exists"}, 400

    user = create_user(data["name"], data["email"], data["password"])
    return {"message": "User created successfully"}, 201


def login(data):
    user = find_user_by_email(data["email"])
    if not user or not verify_password(user["password"], data["password"]):
        return {"message": "Invalid credentials"}, 401

    token = generate_token(user)
    return {"token": token}, 200