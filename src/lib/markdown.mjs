// Markdown to HTML for blog posts. Covers what the content manager's editor
// produces and what people type by hand: headings, paragraphs, emphasis,
// links, images (with captions), lists (nested), quotes, code, tables, rules
// and line breaks. Raw HTML in a post is shown as text, never run, so a post
// can't break the page or its security policy.
//
//   renderMarkdown(source, { url })   url(href) rewrites site-relative links

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const slugify = (s) => String(s).toLowerCase()
  .normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/&[a-z]+;/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  .slice(0, 80) || 'section';

// Plain text from Markdown, for summaries, word counts and feeds.
export function plainText(md) {
  return String(md)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, '')
    .replace(/[*_~`]+/g, '')
    .replace(/\\([\\`*_{}[\]()#+\-.!|~>])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const SAFE_URL = /^(https?:|mailto:|tel:|#|\/|\.{0,2}\/|[^:]*$)/i;

function inline(text, opt) {
  // 1. Protect code spans and escaped characters, then escape everything else.
  const store = [];
  const keep = (htmlStr) => `\u0000${store.push(htmlStr) - 1}\u0000`;
  let s = text
    .replace(/(`+)([\s\S]*?[^`])\1(?!`)/g, (_, __, code) => keep(`<code>${escapeHtml(code.trim())}</code>`))
    .replace(/\\([\\`*_{}[\]()#+\-.!|~>])/g, (_, ch) => keep(escapeHtml(ch)));
  s = escapeHtml(s);

  const href = (raw) => {
    const u = raw.replace(/&amp;/g, '&').trim();
    if (!SAFE_URL.test(u)) return '#';
    return escapeHtml(opt.url ? opt.url(u) : u);
  };
  const isExternal = (raw) => /^https?:\/\//i.test(raw.replace(/&amp;/g, '&'));
  const title = (t) => (t ? ` title="${t}"` : '');

  // 2. Images, then links (so an image inside a link still works).
  s = s.replace(/!\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+&quot;(.*?)&quot;)?\s*\)/g, (_, alt, src, t) =>
    keep(`<img src="${href(src)}" alt="${alt}" loading="lazy" decoding="async"${title(t)}>`));
  s = s.replace(/\[([^\]]+)\]\(\s*([^\s)]+)(?:\s+&quot;(.*?)&quot;)?\s*\)/g, (_, label, url, t) =>
    keep(`<a href="${href(url)}"${title(t)}${isExternal(url) ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`));
  // Autolinks: <https://…> and bare https:// addresses.
  s = s.replace(/&lt;(https?:\/\/[^\s&]+(?:&amp;[^\s&]+)*)&gt;/g, (_, url) => keep(`<a href="${href(url)}" target="_blank" rel="noopener">${url}</a>`));
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<]+[^\s<.,:;"')\]])/g, (_, pre, url) => `${pre}${keep(`<a href="${href(url)}" target="_blank" rel="noopener">${url}</a>`)}`);

  // 3. Emphasis.
  s = s
    .replace(/(\*\*\*|___)(?=\S)([\s\S]*?\S)\1/g, '<strong><em>$2</em></strong>')
    .replace(/(\*\*|__)(?=\S)([\s\S]*?\S)\1/g, '<strong>$2</strong>')
    .replace(/(^|[^\w*])\*(?=\S)([\s\S]*?\S)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_(?=\S)([\s\S]*?\S)_(?!\w)/g, '$1<em>$2</em>')
    .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>');

  // 4. Hard line breaks: two trailing spaces or a backslash before a newline.
  s = s.replace(/(?: {2,}|\\)\n/g, '<br>\n');

  return s.replace(/\u0000(\d+)\u0000/g, (_, n) => store[Number(n)]).replace(/\u0000(\d+)\u0000/g, (_, n) => store[Number(n)]);
}

const isBlank = (l) => /^\s*$/.test(l);
const LIST = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/;
const FENCE = /^\s{0,3}(`{3,}|~{3,})\s*([\w+-]*)\s*$/;
const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const RULE = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const QUOTE = /^\s{0,3}>\s?(.*)$/;
const TABLE_SEP = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;

function startsBlock(line) {
  return FENCE.test(line) || HEADING.test(line) || RULE.test(line) || QUOTE.test(line) || LIST.test(line);
}

function splitRow(row) {
  let r = row.trim();
  if (r.startsWith('|')) r = r.slice(1);
  if (r.endsWith('|') && !r.endsWith('\\|')) r = r.slice(0, -1);
  return r.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
}

function renderList(lines, opt) {
  // lines: the raw lines of one list, including nested ones.
  const first = lines[0].match(LIST);
  const baseIndent = first[1].length;
  const ordered = /\d/.test(first[2]);
  const start = ordered ? parseInt(first[2], 10) : 1;
  const items = [];
  for (const line of lines) {
    const m = line.match(LIST);
    if (m && m[1].length < baseIndent + 2) {
      items.push([m[3]]);
    } else if (items.length) {
      items[items.length - 1].push(line);
    }
  }
  const lis = items.map((it) => {
    const [head, ...rest] = it;
    // Task-list checkboxes become plain markers.
    const text = head.replace(/^\[( |x|X)\]\s+/, (_, c) => (c.trim() ? '☑ ' : '☐ '));
    const nestedStart = rest.findIndex((l) => LIST.test(l));
    const cont = (nestedStart === -1 ? rest : rest.slice(0, nestedStart)).filter((l) => !isBlank(l)).map((l) => l.trim());
    const nested = nestedStart === -1 ? '' : renderList(dedent(rest.slice(nestedStart)), opt);
    return `<li>${inline([text, ...cont].join('\n'), opt)}${nested}</li>`;
  });
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag}${ordered && start !== 1 ? ` start="${start}"` : ''}>${lis.join('')}</${tag}>`;
}

