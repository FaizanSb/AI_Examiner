import jwt
from flask import request

SECRET_KEY = "your_secret_key"

def get_current_user_id():
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return None

    try:
        token = auth_header.split(" ")[1]
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return data["user_id"]
    except:
        return None