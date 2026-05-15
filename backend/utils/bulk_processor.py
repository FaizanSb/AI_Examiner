from utils.pdf_processor import PDFProcessor

def process_bulk_pdf(pdf_path, teacher_answer, total_marks, gemini_service):
    try:
        images = PDFProcessor.convert_pdf_to_images(pdf_path, max_pages=50)

        if not images:
            return []

        # CALL 1: Extract only
        extract_prompt = """
You are a data extractor. This PDF has multiple handwritten student answer sheets.

YOUR ONLY JOB: Extract student info and their written answers. DO NOT evaluate. DO NOT give marks.

For each student extract:
- name: their name written on sheet
- roll_no: their roll number
- answer: their complete written answer word for word

RETURN ONLY RAW JSON ARRAY (no markdown):
[
  {
    "name": "Student Name",
    "roll_no": "Roll Number",
    "answer": "Complete answer exactly as student wrote it"
  }
]
"""
        print("🔥 STEP 1: Extracting students...")
        contents = [extract_prompt, *images]
        response = gemini_service.model.generate_content(contents)
        print("Extraction Response:", response.text)

        students = gemini_service._parse_json(response.text)
        if not students:
            return []

        print(f"✅ Extracted {len(students)} students")

        # CALL 2: Evaluate each student individually
        results = []

        for student in students:
            eval_prompt = f"""
You are a strict examiner. Evaluate ONLY based on the MODEL ANSWER below.

TOTAL MARKS: {total_marks}

MODEL ANSWER (compare strictly against this only):
{teacher_answer}

STUDENT NAME: {student.get('name')}
STUDENT ROLL NO: {student.get('roll_no')}

STUDENT ANSWER:
{student.get('answer', 'No answer written')}

RULES:
- Give marks ONLY for content matching the MODEL ANSWER
- Content not in model answer = no marks
- Be strict but fair

RETURN ONLY RAW JSON (single object, no markdown):
{{
  "name": "{student.get('name')}",
  "roll_no": "{student.get('roll_no')}",
  "answer": "{student.get('answer', '')}",
  "marks_awarded": 0,
  "percentage": 0,
  "grade": "F",
  "feedback": "detailed feedback comparing to model answer",
  "strengths": ["strength 1", "strength 2"],
  "missing_points": ["missing point 1", "missing point 2"]
}}
"""
            print(f"🔥 Evaluating: {student.get('name')}...")
            eval_response = gemini_service.model.generate_content(eval_prompt)
            print(f"Eval Response:", eval_response.text)

            evaluated = gemini_service._parse_json(eval_response.text)

            if evaluated:
                if isinstance(evaluated, list):
                    evaluated = evaluated[0]
                
                # percentage aur grade calculate karo agar Gemini ne galat diya
                marks = evaluated.get('marks_awarded', 0)
                pct = round((marks / total_marks) * 100, 1) if total_marks else 0
                evaluated['percentage'] = pct
                evaluated['grade'] = _calculate_grade(pct)
                evaluated['remarks'] = _calculate_remarks(pct)

                results.append(evaluated)

        print(f"✅ Evaluated {len(results)} students")
        return results

    except Exception as e:
        print("❌ Bulk Processing Error:", e)
        return []


def _calculate_grade(percentage):
    if percentage >= 90: return 'A+'
    if percentage >= 80: return 'A'
    if percentage >= 70: return 'B+'
    if percentage >= 60: return 'B'
    if percentage >= 50: return 'C'
    if percentage >= 40: return 'D'
    return 'F'

def _calculate_remarks(percentage):
    if percentage >= 50:
        return 'Pass'
    return 'Fail'