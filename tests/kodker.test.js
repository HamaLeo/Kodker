const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const K = require('../docs/kodker.js');

function out(src) {
  const lines = [];
  const r = K.run(src, { print: (t) => lines.push(t) });
  return { ...r, lines };
}

test('چاپ و ژمارەی کوردی', () => {
  const r = out('چاپ(١٢ + ٣٫٥)');
  assert.ok(r.ok, r.error);
  assert.deepStrictEqual(r.lines, ['15.5']);
});

test('دەق دەستکاری ناکرێت', () => {
  const r = out('چاپ("ئەگەر و یان ١٢٣")');
  assert.deepStrictEqual(r.lines, ['ئەگەر و یان ١٢٣']);
});

test('کۆمێنت دەستکاری ناکرێت', () => {
  assert.ok(K.transpile('// ئەگەر x { \nچاپ(١)').includes('// ئەگەر x { '));
});

test('ئەگەر بێ کەوانە', () => {
  assert.strictEqual(K.transpile('ئەگەر x > ٥ { }'), 'if (x > 5) { }');
});

test('ئەگەرنا ئەگەر', () => {
  const js = K.transpile('ئەگەر a { } ئەگەرنا ئەگەر b { } ئەگەرنا { }');
  assert.strictEqual(js, 'if (a) { } else if (b) { } else { }');
});

test('بۆ ... لە ... تا', () => {
  const r = out('گۆڕاو s = ٠\nبۆ i لە ١ تا ٤ { s += i }\nچاپ(s)');
  assert.deepStrictEqual(r.lines, ['10']);
});

test('بۆ بە هەنگاوی نەرێنی', () => {
  const r = out('بۆ i لە ٣ تا ١ هەنگاو -١ { چاپ(i) }');
  assert.deepStrictEqual(r.lines, ['3', '2', '1']);
});

test('بۆ هەر', () => {
  const r = out('بۆ هەر x لە [١، ٢، ٣] { چاپ(x * ٢) }');
  assert.deepStrictEqual(r.lines, ['2', '4', '6']);
});

test('بازنەی لەناو بازنە', () => {
  const r = out('گۆڕاو n = ٠\nبۆ i لە ١ تا ٣ { بۆ j لە ١ تا ٣ هەنگاو ٢ { n++ } }\nچاپ(n)');
  assert.deepStrictEqual(r.lines, ['6']);
});

test('هەتا، بشکێنە', () => {
  const r = out('گۆڕاو i = ٠\nهەتا ڕاست { i++\nئەگەر i == ٥ { بشکێنە } }\nچاپ(i)');
  assert.deepStrictEqual(r.lines, ['5']);
});

test('و / یان / نەک', () => {
  const r = out('چاپ(ڕاست و هەڵە، ڕاست یان هەڵە، نەک هەڵە)');
  assert.deepStrictEqual(r.lines, ['هەڵە ڕاست ڕاست']);
});

test('میتۆدی لیست', () => {
  const r = out('نەگۆڕ l = [٣، ١، ٢]\nl.زیادبکە(٠)\nچاپ(l.درێژی، l.ڕیزبکە())');
  assert.deepStrictEqual(r.lines, ['4 [0, 1, 2, 3]']);
});

test('پۆل', () => {
  const r = out('پۆل A { کۆنستراکتەر(x) { ئەمە.x = x } دوو() { گەڕێنەوە ئەمە.x * ٢ } }\nچاپ(نوێ A(٤).دوو())');
  assert.deepStrictEqual(r.lines, ['8']);
});

test('ناوی کوردی بۆ گۆڕاو و ئەگەر لەگەڵ ي/ك عەرەبی', () => {
  const r = out('نەگۆڕ كورد = ١\nچاپ(کورد)');
  assert.ok(r.ok, r.error);
});

test('نیشانە نادیارەکانی RTL دەسڕدرێنەوە', () => {
  const r = out('‏چاپ(‎١)');
  assert.deepStrictEqual(r.lines, ['1']);
});

test('گۆڕاوی هاوناو لەگەڵ فەنکشنی ئامادەکراو ڕێگەپێدراوە', () => {
  const r = out('گۆڕاو گرد = ٣\nچاپ(گرد)');
  assert.ok(r.ok, r.error);
});

