from datetime import datetime

from flask import Flask, request, jsonify
from flask_cors import CORS
from config import Config
from utils.pdf_processor import PDFProcessor
from utils.gemini_service import GeminiService
from utils.db_connection import db, db_connection
from models.teacher import Teacher
from models.student import Student
from models.evaluation import Evaluation
from bson import ObjectId
from utils.bulk_processor import process_bulk_pdf
from werkzeug.security import generate_password_hash
import os
import logging
from routes.auth_routes import auth_bp
from routes.student_routes import student_bp
from routes.evaluation_routes import evaluation_bp
from utils.auth_helper import get_current_user_id
from config import Config

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# ✅ Register blueprints FIRST
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(student_bp, url_prefix="/api/students")
app.register_blueprint(evaluation_bp, url_prefix="/api/evaluations")

# Configure CORS for both development and production
cors_origins = [
    'http://localhost:3000',
    'http://localhost:5000',
    os.getenv('FRONTEND_URL', 'http://localhost:3000')
]
CORS(app, origins=cors_origins, supports_credentials=True)

# Configuration
app.config['UPLOAD_FOLDER'] = Config.UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = Config.MAX_FILE_SIZE

# Initialize services
pdf_processor = PDFProcessor()
gemini_service = GeminiService(Config.GEMINI_API_KEY)


