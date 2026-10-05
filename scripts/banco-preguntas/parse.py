"""Convierte los volcados de texto de los Word en un borrador JSON por pregunta.
Uso: python parse.py <dir_scratch>  → escribe draft.json
"""
import re, json, sys, os

S = sys.argv[1]
SUP = str.maketrans('0123456789+-−()n', '⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻⁻⁽⁾ⁿ')
SUB = str.maketrans('0123456789+-()', '₀₁₂₃₄₅₆₇₈₉₊₋₍₎')


def uni_math(m):
    s = m.group(1)
    # fracciones (a)/(b) → a/b
    s = re.sub(r'\(([^()]*)\)/\(([^()]*)\)', r'\1/\2', s)
    def sup(mm):
        t = mm.group(1)
        if t == '∘':
            return '°'
        return t.translate(SUP) if re.fullmatch(r'[0-9+\-−n]+', t) else '^' + t
    def sub(mm):
        t = mm.group(1)
        return t.translate(SUB) if re.fullmatch(r'[0-9+\-]+', t) else '_' + t
    for _ in range(3):
        s = re.sub(r'\^\(([^()]*)\)', sup, s)
        s = re.sub(r'_\(([^()]*)\)', sub, s)
    s = s.replace('sqrt', '√')
    return s


def clean(t):
    t = re.sub(r'⟦([^⟧]*)⟧', uni_math, t)
    t = re.sub(r'\[L\d/N\d+\]\s*', '', t)
    t = re.sub(r'[ \t]+', ' ', t)
    t = re.sub(r'\s+([.,;:?)])', r'\1', t)
    return t.strip()


def lines(name):
    return [l.rstrip('\n') for l in open(os.path.join(S, name), encoding='utf-8')]


IMG = re.compile(r'\[IMG:media/(image\d+)\.png\]')
OPT = re.compile(r'^\s*([A-D])[.)]\s+(.*)$')


def is_numbered(raw):
    return raw.lstrip().startswith('[L')


def split_q(block):
    """block: líneas crudas de una pregunta → (stem_lines, options, images)."""
    imgs = []
    out = []
    for raw in block:
        for im in IMG.findall(raw):
            imgs.append(im)
        txt = IMG.sub('', raw).strip()
        if txt:
            out.append(raw if not IMG.search(raw) else IMG.sub('', raw))
    # Opciones con letra explícita (A. ...). Una línea puede traer dos (A. … B. …).
    expl = []
    for i, raw in enumerate(out):
        c = clean(raw)
        m = OPT.match(c)
        if m:
            parts = re.split(r'\s(?=[B-D]\.\s)', c)
            for p in parts:
                mm = OPT.match(p)
                if mm:
                    expl.append((i, mm.group(1), mm.group(2).strip()))
    letters = [e[1] for e in expl]
    if letters[-4:] == ['A', 'B', 'C', 'D']:
        first = expl[-4][0]
        opts = [e[2] for e in expl[-4:]]
        return [clean(r) for r in out[:first]], opts, imgs
    # Caso mixto: primera opción numerada y B–D con letra
    if letters[-3:] == ['B', 'C', 'D'] and expl[-3][0] >= 1:
        first = expl[-3][0] - 1
        opts = [clean(out[first])] + [e[2] for e in expl[-3:]]
        return [clean(r) for r in out[:first]], opts, imgs
    # Opciones numeradas: las 4 últimas líneas
    opts = [clean(r) for r in out[-4:]]
    return [clean(r) for r in out[:-4]], opts, imgs


def table_after(ls, marker_idx):
    rows = []
    i = marker_idx
    while i < len(ls) and ls[i] != '<<TABLE>>':
        i += 1
    i += 2  # salta cabecera
    while i < len(ls) and ls[i] != '<</TABLE>>':
        rows.append([c.strip() for c in ls[i].split('|')])
        i += 1
    return rows


def stem_text(stem):
    """Une el enunciado; las tablas inline se vuelven líneas con ' | '."""
    res = []
    in_tab = False
    for l in stem:
        if l == '<<TABLE>>':
            in_tab = True
            continue
        if l == '<</TABLE>>':
            in_tab = False
            continue
        res.append(('▸ ' + l) if in_tab else l)
    return res


items = []

# ───────────── MATEMÁTICAS ─────────────
ml = lines('mate.txt')
blocks, cur, num = [], None, None
for l in ml:
    m = re.match(r'^Pregunta (\d+)\s*$', l.strip())
    if m:
        if cur is not None:
            blocks.append((num, cur))
        num, cur = int(m.group(1)), []
        continue
    if l.startswith('Justificación'):
        blocks.append((num, cur)); cur = None
        break
    if cur is not None:
        cur.append(l)
just = {}
for l in ml:
    m = re.search(r'Pregunta (\d+) \(([A-D])\):\s*(.*)$', l)
    if m:
        just[int(m.group(1))] = (m.group(2), m.group(3).strip())
for n, b in blocks:
    stem, opts, imgs = split_q(b)
    letter, exp = just[n]
    items.append(dict(src='mat', set=1, num=n, stem=stem_text(stem), options=opts,
                      correct='ABCD'.index(letter), explanation=exp, images=imgs))

