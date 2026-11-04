"""Ampliación del banco (nov 2026): 295 preguntas de nivel alto y muy alto.

Once documentos, cada uno con su formato. Se AGREGAN al final del banco: los
ids existentes, sus dificultades y las rondas predeterminadas no cambian (por
eso no hace falta migración: las nuevas se eligen desde "Elegir del banco").

    parse_all(work)  → lo llama parse.py: {'items': [...], 'passages': {...}}
    AMP_*            → lo usa curate.py: correcciones, pistas y explicaciones

Numeración: mate-51..75 cuadernillo · mate-76..100 prueba diagnóstica ·
bio/fis/qui-26..55 · lec-76..100 vol. I · lec-101..125 vol. II ·
lec-126..140 vol. III · lec-141..160 infografías · soc-50..79 Sociales ·
soc-80..119 Competencias Ciudadanas.
"""
import os, re

DIR = 'ampliacion-2026'
# archivo → (volcado, carpeta de imágenes)
DOCS = {
    f'{DIR}/biologia.docx': ('amp-bi.txt', 'bi'),
    f'{DIR}/fisica.docx': ('amp-fi.txt', 'fi'),
    f'{DIR}/quimica.docx': ('amp-qu.txt', 'qu'),
    f'{DIR}/lectura-vol1.docx': ('amp-l1.txt', 'l1'),
    f'{DIR}/lectura-vol2.docx': ('amp-l2.txt', 'l2'),
    f'{DIR}/lectura-vol3.docx': ('amp-l3.txt', 'l3'),
    f'{DIR}/lectura-infografias.docx': ('amp-li.txt', 'li'),
    f'{DIR}/sociales-nivel-alto.docx': ('amp-so.txt', 'so'),
    f'{DIR}/competencias-ciudadanas.docx': ('amp-ci.txt', 'ci'),
    f'{DIR}/matematicas-cuadernillo.docx': ('amp-mc.txt', 'mc'),
    f'{DIR}/matematicas-diagnostica.docx': ('amp-md.txt', 'md'),
}

IMG = re.compile(r'\[IMG:/?media/([^\]]+?)\.png\]')
OPT = re.compile(r'^\s*([A-D])[.)]\s+(.*)$', re.S)
TEXT_SUB = re.compile(r'^[A-Za-zÁÉÍÓÚáéíóúñ,]{2,}$')


# ── OMML linealizado (dump.py) → LaTeX para KaTeX ────────────────────────────
def _balanced(s, i):
    """s[i] == '(' → índice de su ')' correspondiente, o -1."""
    depth = 0
    for j in range(i, len(s)):
        if s[j] == '(':
            depth += 1
        elif s[j] == ')':
            depth -= 1
            if depth == 0:
                return j
    return -1


def _tex(s):
    out, i = [], 0
    while i < len(s):
        if s.startswith('sqrt(', i):
            e = _balanced(s, i + 4)
            out.append(r'\sqrt{%s}' % _tex(s[i + 5:e]))
            i = e + 1
            continue
        if s[i] in '^_' and i + 1 < len(s) and s[i + 1] == '(':
            e = _balanced(s, i + 1)
            inner = s[i + 2:e]
            body = r'\text{%s}' % inner if TEXT_SUB.match(inner) else _tex(inner)
            out.append('%s{%s}' % (s[i], body))
            i = e + 1
            continue
        if s[i] == '(':
            e = _balanced(s, i)
            if e > 0 and s.startswith('/(', e + 1):
                e2 = _balanced(s, e + 2)
                out.append(r'\frac{%s}{%s}' % (_tex(s[i + 1:e]), _tex(s[e + 3:e2])))
                i = e2 + 1
                continue
        out.append(s[i])
        i += 1
    t = ''.join(out)
    t = re.sub(r'(?<![A-Za-z\\])(sin|cos|tan)', r'\\\1 ', t)
    return (t.replace('∘', r'\circ ').replace('⟹', r'\implies ').replace('×', r'\times ')
             .replace('π', r'\pi ').replace('μ', r'\mu ').replace('ρ', r'\rho ').replace('θ', r'\theta ')
             .replace('ω', r'\omega ').replace('γ', r'\gamma ').replace('Δ', r'\Delta ').replace('α', r'\alpha ')
             .replace('%', r'\%').replace('≠', r'\neq '))


def math(m):
    s = m.group(1).replace('\u200b', '').strip()
    # Una variable suelta o una expresión sin estructura va como texto.
    if not re.search(r'[\^_/]|sqrt', s):
        return s
    return r'\( %s \)' % _tex(s)


def clean(t):
    t = re.sub(r'⟦([^⟧]*)⟧', math, t)
    t = IMG.sub('', t)
    t = re.sub(r'\[L\d/N\d+\]\s*', '', t).replace('\u200b', '')
    t = re.sub(r'[ \t]+', ' ', t)
    t = re.sub(r'(?<!\\)\s+([.,;:?])', r'\1', t)
    return t.strip()


def lines(work, name):
    with open(os.path.join(work, name), encoding='utf-8') as f:
        return [l.rstrip('\n') for l in f]


def imgs_of(block):
    return [im for l in block for im in IMG.findall(l)]


def split_options(block):
    """Líneas de una pregunta → (enunciado, 4 opciones). Las opciones son las 4
    últimas líneas con texto, con letra o numeradas por Word."""
    txt = [(l, clean(l)) for l in block]
    txt = [(raw, c) for raw, c in txt if c]
    opts = [c for _, c in txt[-4:]]
    opts = [OPT.match(o).group(2).strip() if OPT.match(o) else o for o in opts]
    return [c for _, c in txt[:-4]], opts


def table_rows(ls, start=0):
    rows, inside = [], False
    for l in ls[start:]:
        s = l.strip()
        if s == '<<TABLE>>':
            inside, rows = True, []
        elif s == '<</TABLE>>':
            inside = False
        elif inside:
            rows.append([re.sub(r'^[/\s]+', '', c).strip() for c in s.split(' | ')])
    return rows


def letter(c):
    return 'ABCD'.index(c.strip()[0])


def level(s):
    return 'Muy alto' if 'muy' in s.lower() else 'Alto'


def item(src, num, code, label, stem, options, correct, explanation, nivel, comp='', images=(), passage=None):
    topic = f'{nivel} · {comp}' if comp else nivel
    return dict(src=src, set=3, num=num, amp=True, stem=stem, options=options, correct=correct,
                explanation=explanation, topic=topic, images=list(images), imgdir=code,
                ampPassage=passage, sourceLabel=label)


# ── Un parser por documento ──────────────────────────────────────────────────
def parse_bi(w):
    ls = lines(w, 'amp-bi.txt')
    t = next(i for i, l in enumerate(ls) if l.startswith('TABLA DE RESPUESTAS'))
    rows = {int(r[0]): r for r in table_rows(ls, t)[1:]}
    blocks, cur = [], None
    for l in ls[1:t]:
        if l.startswith('Competencia:'):
            cur = dict(comp=l.split('|')[0].split(':')[1].strip(), lines=[])
            blocks.append(cur)
        else:
            cur['lines'].append(l)
    out = []
    for n, b in enumerate(blocks, 1):
        stem, opts = split_options(b['lines'])
        stem[0] = re.sub(r'^\d+\.\s*', '', stem[0])
        r = rows[n]
        out.append(item('bio', n, 'bi', 'Biología — banco nivel alto', stem, opts, letter(r[1]), clean(r[3]),
                        level(r[2]), b['comp'], imgs_of(b['lines'])))
    return out, {}


def parse_fi(w):
    ls = lines(w, 'amp-fi.txt')
    t = next(i for i, l in enumerate(ls) if l.startswith('TABLA DE RESPUESTAS'))
    keys = {int(r[0]): r for r in table_rows(ls, t)[1:]}
    out, cur = [], None
    for l in ls[:t]:
        m = re.match(r'^Pregunta (\d+)\s+\[Competencia: (.*?) \| Dificultad: (.*?)\]', l)
        if m:
            cur = dict(n=int(m.group(1)), comp=m.group(2), niv=m.group(3), lines=[], exp='')
            out.append(cur)
        elif cur is not None:
            if re.match(r'^Respuesta Correct', l):
                continue
            if l.startswith('Justificación:'):
                cur['exp'] = clean(l.split(':', 1)[1])
            else:
                cur['lines'].append(l)
    res = []
    for b in out:
        stem, opts = split_options(b['lines'])
        res.append(item('fis', b['n'], 'fi', 'Física — banco nivel alto', stem, opts, letter(keys[b['n']][3]),
                        b['exp'], level(b['niv']), b['comp']))
    return res, {}


QU_FIX = [('el nitrógeno líquido y el hidrógeno gaseoso reaccionan', 'el nitrógeno y el hidrógeno gaseosos reaccionan'),
          ('los siguientes semicelda de reducción', 'las siguientes semiceldas de reducción'),
          ('derivantes del propano', 'derivados del propano')]


def parse_qu(w):
    ls = lines(w, 'amp-qu.txt')
    t = next(i for i, l in enumerate(ls) if l.startswith('TABLA DE RESPUESTAS'))
    rows = {int(r[0]): r for r in table_rows(ls, t)[1:]}
    passages, blocks, cur, pid = {}, [], None, None
    i = 0
    while i < t:
        l = ls[i]
        if l.strip() == '<<TABLE>>':
            body = ls[i + 2]  # la línea 1 es "MARCO / CONTEXTO DE EVALUACIÓN"
            parts = [p.strip() for p in body.split(' / ') if p.strip()]
            title = re.sub(r'^CONTEXTO \d+:\s*', '', parts[0])
            n = len(passages) + 1
            pid = f'qc-{n:02d}'
            paras = parts[1:]
            for a, b in QU_FIX:
                paras = [p.replace(a, b) for p in paras]
            passages[pid] = dict(intro='Lee el siguiente contexto para responder.', title=title, paragraphs=paras)
            cur = None
            i += 4
            continue
        m = re.match(r'^(\d+)\.\s+(.*)$', l)
        if m and pid:
            cur = dict(n=int(m.group(1)), pid=pid, lines=[m.group(2)])
            blocks.append(cur)
        elif cur is not None:
            cur['lines'].append(l)
        i += 1
    out = []
    for b in blocks:
        stem, opts = split_options(b['lines'])
        r = rows[b['n']]
        out.append(item('qui', b['n'], 'qu', 'Química — banco nivel alto', stem, opts, letter(r[1]), clean(r[5]),
                        level(r[4]), r[2], passage=b['pid']))
    return out, passages


LEC_FIX = [('de toda fuerza común a la persona', 'con la fuerza común a la persona'),
           ('marco identitario previa', 'marco identitario previo')]


