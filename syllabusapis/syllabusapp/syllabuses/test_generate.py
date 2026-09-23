import os
import django

# Khởi tạo môi trường Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'syllabusapp.settings')
django.setup()

from syllabuses.models import Syllabus, TemplateSyllabus
from handlers.renderer import MasterTemplateRenderer


def run_test():
    syllabus_id = 1  # Đổi ID syllabus bạn muốn kiểm tra
    syllabus = Syllabus.objects.filter(id=syllabus_id).first()

    if not syllabus:
        print(f"Không tìm thấy Syllabus ID {syllabus_id}")
        return

    # Lấy file template từ TemplateSyllabus (hoặc đường dẫn trực tiếp)
    template_syllabus = TemplateSyllabus.objects.filter(id=22).first()
    if not template_syllabus or not template_syllabus.file:
        template_path = os.path.join("templates", "docx", "template_master.docx")
    else:
        template_path = template_syllabus.file.path

    print(f"--> Sử dụng Template: {template_path}")
    print(f"--> Khởi tạo Renderer cho Syllabus: {syllabus.name} (ID: {syllabus.id})")

    renderer = MasterTemplateRenderer(template_path)

    # 1. In toàn bộ từ điển dữ liệu đã bóc tách được để kiểm tra tính chính xác của key
    extracted_data = renderer._extract_all_data(syllabus)
    print("\n--- DỮ LIỆU ĐÃ TRÍCH XUẤT ĐƯỢC ---")
    for k, v in extracted_data.items():
        if isinstance(v, list):
            print(f"[{k}] (TABLE, {len(v)} dòng):")
            for row in v[:2]:  # In 2 dòng đầu minh họa
                print(f"   -> {row}")
        else:
            print(f"[{k}]: {v}")

    # 2. Render ra buffer và xuất file
    output_dir = os.path.join("media", "output_test")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"result_syllabus_{syllabus.id}.docx")

    buffer = renderer.render(syllabus)
    with open(output_path, "wb") as f:
        f.write(buffer.getvalue())

    print(f"\n--> Render thành công! File lưu tại: {output_path}")


if __name__ == "__main__":
    run_test()