# ───────────── CIENCIAS ─────────────
cl = lines('ciencias.txt')
part = 1
area = None
blocks = []
cur = None
for l in cl:
    s = l.strip()
    if s in ('BIOLOGÍA', 'QUÍMICA', 'FÍSICA'):
        if cur is not None:
            blocks.append(cur); cur = None
        area = {'BIOLOGÍA': 'bio', 'QUÍMICA': 'qui', 'FÍSICA': 'fis'}[s]
        continue
    if s.startswith('Tabla de Respuestas') or s.startswith('TABLA DE RESPUESTAS'):
        if cur is not None:
            blocks.append(cur); cur = None
        part += 1 if s.startswith('Tabla de Respuestas') else 0
        area = None
        continue
    m = re.match(r'^Pregunta (\d+)\s*$', s)
    if m and area:
        if cur is not None:
            blocks.append(cur)
        cur = dict(area=area, part=part, num=int(m.group(1)), lines=[])
        continue
    if cur is not None:
        cur['lines'].append(l)
# claves
keys1, keys2 = {}, {}
i1 = next(i for i, l in enumerate(cl) if l.startswith('Tabla de Respuestas'))
for r in table_after(cl, i1):
    keys1[int(r[0])] = (r[1], r[2])
i2 = next(i for i, l in enumerate(cl) if l.startswith('TABLA DE RESPUESTAS'))
for r in table_after(cl, i2):
    keys2[int(r[0])] = (r[2], r[3])
for b in blocks:
    stem, opts, imgs = split_q(b['lines'])
    if b['part'] == 1:
        letter, topic = keys1[b['num']]
        exp = ''
    else:
        letter, exp = keys2[b['num']]
        topic = ''
    items.append(dict(src=b['area'], set=b['part'], num=b['num'], stem=stem_text(stem),
                      options=opts, correct='ABCD'.index(letter), explanation=exp,
                      topic=topic, images=imgs))

# ───────────── LECTURA ─────────────
ll = lines('lectura.txt')
set_ = 1
passages = []
blocks = []
cur_p = None
cur = None
in_table = False
for idx, l in enumerate(ll):
    s = l.strip()
    if s == '<<TABLE>>':
        in_table = True
        continue
    if s == '<</TABLE>>':
        in_table = False
        continue
    if in_table:
        continue
    if s.startswith('TABLA DE RESPUESTAS'):
        if cur is not None:
            blocks.append(cur); cur = None
        continue
    if s == 'Prueba Lectura Crítica' or s == 'Lectura Critica':
        continue
    if re.match(r'^RESPOND[EA] (LAS|LA) PREGUNTAS?', s):
        if cur is not None:
            blocks.append(cur); cur = None
        if s.startswith('RESPONDA ') and set_ == 1:
            set_ = 2
        cur_p = dict(set=set_, head=s, lines=[], id=len(passages))
        passages.append(cur_p)
        continue
    m1 = re.match(r'^Pregunta (\d+)\s*$', s)
    m2 = re.match(r'^(\d+)\.\s*(.*)$', s) if set_ == 2 else None
    if m1 or (m2 and int(m2.group(1)) <= 26 and (not cur or int(m2.group(1)) == cur['num'] + 1)):
        if cur is not None:
            blocks.append(cur)
        n = int((m1 or m2).group(1))
        cur = dict(set=set_, num=n, passage=cur_p['id'] if cur_p else None, lines=[])
        if m2 and m2.group(2):
            cur['lines'].append(m2.group(2))
        continue
    if cur is not None:
        cur['lines'].append(l)
    elif cur_p is not None:
        cur_p['lines'].append(l)
if cur is not None:
    blocks.append(cur)

# claves lectura: dos tablas
tabs = [i for i, l in enumerate(ll) if l.strip() == '<<TABLE>>']
lkeys = []
for ti in tabs:
    d = {}
    for r in table_after(ll, ti):
        d[int(r[0])] = (r[2], r[1])
    lkeys.append(d)
for b in blocks:
    stem, opts, imgs = split_q(b['lines'])
    letter, comp = lkeys[b['set'] - 1][b['num']]
    items.append(dict(src='lec', set=b['set'], num=b['num'], stem=stem_text(stem), options=opts,
                      correct='ABCD'.index(letter), explanation='', topic=comp, images=imgs,
                      passage=b['passage']))

pjson = []
for p in passages:
    imgs = []
    body = []
    for raw in p['lines']:
        imgs += IMG.findall(raw)
        t = clean(IMG.sub('', raw))
        if t:
            body.append(t)
    pjson.append(dict(id=p['id'], set=p['set'], head=p['head'], body=body, images=imgs))

json.dump(dict(items=items, passages=pjson), open(os.path.join(S, 'draft.json'), 'w', encoding='utf-8'),
          ensure_ascii=False, indent=1)
from collections import Counter
print(Counter((i['src'], i['set']) for i in items))
bad = [i for i in items if len(i['options']) != 4 or any(not o for o in i['options'])]
print('opciones raras:', [(i['src'], i['set'], i['num']) for i in bad])
print('pasajes:', len(pjson))

