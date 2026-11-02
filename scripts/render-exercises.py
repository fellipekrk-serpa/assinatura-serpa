"""Render verified source pages for static hosting; originals remain local."""
import sys, json, hashlib
from pathlib import Path
sys.path.insert(0, sys.argv[1])
import pymupdf
from PIL import Image

root = Path(__file__).resolve().parents[1]
books = json.loads(Path(sys.argv[2]).read_text())
output = root / 'public' / 'exercicios'
output.mkdir(parents=True, exist_ok=True)
manifest = {}
for book in books:
    source = root / 'Apostilas' / (book['id'] + '.pdf')
    assert hashlib.sha256(source.read_bytes()).hexdigest() == book['sha256']
    doc = pymupdf.open(source)
    assert len(doc) == book['pages']
    folder = output / book['id']
    folder.mkdir(exist_ok=True)
    for index, page in enumerate(doc):
        target = folder / f'{index + 1}.webp'
        pix = page.get_pixmap(matrix=pymupdf.Matrix(1600 / page.rect.width, 1600 / page.rect.width), alpha=False)
        Image.frombytes('RGB', [pix.width, pix.height], pix.samples).save(target, 'WEBP', quality=88, method=4)
    manifest[book['id']] = book['pages']
    print(book['id'], len(doc), flush=True)
(output / 'index.json').write_text(json.dumps(manifest), encoding='utf-8')
print('bytes', sum(f.stat().st_size for f in output.rglob('*.webp')), flush=True)