def parse_lectura(w, fname, code, prefix, label):
    """Volúmenes I, II y III: PREGUNTA n + metadatos + tabla con el texto."""
    ls = lines(w, fname)
    t = next(i for i, l in enumerate(ls) if l.startswith('TABLA DE RESPUESTAS'))
    rows = {int(r[0]): r for r in table_rows(ls, t)[1:]}
    passages, by_title, out = {}, {}, []
    idx = [i for i, l in enumerate(ls[:t]) if re.match(r'^PREGUNTA \d+\s*$', l.strip())]
    for k, i in enumerate(idx):
        n = int(ls[i].split()[1])
        end = idx[k + 1] if k + 1 < len(idx) else t
        comp = re.search(r'Competencia:\s*(.*?)\s*\|', ls[i + 1]).group(1)
        a = next(j for j in range(i, end) if ls[j].strip() == '<<TABLE>>')
        z = next(j for j in range(a, end) if ls[j].strip() == '<</TABLE>>')
        title_raw = ls[a + 1].strip()
        title = re.sub(r'\s*\(Continuación\)\s*$', '', title_raw)
        title = re.sub(r'^(TEXTO \d+|INFOGRAFÍA|CARICATURA POLÍTICA):?\s*', '', title).strip()
        if title not in by_title:
            body = ' / '.join(x for x in ls[a + 2:z] if x.strip())
            for x, y in LEC_FIX:
                body = body.replace(x, y)
            images = IMG.findall(body)
            source, paras = None, []
            for p in re.split(r' / (?=Párrafo|\s*\[IMG|Fuente)', IMG.sub('', body)):
                p = p.strip(' /')
                if p.startswith('Fuente'):
                    source = clean(p.split(':', 1)[1])
                elif p:
                    paras.append(clean(p))
            pid = f'{prefix}-{len(by_title) + 1:02d}'
            by_title[title] = pid
            pas = dict(intro='Lee el siguiente texto para responder.', title=title, paragraphs=paras)
            if images:
                pas['images'] = [(code, im) for im in images]
            if source:
                pas['source'] = source
            passages[pid] = pas
        stem, opts = split_options(ls[z + 1:end])
        r = rows[n]
        out.append(item('lec', n, code, label, stem, opts, letter(r[1]), clean(r[3]), level(r[2]), comp,
                        passage=by_title[title]))
    return out, passages


COMP_LI = {'Identifica': 'Identificar', 'Comprende': 'Comprender', 'Reflexiona': 'Reflexionar'}


def parse_li(w):
    ls = lines(w, 'amp-li.txt')
    t = next(i for i, l in enumerate(ls) if l.startswith('TABLA DE RESPUESTAS'))
    j = next(i for i, l in enumerate(ls) if l.startswith('JUSTIFICACIÓN DE LAS RESPUESTAS'))
    rows = {int(r[0]): r for r in table_rows(ls[:j], t)[1:]}
    # Justificación + análisis de los distractores
    exp, cur, reasons = {}, None, False
    for l in ls[j:]:
        m = re.match(r'^Pregunta (\d+) ·', l)
        if m:
            cur, reasons = int(m.group(1)), False
            exp[cur] = []
        elif cur and l.startswith('Justificación:'):
            exp[cur].append(clean(l.split(':', 1)[1]))
        elif cur and l.startswith('Por qué las demás'):
            reasons = True
        elif cur and reasons and OPT.match(clean(l)):
            exp[cur].append(clean(l))
    passages, out, pid, block, n = {}, [], None, [], None

    def flush():
        if n:
            stem, opts = split_options(block)
            r = rows[n]
            out.append(item('lec', n, 'li', 'Lectura crítica — infografías', stem, opts, letter(r[2]),
                            '\n'.join(exp[n]), level(r[4]), COMP_LI[r[3].split()[0]], passage=pid))

    for l in ls[:t]:
        if l.startswith('RESPONDA LAS PREGUNTAS'):
            flush()
            n, block = None, []
            pid = f'li-{len(passages) + 1:02d}'
            passages[pid] = dict(intro='Observa la infografía para responder.', images=[])
            continue
        if pid is None:
            continue
        if IMG.search(l) and not n:
            passages[pid]['images'] = [('li', im) for im in IMG.findall(l)]
            continue
        m = re.match(r'^(\d+)\.\s+(.*)$', l)
        if m:
            flush()
            n, block = int(m.group(1)), [m.group(2)]
        elif n:
            block.append(l)
    flush()
    return out, passages


def parse_so(w):
    ls = lines(w, 'amp-so.txt')
    t = next(i for i, l in enumerate(ls) if l.startswith('TABLA DE RESPUESTAS'))
    # La tabla numera mal una fila ("15" donde va la 14): se leen en orden.
    rows = table_rows(ls, t)[1:]
    blocks, cur = [], None
    for l in ls[:t]:
        m = re.match(r'^Pregunta (\d+)\.\s*(.*)$', l)
        if m:
            cur = dict(n=int(m.group(1)), lines=[m.group(2)])
            blocks.append(cur)
        elif cur is not None:
            cur['lines'].append(l)
    out = []
    for b in blocks:
        stem, opts = split_options(b['lines'])
        r = rows[b['n'] - 1]
        out.append(item('soc', b['n'], 'so', 'Sociales — banco nivel alto', stem, opts, letter(r[1]), clean(r[3]),
                        level(r[2]), '', imgs_of(b['lines'])))
    return out, {}


def parse_ci(w):
    ls = lines(w, 'amp-ci.txt')
    t = next(i for i, l in enumerate(ls) if l.startswith('TABLA DE RESPUESTAS'))
    rows = {int(r[0]): r for r in table_rows(ls, t)[1:]}
    blocks, cur, waiting = [], None, True
    for l in ls[1:t]:
        s = l.strip()
        if not s:
            continue
        # Una pregunta empieza con número tras la justificación de la anterior
        # (la 14 viene tecleada como "4.": se numera por posición).
        m = re.match(r'^\d+\.\s+(.*)$', s)
        if m and waiting:
            cur = dict(n=len(blocks) + 1, lines=[m.group(1)], exp='', key=None)
            blocks.append(cur)
            waiting = False
        elif s.startswith('Justificación:') and cur:
            m2 = re.match(r'^Justificación:\s*La respuesta correcta es ([A-D])\.\s*(.*)$', s)
            cur['key'], cur['exp'] = m2.group(1), m2.group(2)
            waiting = True
        elif cur and not waiting:
            cur['lines'].append(s)
    out = []
    for b in blocks:
        r = rows[b['n']]
        assert r[1][0] == b['key'], ('ciudadanas', b['n'], r[1], b['key'])
        stem, opts = split_options(b['lines'])
        out.append(item('soc', b['n'], 'ci', 'Competencias ciudadanas — banco nivel alto', stem, opts, letter(b['key']),
                        clean(b['exp']), level(r[3]), r[2]))
    return out, {}


def parse_mc(w):
    ls = lines(w, 'amp-mc.txt')
    t = next(i for i, l in enumerate(ls) if l.startswith('CLAVE DE RESPUESTAS'))
    keys, n = {}, None
    for l in ls[t:]:
        m = re.match(r'^(\d+)\. Respuesta ([A-D]) · (.*)$', l)
        if m:
            n = int(m.group(1))
            keys[n] = dict(key=m.group(2), niv=m.group(3), exp='')
        elif n and l.startswith('Matriz'):
            break
        elif n and not keys[n]['exp']:
            keys[n]['exp'] = clean(l)
    blocks, cur = [], None
    for l in ls[6:t]:
        if ' | ' in l or '  |  ' in l:
            content = re.sub(r'^(\[L\d/N\d+\]\s*|\d+\.\s*)', '', l).split('|')[0].strip()
            cur = dict(content=content, comp='', lines=[])
            blocks.append(cur)
        elif l.startswith('Competencia:'):
            cur['comp'] = l.split(':', 1)[1].strip().rstrip('.')
        elif cur:
            cur['lines'].append(l)
    out = []
    for i, b in enumerate(blocks, 1):
        stem, opts = split_options(b['lines'])
        k = keys[i]
        out.append(item('mat', i, 'mc', 'Matemáticas — cuadernillo nivel alto', stem, opts, letter(k['key']), k['exp'],
                        level(k['niv']), f"{b['comp']} — {b['content']}", imgs_of(b['lines'])))
    return out, {}


