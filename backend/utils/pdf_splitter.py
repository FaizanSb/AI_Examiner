from PyPDF2 import PdfReader

def split_pdf_by_students(pdf_path, pages_per_student=5):
    reader = PdfReader(pdf_path)
    total_pages = len(reader.pages)

    student_chunks = []

    for i in range(0, total_pages, pages_per_student):
        chunk = reader.pages[i:i+pages_per_student]
        student_chunks.append(chunk)

    return student_chunks