import os
from pdf2image import convert_from_path
from PyPDF2 import PdfReader
from PIL import Image
import numpy as np
import logging
import platform
import gc
import base64
from io import BytesIO

logger = logging.getLogger(__name__)

# Set Poppler path only for Windows development
POPPLER_PATH = None
if platform.system() == 'Windows':
    POPPLER_PATH = r"C:\poppler-25.12.0\Library\bin"


class PDFProcessor:

    @staticmethod
    def extract_text_from_pdf(pdf_path):
        """Extract plain text from PDF (for model answers)"""
        try:
            reader = PdfReader(pdf_path)
            text = ""

            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

            return text.strip()

        except Exception as e:
            raise Exception(f"Error extracting text from PDF: {str(e)}")

    @staticmethod
    def convert_pdf_to_images(pdf_path, max_pages=5):
        """Convert PDF to images (limited pages for API saving)"""
        try:
            logger.info(f"Converting PDF to images: {pdf_path}")

            if POPPLER_PATH:
                images = convert_from_path(
                    pdf_path,
                    dpi=50,
                    poppler_path=POPPLER_PATH,
                    last_page=max_pages
                )
            else:
                images = convert_from_path(
                    pdf_path,
                    dpi=50,
                    last_page=max_pages
                )

            logger.info(f"Converted {len(images)} pages to images")
            return images

        except Exception as e:
            raise Exception(f"Error converting PDF to images: {str(e)}")

    @staticmethod
    def extract_text_from_images_via_gemini(images, gemini_service):
        """Use Gemini vision API to extract text (BEST METHOD)"""
        try:
            logger.info(f"Extracting text from {len(images)} images using Gemini...")
            extracted_text = ""

            for idx, image in enumerate(images):
                try:
                    logger.info(f"Processing page {idx + 1}/{len(images)}")

                    # Convert image to base64
                    img_byte_arr = BytesIO()
                    image.save(img_byte_arr, format='JPEG', quality=70, optimize=True)
                    img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode()

                    response = gemini_service.model.generate_content([
                        "Extract all text from this image. Include handwritten and typed text. Return ONLY text.",
                        {
                            "mime_type": "image/jpeg",
                            "data": img_base64
                        }
                    ])

                    page_text = response.text.strip() if response.text else ""
                    extracted_text += f"\n--- Page {idx + 1} ---\n{page_text}\n"

                    # cleanup
                    del image
                    del img_byte_arr
                    gc.collect()

                except Exception as page_error:
                    logger.warning(f"Page {idx + 1} error: {str(page_error)}")
                    extracted_text += f"\n--- Page {idx + 1} ---\n[Error]\n"
                    gc.collect()
                    continue

            return extracted_text.strip()

        except Exception as e:
            raise Exception(f"Gemini extraction error: {str(e)}")

    @staticmethod
    def process_student_chunk(pages):
        """
        🔥 IMPORTANT FOR BULK MODE
        Combine all pages of ONE student into single text
        (NO API CALL HERE → saves cost)
        """
        try:
            full_text = ""

            for idx, page in enumerate(pages):
                try:
                    text = page.extract_text()
                    if text:
                        full_text += f"\n--- Page {idx + 1} ---\n{text}\n"
                except Exception as e:
                    logger.warning(f"Error reading page {idx}: {str(e)}")
                    continue

            return full_text.strip()

        except Exception as e:
            logger.error(f"Error processing student chunk: {str(e)}")
            return ""

    @staticmethod
    def save_uploaded_file(file, upload_folder):
        """Save uploaded file and return path"""
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)

        file_path = os.path.join(upload_folder, file.filename)
        file.save(file_path)

        return file_path