test('هەڵەی پێناسە نەکراو بە کوردی', () => {
  const r = out('چاپ(نەزانراو)');
  assert.strictEqual(r.ok, false);
  assert.match(r.error, /پێناسە نەکراوە/);
});

test('هەڵەی نەگۆڕ', () => {
  const r = out('نەگۆڕ a = ١\na = ٢');
  assert.match(r.error, /نەگۆڕ/);
});

test('شێوازی هەڵەی بۆ', () => {
  const r = out('بۆ i لە ١ { }');
  assert.strictEqual(r.ok, false);
  assert.match(r.error, /شێوازی «بۆ»/);
});

test('سنووری دەرچوون', () => {
  const r = K.run('هەتا ڕاست { چاپ(١) }', { print() {}, maxLines: 100 });
  assert.strictEqual(r.ok, false);
  assert.match(r.error, /زۆر درێژ/);
});

test('format', () => {
  assert.strictEqual(K.format([1, 'a', null, true]), '[1, "a", هیچ, ڕاست]');
  assert.strictEqual(K.format({ a: 1 }), '{ a: 1 }');
});

test('هەموو نموونەکان کار دەکەن', () => {
  const dir = path.join(__dirname, '..', 'examples');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.kd'));
  assert.ok(files.length >= 9);
  for (const f of files) {
    const r = out(fs.readFileSync(path.join(dir, f), 'utf8'));
    assert.ok(r.ok, `${f}: ${r.error}`);
    assert.ok(r.lines.length > 0, `${f}: دەرچوونی نییە`);
  }
});

test('docs/examples.js نوێیە', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'docs', 'examples.js'), 'utf8');
  const dir = path.join(__dirname, '..', 'examples');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.kd'))) {
    assert.ok(src.includes(JSON.stringify(fs.readFileSync(path.join(dir, f), 'utf8').trimEnd() + '\n').slice(1, -1)), `${f} لە docs/examples.js نییە، npm run build بکە`);
  }
});

test('هایلایت: دەقەکە بە تەواوی دەپارێزرێت', () => {
  const src = '// کۆمێنت\nئەگەر x > ٥ { چاپ("a<b&c") }‏\nبۆ i لە ١ تا ٣ {}';
  const html = K.highlight(src);
  const plain = html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  assert.strictEqual(plain, src);
  assert.match(html, /<span class="t-k">ئەگەر<\/span>/);
  assert.match(html, /<span class="t-f">چاپ<\/span>/);
  assert.match(html, /<span class="t-s">"a&lt;b&amp;c"<\/span>/);
  assert.match(html, /<span class="t-n">٥<\/span>/);
  assert.match(html, /<span class="t-c">\/\/ کۆمێنت<\/span>/);
});

test('هایلایت: ناوی کار و میتۆد', () => {
  const html = K.highlight('کار کۆ() {}\nل.زیادبکە(١)');
  assert.match(html, /<span class="t-d">کۆ<\/span>/);
  assert.match(html, /<span class="t-p">زیادبکە<\/span>/);
});

test('وانەکان: وەڵامی هەر وانەیەک دەبێت تێپەڕێت', () => {
  const { lessons, check } = require('../docs/lessons.js');
  assert.ok(lessons.length >= 10);
  for (const [i, l] of lessons.entries()) {
    const r = out(l.solution);
    assert.ok(r.ok, `وانە ${i + 1}: ${r.error}`);
    const c = check(l, r.lines, l.solution, K);
    assert.ok(c.ok, `وانە ${i + 1} (${l.title}): ${c.reason} ${JSON.stringify(c.got)}`);
    // کۆدی دەستپێک نابێت خۆی بەخۆی تێپەڕێت
    const s = out(l.starter);
    assert.ok(!check(l, s.lines, l.starter, K).ok, `وانە ${i + 1}: کۆدی دەستپێک پێشتر وەڵامە`);
  }
});

// ── تەواوکردنی خۆکار ──
const labels = (src, pos) => {
  const r = K.completions(src, pos === undefined ? src.length : pos);
  return r ? r.items.map((i) => i.label) : null;
};

test('تەواوکردن: فەنکشنی ئامادەکراو و وشە سەرەکییەکان', () => {
  assert.deepStrictEqual(labels('چا'), ['چاپ']);
  assert.deepStrictEqual(labels('ئە'), ['ئەمە', 'ئەگەر', 'ئەگەرنا']);
});

