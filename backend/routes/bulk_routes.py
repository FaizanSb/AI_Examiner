from utils.pdf_processor import *
from utils.gemini_service import evaluate_answer

def process_bulk_pdf(pdf_path, teacher_answer):
    
    pages = extract_pages_from_pdf(pdf_path)
    students = group_pages_into_students(pages)

    results = []

    for student_pages in students:
        text = " ".join(student_pages)

        info = extract_student_info(text)

        if not info["roll_no"]:
            continue

        evaluation = evaluate_answer(
            teacher_answer,
            info["answers"]
        )

        results.append({
            "name": info["name"],
            "roll_no": info["roll_no"],
            "evaluation": evaluation
        })

    return results