# NAYA — yeh lagao
def serialize_doc(doc):
    """Convert MongoDB document to JSON serializable format"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(item) for item in doc]
    if isinstance(doc, dict):
        result = {}
        for k, v in doc.items():
            result[k] = serialize_doc(v)
        # Frontend consistency
        if 'roll_number' in result:
            result['rollNumber'] = result['roll_number']
        return result
    if isinstance(doc, ObjectId):
        return str(doc)
    if isinstance(doc, datetime):
        return doc.isoformat()
    return doc


# ==================== ROOT ROUTES ====================

@app.route('/api/me', methods=['GET', 'OPTIONS'])
def get_me():
    if request.method == 'OPTIONS':
        return '', 200

    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401

        user = Teacher.find_by_id(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        return jsonify({
            "name": user.get("name"),
            "email": user.get("email"),
            "subject": user.get("subject")
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/', methods=['GET'])
def root():
    return jsonify({
        'message': 'AI Examiner API',
        'version': '1.0',
        'endpoints': {
            'auth': '/api/auth',
            'students': '/api/students',
            'evaluations': '/api/evaluations',
            'health': '/api/health'
        }
    })


@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        db_connection.get_db().command('ping')
        db_status = 'connected'
    except Exception as e:
        db_status = f'disconnected: {str(e)}'

    return jsonify({
        'status': 'healthy',
        'message': 'AI Examiner API is running',
        'database': db_status
    })


# ==================== TEACHER ROUTES ====================

@app.route('/api/teachers', methods=['POST'])
def create_teacher():
    try:
        data = request.json
        name = data.get('name')
        email = data.get('email')
        subject = data.get('subject')

        if not name or not email:
            return jsonify({'error': 'Name and email are required'}), 400

        existing = Teacher.find_by_email(email)
        if existing:
            return jsonify({'error': 'Teacher with this email already exists'}), 400

        teacher = Teacher.create(name, email, subject)
        return jsonify({
            'success': True,
            'teacher': serialize_doc(teacher)
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/teachers/<teacher_id>', methods=['GET'])
def get_teacher(teacher_id):
    try:
        teacher = Teacher.find_by_id(teacher_id)
        if not teacher:
            return jsonify({'error': 'Teacher not found'}), 404

        return jsonify({
            'success': True,
            'teacher': serialize_doc(teacher)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/teachers', methods=['GET'])
def get_all_teachers():
    try:
        teachers = Teacher.get_all()
        return jsonify({
            'success': True,
            'teachers': serialize_doc(teachers),
            'count': len(teachers)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/teachers/<teacher_id>', methods=['DELETE'])
def delete_teacher(teacher_id):
    try:
        Teacher.delete(teacher_id)
        return jsonify({'success': True, 'message': 'Teacher deleted successfully'})
    except Exception as e:
        logger.error(f"Error deleting teacher: {str(e)}")
        return jsonify({'error': str(e)}), 500

 # Updating teacher details is not allowed to prevent complications with authentication and data integrity. If needed, this can be implemented in the future with proper validation and security measures.
 
@app.route('/api/update-profile', methods=['PUT'])
def update_profile():

    try:

        # current logged in user
        user_id = get_current_user_id()

        data = request.json

        name = data.get("name")
        email = data.get("email")
        password = data.get("password")
        subject = data.get("subject")

        teachers = db_connection.get_collection("teachers")

        # =========================
        # CHECK EMAIL EXISTS
        # =========================
        existing_email = teachers.find_one({
            "email": email,
            "_id": {"$ne": ObjectId(user_id)}
        })

        if existing_email:

            return jsonify({
                "success": False,
                "message": "Email already exists"
            }), 400


        # =========================
        # CHECK NAME EXISTS
        # =========================
        existing_name = teachers.find_one({
            "name": name,
            "_id": {"$ne": ObjectId(user_id)}
        })

        if existing_name:

            return jsonify({
                "success": False,
                "message": "Username already exists"
            }), 400


        # =========================
        # UPDATE DATA
        # =========================
        update_data = {
            "name": name,
            "email": email,
            "subject": subject
        }

        # password optional
        if password:

            update_data["password"] = generate_password_hash(
                password
            )

        teachers.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )

        return jsonify({
            "success": True,
            "message": "Profile updated successfully"
        }), 200


    except Exception as e:

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

# ==================== STUDENT ROUTES ====================

@app.route('/api/students', methods=['POST'])
def create_student():
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401

        data = request.json
        name = data.get('name')
        email = data.get('email')
        roll_number = data.get('rollNumber')  # 🔥 frontend consistency
        class_name = data.get('class')

        if not name or not roll_number:
            return jsonify({'error': 'Name and roll number are required'}), 400

        existing_email = Student.find_by_email(email)
        existing_roll = Student.find_by_roll_number(roll_number) if roll_number else None

        if existing_email or existing_roll:
            return jsonify({'error': 'Roll No and Email must be unique'}), 400

        student = Student.create(name, email, roll_number, class_name, teacher_id=user_id)
        return jsonify({
            'success': True,
            'student': serialize_doc(student)
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/students', methods=['GET'])
def get_all_students():
    try:
        user_id = get_current_user_id()

        #print("Current User ID:", user_id)

        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401

        students = Student.get_all(teacher_id=user_id)

        return jsonify({
            'success': True,
            'students': serialize_doc(students),
            'count': len(students)
        })

    except Exception as e:
        logger.error(f"Error in /api/students: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/students/<student_id>', methods=['GET'])
def get_student(student_id):
    try:
        student = Student.find_by_id(student_id)
        if not student:
            return jsonify({'error': 'Student not found'}), 404

        return jsonify({
            'success': True,
            'student': serialize_doc(student)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/students/<student_id>', methods=['DELETE'])
def delete_student(student_id):
    try:
        Student.delete(student_id)
        return jsonify({'success': True, 'message': 'Student deleted successfully'})
    except Exception as e:
        logger.error(f"Error deleting student: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/students/<student_id>/statistics', methods=['GET'])
def get_student_statistics(student_id):
    try:
        stats = Evaluation.get_student_statistics(student_id)
        if not stats:
            return jsonify({
                'success': True,
                'statistics': {
                    'total_evaluations': 0,
                    'average_marks': 0,
                    'average_percentage': 0
                }
            })

        return jsonify({
            'success': True,
            'statistics': serialize_doc(stats)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ==================== EVALUATION ROUTES ====================

@app.route('/api/upload-model-answer', methods=['POST'])
def upload_model_answer():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400

        if not Config.allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Only PDF allowed.'}), 400

        file_path = pdf_processor.save_uploaded_file(file, app.config['UPLOAD_FOLDER'])
        text = pdf_processor.extract_text_from_pdf(file_path)
        os.remove(file_path)

        return jsonify({
            'success': True,
            'model_answer': text,
            'message': 'Model answer uploaded successfully'
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/evaluate-answer', methods=['POST'])
def evaluate_answer():
    try:
        if 'student_file' not in request.files:
            return jsonify({'error': 'No student file provided'}), 400

        teacher_id = get_current_user_id()
        if not teacher_id:
            return jsonify({'error': 'Unauthorized'}), 401

        student_file = request.files['student_file']
        model_answer = request.form.get('model_answer')
        max_marks = request.form.get('max_marks')
        question = request.form.get('question', '')
        student_id = request.form.get('student_id')

        if not model_answer or not max_marks:
            return jsonify({'error': 'Model answer and max marks are required'}), 400

        if not Config.allowed_file(student_file.filename):
            return jsonify({'error': 'Invalid file type'}), 400

        try:
            max_marks = int(max_marks)
        except ValueError:
            return jsonify({'error': 'Invalid max marks value'}), 400

        teacher_name = 'Unknown'
        student_name = 'Unknown'
        student_rollno = 'N/A'

        teacher = Teacher.find_by_id(teacher_id)
        if teacher:
            teacher_name = teacher.get('name', 'Unknown')

        if student_id:
            student = Student.find_by_id(student_id)
            if student:
                student_name = student.get('name', 'Unknown')
                student_rollno = student.get('roll_number', 'N/A')

        student_file_path = pdf_processor.save_uploaded_file(student_file, app.config['UPLOAD_FOLDER'])

        logger.info("Attempting text extraction...")
        try:
            student_text = pdf_processor.extract_text_from_pdf(student_file_path)
            if len(student_text.strip()) < 100:
                logger.info("Insufficient text, using Gemini vision API...")
                images = pdf_processor.convert_pdf_to_images(student_file_path, max_pages=5)
                student_text = pdf_processor.extract_text_from_images_via_gemini(images, gemini_service)
        except Exception as extract_error:
            logger.warning(f"Text extraction failed: {str(extract_error)}, using Gemini vision...")
            images = pdf_processor.convert_pdf_to_images(student_file_path, max_pages=5)
            student_text = pdf_processor.extract_text_from_images_via_gemini(images, gemini_service)

        evaluation_result = gemini_service.evaluate_answer(student_text, model_answer, max_marks, question)

        evaluation_doc = Evaluation.create(
            teacher_id=teacher_id,
            student_id=student_id,
            question=question,
            model_answer=model_answer,
            student_answer=student_file.filename,
            extracted_text=student_text,
            max_marks=max_marks,
            evaluation_result=evaluation_result,
            teacher_name=teacher_name,
            student_name=student_name,
            student_rollno=student_rollno
        )

        evaluation_result['extracted_text'] = student_text
        evaluation_result['evaluation_id'] = str(evaluation_doc['_id'])

        os.remove(student_file_path)

        return jsonify({'success': True, 'evaluation': evaluation_result})

    except Exception as e:
        logger.error(f"Evaluation error: {str(e)}")
        return jsonify({'error': str(e)}), 500


# =========================================================
# Helper — ObjectId normalize karo
# =========================================================
def normalize_id(id_val):
    try:
        return str(ObjectId(str(id_val).strip()))
    except Exception:
        return str(id_val).strip()


def _calculate_grade(percentage):
    if percentage >= 90: return 'A+'
    if percentage >= 80: return 'A'
    if percentage >= 70: return 'B+'
    if percentage >= 60: return 'B'
    if percentage >= 50: return 'C'
    if percentage >= 40: return 'D'
    return 'F'


@app.route('/api/evaluate/bulk', methods=['POST'])
def bulk_evaluation():
    try:
        # =========================================================
        # Validate PDF File
        # =========================================================
        if 'file' not in request.files:
            return jsonify({
                "success": False,
                "message": "PDF file required"
            }), 400

        pdf = request.files['file']

        if not Config.allowed_file(pdf.filename):
            return jsonify({
                "success": False,
                "message": "Invalid file type. Only PDF allowed."
            }), 400

        # =========================================================
        # Get Form Data
        # =========================================================
        model_answer = request.form.get('model_answer', '')
        total_marks = request.form.get('total_marks', 10)

        if not model_answer:
            return jsonify({
                "success": False,
                "message": "Model answer is required"
            }), 400

        try:
            total_marks = int(total_marks)
        except (ValueError, TypeError):
            total_marks = 10

        # =========================================================
        # Get Teacher Info
        # =========================================================
        teacher_id = get_current_user_id()

        teacher_name = 'Unknown'
        subject = ''

        if teacher_id:
            teacher = Teacher.find_by_id(teacher_id)

            if teacher:
                teacher_name = teacher.get('name', 'Unknown')
                subject = teacher.get('subject', '')

        # =========================================================
        # Save Uploaded PDF
        # =========================================================
        pdf_path = pdf_processor.save_uploaded_file(
            pdf,
            app.config['UPLOAD_FOLDER']
        )

        try:
            # =====================================================
            # Process PDF
            # =====================================================
            results = process_bulk_pdf(
                pdf_path,
                model_answer,
                total_marks,
                gemini_service
            )

        finally:
            # Always delete temp file
            if os.path.exists(pdf_path):
                os.remove(pdf_path)

        # =========================================================
        # Validate Results
        # =========================================================
        if not results:
            return jsonify({
                "success": False,
                "message": "Could not extract student data from PDF"
            }), 400

        # =========================================================
        # Save Evaluations
        # =========================================================
        saved_results = []

        for s in results:

            obtained = s.get('marks_awarded', 0)

            percentage = s.get(
                'percentage',
                round((obtained / total_marks) * 100, 1)
                if total_marks else 0
            )

            grade = s.get(
                'grade',
                _calculate_grade(percentage)
            )

            roll_no = str(s.get('roll_no', ''))
            student_name = s.get('name', 'Unknown')
            status = 'new'

            # =====================================================
            # Find Existing Student
            # =====================================================
            existing_student = None

            if roll_no:
                student = Student.find_by_roll_number(roll_no)

                if student:
                    # ✅ ObjectId vs String dono handle
                    if normalize_id(student.get('teacher_id')) == normalize_id(teacher_id):
                        existing_student = student
                        logger.info(f"✅ Student found: {student.get('name')} (roll: {roll_no})")
                    else:
                        logger.warning(
                            f"⚠️ teacher_id mismatch for roll {roll_no} — "
                            f"DB: {student.get('teacher_id')} | "
                            f"Current: {teacher_id}"
                        )

            if existing_student:
                status = 'found'
                student_name = existing_student.get('name', student_name)

            else:
                # =================================================
                # Create New Student
                # =================================================
                try:
                    new_student = Student.create(
                        name=student_name,
                        email=f"{roll_no}@gcuf.edu.pk",
                        roll_number=roll_no,
                        class_name=None,
                        teacher_id=ObjectId(str(teacher_id))  # ✅ ObjectId save karo
                    )
                    existing_student = new_student
                    status = 'new'
                    logger.info(f"✅ New student created: {student_name} (roll: {roll_no})")

                except Exception as e:
                    logger.warning(f"Student create failed for {student_name}: {e}")

                    # ✅ Duplicate error — matlab already exists, email se fetch karo
                    try:
                        existing_student = Student.find_by_email(
                            f"{roll_no}@gcuf.edu.pk"
                        )
                        if existing_student:
                            status = 'found'
                            student_name = existing_student.get('name', student_name)
                            logger.info(f"✅ Fallback fetch success: {student_name}")
                        else:
                            logger.warning(f"Fallback fetch bhi failed: {roll_no}")

                    except Exception as fe:
                        logger.warning(f"Fallback fetch error: {fe}")

            # =====================================================
            # Save Evaluation
            # =====================================================
            try:
                eval_doc = Evaluation.create(
                    teacher_id=str(teacher_id),

                    student_id=(
                        str(existing_student.get('_id'))
                        if existing_student else None
                    ),

                    question=subject,

                    model_answer=model_answer,

                    student_answer=s.get('answer', ''),

                    extracted_text=s.get('answer', ''),

                    max_marks=total_marks,

                    evaluation_result={
                        'marks_awarded': obtained,
                        'percentage': percentage,
                        'grade': grade,
                        'feedback': s.get('feedback', ''),
                        'strengths': s.get('strengths', []),
                        'missing_points': s.get(
                            'missing_points',
                            []
                        )
                    },

                    teacher_name=teacher_name,

                    student_name=student_name,

                    student_rollno=roll_no
                )

                eval_id = str(eval_doc['_id'])

            except Exception as db_err:
                logger.warning(f"DB save failed for {student_name}: {db_err}")
                eval_id = None

            # =====================================================
            # Append to Results
            # =====================================================
            saved_results.append({
                "name": student_name,
                "roll_no": roll_no,
                "obtained_marks": obtained,
                "total_marks": total_marks,
                "percentage": percentage,
                "grade": grade,
                "remarks": s.get('remarks', ''),
                "feedback": s.get('feedback', ''),
                "status": status,
                "evaluation_id": eval_id
            })

        # =========================================================
        # Success Response
        # =========================================================
        return jsonify({
            "success": True,
            "results": serialize_doc(saved_results),
            "count": len(saved_results)
        })

    except Exception as e:
        logger.error(f"Bulk evaluation error: {str(e)}")

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
@app.route('/api/evaluations', methods=['GET'])
def get_all_evaluations():
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401

        evaluations = Evaluation.get_all(teacher_id=user_id)
        if not evaluations:
            return jsonify([])

        return jsonify([serialize_doc(e) for e in evaluations])
    except Exception as e:
        logger.error(f"Error fetching evaluations: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/evaluations/<evaluation_id>', methods=['GET'])
def get_evaluation(evaluation_id):
    try:
        evaluation = Evaluation.find_by_id(evaluation_id)
        if not evaluation:
            return jsonify({'error': 'Evaluation not found'}), 404

        return jsonify({
            'success': True,
            'evaluation': serialize_doc(evaluation)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/evaluations/<evaluation_id>', methods=['DELETE'])
def delete_evaluation(evaluation_id):
    try:
        result = Evaluation.delete(evaluation_id)

        if result.deleted_count == 0:
            return jsonify({'error': 'Evaluation not found'}), 404

        return jsonify({
            'success': True,
            'message': 'Evaluation deleted successfully'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/evaluations/student/<student_id>', methods=['GET'])
def get_student_evaluations(student_id):
    try:
        limit = request.args.get('limit', 10, type=int)
        evaluations = Evaluation.find_by_student(student_id, limit)

        return jsonify({
            'success': True,
            'evaluations': serialize_doc(evaluations),
            'count': len(evaluations)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/evaluations/teacher', methods=['GET'])
def get_teacher_evaluations():
    try:
        user_id = get_current_user_id()
        if not user_id:
            return jsonify({'error': 'Unauthorized'}), 401

        limit = request.args.get('limit', 10, type=int)
        evaluations = Evaluation.find_by_teacher(user_id, limit)

        return jsonify({
            'success': True,
            'evaluations': serialize_doc(evaluations),
            'count': len(evaluations)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/evaluations/recent', methods=['GET'])
def get_recent_evaluations():
    try:
        limit = request.args.get('limit', 20, type=int)
        evaluations = Evaluation.get_recent_evaluations(limit)

        return jsonify({
            'success': True,
            'evaluations': serialize_doc(evaluations),
            'count': len(evaluations)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/ocr-only', methods=['POST'])
def ocr_only():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if not Config.allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type'}), 400

        file_path = pdf_processor.save_uploaded_file(file, app.config['UPLOAD_FOLDER'])
        extracted_text = pdf_processor.extract_text_from_pdf(file_path)
        os.remove(file_path)

        return jsonify({
            'success': True,
            'extracted_text': extracted_text
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    required_vars = ['GEMINI_API_KEY', 'MONGO_URI']
    missing_vars = [var for var in required_vars if not os.getenv(var)]

    if missing_vars:
        logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
        raise RuntimeError(f"Missing environment variables: {', '.join(missing_vars)}")

    if not os.path.exists(Config.UPLOAD_FOLDER):
        os.makedirs(Config.UPLOAD_FOLDER)

    try:
        logger.info("Testing database connection...")
        db_connection.connect()
        logger.info("Database connection successful")

        app.run(debug=True, host='0.0.0.0', port=5000)
    finally:
        db_connection.close()
        logger.info("Database connection closed")