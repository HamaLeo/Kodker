// examples/*.kd  →  docs/examples.js  (بۆ ئەوەی playground ـەکە نموونەکان هەبێت)
const fs = require('fs');
const path = require('path');

const titles = {
  '01-hello': 'سڵاو جیهان',
  '02-fibonacci': 'فیبۆناچی',
  '03-fizzbuzz': 'فیز-بەز',
  '04-primes': 'ژمارە سەرەتاییەکان',
  '05-lists': 'لیست',
  '06-countdown': 'ژماردنەوە بە هەنگاو',
  '07-class': 'پۆل',
  '08-guess': 'گریمانەی ژمارە',
  '09-errors': 'مامەڵە لەگەڵ هەڵە',
};

const dir = path.join(__dirname, '..', 'examples');
const list = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.kd'))
  .sort()
  .map((f) => {
    const id = f.replace(/\.kd$/, '');
    return { id, title: titles[id] || id, code: fs.readFileSync(path.join(dir, f), 'utf8').trimEnd() + '\n' };
  });

const out = '// ئەم فایلە خۆکارانە دروستکراوە: npm run build\nwindow.KODKER_EXAMPLES = ' + JSON.stringify(list, null, 2) + ';\n';
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'examples.js'), out);
console.log(`${list.length} نموونە نووسرا بۆ docs/examples.js`);
