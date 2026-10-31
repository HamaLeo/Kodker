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
  '10-flag': '🎨 ئاڵای کوردستان',
  '11-spiral': '🎨 سپیرالی ڕەنگاوڕەنگ',
  '12-flower': '🎨 گوڵ',
  '13-tree': '🎨 درەخت (Recursion)',
  '14-ball': '🎨 ئەنیمەیشن: تۆپ',
  '15-night': '🎨 ئاسمانی شەو',
  '16-catch': '🎮 بگرە! (یاری)',
  '17-snake': '🎮 مار (یاری)',
  '18-flappy': '🎮 فڵاپی (یاری)',
  '19-breakout': '🎮 بریک‌ئاوت (یاری)',
  '20-clock': '🎨 کاتژمێری زیندوو',
  '21-solar': '🎨 سیستەمی خۆر',
  '22-mandala': '🎨 ماندالا',
  '23-fireworks': '🎆 ئاتەشبازی (کلیک)',
};

// گرووپ: code | art | game  — و وەسف و کۆنترۆڵ بۆ گەلەری سەرەکی
const meta = {
  '16-catch': { group: 'game', desc: 'ئەستێرەکان بگرە و ژیانت بپارێزە.', hint: '← → بجووڵێنە', thumb: 75 },
  '17-snake': { group: 'game', desc: 'ماری قەرەباڵغ: سێو بخۆ و گەورە ببە.', hint: 'تیرەکان', thumb: 45 },
  '18-flappy': { group: 'game', desc: 'لە نێوان بۆڕییەکان تێپەڕە.', hint: 'بۆشایی / کلیک', thumb: 24 },
  '19-breakout': { group: 'game', desc: 'خشتەکان بشکێنە بە تۆپ و پاد.', hint: 'ماوس / ← →', thumb: 40 },
  '20-clock': { group: 'art', desc: 'کاتی ڕاستەقینە بە ئێستا().', hint: '' },
  '21-solar': { group: 'art', desc: 'هەسارەکان بە دەوری خۆر.', hint: '' },
  '22-mandala': { group: 'art', desc: 'شێوەی جوان بە قەڵەمی کیسە.', hint: '' },
  '23-fireworks': { group: 'art', desc: 'کلیک بکە و بیتەقێنە!', hint: 'کلیک' },
  '10-flag': { group: 'art', desc: 'ئاڵای کوردستان.', hint: '' },
  '11-spiral': { group: 'art', desc: 'سپیرالی ڕەنگاوڕەنگ.', hint: '' },
  '12-flower': { group: 'art', desc: 'گوڵ بە بازنە.', hint: '' },
  '13-tree': { group: 'art', desc: 'درەخت بە Recursion.', hint: '' },
  '14-ball': { group: 'art', desc: 'تۆپی دەگەڕێتەوە.', hint: '' },
  '15-night': { group: 'art', desc: 'ئاسمانی شەو.', hint: '' },
};

const dir = path.join(__dirname, '..', 'examples');
const list = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.kd'))
  .sort()
  .map((f) => {
    const id = f.replace(/\.kd$/, '');
    const m = meta[id] || { group: 'code', desc: '', hint: '' };
    return { id, title: titles[id] || id, group: m.group, desc: m.desc, hint: m.hint, thumb: m.thumb, code: fs.readFileSync(path.join(dir, f), 'utf8').trimEnd() + '\n' };
  });

const out = '// ئەم فایلە خۆکارانە دروستکراوە: npm run build\nwindow.KODKER_EXAMPLES = ' + JSON.stringify(list, null, 2) + ';\n';
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'examples.js'), out);
console.log(`${list.length} نموونە نووسرا بۆ docs/examples.js`);