# La prueba diagnóstica de Matemáticas llega con las potencias aplanadas en el
# .docx (x2 por x², (1.10)t por (1.10)^t), opciones dentro de tablas y varias
# claves contradictorias: se transcribe a mano, pregunta por pregunta, contra el
# documento. Las diferencias de fondo están comentadas.
MD = [
    (['Un puente colgante tiene un cable de suspensión en forma de parábola con ecuación y = 0,005x² − 0,2x + 10, donde x e y están en metros. Para instalar una estructura de refuerzo vertical se requiere determinar el punto más bajo del cable.',
      '¿Cuál es la coordenada exacta (x, y) del punto mínimo del cable de suspensión?'],
     ['(20, 8)', '(20, 6)', '(40, 6)', '(40, 8)'], 0, 'Alto', 'Formulación y ejecución — Geometría analítica', None,
     'Como a = 0,005 > 0, el mínimo está en el vértice: x = −b / (2a) = 0,2 / 0,01 = 20. Entonces y = 0,005(400) − 0,2(20) + 10 = 2 − 4 + 10 = 8. El vértice es (20, 8).'),
    (['Una entidad financiera ofrece dos esquemas de inversión para un capital inicial C₀ > 0:',
      'Esquema A: interés simple anual del 12 % durante t años.', 'Esquema B: interés compuesto anual del 10 %, capitalizable anualmente durante t años.',
      r'Los montos se representan con las funciones \( C_A(t) = C_0(1 + 0{,}12t) \) y \( C_B(t) = C_0(1{,}10)^t \).',
      'Un analista afirma que el Esquema A siempre generará un monto mayor que el Esquema B para cualquier tiempo t > 0.',
      '¿Cuál de las siguientes afirmaciones evalúa correctamente la conclusión del analista?'],
     ['La afirmación es correcta, porque una tasa de interés simple del 12 % siempre produce mayores rendimientos que una tasa de interés compuesto del 10 %.',
      'La afirmación es incorrecta, porque, aunque el Esquema A produce un monto mayor durante los primeros años, el crecimiento exponencial del Esquema B hace que eventualmente lo supere.',
      'La afirmación es correcta, porque el interés simple aumenta de manera constante y el interés compuesto solo genera mayores rendimientos cuando la tasa anual es superior al 12 %.',
      'La afirmación es incorrecta, porque el Esquema B produce un monto mayor desde el primer año, debido a que los intereses se capitalizan anualmente.'],
     1, 'Alto', 'Argumentación — Crecimiento exponencial', None,
     'Dividiendo entre C₀: al año 1, A = 1,12 y B = 1,10; al año 2, A = 1,24 y B = 1,21 (gana A). Al año 5, A = 1,60 y B ≈ 1,61; al año 10, A = 2,20 y B ≈ 2,59 (gana B). A tiene ventaja al principio, pero la capitalización hace que B lo supere.'),
    (['En un laboratorio de control de calidad, el 80 % de los componentes proviene de la Planta X y el 20 % de la Planta Y. El 5 % de los componentes de la Planta X son defectuosos, mientras que el 10 % de los de la Planta Y son defectuosos. Se selecciona un componente al azar y resulta ser defectuoso.',
      '¿Cuál es la probabilidad de que este componente defectuoso provenga de la Planta Y?'],
     ['1/3 (aprox. 33,3 %)', '1/2 (50,0 %)', '2/5 (40,0 %)', '1/5 (20,0 %)'], 0, 'Alto', 'Interpretación y representación — Probabilidad condicional', None,
     'P(defectuoso) = 0,80 × 0,05 + 0,20 × 0,10 = 0,04 + 0,02 = 0,06. Por Bayes, P(Y | defectuoso) = 0,02 / 0,06 = 1/3.'),
    # El Word decía costo 2 en la pared lateral, pero su solución usa costo 1 y da
    # r = 5. Con costo 2 sale r³ = 250 (r ≈ 6,3), que no está entre las opciones.
    ([r'Se desea construir un contenedor cilíndrico cerrado con un volumen fijo de \( V = 250\pi \text{ cm}^3 \). El costo del material es de 1 por cm², tanto para la base y la tapa como para la pared lateral.',
      '¿Qué radio r de la base minimiza el costo total de fabricación del contenedor?'],
     ['r = 5 cm', 'r = 10 cm', 'r = 2,5 cm', 'r = 5√2 cm'], 0, 'Muy alto', 'Formulación y ejecución — Optimización', None,
     r'Como \( h = 250/r^2 \), el costo es \( C(r) = 2\pi r^2 + 2\pi r h = 2\pi r^2 + \dfrac{500\pi}{r} \). Derivando: \( C^\prime(r) = 4\pi r - \dfrac{500\pi}{r^2} = 0 \), de donde \( r^3 = 125 \) y r = 5 cm.'),
    (['Un conjunto de datos de salarios en una empresa de 100 empleados tiene una media de $ 3.500.000 y una mediana de $ 2.100.000. Se contrata a un ejecutivo con un salario de $ 45.000.000.',
      '¿Cómo se ven afectadas la media y la mediana tras la incorporación del nuevo ejecutivo?'],
     ['La media se incrementa significativamente, mientras que la mediana se mantiene prácticamente inalterada.',
      'Ambas medidas se incrementan exactamente en la misma proporción.',
      'La mediana se incrementa significativamente y la media permanece constante.',
      'Ninguna de las dos medidas sufre cambio alguno.'], 0, 'Alto', 'Argumentación — Medidas de tendencia central', None,
     'La media es muy sensible a los valores atípicos: un salario tan alto eleva el promedio. La mediana es robusta: solo se desplaza media posición en el orden de los datos.'),
    (['Con base en la información de los diagramas de caja, un docente afirma: “El grupo B tuvo un desempeño más homogéneo que el grupo A, aunque su puntaje promedio se vio afectado por un caso excepcional”.',
      '¿Esta afirmación es válida y por qué?'],
     ['No es válida, porque el grupo A tiene un rango intercuartílico mayor, lo que indica que fue más homogéneo.',
      'Sí es válida, porque la caja del grupo B es más estrecha (menor rango intercuartílico) y presenta un valor atípico superior.',
      'No es válida, porque los diagramas de caja no permiten evidenciar valores atípicos, solo la media.',
      'Sí es válida, porque el grupo B tiene la mediana más alta, lo que garantiza mayor homogeneidad.'],
     1, 'Muy alto', 'Interpretación y representación — Aleatorio', 'image2',
     'La homogeneidad se lee en el ancho de la caja (rango intercuartílico). La caja de B es más angosta: su 50 % central está más agrupado. Además, el punto aislado arriba es un valor atípico, que puede jalar la media hacia arriba: el “caso excepcional” del docente.'),
    (['En el plano cartesiano se ubica un triángulo rectángulo ABC con vértices en A(0,0), B(8,0) y C(8,6). Se desea inscribir una circunferencia dentro del triángulo (circunferencia inscrita).',
      '¿Cuál es la ecuación de la circunferencia inscrita?'],
     ['(x − 6)² + (y − 2)² = 4', '(x − 4)² + (y − 3)² = 9', '(x − 5)² + (y − 2)² = 4', '(x − 8)² + (y − 6)² = 16'],
     0, 'Muy alto', 'Formulación y ejecución — Geométrico-métrico', 'image3',
     'Los catetos miden AB = 8 y BC = 6, y la hipotenusa AC = 10. El radio inscrito en un triángulo rectángulo es r = (a + b − c) / 2 = (8 + 6 − 10) / 2 = 2. El centro está a 2 unidades de la base y a 2 del cateto vertical x = 8: (6, 2). La ecuación es (x − 6)² + (y − 2)² = 4.'),
    # La opción C estaba incompleta en el Word ("t = 3log₂").
    ([r'Un cultivo de bacterias crece según la función \( P(t) = P_0 \, e^{kt} \), donde P(t) es la población en el tiempo t (en horas) y k es una constante positiva. Un biólogo observa que la población se duplica cada 3 horas.',
      'Si en t = 0 hay 1.000 bacterias, ¿cuál de las siguientes expresiones representa correctamente el tiempo t necesario para que la población alcance las 10.000 bacterias?'],
     [r'\( t = \dfrac{3\ln(10)}{\ln(2)} \)', r'\( t = \dfrac{\ln(10)}{3\ln(2)} \)', r'\( t = 3\log_{2}(10) \)', 'Tanto A como C son matemáticamente equivalentes y correctas.'],
     3, 'Muy alto', 'Argumentación — Variacional', None,
     r'Como se duplica cada 3 horas, \( k = \ln(2)/3 \). Para multiplicar por 10: \( e^{kt} = 10 \), así que \( t = \dfrac{3\ln(10)}{\ln(2)} \). Y por cambio de base, \( \dfrac{\ln(10)}{\ln(2)} = \log_{2}(10) \): A y C son la misma expresión.'),
    # El enunciado no daba para llegar a ninguna opción: P quedaba indeterminado,
    # la explicación del Word llegaba a 200√3/3 (no estaba entre las opciones) y el
    # dibujo era otro problema (una torre, con AD = 60 m). Se reescribe sobre la
    # diagonal, con esa misma cuenta, y se retira la imagen.
    (['Un topógrafo se encuentra en la esquina A de un terreno rectangular ABCD y mide la distancia hasta la esquina opuesta C. El ángulo ∠BAC mide 30° y el lado AB mide 100 metros.',
      '¿Cuál es la longitud de la diagonal AC?'],
     ['50√3 metros', '100√3 metros', r'\( \dfrac{200\sqrt{3}}{3} \) metros', '200 metros'], 2, 'Muy alto', 'Interpretación y representación — Geométrico-métrico', None,
     r'En el triángulo rectángulo ABC, AB = 100 m es el cateto adyacente al ángulo de 30°: \( \cos(30^\circ) = \dfrac{100}{AC} \). Despejando, \( AC = \dfrac{200}{\sqrt{3}} = \dfrac{200\sqrt{3}}{3} \) metros.'),
    # El Word decía 0,32 años; la cuenta da 0,31.
    (['Un inversionista deposita un capital de $ 10.000.000 en un fondo que ofrece una tasa de interés compuesto anual del 8 %. El banco le ofrece dos modalidades de capitalización:',
      'Modalidad 1: capitalización anual.', 'Modalidad 2: capitalización mensual.',
      'El inversionista desea retirar su dinero cuando el monto acumulado sea el doble del capital inicial. ¿Cuál es la diferencia en años (aproximada) entre la modalidad 2 y la modalidad 1 para alcanzar dicho objetivo?'],
     ['La modalidad 2 tarda aproximadamente 0,31 años menos que la modalidad 1.', 'La modalidad 2 tarda aproximadamente 0,08 años menos que la modalidad 1.',
      'Ambas modalidades tardan exactamente lo mismo.', 'La modalidad 1 tarda menos porque la tasa anual es más alta.'],
     0, 'Muy alto', 'Formulación y ejecución — Numérico-variacional', None,
     r'Modalidad 1: \( 2 = (1{,}08)^t \), de donde \( t = \dfrac{\ln 2}{\ln 1{,}08} \approx 9{,}01 \) años. Modalidad 2: \( 2 = \left(1 + \dfrac{0{,}08}{12}\right)^{12t} \), de donde \( t \approx 8{,}69 \) años. La diferencia es de unos 0,31 años: capitalizar con más frecuencia reduce el tiempo.'),
    (['Sea f(x) = ax² + bx + c una función cuadrática con a > 0. Si el discriminante Δ = b² − 4ac es igual a cero, ¿cuál de las siguientes afirmaciones es necesariamente verdadera?'],
     ['La gráfica de f(x) intersecta al eje X en dos puntos distintos.', 'La gráfica de f(x) no intersecta al eje X.',
      'La gráfica de f(x) es tangente al eje X en un único punto.', 'El vértice de la parábola se encuentra en el origen (0,0).'],
     2, 'Muy alto', 'Argumentación — Numérico', None,
     'Con discriminante cero hay una única solución real (raíz doble): el vértice toca el eje X en un solo punto, es decir, la parábola es tangente a él. Las opciones A y B corresponden a Δ > 0 y Δ < 0.'),
    (['Un arquitecto diseña un edificio con forma de prisma recto de base cuadrada. La base tiene lado a y la altura del edificio es h. La diagonal de una de sus caras laterales mide 10 metros y el área de la base es de 36 m².',
      '¿Cuál es la altura h del edificio?'],
     ['8 m', '6 m', '4 m', '10 m'], 0, 'Muy alto', 'Interpretación y representación — Espacial-métrico', 'image5',
     'Como a² = 36, a = 6 m. La diagonal de la cara lateral forma un triángulo rectángulo con la base y la altura: 6² + h² = 10², así que h² = 64 y h = 8 m.'),
    (['En una urna hay 5 bolas rojas y 3 bolas azules. Se extraen dos bolas al azar, una tras otra, sin reemplazo. ¿Cuál es la probabilidad de que la primera bola sea roja y la segunda sea azul?'],
     ['15/56', '5/14', '15/64', '3/8'], 0, 'Muy alto', 'Formulación y ejecución — Aleatorio', None,
     'P(primera roja) = 5/8. Sin reemplazo quedan 7 bolas, 3 de ellas azules: P(segunda azul | primera roja) = 3/7. La probabilidad conjunta es 5/8 × 3/7 = 15/56.'),
    (['Un estudiante analiza la función g(x) = x³ − 3x² + 2. Al calcular su derivada obtiene g′(x) = 3x² − 6x. Al igualar a cero, encuentra que los puntos críticos son x = 0 y x = 2. Si evalúa la derivada en x = 1, obtiene g′(1) = −3.',
      '¿Qué puede concluir sobre el comportamiento de la función en x = 1?'],
     ['Que la función tiene un máximo local en x = 1.', 'Que la función es decreciente en el intervalo que contiene a x = 1.',
      'Que la función tiene un punto de inflexión en x = 1.', 'Que la función tiene un mínimo local en x = 1.'],
     1, 'Muy alto', 'Argumentación — Variacional', None,
     'La primera derivada indica la pendiente. Como g′(1) = −3 es negativa, la función decrece en el intervalo que contiene a x = 1. Los extremos locales están en los puntos críticos x = 0 y x = 2, no en x = 1.'),
    (['Una circunferencia tiene su centro en el punto (2, 3) y es tangente al eje X. ¿Cuál es la ecuación de dicha circunferencia?'],
     ['(x − 2)² + (y − 3)² = 9', '(x − 2)² + (y − 3)² = 4', '(x + 2)² + (y + 3)² = 9', '(x − 2)² + (y − 3)² = 3'],
     0, 'Muy alto', 'Interpretación y representación — Geométrico-métrico', None,
     'Si es tangente al eje X, la distancia del centro al eje es el radio. El centro está en (2, 3), así que r = 3 y la ecuación es (x − 2)² + (y − 3)² = 3² = 9.'),
    (['Un comerciante compra un artículo por $ 80.000. Para fijar el precio de venta le aumenta un 30 % al costo. Sin embargo, al momento de venderlo decide hacer un descuento del 20 % sobre el precio de venta fijado. ¿Cuál es la ganancia o pérdida final del comerciante?'],
     ['Ganancia de $ 3.200', 'Pérdida de $ 4.000', 'Ganancia de $ 4.000', 'No hay ganancia ni pérdida.'], 0, 'Muy alto', 'Formulación y ejecución — Numérico', None,
     'Con el aumento: 80.000 × 1,30 = 104.000. Con el descuento: 104.000 × 0,80 = 83.200. Ganancia: 83.200 − 80.000 = $ 3.200.'),
    (['La tabla muestra los resultados de una encuesta realizada a 100 estudiantes de grado 11.° sobre su carrera de preferencia. Si se selecciona un estudiante al azar y se sabe que prefiere Medicina, ¿cuál es la probabilidad de que sea hombre?'],
     ['1/4', '1/10', '1/2', '1/5'], 0, 'Muy alto', 'Argumentación — Aleatorio', 'image6',
     'Prefieren Medicina 10 + 30 = 40 estudiantes, de los cuales 10 son hombres: P(hombre | Medicina) = 10/40 = 1/4.'),
    (['El costo de producir x unidades de un artículo está dado por C(x) = 0,01x² + 5x + 100 dólares. El precio de venta por unidad es de 10 dólares. ¿Cuál es la cantidad de unidades x que maximiza la utilidad (ingreso − costo)?'],
     ['250 unidades', '500 unidades', '100 unidades', '50 unidades'], 0, 'Muy alto', 'Formulación y ejecución — Variacional', None,
     'U(x) = 10x − (0,01x² + 5x + 100) = −0,01x² + 5x − 100. Es una parábola que abre hacia abajo: el máximo está en x = −b / (2a) = −5 / (−0,02) = 250 unidades.'),
    (['En un sistema de coordenadas, una recta pasa por los puntos (2, −1) y (4, 5). ¿Cuál es la ecuación de la recta perpendicular a esta que pasa por el punto (0, 0)?'],
     ['y = −(1/3)x', 'y = 3x', 'y = −3x', 'y = (1/3)x'], 0, 'Muy alto', 'Interpretación y representación — Geométrico-métrico', None,
     'La pendiente de la recta es (5 − (−1)) / (4 − 2) = 3. La perpendicular tiene el recíproco negativo, −1/3, y como pasa por (0, 0) su ecuación es y = −(1/3)x.'),
    ([r'Un estudiante observa la secuencia 2, 5, 10, 17, 26… y afirma que su término n-ésimo se puede modelar con la función cuadrática \( a_n = n^2 + 1 \). ¿Cuál de las siguientes afirmaciones valida o refuta correctamente la hipótesis del estudiante?'],
     ['La hipótesis es correcta, porque al sumar los términos consecutivos se obtiene la diferencia 2n + 1.', 'La hipótesis es incorrecta, porque la secuencia crece linealmente y no cuadráticamente.',
      'La hipótesis es correcta, porque el primer término es 1² + 1 = 2 y el segundo es 2² + 1 = 5.', 'La hipótesis es incorrecta, porque las diferencias de segundo orden son iguales a 3 y no a 2.'],
     2, 'Muy alto', 'Argumentación — Numérico', None,
     'La función reproduce la secuencia: 1² + 1 = 2, 2² + 1 = 5, 3² + 1 = 10, 4² + 1 = 17. Las diferencias de primer orden son 3, 5, 7, 9 y las de segundo orden son constantes (2), lo que es propio de una función cuadrática.'),
    # La gráfica del Word dibuja el punto en (3,3) y un radio cercano a 4,4: se retira.
    (['En el plano cartesiano, una circunferencia tiene su centro en el origen (0, 0) y pasa por el punto (3, 4). Se traza una recta L tangente a la circunferencia exactamente en ese punto.',
      '¿Cuál es la ecuación de la recta L?'],
     [r'\( y = -\dfrac{3}{4}x + \dfrac{25}{4} \)', r'\( y = \dfrac{4}{3}x \)', r'\( y = -\dfrac{4}{3}x + 8 \)', r'\( y = \dfrac{3}{4}x + \dfrac{7}{4} \)'],
     0, 'Muy alto', 'Interpretación y representación — Geométrico-métrico', None,
     r'El radio hasta (3, 4) tiene pendiente 4/3. La tangente es perpendicular al radio, así que su pendiente es −3/4. Con el punto (3, 4): \( y - 4 = -\dfrac{3}{4}(x - 3) \), es decir, \( y = -\dfrac{3}{4}x + \dfrac{25}{4} \).'),
    ([r'Un estudiante analiza el límite de la función racional \( f(x) = \dfrac{x^2 - 9}{x - 3} \) cuando x se aproxima a 3. Al evaluar directamente x = 3 obtiene una indeterminación de la forma 0/0. Sin embargo, concluye que el límite existe y es igual a 6.',
      '¿Cuál de los siguientes argumentos valida rigurosamente la conclusión del estudiante?'],
     ['Al reemplazar x = 3 en la función original, el resultado es 6.', 'La función es continua en todos los reales, por lo que el límite es igual al valor de la función en x = 3.',
      'Al factorizar el numerador como (x − 3)(x + 3), se cancela el término (x − 3) y se evalúa x + 3 en x = 3.', 'El límite no existe porque hay una asíntota vertical en x = 3.'],
     2, 'Muy alto', 'Argumentación — Variacional', None,
     'Al factorizar la diferencia de cuadrados queda (x − 3)(x + 3) / (x − 3). Cancelar es válido porque x se aproxima a 3 sin ser exactamente 3. Queda x + 3, y evaluando en 3 el límite es 6.'),
    # La tabla del Word marcaba A (1/6); su propia explicación llega a 2/9, que es lo correcto.
    (['Se lanzan dos dados. ¿Cuál es la probabilidad de que la suma de los resultados sea mayor o igual a 10, dado que el primer dado cayó en un número par?'],
     ['1/6', '1/9', '2/9', '1/2'], 2, 'Muy alto', 'Formulación y ejecución — Aleatorio', None,
     'Si el primer dado es par (2, 4 o 6), hay 3 × 6 = 18 casos posibles. Suman 10 o más: (4,6), (6,4), (6,5) y (6,6), es decir, 4 casos. La probabilidad es 4/18 = 2/9.'),
    (['La gráfica de una función f(x) tiene un comportamiento lineal decreciente desde x = 0 hasta x = 4, y luego es constante desde x = 4 hasta x = 8. Si f(0) = 10 y f(4) = 2, ¿cuál es el valor de f(6) + f(2)?'],
     ['10', '8', '6', '12'], 1, 'Muy alto', 'Interpretación y representación — Numérico-variacional', None,
     'De 0 a 4 la pendiente es (2 − 10) / 4 = −2: f(x) = −2x + 10, así que f(2) = 6. De 4 a 8 la función es constante en 2, así que f(6) = 2. La suma es 6 + 2 = 8.'),
    # La opción A decía "área = base por altura": faltaba el "sobre dos".
    (['Una pirámide recta tiene una base cuadrada de lado 8 cm y una altura de 3 cm. Un estudiante afirma que el área de una de sus caras laterales (triángulos) es igual a 20 cm².',
      '¿El cálculo del estudiante es correcto?'],
     ['Sí, porque el área del triángulo es base por altura sobre dos, y la altura del triángulo lateral es 5 cm.', 'No, porque el área lateral es (8 × 3) / 2 = 12 cm².',
      'No, porque la altura de la cara lateral no es 5 cm, es √73 cm.', 'Sí, porque la apotema de la pirámide es igual a la altura de la pirámide.'],
     0, 'Muy alto', 'Argumentación — Espacial-métrico', None,
     'La altura de la cara lateral (apotema) sale de Pitágoras con la altura de la pirámide (3 cm) y la mitad del lado de la base (4 cm): √(9 + 16) = 5 cm. El área de la cara es (8 × 5) / 2 = 20 cm².'),
]


