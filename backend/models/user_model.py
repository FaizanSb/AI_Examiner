from datetime import datetime
from bson import ObjectId
from utils.db_connection import db_connection


class Teacher:
    @staticmethod
    def get_collection():
        return db_connection.get_collection('teachers')

    @staticmethod
    def create(name, email, password, subject=None):
        """Create teacher (password stored - ideally hash later)"""
        teacher = {
            'name': name,
            'email': email,
            'password': password,
            'subject': subject,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        result = Teacher.get_collection().insert_one(teacher)
        teacher['_id'] = result.inserted_id
        return teacher

    @staticmethod
    def find_by_email(email):
        return Teacher.get_collection().find_one({'email': email})

    @staticmethod
    def find_by_id(teacher_id):
        return Teacher.get_collection().find_one({'_id': ObjectId(teacher_id)})

    @staticmethod
    def update(teacher_id, data):
        data['updated_at'] = datetime.utcnow()
        return Teacher.get_collection().update_one(
            {'_id': ObjectId(teacher_id)},
            {'$set': data}
        )

    @staticmethod
    def get_all():
        return list(Teacher.get_collection().find())

    @staticmethod
    def delete(teacher_id):
        return Teacher.get_collection().delete_one({'_id': ObjectId(teacher_id)})

    # ✅ EXTRA SAFE HELPER (recommended)
    @staticmethod
    def safe_teacher(teacher):
        """Remove sensitive fields before sending to frontend"""
        if not teacher:
            return None

        teacher = teacher.copy()
        teacher.pop('password', None)
        return teacher