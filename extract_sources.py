import os
from pdfminer.high_level import extract_text

SOURCES = {
    "whitcraft_list_of_paradoxes.pdf": "whitcraft_list_of_paradoxes.txt",
    "szpiro23.pdf": "szpiro23.txt",
    "clark_paradoxes_a_to_z.pdf": "clark_paradoxes_a_to_z.txt",
}

base_dir = os.path.dirname(__file__)
source_dir = os.path.join(base_dir, "sources")
text_dir = os.path.join(source_dir, "text")
os.makedirs(text_dir, exist_ok=True)

for pdf_name, out_name in SOURCES.items():
    pdf_path = os.path.join(source_dir, pdf_name)
    if not os.path.exists(pdf_path):
        print(f"Missing {pdf_path}, skipping")
        continue
    out_path = os.path.join(text_dir, out_name)
    if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
        print(f"Already extracted {out_name}")
        continue
    print(f"Extracting {pdf_name} -> {out_name}")
    try:
        text = extract_text(pdf_path)
    except Exception as exc:
        print(f"Failed to extract {pdf_name}: {exc}")
        continue
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(text)
