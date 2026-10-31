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

  class OutputLimit extends Error {}

  function createBuiltins(print, maxLines) {
    let lines = 0;
    return {
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

  /**
   * کۆدی کوردی جێبەجێ دەکات.
   * @returns {{ok: boolean, js: string|null, error: string|null}}
   */
  function run(source, opts) {
    opts = opts || {};
    const print = opts.print || function () {};
    let js;
    try {
      js = transpile(source);
    } catch (e) {
      return { ok: false, js: null, error: explainError(e) };
    }
    const env = createBuiltins(print, opts.maxLines || 5000);
    const names = Object.keys(env);
    try {
      // کۆدەکە لە ناو فەنکشنێکی ناوەکیدایە تا بتوانرێت ناوی فەنکشنە ئامادەکراوەکان دووبارە بەکاربهێنرێنەوە
      const fn = new Function(...names, '"use strict";\nreturn (function () {\n' + js + '\n})();');
      fn(...names.map((k) => env[k]));
    } catch (e) {
      return { ok: false, js, error: explainError(e) };
    }
    return { ok: true, js, error: null };
  }

  return { transpile, tokenize, highlight, run, format, KEYWORDS, PROPS, KodkerError, VERSION: '0.1.0' };
});