function dedent(lines) {
  const ind = Math.min(...lines.filter((l) => !isBlank(l)).map((l) => l.match(/^\s*/)[0].length));
  return lines.map((l) => l.slice(Math.min(ind, l.match(/^\s*/)[0].length)));
}

export function renderMarkdown(source, opt = {}) {
  const lines = String(source || '').replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');
  const out = [];
  const ids = new Map();
  const headingId = (text) => {
    const base = slugify(text);
    const n = (ids.get(base) || 0) + 1;
    ids.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (isBlank(line)) { i++; continue; }

    let m = line.match(FENCE);
    if (m) {
      const fence = m[1];
      const lang = m[2];
      const code = [];
      i++;
      while (i < lines.length && !new RegExp(`^\\s{0,3}${fence[0]}{${fence.length},}\\s*$`).test(lines[i])) { code.push(lines[i]); i++; }
      i++;
      out.push(`<pre><code${lang ? ` class="language-${escapeHtml(lang)}"` : ''}>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    m = line.match(HEADING);
    if (m) {
      // The page title is the only h1, so post headings start at h2.
      const level = Math.min(4, Math.max(2, m[1].length));
      const text = m[2];
      out.push(`<h${level} id="${headingId(text.replace(/[*_`]/g, ''))}">${inline(text, opt)}</h${level}>`);
      i++;
      continue;
    }

    if (RULE.test(line)) { out.push('<hr>'); i++; continue; }

    if (QUOTE.test(line)) {
      const inner = [];
      while (i < lines.length && (QUOTE.test(lines[i]) || (!isBlank(lines[i]) && !startsBlock(lines[i]) && inner.length))) {
        const q = lines[i].match(QUOTE);
        inner.push(q ? q[1] : lines[i]);
        i++;
      }
      out.push(`<blockquote>${renderMarkdown(inner.join('\n'), opt)}</blockquote>`);
      continue;
    }

    if (LIST.test(line)) {
      const block = [];
      const baseIndent = line.match(LIST)[1].length;
      const ordered = (l) => /\d/.test(l.match(LIST)[2]);
      const kind = ordered(line);
      // A list item at the base indent but of the other kind starts a new list.
      const otherKind = (l) => LIST.test(l) && l.match(LIST)[1].length < baseIndent + 2 && ordered(l) !== kind;
      while (i < lines.length) {
        const l = lines[i];
        if (block.length && otherKind(l)) break;
        if (isBlank(l)) {
          if (lines[i + 1] !== undefined && otherKind(lines[i + 1])) break;
          // A blank line ends the list unless the next line continues it.
          const nxt = lines[i + 1];
          if (nxt !== undefined && (LIST.test(nxt) && nxt.match(LIST)[1].length >= baseIndent || /^\s{2,}\S/.test(nxt))) { block.push(l); i++; continue; }
          break;
        }
        if (block.length && !LIST.test(l) && !/^\s/.test(l) && startsBlock(l)) break;
        if (block.length && !LIST.test(l) && !/^\s/.test(l) && isBlank(lines[i - 1])) break;
        block.push(l);
        i++;
      }
      out.push(renderList(block, opt));
      continue;
    }

    // Table: a header row, a separator row, then body rows.
    if (line.includes('|') && i + 1 < lines.length && TABLE_SEP.test(lines[i + 1])) {
      const head = splitRow(line);
      const aligns = splitRow(lines[i + 1]).map((c) => (c.startsWith(':') && c.endsWith(':') ? 'center' : c.endsWith(':') ? 'right' : ''));
      i += 2;
      const rows = [];
      while (i < lines.length && !isBlank(lines[i]) && lines[i].includes('|')) { rows.push(splitRow(lines[i])); i++; }
      const cell = (tag, c, k) => `<${tag}${aligns[k] ? ` style="text-align:${aligns[k]}"` : ''}>${inline(c, opt)}</${tag}>`;
      out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c, k) => cell('th', c, k)).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${head.map((_, k) => cell('td', r[k] ?? '', k)).join('')}</tr>`).join('')}</tbody></table></div>`);
      continue;
    }

    // Paragraph (or a figure when the paragraph is a single image).
    const para = [];
    while (i < lines.length && !isBlank(lines[i]) && !(para.length && startsBlock(lines[i]))) {
      if (lines[i + 1] !== undefined && TABLE_SEP.test(lines[i + 1]) && lines[i].includes('|') && para.length) break;
      para.push(lines[i]);
      i++;
    }
    const text = para.join('\n');
    const img = text.trim().match(/^!\[([^\]]*)\]\(\s*([^\s)]+)(?:\s+"(.*?)")?\s*\)$/);
    if (img) {
      const caption = img[3] || '';
      out.push(`<figure>${inline(`![${img[1]}](${img[2]})`, opt)}${caption ? `<figcaption>${inline(caption, opt)}</figcaption>` : ''}</figure>`);
    } else {
      out.push(`<p>${inline(text, opt)}</p>`);
    }
  }
  return out.join('\n');
}
