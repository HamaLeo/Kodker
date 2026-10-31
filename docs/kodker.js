/*!
 * کۆدکەر (Kodker) — زمانی پڕۆگرامینگی کوردی کە دەگۆڕدرێت بۆ JavaScript
 * Kodker — a Kurdish (Sorani) programming language that compiles to JavaScript.
 * MIT License
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Kodker = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ───────────────────────── وشە سەرەکییەکان ─────────────────────────
  // (ئەگەر، هەتا، بۆ بە شێوەیەکی تایبەت مامەڵەیان لەگەڵ دەکرێت)
  const KEYWORDS = {
    'گۆڕاو': 'let',
    'نەگۆڕ': 'const',
    'کار': 'function',
    'گەڕێنەوە': 'return',
    'ئەگەرنا': 'else',
    'بشکێنە': 'break',
    'بەردەوامبە': 'continue',
    'ڕاست': 'true',
    'هەڵە': 'false',
    'هیچ': 'null',
    'نەناسراو': 'undefined',
    'و': '&&',
    'یان': '||',
    'نەک': '!',
    'نوێ': 'new',
    'تاقیبکەرەوە': 'try',
    'گیرکە': 'catch',
    'لەکۆتاییدا': 'finally',
    'فڕێبدە': 'throw',
    'هەڵبژێرە': 'switch',
    'حاڵەت': 'case',
    'بنەڕەت': 'default',
    'ئەمە': 'this',
    'جۆرەکەی': 'typeof',
    'پۆل': 'class',
    'کۆنستراکتەر': 'constructor',
    'درێژبکەرەوە': 'extends',
    'سوپەر': 'super',
  };

  // ناوی تایبەتمەندی و میتۆدەکان دوای خاڵ (لیست، دەق ...)
  const PROPS = {
    'درێژی': 'length',
    'زیادبکە': 'push',
    'لابەرە': 'pop',
    'یەکەمیلابەرە': 'shift',
    'ڕیزبکە': 'sort',
    'پێچەوانەبکە': 'reverse',
    'ببڕە': 'slice',
    'بەیەکەوەبنووسە': 'join',
    'دابەشبکە': 'split',
    'گەورەبکە': 'toUpperCase',
    'بچووکبکە': 'toLowerCase',
    'لەخۆدەگرێت': 'includes',
    'بۆهەریەک': 'forEach',
    'نەخشە': 'map',
    'پاڵاوتن': 'filter',
    'کۆکردنەوە': 'reduce',
    'دۆزینەوە': 'find',
    'شوێن': 'indexOf',
    'جێگۆڕکێ': 'replace',
    'پاککەرەوە': 'trim',
  };

  const PUNCT_MAP = { '،': ',', '؛': ';', '؟': '?' };

  class KodkerError extends Error {}

  // ───────────────────────── تۆکنایزەر ─────────────────────────
  const INVISIBLE = /[‎‏‪-‮⁦-⁩﻿]/;
  const WORD_START = /[\p{L}\p{M}_$‌‍]/u;
  const WORD_PART = /[\p{L}\p{M}\p{N}_$‌‍]/u;
  const DIGIT = /[0-9٠-٩۰-۹]/;

  function toAsciiDigits(s) {
    let out = '';
    for (const ch of s) {
      const c = ch.charCodeAt(0);
      if (c >= 0x660 && c <= 0x669) out += String(c - 0x660);
      else if (c >= 0x6f0 && c <= 0x6f9) out += String(c - 0x6f0);
      else if (ch === '٫') out += '.';
      else out += ch;
    }
    return out;
  }

  // یەکخستنی پیتە عەرەبییەکان (ك → ک ، ي → ی)
  function normalizeWord(w) {
    return w.normalize('NFC').replace(/ك/g, 'ک').replace(/[يى]/g, 'ی');
  }

  function tokenize(src) {
    const tokens = [];
    const n = src.length;
    let i = 0;
    while (i < n) {
      const c = src[i];

      if (INVISIBLE.test(c)) { tokens.push({ type: 'ws', text: '', raw: c }); i++; continue; }

      if (/\s/.test(c)) {
        let j = i;
        while (j < n && /\s/.test(src[j])) j++;
        tokens.push({ type: 'ws', text: src.slice(i, j), raw: src.slice(i, j) });
        i = j;
      } else if (c === '/' && src[i + 1] === '/') {
        let j = i;
        while (j < n && src[j] !== '\n') j++;
        tokens.push({ type: 'comment', text: src.slice(i, j), raw: src.slice(i, j) });
        i = j;
      } else if (c === '/' && src[i + 1] === '*') {
        let j = src.indexOf('*/', i + 2);
        j = j === -1 ? n : j + 2;
        tokens.push({ type: 'comment', text: src.slice(i, j), raw: src.slice(i, j) });
        i = j;
      } else if (c === '"' || c === "'" || c === '`') {
        let j = i + 1;
        while (j < n && src[j] !== c) {
          if (src[j] === '\\') j++;
          if (c !== '`' && src[j] === '\n') break;
          j++;
        }
        j = Math.min(j + 1, n);
        tokens.push({ type: 'str', text: src.slice(i, j), raw: src.slice(i, j) });
        i = j;
      } else if (DIGIT.test(c)) {
        let j = i;
        while (j < n && DIGIT.test(src[j])) j++;
        if ((src[j] === '.' || src[j] === '٫') && j + 1 < n && DIGIT.test(src[j + 1])) {
          j++;
          while (j < n && DIGIT.test(src[j])) j++;
        }
        tokens.push({ type: 'num', text: toAsciiDigits(src.slice(i, j)), raw: src.slice(i, j) });
        i = j;
      } else if (WORD_START.test(c)) {
        let j = i + 1;
        while (j < n && WORD_PART.test(src[j])) j++;
        tokens.push({ type: 'word', text: normalizeWord(src.slice(i, j)), raw: src.slice(i, j) });
        i = j;
      } else {
        tokens.push({ type: 'punct', text: PUNCT_MAP[c] || c, raw: c });
        i++;
      }
    }
    return tokens;
  }

  // ───────────────────────── وەرگێڕان ─────────────────────────
  const OPEN = '([{';
  const CLOSE = ')]}';

  // هەموو تۆکنەکان دەخوێنێتەوە هەتا یەکەم «{» لە ناو قووڵایی ٠
  function readHeader(tokens, start) {
    let depth = 0;
    let j = start;
    for (; j < tokens.length; j++) {
      const t = tokens[j];
      if (t.type !== 'punct') continue;
      if (t.text === '{' && depth === 0) break;
      if (t.text === '(' || t.text === '[') depth++;
      else if (t.text === ')' || t.text === ']') depth--;
    }
    return { tokens: tokens.slice(start, j), end: j };
  }

  const significant = (toks) => toks.filter((t) => t.type !== 'ws' && t.type !== 'comment');

  function translateFor(header) {
    const segs = [];
    let cur = { marker: null, toks: [] };
    let depth = 0;
    for (const t of header) {
      if (t.type === 'punct') {
        if (OPEN.includes(t.text)) depth++;
        else if (CLOSE.includes(t.text)) depth--;
      }
      if (depth === 0 && t.type === 'word' && (t.text === 'لە' || t.text === 'تا' || t.text === 'هەنگاو')) {
        segs.push(cur);
        cur = { marker: t.text, toks: [] };
        continue;
      }
      cur.toks.push(t);
    }
    segs.push(cur);

    const head = significant(segs[0].toks);
    const usage =
      'شێوازی «بۆ» هەڵەیە. نموونە:\n  بۆ i لە ١ تا ١٠ { ... }\n  بۆ i لە ١٠ تا ١ هەنگاو -١ { ... }\n  بۆ هەر عەنسەر لە لیست { ... }';

    // بۆ هەر x لە لیست { }
    if (head.length && head[0].text === 'هەر') {
      if (head.length !== 2 || head[1].type !== 'word' || segs.length !== 2 || segs[1].marker !== 'لە') {
        throw new KodkerError(usage);
      }
      return `for (let ${head[1].text} of (${translate(segs[1].toks).trim()})) `;
    }

    // بۆ i لە ١ تا ١٠ [هەنگاو ٢] { }
    const markers = segs.slice(1).map((s) => s.marker).join(',');
    if (head.length !== 1 || head[0].type !== 'word' || (markers !== 'لە,تا' && markers !== 'لە,تا,هەنگاو')) {
      throw new KodkerError(usage);
    }
    const v = head[0].text;
    const start = translate(segs[1].toks).trim();
    const end = translate(segs[2].toks).trim();
    if (segs.length === 3) {
      return `for (let ${v} = (${start}); ${v} <= (${end}); ${v}++) `;
    }
    const step = translate(segs[3].toks).trim();
    return `for (let ${v} = (${start}), __هەنگاو = (${step}); __هەنگاو > 0 ? ${v} <= (${end}) : ${v} >= (${end}); ${v} += __هەنگاو) `;
  }

  function translate(tokens) {
    let out = '';
    let prev = null; // دوایین تۆکنی گرنگ
    let i = 0;
    while (i < tokens.length) {
      const t = tokens[i];

      if (t.type === 'word') {
        const afterDot = prev && prev.type === 'punct' && prev.text === '.';
        if (afterDot) {
          out += PROPS[t.text] || t.text;
        } else if (t.text === 'ئەگەر' || t.text === 'هەتا') {
          const h = readHeader(tokens, i + 1);
          out += (t.text === 'ئەگەر' ? 'if' : 'while') + ' (' + translate(h.tokens).trim() + ') ';
          i = h.end;
          prev = t;
          continue;
        } else if (t.text === 'بۆ') {
          const h = readHeader(tokens, i + 1);
          out += translateFor(h.tokens);
          i = h.end;
          prev = t;
          continue;
        } else {
          out += Object.prototype.hasOwnProperty.call(KEYWORDS, t.text) ? KEYWORDS[t.text] : t.text;
        }
        prev = t;
      } else {
        out += t.text;
        if (t.type !== 'ws' && t.type !== 'comment') prev = t;
      }
      i++;
    }
    return out;
  }

  function transpile(source) {
    return translate(tokenize(String(source)));
  }

  // ───────────────────────── جێبەجێکردن ─────────────────────────
  function format(v, nested, depth) {
    depth = depth || 0;
    if (v === null) return 'هیچ';
    if (v === undefined) return 'نەناسراو';
    if (v === true) return 'ڕاست';
    if (v === false) return 'هەڵە';
    if (typeof v === 'string') return nested ? JSON.stringify(v) : v;
    if (typeof v === 'function') return '[کار]';
    if (typeof v !== 'object') return String(v);
    if (depth > 4) return '…';
    if (Array.isArray(v)) return '[' + v.map((x) => format(x, true, depth + 1)).join(', ') + ']';
    const keys = Object.keys(v);
    if (!keys.length) return '{}';
    return '{ ' + keys.map((k) => k + ': ' + format(v[k], true, depth + 1)).join(', ') + ' }';
  }


  // ───────────────────────── کێشان (Canvas) ─────────────────────────
  // فەرمانەکانی کێشان لە کاتی جێبەجێکردندا تۆمار دەکرێن (نەک ڕاستەوخۆ دەکێشرێن)، بۆ ئەوەی
  // لە Web Worker کار بکەن و لە وێبگەڕدا لێیاندرێتەوە (docs/canvas.js).
  const COLOR_NAMES = {
    'سوور': '#ed2024', 'سەوز': '#278e43', 'شین': '#2563eb', 'زەرد': '#febd11', 'نارنجی': '#ff8420',
    'وەنەوشەیی': '#8b5cf6', 'پەمەیی': '#ec4899', 'ڕەش': '#111111', 'سپی': '#ffffff',
    'خۆڵەمێشی': '#9ca3af', 'قاوەیی': '#92400e', 'ئاسمانی': '#38bdf8',
  };
  const GFX_MAX_COMMANDS = 200000;
  const GFX_MAX_FRAMES = 3000;

  class GfxLimit extends Error {}

  function createGfx() {
    const g = {
      width: 500, height: 400, fps: 30, bg: '#ffffff', drawn: false, count: 0,
      frames: [[]], x: 250, y: 200, heading: 0, pen: true,
    };
    g.push = (cmd) => {
      if (++g.count > GFX_MAX_COMMANDS) throw new GfxLimit('LIMIT');
      g.frames[g.frames.length - 1].push(cmd);
      g.drawn = true;
    };
    g.result = () => {
      if (!g.drawn) return null;
      const frames = g.frames.slice();
      while (frames.length > 1 && frames[frames.length - 1].length === 0) frames.pop();
      return { width: g.width, height: g.height, fps: g.fps, frames };
    };
    return g;
  }

  class OutputLimit extends Error {}

  function createBuiltins(print, maxLines, gx) {
    let lines = 0;
    gx = gx || createGfx();
    const num = (v) => {
      const n = Number(v);
      if (v === null || v === undefined || v === '' || !Number.isFinite(n)) {
        throw new TypeError('لە کێشاندا ژمارەیەک پێویستە، بەڵام «' + format(v, true) + '» وەرگیرا.');
      }
      return n;
    };
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
    const color = (c) => {
      if (typeof c !== 'string') throw new TypeError('ڕەنگ دەبێت دەق بێت، بۆ نموونە "سوور" یان "#ff0000". وەرگیرا: «' + format(c, true) + '»');
      return COLOR_NAMES[normalizeWord(c.trim())] || c;
    };
    const move = (d) => {
      const r = (gx.heading * Math.PI) / 180;
      const nx = gx.x + d * Math.sin(r);
      const ny = gx.y - d * Math.cos(r);
      if (gx.pen) gx.push(['line', gx.x, gx.y, nx, ny]);
      gx.x = nx; gx.y = ny;
    };
    const shape = (op, mode, ...a) => gx.push([op, ...a.map(num), mode]);
    return {
      // ── کێشان ──
      'قەبارە': (w, h) => {
        gx.width = clamp(num(w), 50, 1200); gx.height = clamp(num(h), 50, 1200);
        gx.x = gx.width / 2; gx.y = gx.height / 2; gx.heading = 0; gx.drawn = true;
      },
      'پاشبنەمابکە': (c) => { gx.bg = color(c); gx.push(['bg', gx.bg]); },
      'پاککەرەوە': () => gx.push(['bg', gx.bg]),
      'ڕەنگبکە': (c) => gx.push(['fill', color(c)]),
      'هێڵڕەنگبکە': (c) => gx.push(['stroke', color(c)]),
      'ئەستووریبکە': (n) => gx.push(['lw', num(n)]),
      'لاکێش': (x, y, w, h) => shape('rect', 'f', x, y, w, h),
      'لاکێشەهێڵ': (x, y, w, h) => shape('rect', 's', x, y, w, h),
      'بازنە': (x, y, r) => shape('circle', 'f', x, y, r),
      'بازنەهێڵ': (x, y, r) => shape('circle', 's', x, y, r),
      'هێڵ': (a, b, c, d) => gx.push(['line', num(a), num(b), num(c), num(d)]),
      'سێگۆشە': (a, b, c, d, e, f) => shape('tri', 'f', a, b, c, d, e, f),
      'سێگۆشەهێڵ': (a, b, c, d, e, f) => shape('tri', 's', a, b, c, d, e, f),
      'ئەستێرە': (x, y, r, n) => gx.push(['star', num(x), num(y), num(r), n === undefined ? 5 : clamp(Math.round(num(n)), 3, 60), 'f']),
      'ئەستێرەهێڵ': (x, y, r, n) => gx.push(['star', num(x), num(y), num(r), n === undefined ? 5 : clamp(Math.round(num(n)), 3, 60), 's']),
      'خۆر': (x, y, r) => gx.push(['sun', num(x), num(y), num(r)]),
      'نووسین': (t, x, y, size) => gx.push(['text', String(t), num(x), num(y), size === undefined ? 24 : num(size)]),
      // ── قەڵەمی کیسە (Turtle) ──
      'پێشەوە': (n) => move(num(n)),
      'دواوە': (n) => move(-num(n)),
      'بۆچەپ': (d) => { gx.heading -= num(d); },
      'بۆڕاست': (d) => { gx.heading += num(d); },
      'ڕووبکەبۆ': (d) => { gx.heading = num(d); },
      'قەڵەمبەرز': () => { gx.pen = false; },
      'قەڵەمدابنێ': () => { gx.pen = true; },
      'بچۆبۆ': (x, y) => {
        x = num(x); y = num(y);
        if (gx.pen) gx.push(['line', gx.x, gx.y, x, y]);
        gx.x = x; gx.y = y;
      },
      // ── ئەنیمەیشن ──
      'فریم': () => {
        if (gx.frames.length >= GFX_MAX_FRAMES) throw new GfxLimit('LIMIT');
        gx.frames.push([]); gx.drawn = true;
      },
      'خێرایی': (n) => { gx.fps = clamp(num(n), 1, 60); },
      // ── ڕەنگ و بیرکاری ──
      'ڕەنگی': (r, g, b, a) => (a === undefined ? `rgb(${num(r)},${num(g)},${num(b)})` : `rgba(${num(r)},${num(g)},${num(b)},${num(a)})`),
      'پەلکەزێڕینە': (h, a) => `hsla(${((num(h) % 360) + 360) % 360},85%,55%,${a === undefined ? 1 : num(a)})`,
      'سینۆس': Math.sin,
      'کۆسینۆس': Math.cos,
      // ── گشتی ──
      'چاپ': (...args) => {
        if (++lines > maxLines) throw new OutputLimit('LIMIT');
        print(args.map((a) => format(a)).join(' '));
      },
      'هەڕەمەکی': (a, b) => {
        if (b === undefined) { b = a; a = 0; }
        return Math.floor(Math.random() * (b - a + 1)) + a;
      },
      'بکەژمارە': Number,
      'بکەدەق': String,
      'ڕەگ': Math.sqrt,
      'توان': Math.pow,
      'خوارکە': Math.floor,
      'سەرکە': Math.ceil,
      'گردبکە': Math.round,
      'ڕەها': Math.abs,
      'گەورەترین': Math.max,
      'بچووکترین': Math.min,
      'پای': Math.PI,
    };
  }

  function explainError(e) {
    if (e instanceof KodkerError) return e.message;
    if (e instanceof GfxLimit) return 'کێشانەکە زۆر گەورە بوو (زیاتر لە ٢٠٠ هەزار فەرمان یان ٣٠٠٠ فریم) و وەستێنرا.';
    if (e instanceof OutputLimit) return 'دەرچوونەکە زۆر درێژ بوو و وەستێنرا (زیاتر لە ٥٠٠٠ ڕیز).';
    const msg = String((e && e.message) || e);
    let m;
    if (e instanceof ReferenceError) {
      if ((m = msg.match(/^(.+) is not defined/))) return `«${m[1]}» پێناسە نەکراوە. ئایا ناوەکەت ڕاست نووسیوە، یان پێشتر «گۆڕاو» ـت بۆ دروست کردووە؟`;
      if ((m = msg.match(/Cannot access '(.+)' before initialization/))) return `«${m[1]}» پێش ئەوەی پێناسە بکرێت بەکارهاتووە.`;
    }
    if (e instanceof TypeError) {
      if (/Assignment to constant variable/.test(msg)) return 'ناتوانیت نرخی «نەگۆڕ» بگۆڕیت. ئەگەر دەتەوێت بیگۆڕیت، «گۆڕاو» بەکاربهێنە.';
      if ((m = msg.match(/^(.+) is not a function/))) return `«${m[1]}» کار (فەنکشن) نییە و ناتوانرێت بانگ بکرێت.`;
      if ((m = msg.match(/Cannot read propert(?:y|ies) of (undefined|null) \(reading '(.+)'\)/))) {
        return `ناتوانرێت «${m[2]}» بخوێندرێتەوە لە شتێک کە ${m[1] === 'null' ? 'هیچ' : 'نەناسراو'}ە.`;
      }
    }
    if (e instanceof RangeError && /call stack/i.test(msg)) return 'کارەکە بێکۆتایی خۆی بانگ دەکاتەوە (بازنەی بێکۆتایی).';
    if (e instanceof SyntaxError) {
      if ((m = msg.match(/Identifier '(.+)' has already been declared/))) return `«${m[1]}» پێشتر پێناسە کراوە.`;
      return 'هەڵەی ڕێنووس لە کۆدەکەتدا: ' + msg;
    }
    return msg;
  }


  // ───────────────────────── هایلایتکردنی سینتاکس ─────────────────────────
  const CONTROL = new Set(['ئەگەر', 'هەتا', 'بۆ', 'لە', 'تا', 'هەنگاو', 'هەر']);
  const CONSTANTS = new Set(['ڕاست', 'هەڵە', 'هیچ', 'نەناسراو', 'ئەمە']);
  const BUILTIN_NAMES = new Set(Object.keys(createBuiltins(function () {}, 1)));
  const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /**
   * کۆدەکە دەگۆڕێت بۆ HTML ی ڕەنگکراو. دەقە سەرەکییەکە بە تەواوی دەپارێزرێت
   * (بۆ ئەوەی لەسەر textarea دابنرێت بێ جیاوازی لە شوێنی پیتەکان).
   */
  function highlight(source) {
    const tokens = tokenize(String(source));
    let html = '';
    let prev = null;
    let prevPrev = null;
    for (const t of tokens) {
      let cls = '';
      if (t.type === 'comment') cls = 'c';
      else if (t.type === 'str') cls = 's';
      else if (t.type === 'num') cls = 'n';
      else if (t.type === 'word') {
        if (prev && prev.text === '.') cls = Object.prototype.hasOwnProperty.call(PROPS, t.text) ? 'p' : '';
        else if (prev && prev.type === 'word' && (prev.text === 'کار' || prev.text === 'پۆل')) cls = 'd';
        else if (CONSTANTS.has(t.text)) cls = 'v';
        else if (CONTROL.has(t.text) || Object.prototype.hasOwnProperty.call(KEYWORDS, t.text)) cls = 'k';
        else if (BUILTIN_NAMES.has(t.text)) cls = 'f';
      }
      const raw = escapeHtml(t.raw);
      html += cls ? '<span class="t-' + cls + '">' + raw + '</span>' : raw;
      if (t.type !== 'ws' && t.type !== 'comment') { prevPrev = prev; prev = t; }
    }
    return html;
  }

  // ───────────────────────── تەواوکردنی خۆکار ─────────────────────────
  const BUILTIN_INFO = {
    'چاپ': 'console.log', 'هەڕەمەکی': 'random', 'بکەژمارە': 'Number', 'بکەدەق': 'String',
    'ڕەگ': 'sqrt', 'توان': 'pow', 'خوارکە': 'floor', 'سەرکە': 'ceil', 'گردبکە': 'round',
    'ڕەها': 'abs', 'گەورەترین': 'max', 'بچووکترین': 'min', 'پای': 'π',
    'قەبارە': 'canvas size', 'پاشبنەمابکە': 'background', 'پاککەرەوە': 'clear', 'ڕەنگبکە': 'fill color',
    'هێڵڕەنگبکە': 'stroke color', 'ئەستووریبکە': 'line width', 'لاکێش': 'fillRect', 'لاکێشەهێڵ': 'strokeRect',
    'بازنە': 'circle', 'بازنەهێڵ': 'circle outline', 'هێڵ': 'line', 'سێگۆشە': 'triangle', 'سێگۆشەهێڵ': 'triangle outline',
    'ئەستێرە': 'star', 'ئەستێرەهێڵ': 'star outline', 'خۆر': 'sun ☀', 'نووسین': 'text',
    'پێشەوە': 'forward', 'دواوە': 'back', 'بۆچەپ': 'turn left', 'بۆڕاست': 'turn right', 'ڕووبکەبۆ': 'heading',
    'قەڵەمبەرز': 'pen up', 'قەڵەمدابنێ': 'pen down', 'بچۆبۆ': 'goto', 'فریم': 'next frame', 'خێرایی': 'fps',
    'ڕەنگی': 'rgb', 'پەلکەزێڕینە': 'rainbow hsl', 'سینۆس': 'sin', 'کۆسینۆس': 'cos',
  };
  const CONTROL_INFO = {
    'ئەگەر': 'if', 'هەتا': 'while', 'بۆ': 'for', 'لە': 'for … لە', 'تا': 'for … تا', 'هەنگاو': 'for … هەنگاو', 'هەر': 'for … هەر',
  };
  // قاڵبی کۆد: $0 شوێنی نیشانەکەیە. دێڕە نوێیەکان لە ئێدیتەر بە هەمان نزمکردنەوە (indent) دەنووسرێن.
  const SNIPPETS = {
    'ئەگەر': 'ئەگەر $0 {\n  \n}',
    'ئەگەرنا': 'ئەگەرنا {\n  $0\n}',
    'هەتا': 'هەتا $0 {\n  \n}',
    'بۆ': 'بۆ i لە ١ تا $0 {\n  \n}',
    'کار': 'کار $0() {\n  \n}',
    'پۆل': 'پۆل $0 {\n  \n}',
    'تاقیبکەرەوە': 'تاقیبکەرەوە {\n  $0\n} گیرکە (کێشە) {\n  \n}',
  };
  const DECLARES_NAME = new Set(['کار', 'پۆل', 'گۆڕاو', 'نەگۆڕ', 'بۆ', 'هەر']);
  const NON_METHOD_PROPS = new Set(['درێژی']);
  const KIND_ORDER = { kw: 0, fn: 1, prop: 1, var: 2 };
  const MAX_COMPLETIONS = 8;

  /**
   * پێشنیاری تەواوکردنی وشە لە شوێنی نیشانەی نووسین (caret).
   * @param {string} source کۆدەکە
   * @param {number} pos شوێنی caret (ژمارەی پیت)
   * @returns {{from:number,to:number,prefix:string,items:Array<{label:string,kind:string,detail:string,template:string}>}|null}
   */
  function completions(source, pos) {
    source = String(source);
    const tokens = tokenize(source);
    const starts = [];
    let offset = 0;
    for (const t of tokens) { starts.push(offset); offset += t.raw.length; }

    // وشەیەک کە caret لە کۆتاییەکەیەتی (نە لە ناو دەق/کۆمێنت، نە لە ناوەڕاستی وشە)
    let idx = -1;
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].type === 'word' && starts[i] < pos && pos === starts[i] + tokens[i].raw.length) { idx = i; break; }
    }
    if (idx === -1) return null;

    const prefix = tokens[idx].text;
    let prev = null;
    for (let j = idx - 1; j >= 0; j--) {
      if (tokens[j].type !== 'ws' && tokens[j].type !== 'comment') { prev = tokens[j]; break; }
    }
    const member = !!prev && prev.type === 'punct' && prev.text === '.';
    if (prev && prev.type === 'word' && DECLARES_NAME.has(prev.text)) return null; // ناوی نوێ دەنووسرێت

    const items = [];
    const seen = new Set();
    const add = (label, kind, detail, template) => {
      if (seen.has(label) || !label.startsWith(prefix)) return;
      seen.add(label);
      items.push({ label, kind, detail, template: template || label });
    };

    if (member) {
      for (const k of Object.keys(PROPS)) add(k, 'prop', PROPS[k], NON_METHOD_PROPS.has(k) ? k : k + '($0)');
      // ناوی ئەو تایبەتمەندییانەی لە کۆدەکەدا بەکارهاتوون (وەک ئەمە.پانی)
      tokens.forEach((t, i) => {
        if (i === idx || t.type !== 'word') return;
        let q = null;
        for (let j = i - 1; j >= 0; j--) if (tokens[j].type !== 'ws' && tokens[j].type !== 'comment') { q = tokens[j]; break; }
        if (q && q.text === '.' && !Object.prototype.hasOwnProperty.call(PROPS, t.text)) add(t.text, 'var', 'تایبەتمەندی');
      });
    } else {
      for (const k of Object.keys(KEYWORDS)) {
        if (k === 'و') continue; // یەک پیتە و تەنها شڵەژان دروست دەکات
        add(k, 'kw', KEYWORDS[k], SNIPPETS[k]);
      }
      for (const k of Object.keys(CONTROL_INFO)) add(k, 'kw', CONTROL_INFO[k], SNIPPETS[k]);
      for (const k of Object.keys(BUILTIN_INFO)) add(k, 'fn', BUILTIN_INFO[k], k === 'پای' ? k : k + '($0)');
      tokens.forEach((t, i) => {
        if (i === idx || t.type !== 'word') return;
        let q = null;
        for (let j = i - 1; j >= 0; j--) if (tokens[j].type !== 'ws' && tokens[j].type !== 'comment') { q = tokens[j]; break; }
        if (q && q.text === '.') return;
        add(t.text, 'var', 'گۆڕاو');
      });
    }

    let list = items;
    // ئەگەر تەنها یەک پێشنیار هەبێت و هەمان ئەوەی نووسراوە بێت و هیچ قاڵبێکی نەبێت، پێویست نییە
    if (list.length === 1 && list[0].label === prefix && list[0].template === prefix) return null;
    list = list.filter((it) => !(it.kind === 'var' && it.label === prefix));
    if (!list.length) return null;
    list.sort((a, b) => (KIND_ORDER[a.kind] - KIND_ORDER[b.kind]) || (a.label < b.label ? -1 : a.label > b.label ? 1 : 0));
    return { from: starts[idx], to: pos, prefix, items: list.slice(0, MAX_COMPLETIONS) };
  }

  /**
   * کۆدی کوردی جێبەجێ دەکات.
   * @returns {{ok: boolean, js: string|null, error: string|null, gfx: object|null}}
   */
  function run(source, opts) {
    opts = opts || {};
    const print = opts.print || function () {};
    let js;
    try {
      js = transpile(source);
    } catch (e) {
      return { ok: false, js: null, error: explainError(e), gfx: null };
    }
    const gx = createGfx();
    const env = createBuiltins(print, opts.maxLines || 5000, gx);
    const names = Object.keys(env);
    try {
      // کۆدەکە لە ناو فەنکشنێکی ناوەکیدایە تا بتوانرێت ناوی فەنکشنە ئامادەکراوەکان دووبارە بەکاربهێنرێنەوە
      const fn = new Function(...names, '"use strict";\nreturn (function () {\n' + js + '\n})();');
      fn(...names.map((k) => env[k]));
    } catch (e) {
      return { ok: false, js, error: explainError(e), gfx: gx.result() };
    }
    return { ok: true, js, error: null, gfx: gx.result() };
  }

  return { transpile, tokenize, highlight, completions, run, format, KEYWORDS, PROPS, KodkerError, VERSION: '0.1.0' };
});
