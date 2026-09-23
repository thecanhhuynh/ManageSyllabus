import re

def convert_friendly_to_jinja(text):
    """
    Chuyển đổi cú pháp [[TAG]] thành {{ TAG }}
    """
    if not text:
        return text
    text = re.sub(r'\[\[\s*([A-Z_][A-Z0-9_]*)\s*\]\]', r'{{ \1 }}', text)
    return text