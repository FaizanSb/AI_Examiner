import google.generativeai as genai
import json
import re
import logging

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self, api_key):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    def _parse_json(self, text):
        """Extract JSON from Gemini response"""
        try:
            text = text.strip()

            # Try JSON block
            json_match = re.search(r'```(?:json)?\s*(\[.*?\]|\{.*?\})\s*```', text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))

            # Fallback
            raw_match = re.search(r'(\[.*\]|\{.*\})', text, re.DOTALL)
            if raw_match:
                return json.loads(raw_match.group())

            return []
        except Exception:
            return []

    def evaluate_and_extract(self, student_text, teacher_answer):
        """Single student evaluation (fallback use)"""

        prompt = f"""
You are an expert examiner.

Extract:
- name
- roll_no
- evaluate answer

Return ONLY JSON:

{{
  "name": "",
  "roll_no": "",
  "obtained_marks": 0,
  "total_marks": 10,
  "remarks": ""
}}

TEACHER ANSWER:
{teacher_answer}

STUDENT ANSWER:
{student_text}
"""

        try:
            response = self.model.generate_content(prompt)
            result = self._parse_json(response.text)

            return result if result else {
                "name": None,
                "roll_no": None,
                "obtained_marks": 0,
                "total_marks": 10,
                "remarks": "No data"
            }

        except Exception as e:
            return {
                "name": None,
                "roll_no": None,
                "obtained_marks": 0,
                "total_marks": 10,
                "remarks": str(e)
            }