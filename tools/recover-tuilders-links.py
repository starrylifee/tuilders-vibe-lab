"""Recover known links from the original Code Dive PDF, without changing the PDF."""
import json
import sys
from pathlib import Path
import fitz

source = Path(sys.argv[1])
root = Path(__file__).resolve().parents[1]
mapping = {19: 18, **{34 + i: 28 + i for i in range(11)}, 60: 54}
links = {}
with fitz.open(source) as pdf:
    for target, original in mapping.items():
        values = []
        for item in pdf[original - 1].get_links():
            uri = item.get('uri', '')
            if uri.startswith(('https://', 'http://')):
                values.append({'url': uri, 'label': '이 장의 체험 링크' if target != 60 else 'Google AI Studio 열기'})
        links[str(target)] = values
(root / 'courses' / 'tuilders-links.json').write_text(json.dumps(links, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Recovered {sum(map(len, links.values()))} links across {len(links)} slides.')
