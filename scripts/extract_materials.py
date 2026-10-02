"""Copy originals and extract readable MATLAB code; never change source notebooks."""
from pathlib import Path
import json, shutil, zipfile, subprocess, tempfile, xml.etree.ElementTree as ET
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / 'public' / 'materiales'
NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
files = []
for source in sorted(ROOT.glob('semana*/*')):
    if source.suffix not in ('.pdf', '.mlx'):
        continue
    relative = source.relative_to(ROOT)
    target = DEST / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(source, target)
    record = {'id': str(relative), 'week': int(source.parent.name[6:]), 'name': source.name,
              'path': 'materiales/' + str(relative), 'type': source.suffix[1:]}
    if source.suffix == '.pdf':
        record['pages'] = []
        poppler = '/usr/bin/pdftoppm' if Path('/usr/bin/pdftoppm').exists() else 'pdftoppm'
        with tempfile.TemporaryDirectory() as tmp:
            prefix = str(Path(tmp) / 'page')
            subprocess.run([poppler, '-scale-to', '1800', '-png', str(source), prefix], check=True)
            for index, page in enumerate(sorted(Path(tmp).glob('page-*.png')), 1):
                asset = target.parent / (source.stem + f'_page{index:02}.webp')
                Image.open(page).convert('RGB').save(asset, format='WEBP', quality=90)
                record['pages'].append('materiales/' + str(asset.relative_to(DEST)))
    if source.suffix == '.mlx':
        with zipfile.ZipFile(source) as z:
            doc = ET.fromstring(z.read('matlab/document.xml'))
            blocks = []
            for paragraph in doc.findall('.//w:p', NS):
                style = paragraph.find('w:pPr/w:pStyle', NS)
                if style is not None and style.get('{' + NS['w'] + '}val') == 'code':
                    blocks.append(''.join(t.text or '' for t in paragraph.findall('.//w:t', NS)))
            record['code'] = '\n\n'.join(blocks)
            m = target.with_suffix('.m')
            m.write_text(record['code'], encoding='utf-8')
            record['mPath'] = 'materiales/' + str(relative.with_suffix('.m'))
            record['images'] = []
            for image in z.namelist():
                if image.startswith('media/'):
                    asset = target.parent / (source.stem + '_' + Path(image).name)
                    asset.write_bytes(z.read(image))
                    record['images'].append('materiales/' + str(asset.relative_to(DEST)))
    files.append(record)
(ROOT / 'src' / 'materials.json').write_text(json.dumps(files, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'{len(files)} original files prepared; MATLAB code extracted without modifying originals.')