def parse_md():
    out = []
    for i, (stem, opts, key, niv, comp, image, exp) in enumerate(MD, 1):
        it = item('mat', i, 'md', 'Matemáticas — prueba diagnóstica', stem, opts, key, exp, niv, comp, [image] if image else [])
        out.append(it)
    return out, {}


def parse_all(work):
    items, passages = [], {}
    # El orden fija los ids (ver el docstring): no cambiarlo.
    parts = [parse_mc(work), parse_md(), parse_bi(work), parse_qu(work), parse_fi(work),
             parse_lectura(work, 'amp-l1.txt', 'l1', 'la', 'Lectura crítica — banco nivel alto, vol. I'),
             parse_lectura(work, 'amp-l2.txt', 'l2', 'lb', 'Lectura crítica — banco nivel alto, vol. II'),
             parse_lectura(work, 'amp-l3.txt', 'l3', 'lc', 'Lectura crítica — banco nivel alto, vol. III'),
             parse_li(work), parse_so(work), parse_ci(work)]
    for its, pas in parts:
        items += its
        passages.update(pas)
    return dict(items=items, passages=passages)


# ── Imágenes ─────────────────────────────────────────────────────────────────
# Se retiran porque revelan la respuesta, están vacías o no corresponden al
# enunciado. La pregunta se entiende sin ellas (el enunciado se ajusta en AMP_FIX).
AMP_DROP_IMAGES = {
    'mate-53',  # árbol de probabilidad sin valores y con el texto cortado
    'mate-58',  # el título da la escala ("1 cm representa 3 m")
    'mate-60',  # muestra "9 × 9 × 8 = 648 claves": es la respuesta
    'mate-64',  # plano vacío: las dos rectas no se dibujaron
    'mate-74',  # rotula el centro C(2, −1): es la respuesta
    'mate-82',  # dibuja el centro (6, 2) sobre la cuadrícula: es la respuesta
    'soc-69',   # matriz con texto ilegible
}


