import os, sys
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'syllabusapp.settings')
import django
django.setup()

from syllabuses.models import TemplateSyllabus, TemplateBlock, TemplateMainSection, TemplateSubSection

t = TemplateSyllabus.objects.filter(id=1).first()
if not t:
    print("Template 1 not found")
    sys.exit()

print(f"=== TEMPLATE {t.id}: {t.name} ===")
for ms in t.main_sections.all().order_by("position"):
    print(f"\n[MainSection ID={ms.id}] code='{ms.code}' name='{ms.name}' position={ms.position}")
    for sub in ms.sub_sections.all().order_by("position"):
        print(f"   [SubSection ID={sub.id}] code='{sub.code}' type='{sub.type}' pos={sub.position}")

print(f"\n=== BLOCKS IN TEMPLATE {t.id} ({t.blocks.filter(is_active=True).count()} blocks) ===")
for b in t.blocks.filter(is_active=True).order_by("position"):
    cfg_code = (b.config or {}).get("code")
    cfg_table = (b.config or {}).get("table_code")
    print(f"Block ID={b.id}: code='{b.code}', name='{b.name}', type='{b.block_type}', cfg.code='{cfg_code}', cfg.table_code='{cfg_table}'")
