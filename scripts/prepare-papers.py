#!/usr/bin/env python3
"""Make every research paper readable on the site, not only as a PDF.

For each PDF in public/papers/ this writes:
  public/papers/pages/<slug>/pNN.webp   each page as an image (the "Pages" view)
  public/papers/figures/<slug>-N.webp   each figure, cropped from the page
  content/papers/<slug>.json            the paper as structured text: headings,
                                        paragraphs, figures, tables, references

The text is taken from the PDF itself (font sizes and weights tell headings,
captions and body text apart), so the web version says exactly what the PDF
says. Re-run after replacing or adding a paper:

  python3 scripts/prepare-papers.py            all papers
  python3 scripts/prepare-papers.py <slug>     one paper

Needs (dev machine only): poppler-utils (pdftoppm), and the Python packages
pdfplumber and Pillow (pip install pdfplumber pillow).
"""
import html
import json
import os
import re
import subprocess
import sys
import tempfile
from collections import Counter

import pdfplumber
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_DIR = os.path.join(ROOT, 'public', 'papers')
PAGE_DIR = os.path.join(PDF_DIR, 'pages')
FIG_DIR = os.path.join(PDF_DIR, 'figures')
JSON_DIR = os.path.join(ROOT, 'content', 'papers')
DPI = 200            # render resolution for figure crops
PAGE_WIDTH = 1100    # width of page images in the Pages view
TERMINAL = tuple('.?!:;)"”’\'')



# Symbol-font codes that pdfplumber reads through the standard encoding.
SYMBOL_FIX = {'\ufb01': '\u2192', '\ufb02': '\u2193', '\u00ab': '\u2194', '\u2039': '\u2190', '\u203a': '\u2191'}

def style_of(chars):
    """Dominant font size, bold and italic for a run of characters."""
    c = Counter()
    for ch in chars:
        if ch['text'].strip():
            c[(round(ch['size'], 1), ch['fontname'].split('+')[-1])] += 1
    if not c:
        return 0, False, False
    (size, font), _ = c.most_common(1)[0]
    return size, 'Bold' in font or 'Heavy' in font, 'Italic' in font or 'Oblique' in font


def inside(box, region, pad=2):
    x0, top, x1, bottom = box
    cx, cy = (x0 + x1) / 2, (top + bottom) / 2
    return region[0] - pad <= cx <= region[2] + pad and region[1] - pad <= cy <= region[3] + pad


def line_html(words):
    """Words of one line to HTML, keeping italic and bold runs."""
    out, cur, buf = [], None, []
    for w in words:
        f = w['fontname'].split('+')[-1]
        st = ('Bold' in f, 'Italic' in f or 'Oblique' in f)
        if st != cur and buf:
            out.append((cur, ' '.join(buf)))
            buf = []
        cur = st
        buf.append(w['text'])
    if buf:
        out.append((cur, ' '.join(buf)))
    parts = []
    for (bold, italic), text in out:
        t = html.escape(text, quote=False)
        if italic:
            t = f'<em>{t}</em>'
        if bold:
            t = f'<strong>{t}</strong>'
        parts.append(t)
    out_html = ' '.join(parts).replace('</em> <em>', ' ').replace('</strong> <strong>', ' ')
    return re.sub(r'(</em>|</strong>) ([.,;:)\]])', r'\1\2', out_html)


URL_END = re.compile(r'https?://\S*$')
BULLET = re.compile(r'^(\(cid:127\)|[•●▪◦‣∙·–-])\s+')
REF_START = re.compile(r"^[A-Z0-9][^()]{0,160}\((\d{4}[a-z]?|n\.d\.)[^)]*\)")


def join_lines(lines):
    """Join the lines of one paragraph, mending hyphens and broken URLs."""
    text = ''
    in_url = False
    for i, ln in enumerate(lines):
        h = ln['html']
        if i == 0:
            text = h
            in_url = bool(URL_END.search(ln['text']))
            continue
        prev_plain = lines[i - 1]['text']
        first = ln['text'].split(' ', 1)[0]
        url_cont = in_url and re.search(r'[/._\-=?&%#]', first) and not re.match(r'^[A-Z][a-z]+$', first)
        # Still inside the URL if this line is one unbroken token, or ends with a new one.
        in_url = bool(URL_END.search(ln['text'])) or (bool(url_cont) and ' ' not in ln['text'].strip())
        if url_cont:
            text += h                      # a URL continues on the next line
        elif prev_plain.endswith('-') and first[:1].islower() and first not in ('and', 'or', 'to', 'nor'):
            text += h                      # out-of-\nhome
        else:
            text += ' ' + h
    text = text.replace('(cid:127)', '•')
    text = re.sub(r'\s+([,;:])(?=\s|<|$)', r'\1', text)
    return text.replace('</em> <em>', ' ').replace('</em><em>', '').replace('</strong> <strong>', ' ')


