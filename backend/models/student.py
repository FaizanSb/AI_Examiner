from datetime import datetime
from bson import ObjectId
from utils.db_connection import db_connection


class Student:
    @staticmethod
    def get_collection():
        return db_connection.get_collection('students')

    @staticmethod
    def create(name, email, roll_number=None, class_name=None, teacher_id=None):
        student = {
            'name': name,
            'email': email,
            'roll_number': roll_number,
            'class': class_name,
            'teacher_id': teacher_id,
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }

        result = Student.get_collection().insert_one(student)
        student['_id'] = result.inserted_id
        return student

    @staticmethod
    def find_by_email(email):
        return Student.get_collection().find_one({'email': email})

    @staticmethod
    def find_by_id(student_id):
        return Student.get_collection().find_one({'_id': ObjectId(student_id)})

    @staticmethod
    def find_by_roll_number(roll_number):
        return Student.get_collection().find_one({'roll_number': roll_number})

    @staticmethod
    def update(student_id, data):
        data['updated_at'] = datetime.utcnow()
        return Student.get_collection().update_one(
            {'_id': ObjectId(student_id)},
            {'$set': data}
        )

    @staticmethod
    def get_all(teacher_id=None):
        query = {}

        if teacher_id:
            # ✅ FIX: Dono forms mein query karo — ObjectId aur String
            # DB mein kuch records ObjectId hain, kuch String — dono match hon
            try:
                oid = ObjectId(str(teacher_id))
                query['teacher_id'] = {'$in': [oid, str(oid)]}
            except Exception:
                query['teacher_id'] = str(teacher_id)

        return list(Student.get_collection().find(query))

    @staticmethod
    def delete(student_id):
        return Student.get_collection().delete_one({'_id': ObjectId(student_id)})