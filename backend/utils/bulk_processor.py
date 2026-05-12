from utils.pdf_processor import PDFProcessor

def process_bulk_pdf(pdf_path, teacher_answer, total_marks, gemini_service):
    """
    BULK PROCESSOR (HANDWRITTEN SUPPORT)
    PDF → Images → Gemini → Extract + Evaluate → JSON
    """
    try:
        # Convert PDF to images
        images = PDFProcessor.convert_pdf_to_images(pdf_path, max_pages=50)

        if not images:
            return []

        prompt = f"""
You are an expert examiner.

This PDF contains MULTIPLE handwritten student answer sheets.

TASK:
1. Extract all students from the PDF
2. For each student extract:
   - name (student ka naam)
   - roll_no (roll number, MANDATORY)
   - their written answer
   - evaluate their answer vs the MODEL ANSWER below

3. Award marks out of {total_marks}
4. Be strict but fair

MODEL ANSWER:
{teacher_answer}

RETURN ONLY A VALID JSON ARRAY (no explanation, no markdown, just raw JSON):

[
  {{
    "name": "Student Name",
    "roll_no": "Roll Number",
    "obtained_marks": 0,
    "remarks": "Brief feedback"
  }}
]
"""

        print("🔥 BULK PROCESS START")
        print("Images:", len(images))
        print("Total Marks:", total_marks)

        contents = [prompt, *images]
        response = gemini_service.model.generate_content(contents)

        print("🔥 GEMINI RESPONSE:")
        print(response.text)

        result = gemini_service._parse_json(response.text)

        return result if result else []

    except Exception as e:
        print("❌ Bulk Processing Error:", e)
        return []