import subprocess

libreoffice_path = r"C:\Program Files\LibreOffice\program\soffice.exe"

file_word_goc = r"D:\ManageSyllabus\syllabusapis\syllabusapp\templates\exports\syllabus_template.docx"
thu_muc_xuat = r"D:\ManageSyllabus\syllabusapis\syllabusapp\templates\exports"

subprocess.run([
    libreoffice_path,
    "--headless",
    "--convert-to", "pdf",
    "--outdir", thu_muc_xuat,
    file_word_goc
], check=True)

print("Convert thành công! Hãy kiểm tra thư mục.")