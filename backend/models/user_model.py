from werkzeug.security import generate_password_hash, check_password_hash

users = []

def create_user(name, email, password):
    hashed_password = generate_password_hash(password)
    user = {
        "id": len(users) + 1,
        "name": name,
        "email": email,
        "password": hashed_password
    }
    users.append(user)
    return user

def find_user_by_email(email):
    return next((u for u in users if u["email"] == email), None)

def verify_password(stored_password, provided_password):
    return check_password_hash(stored_password, provided_password)