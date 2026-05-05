from werkzeug.security import generate_password_hash, check_password_hash
from models.teacher import Teacher
from utils.jwt_helper import generate_token

def signup(data):
    # Check if already exists
    if Teacher.find_by_email(data["email"]):
        return {"message": "User already exists"}, 400

    # Hash password
    hashed_password = generate_password_hash(data["password"])

    # MongoDB mein save karo
    teacher = Teacher.create(
        name=data["name"],
        email=data["email"],
        password=hashed_password,
        subject=data.get("subject")
    )

    return {"message": "Account created successfully"}, 201


def login(data):
    teacher = Teacher.find_by_email(data["email"])

    if not teacher or not check_password_hash(teacher["password"], data["password"]):
        return {"message": "Invalid credentials"}, 401

    token = generate_token(teacher)
    return {"token": token}, 200    