from utils.pdf_processor import PDFProcessor

def process_bulk_pdf(pdf_path, teacher_answer, teacher_info, gemini_service):
    """
    BULK PROCESSOR (HANDWRITTEN SUPPORT)
    PDF → Images → Gemini → Extract + Evaluate → JSON
    """

    try:
        # ✅ Convert PDF to images
        images = PDFProcessor.convert_pdf_to_images(pdf_path, max_pages=50)

        if not images:
            return []

        # ✅ Prompt
        prompt = f"""
You are an expert examiner.

This PDF contains MULTIPLE handwritten student answer sheets.

TASK:
1. Extract all students
2. For each student extract:
   - name
   - roll_no (MANDATORY)
   - evaluate answers

3. Mark out of 10
4. Be strict but fair

RETURN ONLY VALID JSON ARRAY:

[
  {{
    "name": "",
    "roll_no": "",
    "obtained_marks": 0,
    "total_marks": 10,
    "remarks": ""
  }}
]

TEACHER ANSWER:
{teacher_answer}
"""

        # ✅ Gemini Call
        print("🔥 BULK PROCESS START")
        print("Images:", len(images))

        contents = [prompt, *images]
        response = gemini_service.model.generate_content(contents)

        print("🔥 GEMINI RESPONSE:")
        print(response.text)

        # ✅ Parse JSON
        result = gemini_service._parse_json(response.text)

        return result if result else []

    except Exception as e:
        print("❌ Bulk Processing Error:", e)
        return []