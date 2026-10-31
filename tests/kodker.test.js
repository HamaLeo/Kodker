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
