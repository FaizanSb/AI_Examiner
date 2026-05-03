import jwt
from datetime import datetime, timedelta

SECRET_KEY = "your_secret_key"

def generate_token(user):
    payload = {
        "user_id": user["id"],
        "exp": datetime.utcnow() + timedelta(hours=24)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")