"""Regenera el banco de preguntas de las rondas en vivo desde los Word.

    python scripts/banco-preguntas/build.py
    node scripts/build-rondas.mjs          # y luego la migración

Lee los .docx de scripts/data/banco-preguntas/, escribe
src/lib/questionBank.json y las imágenes en public/preguntas/.
Requiere Python 3 con Pillow (pip install pillow).
"""
import os, subprocess, sys, tempfile, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))
SRC = os.path.join(REPO, 'scripts', 'data', 'banco-preguntas')
DOCS = {  # docx → (texto volcado, carpeta de imágenes)
    'matematicas.docx': ('mate.txt', 'mat'),
    'lectura-critica.docx': ('lectura.txt', 'lec'),
    'ciencias-naturales.docx': ('ciencias.txt', 'cie'),
    'sociales.docx': ('sociales.txt', 'soc'),
}
sys.path.insert(0, HERE)
from ampliacion import DOCS as AMP_DOCS
DOCS.update(AMP_DOCS)

work = tempfile.mkdtemp(prefix='banco-preguntas-')
for docx, (txt, folder) in DOCS.items():
    path = os.path.join(SRC, docx)
    subprocess.run([sys.executable, os.path.join(HERE, 'dump.py'), path, os.path.join(work, txt)], check=True)
    z = zipfile.ZipFile(path)
    os.makedirs(os.path.join(work, 'img', folder), exist_ok=True)
    for n in z.namelist():
        # Un documento guarda una imagen en media/ en vez de word/media/.
        if (n.startswith('word/media/') or n.startswith('media/')) and os.path.basename(n):
            open(os.path.join(work, 'img', folder, os.path.basename(n)), 'wb').write(z.read(n))

subprocess.run([sys.executable, os.path.join(HERE, 'parse.py'), work], check=True)
subprocess.run([sys.executable, os.path.join(HERE, 'curate.py'), work, REPO], check=True)
print('Listo. Ahora: node scripts/build-rondas.mjs')
