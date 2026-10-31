#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const Kodker = require('../docs/kodker.js');

const args = process.argv.slice(2);
const showJs = args.includes('--js');
const file = args.find((a) => !a.startsWith('-'));

if (!file || args.includes('-h') || args.includes('--help')) {
  console.log(`کۆدکەر ${Kodker.VERSION} — پڕۆگرامینگ بە کوردی

بەکارهێنان:
  kodker <فایل.kd>         فایلێکی کۆدکەر جێبەجێ دەکات
  kodker --js <فایل.kd>    تەنها JavaScript ـەکەی نیشان دەدات`);
  process.exit(file ? 0 : 1);
}

let source;
try {
  source = fs.readFileSync(path.resolve(file), 'utf8');
} catch (e) {
  console.error(`نەتوانرا فایلی «${file}» بخوێندرێتەوە.`);
  process.exit(1);
}

if (showJs) {
  try {
    console.log(Kodker.transpile(source));
  } catch (e) {
    console.error('هەڵە: ' + e.message);
    process.exit(1);
  }
} else {
  const r = Kodker.run(source, { print: (t) => console.log(t), maxLines: Infinity });
  if (!r.ok) {
    console.error('هەڵە: ' + r.error);
    process.exit(1);
  }
}
