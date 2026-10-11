// Front matter for blog posts: a small YAML reader for the flat fields the
// content manager writes (strings, dates, booleans, numbers, lists of strings,
// and folded or literal block text). Nested maps are not needed by any post
// field, so they are not supported; anything unexpected raises a clear error
// naming the file and line.

export function splitFrontMatter(source, file = 'post') {
  const text = source.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const m = text.match(/^---[ \t]*\n([\s\S]*?)\n(?:---|\.\.\.)[ \t]*(?:\n|$)/);
  if (!m) return { data: {}, body: text };
  return { data: parseYaml(m[1], file), body: text.slice(m[0].length) };
}

const unquoteDouble = (s) => s.replace(/\\(u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (_, e) => {
  if (e[0] === 'u' || e[0] === 'x') return String.fromCharCode(parseInt(e.slice(1), 16));
  return { n: '\n', t: '\t', r: '\r', '0': '\0', '"': '"', '\\': '\\', '/': '/', ' ': ' ', _: ' ', N: '\u0085', L: ' ', P: ' ' }[e] ?? e;
});

function scalar(raw, file, lineNo) {
  let v = raw.trim();
  if (v === '') return null;
  if (v.startsWith('"')) {
    const end = v.lastIndexOf('"');
    if (end <= 0) throw new Error(`${file}: unclosed double quote on front-matter line ${lineNo}`);
    return unquoteDouble(v.slice(1, end));
  }
  if (v.startsWith("'")) {
    const end = v.lastIndexOf("'");
    if (end <= 0) throw new Error(`${file}: unclosed single quote on front-matter line ${lineNo}`);
    return v.slice(1, end).replace(/''/g, "'");
  }
  // Strip a trailing comment ( # preceded by a space).
  v = v.replace(/\s+#.*$/, '');
  if (/^(true|yes|on)$/i.test(v)) return true;
  if (/^(false|no|off)$/i.test(v)) return false;
  if (/^(null|~)$/i.test(v)) return null;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  if (v.startsWith('[') && v.endsWith(']')) return flowList(v.slice(1, -1), file, lineNo);
  return v;
}

function flowList(inner, file, lineNo) {
  const out = [];
  let cur = '';
  let q = null;
  for (const ch of inner) {
    if (q) { cur += ch; if (ch === q) q = null; continue; }
    if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
    if (ch === ',') { if (cur.trim()) out.push(scalar(cur, file, lineNo)); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(scalar(cur, file, lineNo));
  return out.map((x) => (x === null ? '' : String(x)));
}

// Block scalars: | keeps line breaks, > folds them into spaces. A trailing
// - strips the final newline, + keeps all of them.
function blockScalar(lines, start, indicator) {
  const style = indicator[0];
  const chomp = indicator.includes('-') ? 'strip' : indicator.includes('+') ? 'keep' : 'clip';
  const body = [];
  let i = start;
  let indent = null;
  for (; i < lines.length; i++) {
    const l = lines[i];
    if (l.trim() === '') { body.push(''); continue; }
    const ind = l.match(/^ */)[0].length;
    if (indent === null) indent = ind;
    if (ind < indent || ind === 0) break;
    body.push(l.slice(indent));
  }
  // Trailing blank lines belong to the chomping rule, not the content.
  let trailing = 0;
  while (body.length && body[body.length - 1] === '') { body.pop(); trailing++; }
  let text;
  if (style === '|') text = body.join('\n');
  else {
    text = '';
    body.forEach((l, k) => {
      if (k === 0) { text = l; return; }
      const prev = body[k - 1];
      if (l === '') text += '\n';
      else if (prev === '' || /^\s/.test(l) || /^\s/.test(prev)) text += (prev === '' ? '' : '\n') + l;
      else text += ' ' + l;
    });
  }
  if (chomp === 'clip' && body.length) text += '\n';
  if (chomp === 'keep') text += '\n'.repeat(trailing + 1);
  return { value: chomp === 'strip' ? text : text, next: i };
}

export function parseYaml(src, file = 'post') {
  const lines = src.split('\n');
  const data = {};
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || /^\s*#/.test(line)) { i++; continue; }
    if (/^\s/.test(line)) throw new Error(`${file}: unexpected indentation on front-matter line ${i + 1}: "${line.trim()}"`);
    const m = line.match(/^([A-Za-z_][\w-]*)\s*:(?:\s+(.*)|\s*)$/);
    if (!m) throw new Error(`${file}: can't read front-matter line ${i + 1}: "${line}"`);
    const key = m[1];
    const rest = (m[2] ?? '').trim();
    i++;
    if (/^[|>][+-]?\d*$/.test(rest)) {
      const { value, next } = blockScalar(lines, i, rest);
      data[key] = value.replace(/\n$/, '');
      i = next;
      continue;
    }
    if (rest === '') {
      // A block list, a multi-line plain scalar, or an empty value.
      const items = [];
      let j = i;
      while (j < lines.length && (lines[j].trim() === '' || /^\s+-(\s|$)/.test(lines[j]) || /^-(\s|$)/.test(lines[j]))) {
        const t = lines[j].trim();
        if (t.startsWith('-')) {
          const after = t.slice(1).trim();
          if (/^[A-Za-z_][\w-]*\s*:\s/.test(after)) throw new Error(`${file}: lists of objects aren't supported in front matter (line ${j + 1})`);
          items.push(after);
        }
        j++;
      }
      if (items.length) {
        data[key] = items.map((x, k) => { const v = scalar(x, file, i + k); return v === null ? '' : String(v); });
        i = j;
      } else {
        const cont = [];
        while (i < lines.length && /^\s+\S/.test(lines[i])) { cont.push(lines[i].trim()); i++; }
        data[key] = cont.length ? scalar(cont.join(' '), file, i) : null;
      }
      continue;
    }
    // A plain scalar can continue on more-indented lines.
    let value = rest;
    if (!/^["'[]/.test(value)) {
      while (i < lines.length && /^\s+\S/.test(lines[i]) && !/^\s+-\s/.test(lines[i])) { value += ' ' + lines[i].trim(); i++; }
    } else if (value.startsWith('"') && !/"\s*(#.*)?$/.test(value.slice(1))) {
      // A double-quoted string folded over several lines.
      while (i < lines.length) { value += ' ' + lines[i].trim(); i++; if (/"\s*(#.*)?$/.test(lines[i - 1])) break; }
    }
    data[key] = scalar(value, file, i);
  }
  return data;
}
