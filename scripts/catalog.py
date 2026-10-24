"""Inventory PDFs without inferring scores. Plaintext output belongs in .private/."""
import argparse, hashlib, json
from pathlib import Path
from pypdf import PdfReader

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('--output', type=Path, default=Path('.private/catalog.json'))
args = parser.parse_args()
items, seen = [], set()
for path in sorted(args.source.rglob('*.pdf')):
    content = path.read_bytes()
    digest = hashlib.sha256(content).hexdigest()
    if digest in seen:
        continue
    seen.add(digest)
    reader = PdfReader(path)
    items.append(dict(id=digest, path=str(path.resolve()), title=path.stem,
                      kind='source' if 'temp' in path.relative_to(args.source).parts else 'practice',
                      pages=len(reader.pages)))
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Inventoried {len(items)} unique PDFs. No scores inferred.')