def _crop(box):
    return lambda im: im.crop(box)


def _white(box):
    def f(im):
        from PIL import ImageDraw
        im = im.copy()
        ImageDraw.Draw(im).rectangle(box, fill='white')
        return im
    return f


AMP_IMG_OPS = {
    ('bi', 'image2'): _crop((0, 0, 309, 271)),    # el pie decía "Trisomía 21"
    ('md', 'image2'): _crop((0, 0, 498, 338)),    # los recuadros explicaban la respuesta
}


# ── Correcciones ─────────────────────────────────────────────────────────────
def _rep(q, pairs, field='stem'):
    vals = list(q[field])
    for a, b in pairs:
        assert any(a in v for v in vals), (q.get('num'), a)
        vals = [v.replace(a, b) for v in vals]
    return {**q, field: vals}


AMP_FIX = {
    # ── Biología ──
    # bio-29: pregunta partida por la imagen; el pie se recortó porque decía la respuesta.
    'bio-29': lambda q: {**q, 'stem': ['La imagen muestra el cariotipo de una persona (fuente: Wellcome Collection). Con base en la observación del cariotipo, ¿cuál de las siguientes afirmaciones es correcta?']},
    # bio-31: el Word habla de una "línea punteada" que la gráfica no tiene.
    'bio-31': lambda q: _rep(q, [('La línea punteada indica el nivel basal (90 mg/dL).', 'El nivel basal es de 90 mg/dL.')]),
    # bio-33: "solo podían nacer hijos A o B" no sustenta la sospecha: el hijo es A.
    'bio-33': lambda q: _rep(q, [('solo podían nacer hijos A o B', 'solo podían nacer hijos AB u O')]),
    # bio-49: el enunciado decía 10.000 kcal y la pirámide 1.000. La clave C de la
    # tabla solo es cierta con la cifra de la imagen; su justificación se enredaba.
    'bio-49': lambda q: {**_rep(q, [('10,000 kcal', '1.000 kcal')]), 'options': ['1.000 kcal', '100 kcal', '10 kcal', '1 kcal'], 'correct': 2},

    # ── Física ──
    'fis-30': lambda q: _rep(q, [('quadruplica', 'cuadruplica')], 'options'),
    # fis-43: la clave decía "menor", pero si se suelta más alto y se calcula con
    # el h₀ de referencia, h₁ crece y el denominador no: el valor sale MAYOR.
    'fis-43': lambda q: {**_rep(q, [('superior a h0 en una de las pruebas, ¿cómo', 'superior a h0 en una de las pruebas, pero en el cálculo sigue usando h0, ¿cómo')]), 'correct': 0},
    # fis-44: ninguna opción era correcta: la orbital es la MITAD de la de escape.
    'fis-44': lambda q: {**q, 'options': [q['options'][0], 'Es la mitad de la velocidad de escape.', q['options'][2], q['options'][3]]},
    # fis-53: colgado de un resorte, en el equilibrio se anula la fuerza neta, no la elástica.
    'fis-53': lambda q: _rep(q, [('la aceleración y la fuerza elástica son nulas', 'la aceleración y la fuerza neta son nulas')], 'options'),
    'fis-54': lambda q: _rep(q, [('na onda electromagnética', 'Una onda electromagnética')]),

    # ── Química ──
    'qui-52': lambda q: _rep(q, [('quadruplica', 'cuadruplica')], 'options'),

    # ── Lectura ──
    'lec-108': lambda q: _rep(q, [('sea participe activo', 'sea partícipe activo')], 'options'),
    'lec-125': lambda q: _rep(q, [('carácter existential', 'carácter existencial')]),
    'lec-139': lambda q: _rep(q, [('Demonstrar', 'Demostrar')], 'options'),

    # ── Sociales ──
    'soc-51': lambda q: _rep(q, [('contrataren', 'contraten')], 'options'),
    'soc-52': lambda q: _rep(q, [('dentro de los fronteras', 'dentro de las fronteras')]),
    # soc-56: 1928 no es "finales del siglo XIX".
    'soc-56': lambda q: _rep(q, [('A finales del siglo XIX, la Masacre', 'A finales de la década de 1920, la Masacre')]),
    'soc-57': lambda q: _rep(q, [('por encima del dos dígitos', 'por encima de los dos dígitos')], 'options'),
    'soc-69': lambda q: {**q, 'stem': q['stem'][1:]},
    'soc-77': lambda q: _rep(q, [('soberanías regionales soberanas', 'soberanías regionales')], 'options'),

    # ── Matemáticas (cuadernillo) ──
    'mate-52': lambda q: _rep(q, [('Según la gráfica, ¿Qué', 'Según la gráfica, ¿qué')]),
    'mate-64': lambda q: _rep(q, [('Según la intersección de las rectas que modelan ambas compras, ¿cuánto', '¿Cuánto')]),
    # mate-75: la gráfica llega solo hasta 100 unidades; no muestra lo que pasa después.
    'mate-75': lambda q: _rep(q, [('pero la gráfica muestra que su predicción se aleja rápidamente de los datos para x>100', 'pero no se tienen datos para x>100')]),
}

AMP_EXPLAIN = {
    'bio-49': 'Con una eficiencia del 10 % por nivel: 1.000 kcal (productores) → 100 kcal (consumidores primarios) → 10 kcal (consumidores secundarios). Es lo que muestra la pirámide.',
    'fis-43': 'Si la pelota se suelta desde más arriba, el rebote h₁ también es mayor. Como el cálculo sigue usando el h₀ de referencia (más pequeño que la altura real), el cociente h₁/h₀ crece y el coeficiente sale artificialmente mayor.',
    'fis-44': 'Con g/4 = GM/r², el radio orbital es r = 2R. La velocidad orbital es √(GM/2R) y la de escape √(2GM/R). Su cociente es √(1/4) = 1/2: la orbital es la mitad de la de escape.',
    'fis-53': 'En el punto de equilibrio el desplazamiento respecto al centro es cero (x = 0). Como la fuerza restauradora es F = −kx y la aceleración a = −ω²x, ambas se anulan. La energía cinética y la velocidad alcanzan ahí su valor máximo.',
    'lec-87': 'El autor critica el sesgo de confirmación y el inductivismo ingenuo, donde el investigador recopila únicamente datos empíricos que se ajusten a su hipótesis previa sin ponerla verdaderamente a prueba.',
    'lec-99': 'El mayor riesgo normativo de restringir la tolerancia a los “intolerantes” radica en la arbitrariedad de quién ostenta la facultad institucional de definir quién es “intolerante”.',
    'soc-91': 'Los actores directamente afectados por la medida son estudiantes, profesores y padres. Los proveedores de telefonía móvil tienen un interés comercial, pero no son parte del conflicto escolar ni su perspectiva es relevante para la decisión pedagógica.',
    'soc-102': 'La Sentencia C-355 de 2006 despenalizó el aborto en tres causales: violación, malformación grave del feto y riesgo para la vida o salud de la madre (la C-055 de 2022 lo amplió después hasta la semana 24). Las demás opciones no corresponden a las causales establecidas por la Corte.',
}