test('تەواوکردن: ڕیزبەندی (وشە، فەنکشن، گۆڕاو)', () => {
  const l = labels('گۆڕاو چاپکەر = ١\nچا');
  assert.deepStrictEqual(l, ['چاپ', 'چاپکەر']);
});

test('تەواوکردن: میتۆدی دوای خاڵ', () => {
  const r = K.completions('ل.زی', 4);
  assert.deepStrictEqual(r.items.map((i) => [i.label, i.template]), [['زیادبکە', 'زیادبکە($0)']]);
  const d = K.completions('ل.در', 4);
  assert.deepStrictEqual(d.items.map((i) => [i.label, i.template]), [['درێژی', 'درێژی']]);
});

test('تەواوکردن: گۆڕاوەکانی ناو کۆدەکە', () => {
  assert.deepStrictEqual(labels('گۆڕاو ژمارەکان = ١\nژم'), ['ژمارەکان']);
});

test('تەواوکردن: تایبەتمەندییەکانی ئۆبجێکت دوای خاڵ', () => {
  assert.deepStrictEqual(labels('ئەمە.پانی = ١\nئەمە.پا'), ['پاککەرەوە', 'پاڵاوتن', 'پانی']);
});

test('تەواوکردن: نە لە ناو دەق، نە کۆمێنت، نە کاتی ناونانی نوێ', () => {
  assert.strictEqual(labels('چاپ("چا'), null);
  assert.strictEqual(labels('// چا'), null);
  assert.strictEqual(labels('گۆڕاو چا'), null);
  assert.strictEqual(labels('کار چا'), null);
  assert.strictEqual(labels('بۆ چا'), null);
});

test('تەواوکردن: نە لە ناوەڕاستی وشە، نە بێ پێشگر', () => {
  assert.strictEqual(labels('چاپ', 2), null);
  assert.strictEqual(labels(''), null);
  assert.strictEqual(labels('چاپ('), null);
});

test('تەواوکردن: وشەی تەواو و بێ قاڵب پێشنیار نابێت، بەڵام قاڵبەکان دەمێننەوە', () => {
  assert.strictEqual(labels('ل.درێژی'), null);          // میتۆدی بێ قاڵب
  assert.strictEqual(labels('هیچ'), null);               // وشەی بێ قاڵب
  const r = K.completions('بۆ', 2);                      // «بۆ» تەواو نووسراوە، بەڵام قاڵبی هەیە
  assert.deepStrictEqual(r.items.map((i) => i.template), ['بۆ i لە ١ تا $0 {\n  \n}']);
  assert.deepStrictEqual(K.completions('کار', 3).items.map((i) => i.template), ['کار $0() {\n  \n}']);
});

test('تەواوکردن: پیتی عەرەبی (ك) یەکدەخرێت', () => {
  assert.deepStrictEqual(labels('كا'), ['کار']);
});

test('تەواوکردن: قاڵبی ئەگەر و ڕێژەی شوێن', () => {
  const r = K.completions('ئەگە', 4);
  const it = r.items.find((i) => i.label === 'ئەگەر');
  assert.strictEqual(it.template, 'ئەگەر $0 {\n  \n}');
  assert.strictEqual(r.from, 0);
  assert.strictEqual(r.to, 4);
});

test('تەواوکردن: from/to لە ناوەڕاستی کۆد', () => {
  const src = 'چاپ(١)\nهەڕە';
  const r = K.completions(src, src.length);
  assert.strictEqual(r.from, 7);
  assert.strictEqual(src.slice(r.from, r.to), 'هەڕە');
  assert.deepStrictEqual(r.items.map((i) => i.label), ['هەڕەمەکی']);
});

test('تەواوکردن: هەموو قاڵبەکان $0 یان کۆدی دروستن', () => {
  for (const kw of ['ئەگەر', 'ئەگەرنا', 'هەتا', 'بۆ', 'کار', 'پۆل', 'تاقیبکەرەوە']) {
    const r = K.completions(kw.slice(0, -1) + 'X'.repeat(0), kw.length - 1);
    assert.ok(r, kw);
    const it = r.items.find((i) => i.label === kw);
    assert.ok(it && it.template.includes('$0'), kw + ' قاڵبی نییە');
  }
});