LINK = re.compile(r'(https?://[^\s<]+[^\s<.,;:)\]])')


def linkify(h):
    return LINK.sub(lambda m: f'<a href="{m.group(1)}">{m.group(1)}</a>', h)


def plain(h):
    return html.unescape(re.sub(r'<[^>]+>', '', h))


def slug_id(text, seen):
    base = re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')[:60] or 'section'
    n = seen.get(base, 0) + 1
    seen[base] = n
    return base if n == 1 else f'{base}-{n}'


def prepare(slug):
    pdf_path = os.path.join(PDF_DIR, f'{slug}.pdf')
    os.makedirs(os.path.join(PAGE_DIR, slug), exist_ok=True)
    os.makedirs(FIG_DIR, exist_ok=True)
    for f in os.listdir(os.path.join(PAGE_DIR, slug)):
        os.remove(os.path.join(PAGE_DIR, slug, f))
    for f in os.listdir(FIG_DIR):
        if f.startswith(f'{slug}-'):
            os.remove(os.path.join(FIG_DIR, f))

    items = []            # (page, top, kind, data) in reading order
    pages_meta = []
    fig_n = 0
    with pdfplumber.open(pdf_path) as pdf, tempfile.TemporaryDirectory() as tmp:
        # Body size: the most common size of plain (not bold, not italic) text.
        sizes = Counter()
        for pg in pdf.pages:
            for ch in pg.chars:
                f = ch['fontname']
                if ch['text'].strip() and 'Bold' not in f and 'Italic' not in f:
                    sizes[round(ch['size'], 1)] += 1
        body = sizes.most_common(1)[0][0]

        for pno, pg in enumerate(pdf.pages, start=1):
            # Arrows set in the Symbol font come out as the characters that share
            # their codes in the standard encoding (the right arrow reads as "fi").
            for ch in pg.chars:
                if ch['fontname'].split('+')[-1].startswith('Symbol') and ch['text'] in SYMBOL_FIX:
                    ch['text'] = SYMBOL_FIX[ch['text']]
            base = os.path.join(tmp, f'p{pno}')
            subprocess.run(['pdftoppm', '-r', str(DPI), '-f', str(pno), '-l', str(pno), '-png', '-singlefile', pdf_path, base], check=True)
            render = Image.open(base + '.png').convert('RGB')
            scale = render.width / float(pg.width)
            page_img = render.resize((PAGE_WIDTH, round(render.height * PAGE_WIDTH / render.width)), Image.LANCZOS)
            page_img.save(os.path.join(PAGE_DIR, slug, f'p{pno:02d}.webp'), 'WEBP', quality=72, method=6)
            pages_meta.append({'w': page_img.width, 'h': page_img.height})

            tables = [t for t in pg.find_tables() if (t.bbox[2] - t.bbox[0]) > 80 and len(t.rows) > 1]
            regions = [t.bbox for t in tables]
            imgs = []
            for im in pg.images:
                box = (max(0, im['x0']), max(0, im['top']), min(pg.width, im['x1']), min(pg.height, im['bottom']))
                if box[2] - box[0] < 40 or box[3] - box[1] < 30:
                    continue
                if any(abs(box[0] - b[0]) < 2 and abs(box[1] - b[1]) < 2 for b in imgs):
                    continue                      # an image and its soft mask
                imgs.append(box)
            regions += imgs

            words = pg.extract_words(extra_attrs=['fontname', 'size'], x_tolerance=1.5, keep_blank_chars=False)
            for ln in pg.extract_text_lines(return_chars=True):
                box = (ln['x0'], ln['top'], ln['x1'], ln['bottom'])
                if any(inside(box, r) for r in regions):
                    continue
                lw = [w for w in words if abs(w['top'] - ln['top']) < 2.5 and w['x0'] >= ln['x0'] - 1 and w['x1'] <= ln['x1'] + 1]
                size, bold, italic = style_of(ln['chars'])
                items.append((pno, ln['top'], 'line', {
                    'text': ln['text'].strip(), 'html': line_html(lw) if lw else html.escape(ln['text'].strip(), quote=False),
                    'x0': ln['x0'], 'x1': ln['x1'], 'top': ln['top'], 'bottom': ln['bottom'],
                    'size': size, 'bold': bold, 'italic': italic, 'page': pno,
                }))
            for t in tables:
                rows = [[re.sub(r'\s+([,.;:])(?=\s|$)', r'\1', re.sub(r'\s+', ' ', c or '')).strip() for c in row] for row in t.extract()]
                rows = [r for r in rows if any(r)]
                items.append((pno, t.bbox[1], 'table', {'rows': rows}))
            for box in imgs:
                fig_n += 1
                crop = render.crop(tuple(round(v * scale) for v in box))
                if crop.width > 1400:
                    crop = crop.resize((1400, round(crop.height * 1400 / crop.width)), Image.LANCZOS)
                name = f'{slug}-{fig_n}.webp'
                crop.save(os.path.join(FIG_DIR, name), 'WEBP', quality=80, method=6)
                items.append((pno, box[1], 'figure', {'src': f'papers/figures/{name}', 'w': crop.width, 'h': crop.height}))

    items.sort(key=lambda it: (it[0], it[1]))
    lines = [it[3] for it in items if it[2] == 'line']
    left = min(l['x0'] for l in lines)
    right = max(l['x1'] for l in lines if abs(l['size'] - body) < 0.3)
    pitch = Counter(round(b['top'] - a['top']) for a, b in zip(lines, lines[1:]) if a['page'] == b['page'] and abs(a['size'] - body) < 0.3 and abs(b['size'] - body) < 0.3).most_common(1)[0][0]

    def kind(l):
        if l['bold'] and l['size'] >= body + 1.4:
            return 'h2'
        if l['bold'] and l['size'] >= body - 0.2 and len(l['text']) < 120:
            return 'h3'
        if l['italic'] and l['size'] <= body - 1.0:
            return 'caption'
        if l['size'] <= body - 1.0:
            return 'small'
        return 'body'

    blocks = []
    cur = None
    in_refs = False
    # Do references use a hanging indent? Then each entry starts at the margin.
    ref_lines, seen_refs = [], False
    for it in items:
        if it[2] != 'line':
            continue
        d = it[3]
        if d['bold'] and d['size'] >= body + 1.4:
            seen_refs = d['text'].lower().startswith('references')
        elif seen_refs:
            ref_lines.append(d)
    ref_left = min((l['x0'] for l in ref_lines), default=left)
    ref_hanging = any(l['x0'] > ref_left + 8 for l in ref_lines)

    def flush():
        nonlocal cur
        if cur:
            blocks.append(cur)
        cur = None

    prev = None
    for pno, top, k, d in items:
        if k != 'line':
            flush()
            blocks.append({'t': 'fig' if k == 'figure' else 'table', **d})
            prev = None
            continue
        kd = kind(d)
        if kd in ('h2', 'h3'):
            # A heading can run over two lines.
            if cur and cur['t'] == kd and prev and prev['page'] == d['page'] and d['top'] - prev['top'] < pitch * 1.6:
                cur['lines'].append(d)
            else:
                flush()
                cur = {'t': kd, 'lines': [d]}
                in_refs = kd == 'h2' and d['text'].lower().startswith('references')
            prev = d
            continue
        if in_refs:
            t = 'small' if d['size'] <= body - 1.8 else 'ref'
        else:
            t = {'body': 'p', 'caption': 'caption', 'small': 'small'}[kd]
        bullet = bool(BULLET.match(d['text']))
        if t == 'p' and bullet:
            t = 'li'
        elif t == 'p' and cur and cur['t'] == 'li' and prev is not None and d['x0'] > left + 6 and d['top'] - prev['top'] < pitch * 1.45:
            t = 'li'                       # an indented continuation of a list item
        new = cur is None or cur['t'] != t
        if not new and prev is not None:
            if t == 'li':
                new = bullet
            elif t == 'ref':
                new = (d['x0'] <= ref_left + 4) if ref_hanging else (REF_START.match(d['text']) is not None)
            elif prev['page'] == d['page']:
                gap = d['top'] - prev['top']
                ended = prev['x1'] < right - 35 and prev['text'].endswith(TERMINAL)
                new = gap > pitch * 1.45 or ended
            else:
                new = prev['x1'] < right - 35 or (prev['text'].endswith(TERMINAL) and d['text'][:1].isupper() and prev['x1'] < right - 8)
        if new:
            flush()
            cur = {'t': t, 'lines': []}
        cur['lines'].append(d)
        prev = d
    flush()

    # Lines to HTML; captions attach to the figure or table they describe.
    out, seen = [], {}
    for b in blocks:
        if 'lines' in b:
            h = join_lines(b['lines'])
            b = {'t': b['t'], 'html': linkify(h) if b['t'] in ('p', 'ref', 'small', 'caption') else h}
        out.append(b)
    for b in out:
        if b['t'] == 'li':
            b['html'] = re.sub(r'^(\(cid:127\)|•|●|▪|◦|‣|∙|·|–|-)\s*', '', b['html'])
    merged = []
    for i, b in enumerate(out):
        if b['t'] == 'caption':
            txt = plain(b['html'])
            prv = merged[-1] if merged else None
            nxt = out[i + 1] if i + 1 < len(out) else None
            # "Table 1." belongs to a table and "Figure 1." to a figure, whether
            # the caption sits above or below it in the PDF.
            kind = 'table' if txt.startswith('Table') else 'fig' if txt.startswith(('Figure', 'Exhibit')) else None
            if kind:
                if prv and prv['t'] == kind and 'caption' not in prv:
                    prv['caption'] = b['html']
                    continue
                if nxt and nxt['t'] == kind:
                    nxt['caption'] = b['html']
                    continue
            elif prv and prv['t'] in ('fig', 'table') and 'caption' not in prv:
                prv['caption'] = b['html']
                continue
            if prv and prv['t'] in ('fig', 'table'):
                prv['note'] = (prv.get('note', '') + ' ' + b['html']).strip()
                continue
            b = {'t': 'note', 'html': b['html']}
        if b['t'] == 'small':
            prv = merged[-1] if merged else None
            if prv and prv['t'] in ('fig', 'table'):
                prv['note'] = (prv.get('note', '') + ' ' + b['html']).strip()
                continue
            b = {'t': 'note', 'html': b['html']}
        merged.append(b)

    # Drop the front matter: title, author, abstract and keywords are shown
    # elsewhere on the paper's page.
    start = 0
    for i, b in enumerate(merged):
        if b['t'] == 'p' and plain(b['html']).startswith('Keywords'):
            start = i + 1
            break
    else:
        for i, b in enumerate(merged):
            if b['t'] == 'h2' and plain(b['html']).strip().lower() != 'abstract' and i > 0:
                start = i
                break
    merged = merged[start:]

    # A table that runs onto the next page comes back as two tables with the
    # same header row: join them.
    joined = []
    for b in merged:
        if b['t'] == 'table' and joined and joined[-1]['t'] == 'table' and joined[-1]['rows'][0] == b['rows'][0]:
            joined[-1]['rows'].extend(b['rows'][1:])
            if b.get('caption') and not joined[-1].get('caption'):
                joined[-1]['caption'] = b['caption']
            if b.get('note'):
                joined[-1]['note'] = (joined[-1].get('note', '') + ' ' + b['note']).strip()
            continue
        joined.append(b)
    merged = joined

    final, refs = [], None
    for b in merged:
        if b['t'] in ('h2', 'h3'):
            text = plain(b['html'])
            b = {'t': b['t'], 'text': text, 'id': slug_id(text, seen)}
        if b['t'] == 'ref':
            if refs is None:
                refs = {'t': 'refs', 'items': []}
                final.append(refs)
            refs['items'].append(b['html'])
            continue
        refs = None if b['t'] != 'note' else refs
        if b['t'] == 'li':
            if final and final[-1]['t'] == 'list':
                final[-1]['items'].append(b['html'])
            else:
                final.append({'t': 'list', 'items': [b['html']]})
            continue
        final.append(b)

    words = sum(len(plain(b.get('html', '') + ' ' + b.get('caption', '') + ' ' + ' '.join(b.get('items', []))).split()) for b in final) + sum(len(' '.join(r).split()) for b in final if b['t'] == 'table' for r in b['rows'])
    doc = {
        'slug': slug,
        'pages': pages_meta,
        'words': words,
        'figures': fig_n,
        'tables': sum(1 for b in final if b['t'] == 'table'),
        'blocks': final,
    }
    os.makedirs(JSON_DIR, exist_ok=True)
    with open(os.path.join(JSON_DIR, f'{slug}.json'), 'w') as fh:
        json.dump(doc, fh, ensure_ascii=False, indent=1)
    kinds = Counter(b['t'] for b in final)
    print(f'  {slug}: {len(pages_meta)} pages, {fig_n} figures, {doc["tables"]} tables, {kinds["h2"]} sections, {kinds["p"]} paragraphs, {sum(len(b["items"]) for b in final if b["t"] == "refs")} references')


if __name__ == '__main__':
    wanted = sys.argv[1:]
    slugs = sorted(f[:-4] for f in os.listdir(PDF_DIR) if f.endswith('.pdf'))
    for s in slugs:
        if not wanted or s in wanted:
            prepare(s)