# ── Pistas ───────────────────────────────────────────────────────────────────
AMP_HINTS = {
    # Matemáticas — cuadernillo
    'mate-51': 'Mejorar es la diferencia entre el valor final y el inicial, no el valor final. Calcúlala para cada sede.',
    'mate-52': 'Lee en la gráfica qué ancho da el punto más alto y reemplázalo en 40 − 2x para hallar el largo.',
    'mate-53': 'Calcula primero el total de quienes aprueban: los del club más los que no están en el club.',
    'mate-54': 'Usa la distancia entre dos puntos en cada cable y compara los dos resultados.',
    'mate-55': 'Una tendencia ascendente indica asociación. ¿Eso basta para afirmar que una cosa causa la otra?',
    'mate-56': 'Busca la medida que depende de la posición central de los datos y no de su valor exacto.',
    'mate-57': 'El descuento no se aplica sobre 100, sino sobre el precio que ya subió.',
    'mate-58': 'Primero halla cuántos metros representa cada centímetro del plano.',
    'mate-59': 'Las primeras 10 unidades ya están pagadas con la tarifa fija: ¿cuántas unidades se cobran aparte?',
    'mate-60': 'Empieza por el primer dígito: no puede ser 0. ¿Cuántas opciones quedan para cada posición siguiente?',
    'mate-61': 'Escribe la nueva base y la nueva altura, y multiplícalas.',
    'mate-62': 'Multiplica cada nota por su porcentaje y suma los dos resultados.',
    'mate-63': 'Tasa = cambio de volumen ÷ cambio de tiempo. Lee los valores en los minutos 2 y 6.',
    'mate-64': 'Plantea las dos ecuaciones y súmalas: te da cuánto cuestan juntos un jugo y un sándwich.',
    'mate-65': 'Reflejar y trasladar mueve la figura sin deformarla. ¿Qué no cambia entonces?',
    'mate-66': 'Calcula para cada municipio el aumento en usuarios y luego ese aumento como porcentaje de su valor inicial.',
    'mate-67': 'Tienes el cateto adyacente y buscas el opuesto. ¿Qué razón trigonométrica los relaciona?',
    'mate-68': 'Prueba un valor un poco mayor que 2, como x = 2,01. ¿Qué pasa con el denominador y con el resultado?',
    'mate-69': 'Son 7 movimientos en total: basta elegir en cuáles de ellos se sube.',
    'mate-70': 'Si las longitudes se multiplican por 1,5, el volumen se multiplica por ese factor al cubo.',
    'mate-71': 'Pregúntate quiénes respondieron la encuesta y quiénes quedaron por fuera.',
    'mate-72': '¿Cuántos periodos de 3 horas caben en 12 horas? Divide entre 2 esa cantidad de veces.',
    'mate-73': 'Tienen que funcionar los dos a la vez y son independientes: ¿se suman o se multiplican?',
    'mate-74': 'Compara con la forma (x − h)² + (y − k)² = r²: fíjate en los signos y en que el 25 es r².',
    'mate-75': '¿Ajustar bien en un rango garantiza que el modelo funcione fuera de ese rango?',
    # Matemáticas — prueba diagnóstica
    'mate-76': 'El punto más bajo de una parábola que abre hacia arriba es su vértice: x = −b / (2a).',
    'mate-77': 'Compara los dos esquemas en varios años, por ejemplo t = 1, t = 2 y t = 10.',
    'mate-78': 'Calcula la probabilidad total de que un componente sea defectuoso y mira qué parte viene de la Planta Y.',
    'mate-79': 'Escribe h en función de r con el volumen, arma el costo y busca dónde su derivada es cero.',
    'mate-80': 'Un dato extremo altera mucho una de estas medidas y casi nada la otra. ¿Cuál se basa en la posición?',
    'mate-81': 'La homogeneidad se lee en el ancho de la caja; los casos excepcionales, en los puntos aislados.',
    'mate-82': 'Radio inscrito de un triángulo rectángulo: r = (a + b − c) / 2. El centro está a r de cada cateto.',
    'mate-83': 'Halla k con la duplicación cada 3 horas y luego despeja t. Recuerda el cambio de base de los logaritmos.',
    'mate-84': 'En el triángulo ABC conoces el cateto adyacente al ángulo de 30° y buscas la hipotenusa.',
    'mate-85': 'Despeja t en cada modalidad. En la mensual, la tasa es 0,08/12 y hay 12t periodos.',
    'mate-86': 'Discriminante cero significa una sola raíz real. ¿Cómo se ve eso en la gráfica?',
    'mate-87': 'Con el área de la base sacas el lado. La diagonal, la base y la altura forman un triángulo rectángulo.',
    'mate-88': 'Después de sacar una roja, ¿cuántas bolas quedan y cuántas de ellas son azules?',
    'mate-89': 'El signo de la derivada dice si la función sube o baja. ¿Qué signo tiene g′(1)?',
    'mate-90': 'Si es tangente al eje X, ¿a qué distancia del eje está el centro? Esa distancia es el radio.',
    'mate-91': 'Aplica primero el aumento y, sobre ese resultado, el descuento. Luego compara con lo que pagó.',
    'mate-92': 'Mira solo la columna de Medicina: esa es tu nueva base.',
    'mate-93': 'Arma la utilidad restando costo a ingreso y busca el vértice de la parábola.',
    'mate-94': 'Calcula la pendiente de la recta; la perpendicular tiene el recíproco con signo contrario.',
    'mate-95': 'Prueba la fórmula con n = 1, 2, 3 y compara con los términos de la secuencia.',
    'mate-96': 'La tangente es perpendicular al radio en el punto de contacto.',
    'mate-97': 'Con una indeterminación 0/0, intenta factorizar el numerador.',
    'mate-98': 'Si el primer dado es par, hay 18 casos posibles. Cuenta cuáles suman 10 o más.',
    'mate-99': 'Halla la recta del primer tramo para f(2). En el tramo constante, ¿cuánto vale f(6)?',
    'mate-100': 'La altura de la cara lateral sale de un triángulo con la altura de la pirámide y la mitad del lado de la base.',
    # Biología
    'bio-26': '¿Qué colores de la luz absorbe mejor la clorofila? ¿Por qué vemos verdes las plantas?',
    'bio-27': 'La variable independiente es la que el investigador cambia; la dependiente, la que mide.',
    'bio-28': 'Sigue la cadena: ¿quién se come directamente al fitoplancton?',
    'bio-29': 'Cuenta cuántos cromosomas hay en cada par. ¿Alguno tiene uno de más?',
    'bio-30': 'En un cruce de prueba, si todo saliera dominante la planta sería homocigota. ¿Salió así?',
    'bio-31': '¿Qué hormona hace que la glucosa entre a las células después de comer?',
    'bio-32': 'Un rasgo que ayuda a sobrevivir se vuelve más frecuente con las generaciones. ¿Cómo se llama ese proceso?',
    'bio-33': 'Haz el cruce: la madre aporta A o B y el padre, siempre O. ¿Qué grupos resultan?',
    'bio-34': 'Con luz, la planta hace fotosíntesis y también respira. Sin luz, ¿qué le queda?',
    'bio-35': 'Por dentro tienen los mismos huesos aunque por fuera sean distintos: ¿qué indica eso sobre su origen?',
    'bio-36': 'Los ribosomas fabrican proteínas. ¿Cuáles salen del retículo rugoso hacia el exterior de la célula?',
    'bio-37': 'La despolarización hace más positivo el interior de la neurona. ¿Qué ion entra?',
    'bio-38': '¿Para qué sirven los cloroplastos? ¿Recibe luz una raíz?',
    'bio-39': 'En el páramo hay mucha radiación solar y el aire es poco denso. ¿Contra qué protegen esos pelos?',
    'bio-40': 'Esas bacterias convierten el N₂ del aire en formas que las plantas pueden usar.',
    'bio-41': 'Para probar una hipótesis, cambia solo la variable de interés y mide un resultado.',
    'bio-42': 'Sin células beta no hay insulina. ¿Qué pasa con la glucosa que no puede entrar a las células?',
    'bio-43': 'El ventrículo derecho lleva sangre sin oxígeno y el izquierdo, sangre oxigenada. ¿Qué pasa si se comunican?',
    'bio-44': 'La auxina es la hormona que alarga las células.',
    'bio-45': 'Al principio la producción sube y luego se estabiliza: algo más empieza a limitarla.',
    'bio-46': 'Hipertónica significa más solutos afuera. El agua se mueve hacia donde hay más solutos.',
    'bio-47': 'Las enzimas tienen un pH óptimo. ¿Qué les pasa fuera de él?',
    'bio-48': 'La planta obtiene polinización y el insecto, alimento. ¿Cómo se llama esa relación?',
    'bio-49': 'Solo pasa el 10 % de la energía a cada nivel. Mira la pirámide y baja dos niveles desde los productores.',
    'bio-50': 'El estudiante cambia la luz y cuenta las semillas germinadas. ¿Cuál de las dos es el resultado medido?',
    'bio-51': 'Piensa en para qué sirve cada molécula: una guarda información por mucho tiempo y la otra cumple funciones temporales.',
    'bio-52': 'Si el neurotransmisor no puede unirse a su receptor, ¿llega la señal a la siguiente neurona?',
    'bio-53': 'Un alelo recesivo puede “esconderse” en los individuos heterocigotos.',
    'bio-54': 'El grupo control es el que no recibe el tratamiento que se quiere probar.',
    'bio-55': 'Sin descomponedores, ¿qué pasa con la materia orgánica muerta y sus nutrientes?',
    # Química
    'qui-26': 'Cuenta las moles de gas a cada lado de la ecuación. Al subir la presión, ¿hacia dónde se desplaza?',
    'qui-27': 'Busca el reactivo límite: 1 mol de N₂ necesita 3 de H₂. ¿Alcanzan las 18 moles de H₂?',
    'qui-28': 'Mira el signo de ΔH. Si la reacción libera calor, ¿qué efecto tiene calentarla?',
    'qui-29': 'Compara 1 atm con la presión del punto triple. ¿Por debajo de ella puede existir el líquido?',
    'qui-30': 'El estado supercrítico exige superar dos valores a la vez. ¿Cuáles?',
    'qui-31': '¿Qué ocurre con un gas por encima de su temperatura crítica?',
    'qui-32': 'Compara los experimentos 1 y 2: se duplica la concentración. ¿Qué le pasa a la velocidad?',
    'qui-33': 'Un catalizador abre un camino más fácil, pero no cambia la energía de reactivos ni de productos.',
    'qui-34': 'Revisa qué factores cambian respecto al experimento 4 y si cada uno acelera o frena la reacción.',
    'qui-35': 'Uno de los ácidos se disocia por completo y el otro solo en parte. ¿Cuál deja más H₃O⁺?',
    'qui-36': 'Agregas un ion que ya está en los productos. ¿Hacia dónde se desplaza el equilibrio?',
    'qui-37': 'El indicador debe cambiar de color cerca del pH del punto de equivalencia: 8,7.',
    'qui-38': 'A 40 °C, ¿cuántos gramos de KNO₃ caben en 100 g de agua? Compáralo con los 80 g disueltos.',
    'qui-39': 'Si al calentar se disuelve menos, ¿el proceso de disolución libera o absorbe calor?',
    'qui-40': 'Busca una temperatura en la que una sal siga disuelta y la otra ya no quepa.',
    'qui-41': 'El OH⁻ reemplaza al Cl en un carbono secundario. ¿Qué función orgánica resulta?',
    'qui-42': 'Los grupos alquilo donan electrones. ¿Qué carbocatión tiene más grupos alquilo?',
    'qui-43': 'Base fuerte, alcohol y calor favorecen quitar átomos en lugar de sustituirlos. ¿Qué enlace se forma?',
    'qui-44': 'Se reduce el de mayor E° y el otro se oxida. E°celda = E°cátodo − E°ánodo.',
    'qui-45': 'Los electrones van por el cable. ¿Qué pasa con las cargas que se acumulan en cada vaso?',
    'qui-46': 'En la ecuación de Nernst, Q = [Zn²⁺]/[Cu²⁺]. Si baja [Cu²⁺], ¿qué le pasa a Q y al voltaje?',
    'qui-47': 'Todas tienen 10 electrones. ¿Cuál tiene más protones atrayéndolos?',
    'qui-48': 'En un periodo, la energía de ionización tiende a crecer hacia la derecha. ¿Cuál está más a la derecha?',
    'qui-49': 'En un periodo, la electronegatividad cambia de manera continua de izquierda a derecha. ¿En qué sentido?',
    'qui-50': 'Usa PV = nRT con las 2 moles totales. La presión parcial depende de la fracción molar.',
    'qui-51': 'Ley de Graham: la velocidad es inversamente proporcional a la raíz de la masa molar.',
    'qui-52': 'La energía cinética media y la presión son proporcionales a la temperatura absoluta a volumen fijo.',
    'qui-53': 'Misma fórmula molecular. ¿Qué grupo funcional tiene cada uno?',
    'qui-54': 'Un carbono quiral está unido a cuatro grupos distintos. Revisa el carbono que lleva el OH.',
    'qui-55': '¿Qué interacción intermolecular pueden formar los alcoholes por tener OH y el éter no?',
    # Física
    'fis-26': 'Escribe la condición de deslizamiento: ¿qué le pasa a la masa cuando igualas las dos fuerzas?',
    'fis-27': 'En un ciclo la energía interna vuelve a su valor inicial. Aplica la primera ley con ΔU = 0.',
    'fis-28': 'T² = (4π²/g)·L: la pendiente es lo que multiplica a L. ¿Qué hay que cambiar para duplicarla?',
    'fis-29': 'Al tocarse dos esferas idénticas, la carga total se reparte por igual. Hazlo dos veces.',
    'fis-30': 'v = √(T/μ). Reemplaza 2T y μ/2 y simplifica.',
    'fis-31': '¿Qué le pasa a un conductor metálico cuando circula mucha corriente? ¿Y a su resistencia?',
    'fis-32': 'De subida, el aire frena junto con la gravedad. De bajada, el aire se opone a ella.',
    'fis-33': 'Cuando la fuente se acerca, los frentes de onda se apretujan delante de ella.',
    'fis-34': 'La reflexión interna total depende del ángulo crítico en la frontera núcleo-revestimiento.',
    'fis-35': 'El peso no cambia. Si el líquido es menos denso, ¿tiene que desplazar más o menos volumen?',
    'fis-36': 'Las tres fuerzas tienen igual magnitud y apuntan a ángulos de 120° entre sí. Súmalas como vectores.',
    'fis-37': 'La aceleración en el plano es a = g·sen θ. ¿El seno se duplica si se duplica el ángulo?',
    'fis-38': 'Adiabático significa Q = 0. Si el gas hace trabajo, ¿de dónde saca esa energía?',
    'fis-39': 'Un condensador descargado no se opone al principio; cargado, ya no deja pasar corriente.',
    'fis-40': '¿La velocidad del sonido en un gas depende de la temperatura?',
    'fis-41': 'Misma masa pero distinta densidad: ¿cuál desplaza más agua y recibe más empuje?',
    'fis-42': 'La fuerza magnética actúa como centrípeta: despeja R y reemplaza 2v y 2B.',
    'fis-43': 'Si la soltó más alto, rebota más alto; pero el h0 del cálculo no cambió. ¿Qué le pasa al cociente?',
    'fis-44': 'Con g/4, el radio orbital es 2R. Escribe las dos velocidades y divide una entre la otra.',
    'fis-45': 'Separación entre franjas: Δy = λL/d. ¿Qué le pasa a la longitud de onda dentro del agua?',
    'fis-46': 'Partiendo del reposo, x = ½at². Si el eje horizontal es t², ¿qué queda como pendiente?',
    'fis-47': '¿De qué soporte está más cerca la persona? Ese soporte carga más peso.',
    'fis-48': 'En un gas ideal, la energía interna solo depende de la temperatura.',
    'fis-49': 'Campo de un solenoide: B = μnI. ¿Qué conviene aumentar?',
    'fis-50': 'La velocidad horizontal no cambia y la vertical crece. ¿Qué le pasa a la tangente del ángulo?',
    'fis-51': 'Corrientes en el mismo sentido: revisa bien el motivo de cada opción, no solo si dice atractiva o repulsiva.',
    'fis-52': 'Velocidad alta y presión baja en el mismo punto de un fluido: ¿qué principio relaciona esas dos cosas?',
    'fis-53': 'En el equilibrio la aceleración es cero. ¿Dónde es máxima la velocidad en un MAS?',
    'fis-54': 'E, B y la dirección de propagación son perpendiculares entre sí.',
    'fis-55': '¿Puede una máquina real superar a la máquina ideal de Carnot?',
    # Lectura — vol. I
    'lec-76': 'Fíjate en la frase “no navega voluntariamente; es arrastrado”.',
    'lec-77': '“Dopaminérgicos” es un término de la neurociencia. ¿Es poesía o una explicación técnica?',
    'lec-78': 'El autor dice que creemos usar la técnica “cuando en rigor” ocurre lo contrario.',
    'lec-79': 'Si la técnica determina hasta nuestro pensamiento, ¿qué tan real es elegir usarla?',
    'lec-80': 'Lee el mensaje de la balanza: dice qué NO es la escasez y qué sí es.',
    'lec-81': 'El ícono acompaña la frase “Desequilibrio distributivo”. ¿Qué idea resume?',
    'lec-82': 'El autor dice “no obligados por una fuerza mayor”. Entonces, ¿de quién depende el poder?',
    'lec-83': 'Bastaría con dejar de hacer algo: ¿qué tan poco se necesita para acabar con el poder del tirano?',
    'lec-84': 'En ese lugar ni siquiera hay río. ¿Qué busca un político que promete cosas sin sentido?',
    'lec-85': 'Le señalan el absurdo y, en vez de corregirlo, promete algo aún más absurdo.',
    'lec-86': 'Busca la palabra que el texto opone a “verificabilidad”.',
    'lec-87': 'Si solo buscas lo que confirma tu idea, siempre lo encontrarás. ¿Qué método se critica?',
    'lec-88': 'Lee la última frase: “la nada era la única sustancia que le pertenecía”.',
    'lec-89': 'Mata a quienes le mostraron lo que no quería ver. ¿Qué hace el poder con esa verdad?',
    'lec-90': 'Lee el resto de la frase: ¿en qué “ciclo” quedó metido el ocio?',
    'lec-91': 'Ya no se descansa para disfrutar, sino para volver a producir. ¿Qué se pone por encima de qué?',
    'lec-92': 'El texto llama al eufemismo “instrumento de anestesia”. ¿Qué adormece?',
    'lec-93': 'Si las palabras cambian cómo vemos los hechos, ¿el lenguaje solo refleja la realidad?',
    'lec-94': 'Lee la frase destacada de la infografía: ¿qué mito quiere desmontar?',
    'lec-95': '¿Esa frase contradice los datos o resume lo que los datos muestran?',
    'lec-96': 'El pasado ya no es, el futuro aún no es y el presente pasa. ¿Qué queda?',
    'lec-97': 'Lo sé si nadie pregunta; no lo sé si debo explicarlo. ¿Qué diferencia hay entre vivirlo y definirlo?',
    'lec-98': 'Lee la última frase: ¿qué propone hacer con los intolerantes y para qué?',
    'lec-99': '¿Quién decide quién es “intolerante”? Piensa en cómo podría abusarse de ese poder.',
    'lec-100': 'Fíjate en lo que el sabio dice que pasa si quitas una ilusión sin ofrecer nada a cambio.',
    # Lectura — vol. II
    'lec-101': 'El texto aclara lo que el “fin de la historia” NO significa. ¿Qué sí significa?',
    'lec-102': 'Un buen contraargumento muestra que el modelo tiene problemas sin resolver, no solo que pasan cosas.',
    'lec-103': 'El texto dice “la única finalidad”. ¿Cuál es?',
    'lec-104': 'Paternalismo es intervenir “por tu propio bien”. Lee la última frase de Mill.',
    'lec-105': 'Beneficio en un lugar y costo en otro: ¿quién paga la tecnología limpia?',
    'lec-106': 'La ironía dice algo que parece cierto para revelar lo contrario. ¿Es “inmaterial” una mina de cobalto?',
    'lec-107': 'Rousseau pide protección y a la vez “quedar tan libre como antes”.',
    'lec-108': 'Solo te obedeces a ti mismo si participas en crear la ley que cumples.',
    'lec-109': 'Lee la última oración: ¿qué capacidad humana destruye esa memoria ilimitada?',
    'lec-110': 'Es una metáfora: nadie está en prisión. ¿Qué es lo que persigue para siempre a la persona?',
    'lec-111': 'Un papel en blanco no tiene nada escrito todavía. ¿De dónde vienen entonces las ideas?',
    'lec-112': '¿Qué escuela sostiene justo lo contrario de que todo viene de la experiencia?',
    'lec-113': 'Compara lo que cuentan los hombres (victorias, tanques) con lo que cuentan las mujeres (barro, dolor).',
    'lec-114': '¿Para quién resulta incómodo un relato sin héroes ni gloria?',
    'lec-115': 'Lee: “Todo lo que era vivido directamente se ha alejado en una representación”.',
    'lec-116': 'Piensa en las fotos y los perfiles de las redes: ¿son la vida o su representación?',
    'lec-117': 'Busca la palabra “incertidumbre” en el texto.',
    'lec-118': 'Si usan el mismo circuito que las adicciones, ¿es casualidad o un diseño pensado para eso?',
    'lec-119': 'Sancho ve molinos y don Quijote, gigantes. ¿Qué representa cada mirada?',
    'lec-120': 'Don Quijote no revisa lo que ve: descalifica a quien lo corrige. ¿Qué protege así?',
    'lec-121': 'Gigante en una cosa y enano en otra: ¿en cuáles?',
    'lec-122': 'Si el problema es que la técnica superó a la ética, ¿qué debería hacerse con la técnica?',
    'lec-123': 'Lee la primera oración: ¿qué pesa menos y qué pesa más?',
    'lec-124': 'Para debatir hay que acordar al menos algunos hechos. ¿Qué pasa si eso desaparece?',
    'lec-125': 'El manifiesto habla de “la continuación misma de la especie humana”.',
    # Lectura — vol. III
    'lec-126': 'Compara en la infografía los litros de una camiseta con el consumo diario de una persona.',
    'lec-127': '“Falsa sostenibilidad” y “enmascara”: ¿el autor elogia o denuncia?',
    'lec-128': '¿El párrafo 2 da un ejemplo, refuta el párrafo 1 o muestra lo que este provoca?',
    'lec-129': 'Sigue la línea punteada naranja del gráfico: ¿sube o baja? ¿Hasta qué valores llega?',
    'lec-130': '“Deliberado” significa hecho a propósito. ¿Quién se beneficia de que no dejes la pantalla?',
    'lec-131': 'El párrafo 3 conecta la atención con el “juicio crítico”.',
    'lec-132': 'Mira el recuadro central del esquema: ¿qué ocurre allí y qué falta?',
    'lec-133': '“Extractivismo” viene de sacar recursos de la tierra. ¿Qué se saca aquí?',
    'lec-134': 'Ponte del lado de las empresas: ¿qué dirían que se perdería si deben pagar por los datos?',
    'lec-135': 'Lee: “no para acoger al ciudadano, sino para…”.',
    'lec-136': '“Silenciosa” porque nadie te lo ordena. ¿Quién controla entonces tu comportamiento?',
    'lec-137': 'El párrafo 2 dice que la miseria se invisibiliza “en lugar de” algo.',
    'lec-138': 'Busca en el párrafo 2 de qué “se nutren” los algoritmos.',
    'lec-139': 'El prejuicio se escribe con números. ¿Qué apariencia adquiere así?',
    'lec-140': 'El texto habla de un “mito”. ¿Qué creencia sobre los algoritmos quiere desmontar?',
    # Lectura — infografías
    'lec-141': 'Pasa todo a litros: calcula el ahorro de la ducha y el de la lavadora, y compáralo con 600 L.',
    'lec-142': 'Fíjate en la palabra “hasta” y compara 200 L con el consumo normal del inodoro.',
    'lec-143': '¿El gráfico y el recuadro hablan de lo mismo? Uno trata del uso y el otro, de…',
    'lec-144': '¿Es cierto que la ducha es lo que más consume? ¿Y que eso solo resuelve todo el problema?',
    'lec-145': 'Sigue la franja de “no se separan”: se divide en dos caminos. ¿Cuál va al relleno?',
    'lec-146': 'Compara cuántos kg se pierden en cada punto de la ruta. ¿Dónde está la mayor pérdida?',
    'lec-147': 'Hay una frase en la infografía que explica el grosor de las franjas.',
    'lec-148': 'La persona ya separa sus botellas. Busca qué le pasa al plástico DESPUÉS de separarse.',
    'lec-149': 'Resta el valor de 10–12 años al de 16–18 en cada tipo de uso.',
    'lec-150': 'Revisa las barras amarillas de los tres grupos y verifica cada afirmación con los números.',
    'lec-151': 'La conclusión habla de rendimiento académico. ¿Algún dato de la infografía lo mide?',
    'lec-152': 'Lee la nota metodológica: ¿a quiénes se encuestó y a quiénes no?',
    'lec-153': 'Marca los modos con 40 minutos o menos y luego los de menos de 500 g. ¿Cuáles están en las dos listas?',
    'lec-154': 'Calcula las emisiones de las 4 personas antes y después, y réstalas.',
    'lec-155': 'Revisa la columna de costo: ¿la moto es de verdad la más barata de todas?',
    'lec-156': '¿Qué cambia en el tráfico fuera de la hora pico?',
    'lec-157': 'La infografía define “pérdida” y “desperdicio” por separado. ¿Qué etapas incluye el desperdicio?',
    'lec-158': 'Pide proporción, no cantidad: divide lo que pierde cada etapa entre lo que recibe.',
    'lec-159': 'La pirámide invertida ordena las opciones. Ya no se puede prevenir: ¿cuál sigue?',
    'lec-160': 'Suma pérdida y desperdicio; luego calcula qué parte de ese total NO viene de los hogares.',
    # Sociales — nivel alto
    'soc-50': 'Resume qué defiende cada lado: uno habla de inversión y el otro de deuda con los territorios.',
    'soc-51': 'El analista habla de un desbalance productivo: ¿qué propuesta ataca esa causa?',
    'soc-52': 'Busca cuál fenómeno de hoy sigue tratando a ciudadanos como “enemigo interno”.',
    'soc-53': '¿Es consulta o es veto? Revisa qué derecho protege el Convenio 169 de la OIT.',
    'soc-54': 'Una rama limita a otra para que el poder no se concentre. ¿Cómo se llama ese principio?',
    'soc-55': 'Busca el punto en que uno dice que la rebaja beneficia a todos y el otro, que aumenta la desigualdad.',
    'soc-56': 'La empresa era estadounidense. ¿Qué temía el gobierno colombiano de esa potencia?',
    'soc-57': 'Para reforzar la relación, el gasto tiene que llegar a quienes menos tienen.',
    'soc-58': 'Se producían bienes de consumo, pero ¿de dónde venían las máquinas para producirlos?',
    'soc-59': 'Identifica qué derecho defiende cada parte: campesinos y alcaldía.',
    'soc-60': '“Concertación e interculturalidad”: ¿qué acción incluye de verdad a las comunidades?',
    'soc-61': 'Dos partidos se reparten todo. ¿Qué les pasa a las demás fuerzas políticas?',
    'soc-62': 'Imagina a un adulto mayor enfermo haciendo fila desde las 4:00 a. m.',
    'soc-63': 'Más personas mayores y menos jóvenes: ¿quién paga las pensiones?',
    'soc-64': 'Fíjate en el título de cada declaración: “del Hombre” frente a “de la Mujer”.',
    'soc-65': 'No hay impunidad total ni castigo igual al ordinario. ¿Qué se pide a cambio de una pena menor?',
    'soc-66': 'Llega mucha gente sin planeación y sin recursos. ¿Cómo quedan esos barrios?',
    'soc-67': 'La postura B no niega el problema: dice que el castigo golpea al más débil sin resolverlo.',
    'soc-68': 'Si la ley prohíbe comerciar con otros, ¿cómo consiguen las élites lo que quieren comprar?',
    'soc-69': 'Por un lado, derechos sociales garantizados; por otro, mercado y privatización.',
    'soc-70': 'Subir las tasas encarece el crédito. ¿Qué le pasa al consumo y a los precios?',
    'soc-71': 'Si muchos campesinos pierden su tierra, ¿quién la acumula?',
    'soc-72': 'La Constitución de 1991 define un Estado laico. ¿Puede exigir una religión para adoptar?',
    'soc-73': 'Etnocentrismo: juzgar a otras culturas desde la supuesta superioridad de la propia.',
    'soc-74': 'El río y las ciénagas forman un sistema. ¿Qué rompió el muro?',
    'soc-75': 'Totalitario viene de “total”: ¿qué aspectos de la vida quiere controlar el Estado?',
    'soc-76': 'No regresividad: no se puede retroceder en derechos ya alcanzados.',
    'soc-77': 'Modelo federal extremo: ¿qué pasa con el gobierno central y con los estados?',
    'soc-78': 'Se entrenó con datos de un pasado en el que contrataban sobre todo hombres.',
    'soc-79': 'Keynes defendía que en crisis el Estado debe actuar. ¿De qué forma?',
    # Competencias ciudadanas
    'soc-80': 'No todo trato diferente es discriminación. ¿Qué examen se aplica para saberlo?',
    'soc-81': 'Ningún derecho es absoluto. Busca la opción que no dé la razón siempre a una sola parte.',
    'soc-82': 'Son menores de edad. ¿Qué dice la Constitución sobre sus derechos frente a los de los demás?',
    'soc-83': 'La jurisdicción indígena es autónoma, pero ¿tiene algún límite?',
    'soc-84': 'La pena ya se cumplió y el delito no tiene relación con el cargo. ¿Qué derechos se afectan?',
    'soc-85': 'Pasa de un primer paso a una catástrofe sin justificar la cadena. ¿Qué falacia es esa?',
    'soc-86': 'Bajaron las cifras, pero ¿fue por las políticas o por otra razón?',
    'soc-87': 'Saca una conclusión sobre todos los jóvenes a partir de sus sobrinos.',
    'soc-88': '¿El oponente responde al argumento o ataca a la persona?',
    'soc-89': 'Busca la palabra que no admite ninguna excepción.',
    'soc-90': 'Cada parte representa una dimensión. ¿Quién no está en la mesa de negociación?',
    'soc-91': 'Hay tres actores directamente afectados. ¿Cuál no tiene relación con la decisión escolar?',
    'soc-92': 'Busca una opción con dos lados: un interés individual frente a un derecho colectivo.',
    'soc-93': 'Multiperspectivismo: una solución que recoja las preocupaciones de todas las partes.',
    'soc-94': 'Son tres posturas distintas. ¿Alguna agota por sí sola el problema?',
    'soc-95': 'Buscaba ayudar en una cosa y dañó otras. ¿Qué no se analizó?',
    'soc-96': 'La gente reaccionó a la norma comprando otro carro. ¿Se previó esa reacción?',
    'soc-97': 'Aumentó la asistencia, pero no la calidad. ¿Había escuelas suficientes?',
    'soc-98': 'Busca un efecto que el gobierno NO buscaba con el aumento.',
    'soc-99': 'El problema no se resolvió: se fue al barrio de al lado.',
    'soc-100': 'Se demanda una LEY por inconstitucional. ¿Qué acción sirve para eso?',
    'soc-101': 'El ambiente sano es un derecho colectivo. ¿Qué mecanismo lo protege?',
    'soc-102': 'Recuerda la Sentencia C-355 de 2006 y sus tres causales.',
    'soc-103': 'Es un delito. ¿Qué entidad investiga delitos, y cuál responde por faltas disciplinarias o fiscales?',
    'soc-104': 'El propio nombre de uno de los mecanismos indica para qué sirve.',
    'soc-105': 'Una medida de inclusión debe ser proporcional. ¿Qué opción no es extrema?',
    'soc-106': 'Haber consultado a otras comunidades, ¿reemplaza consultar a esta?',
    'soc-107': 'Lo expulsaron por expresar una crítica. ¿Qué derechos están en juego?',
    'soc-108': 'Es un acto general de la administración. ¿Qué acción procede contra esos actos?',
    'soc-109': 'Excluir a alguien por su edad: ¿qué derecho se vulnera?',
    'soc-110': 'Castigar más no funcionó. ¿Qué otras dimensiones tiene el consumo de drogas?',
    'soc-111': 'Si las estaciones quedan lejos de la gente, ¿quién las va a usar?',
    'soc-112': 'Sembrar es solo el comienzo. ¿Qué faltó después?',
    'soc-113': 'Si no hay alternativa barata, ¿el precio cambia lo que compran los de menos ingresos?',
    'soc-114': 'Producen suficiente, pero no tienen dónde vender.',
    'soc-115': 'Se restringen derechos fundamentales. ¿El control de la Corte debe ser débil o riguroso?',
    'soc-116': '¿Qué busca el sistema penal para adolescentes: castigar o resocializar?',
    'soc-117': 'Exigir un título antes de poder informar es un control previo. ¿Es compatible con la libertad de expresión?',
    'soc-118': 'Unos quieren ampliar el voto y otros dudan de la madurez. Busca esos dos principios.',
    'soc-119': 'Contratar a un familiar antepone lo personal al interés público. ¿Qué principio protege ese interés?',
}
