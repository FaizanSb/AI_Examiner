import google.generativeai as genai
import json
import re
import logging

logger = logging.getLogger(__name__)


class GeminiService:
    def __init__(self, api_key):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    # =============================
    # JSON PARSER
    # =============================
    def _parse_json(self, text):
        try:
            text = text.strip()

            json_match = re.search(r'```(?:json)?\s*(\[.*?\]|\{.*?\})\s*```', text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))

            raw_match = re.search(r'(\[.*\]|\{.*\})', text, re.DOTALL)
            if raw_match:
                return json.loads(raw_match.group())

            return []
        except Exception as e:
            logger.error(f"JSON Parse Error: {e}")
            return []

    # =============================
    # MAIN EVALUATION METHOD
    # =============================
    def evaluate_answer(self, student_text, teacher_answer, max_marks, question):
        prompt = f"""
You are an expert examiner.

Evaluate the student's answer based on the teacher's answer.

QUESTION:
{question}

TASK:
1. Evaluate answer strictly
2. Give marks out of {max_marks}
3. Give short feedback
4. List 2-3 strengths
5. List 2-3 areas for improvement

RETURN ONLY JSON (no extra text):

{{
  "marks_awarded": 0,
  "max_marks": {max_marks},
  "percentage": 0,
  "grade": "F",
  "feedback": "",
  "strengths": [],
  "missing_points": []
}}

TEACHER ANSWER:
{teacher_answer}

STUDENT ANSWER:
{student_text}
"""
        try:
            response = self.model.generate_content(prompt)
            print("🔥 GEMINI RAW:", response.text)

            result = self._parse_json(response.text)

            if not result:
                return {
                    "marks_awarded": 0,
                    "max_marks": max_marks,
                    "percentage": 0,
                    "grade": "F",
                    "feedback": "No evaluation generated",
                    "strengths": [],
                    "missing_points": []
                }

            obtained = result.get("marks_awarded", 0)
            total = result.get("max_marks", max_marks)
            percentage = (obtained / total) * 100 if total > 0 else 0

            if percentage >= 80:
                grade = "A"
            elif percentage >= 60:
                grade = "B"
            elif percentage >= 40:
                grade = "C"
            else:
                grade = "F"

            return {
                "marks_awarded": obtained,
                "max_marks": total,
                "percentage": round(percentage, 2),
                "grade": result.get("grade", grade),
                "feedback": result.get("feedback", ""),
                "strengths": result.get("strengths", []),
                "missing_points": result.get("missing_points", [])
            }

        except Exception as e:
            logger.error(f"Gemini Error: {e}")
            return {
                "marks_awarded": 0,
                "max_marks": max_marks,
                "percentage": 0,
                "grade": "F",
                "feedback": str(e),
                "strengths": [],
                "missing_points": []
            }