def extract_student_info(text, gemini_call):
    prompt = f"""
    Extract the following from the text:
    - Student Name
    - Roll Number (MANDATORY)

    Return JSON:
    {{
        "name": "...",
        "roll_no": "..."
    }}

    Text:
    {text}
    """

    return gemini_call(prompt)