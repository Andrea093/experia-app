import zipfile, re, sys, os
from xml.etree import ElementTree as ET

NS = {
    'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'v': 'urn:schemas-microsoft-com:vml',
    'm': 'http://schemas.openxmlformats.org/officeDocument/2006/math',
}
W = '{%s}' % NS['w']

def rels(z):
    x = ET.fromstring(z.read('word/_rels/document.xml.rels'))
    return {e.get('Id'): e.get('Target') for e in x}

M = '{%s}' % NS['m']

def omml(el):
    tag = el.tag
    kids = list(el)
    def sub(name):
        c = el.find(M + name)
        return ''.join(omml(k) for k in c) if c is not None else ''
    if tag == M + 't':
        return el.text or ''
    if tag == M + 'f':
        return '(%s)/(%s)' % (sub('num'), sub('den'))
    if tag == M + 'sSup':
        return '%s^(%s)' % (sub('e'), sub('sup'))
    if tag == M + 'sSub':
        return '%s_(%s)' % (sub('e'), sub('sub'))
    if tag == M + 'sSubSup':
        return '%s_(%s)^(%s)' % (sub('e'), sub('sub'), sub('sup'))
    if tag == M + 'sPre':
        return '_(%s)^(%s)%s' % (sub('sub'), sub('sup'), sub('e'))
    if tag == M + 'rad':
        d = sub('deg')
        return ('root%s' % d if d else 'sqrt') + '(%s)' % sub('e')
    if tag == M + 'd':
        pr = el.find(M + 'dPr')
        b, e = '(', ')'
        if pr is not None:
            bc = pr.find(M + 'begChr'); ec = pr.find(M + 'endChr')
            if bc is not None: b = bc.get(M + 'val') or ''
            if ec is not None: e = ec.get(M + 'val') or ''
        return b + ','.join(''.join(omml(k) for k in c) for c in el.findall(M + 'e')) + e
    if tag.endswith('Pr'):
        return ''
    if tag == W + 't':
        return el.text or ''
    return ''.join(omml(k) for k in kids)

def para_text(p, rmap):
    out = []
    skip = set()
    for el in p.iter():
        if el in skip:
            continue
        if el.tag == M + 'oMath':
            out.append(' ⟦' + omml(el) + '⟧ ')
            for d in el.iter():
                skip.add(d)
            continue
        tag = el.tag
        if tag == W + 't':
            out.append(el.text or '')
        elif tag == W + 'sym':
            out.append(' → ' if el.get(W + 'char') == 'F0E0' else '?')
        elif tag == W + 'tab':
            out.append('\t')
        elif tag == W + 'br':
            out.append('\n')
        elif tag == '{%s}blip' % NS['a']:
            rid = el.get('{%s}embed' % NS['r'])
            out.append(' [IMG:%s] ' % rmap.get(rid, rid))
        elif tag == '{%s}imagedata' % NS['v']:
            rid = el.get('{%s}id' % NS['r'])
            out.append(' [IMG:%s] ' % rmap.get(rid, rid))
    return ''.join(out)

def numbered(p):
    pr = p.find(W + 'pPr')
    if pr is not None and pr.find(W + 'numPr') is not None:
        n = pr.find(W + 'numPr')
        ilvl = n.find(W + 'ilvl'); nid = n.find(W + 'numId')
        return 'L%s/N%s' % (ilvl.get(W + 'val') if ilvl is not None else '?', nid.get(W + 'val') if nid is not None else '?')
    return ''

def dump(path):
    z = zipfile.ZipFile(path)
    rmap = rels(z)
    doc = ET.fromstring(z.read('word/document.xml'))
    body = doc.find(W + 'body')
    lines = []
    for child in body:
        if child.tag == W + 'p':
            t = para_text(child, rmap)
            if t.strip():
                num = numbered(child)
                lines.append(('[%s] ' % num if num else '') + t)
        elif child.tag == W + 'tbl':
            lines.append('<<TABLE>>')
            for tr in child.iter(W + 'tr'):
                cells = []
                for tc in tr.findall(W + 'tc'):
                    cells.append(' / '.join(para_text(p, rmap) for p in tc.iter(W + 'p')).strip())
                lines.append(' | '.join(cells))
            lines.append('<</TABLE>>')
    return '\n'.join(lines)

if __name__ == '__main__':
    src, out = sys.argv[1], sys.argv[2]
    open(out, 'w', encoding='utf-8').write(dump(src))
