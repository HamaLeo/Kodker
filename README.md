<div align="center">

# ☀ کۆدکەر · Kodker

**پڕۆگرامینگ بە زمانی کوردی**

زمانێکی پڕۆگرامینگی کراوە (open-source) بە سینتاکسی کوردی (سۆرانی) کە دەگۆڕدرێت بۆ JavaScript.
وێبگەڕەکەت بکەرەوە، کۆد بنووسە و جێبەجێی بکە، بێ دابەزاندن.

[**🚀 Playground**](https://hamaleo.github.io/HamaLeo/) · [**🎓 فێرکاری**](https://hamaleo.github.io/HamaLeo/tutorial.html) · [نموونەکان](examples) · [ڕێنمایی](#-ڕێنمایی-خێرا)

*A Kurdish (Sorani) programming language that compiles to JavaScript, with a zero-install web playground.*

</div>

---

```
// یەکەم پڕۆگرامم بە کوردی
کار فیبۆ(ن) {
  ئەگەر ن < ٢ { گەڕێنەوە ن }
  گەڕێنەوە فیبۆ(ن - ١) + فیبۆ(ن - ٢)
}

بۆ i لە ٠ تا ١٠ {
  چاپ("فیبۆ(" + i + ") =", فیبۆ(i))
}
```

## ✨ تایبەتمەندییەکان

- **سینتاکسی کوردی**: `ئەگەر`، `بۆ`، `هەتا`، `کار`، `چاپ`، `پۆل` ...
- **ژمارەی کوردی/عەرەبی**: `٠١٢٣` و `0123` هەردووکیان کار دەکەن، هەروەها فاریزەی کوردی `،`
- **Playground لە وێبگەڕدا**: بێ دابەزاندن، **هایلایتکردنی سینتاکس**، بەستەری هاوبەشکردن، نموونە ئامادەکراوەکان
- **🎓 فێرکاری ئەنتەراکتیڤ**: ١١ وانە لە «چاپ» هەتا «پۆل»، هەر یەکە بە ئەرک و پشکنینی خۆکار و پێشکەوتن کە هەڵدەگیرێت
- **هەڵەی کوردی**: «`نەزانراو` پێناسە نەکراوە. ئایا ناوەکەت ڕاست نووسیوە؟»
- **ئاسوودە**: بازنەی بێکۆتایی دەوەستێنرێت (Web Worker + کاتی سنووردار)
- **بێ پێویستی بە هیچ پاکێج**: یەک فایلی JavaScript (`docs/kodker.js`)
- **CLI**: `kodker file.kd`

## 🧭 ڕێنمایی خێرا

| کۆدکەر | JavaScript |
|---|---|
| `گۆڕاو x = ٥` | `let x = 5` |
| `نەگۆڕ ناو = "هەژار"` | `const ناو = "هەژار"` |
| `ڕاست` · `هەڵە` · `هیچ` | `true` · `false` · `null` |
| `چاپ(x)` | `console.log(x)` |
| `ئەگەر x > ٥ { }` (کەوانە پێویست نییە) | `if (x > 5) { }` |
| `ئەگەرنا ئەگەر ... { }` / `ئەگەرنا { }` | `else if` / `else` |
| `و` · `یان` · `نەک` | `&&` · `\|\|` · `!` |
| `بۆ i لە ١ تا ١٠ { }` | `for (let i = 1; i <= 10; i++)` |
| `بۆ i لە ١٠ تا ١ هەنگاو -١ { }` | `for` بە هەنگاو |
| `بۆ هەر x لە لیست { }` | `for (let x of list)` |
| `هەتا ڕاست { }` | `while (true) { }` |
| `بشکێنە` · `بەردەوامبە` | `break` · `continue` |
| `کار کۆ(a, b) { گەڕێنەوە a + b }` | `function` / `return` |
| `پۆل` · `کۆنستراکتەر` · `نوێ` · `ئەمە` | `class` · `constructor` · `new` · `this` |
| `تاقیبکەرەوە` · `گیرکە` · `فڕێبدە` | `try` · `catch` · `throw` |
| `هەڵبژێرە` · `حاڵەت` · `بنەڕەت` | `switch` · `case` · `default` |

**لیست و دەق:** `.درێژی` (length) · `.زیادبکە` (push) · `.لابەرە` (pop) · `.نەخشە` (map) · `.پاڵاوتن` (filter) · `.کۆکردنەوە` (reduce) · `.ڕیزبکە` (sort) · `.پێچەوانەبکە` (reverse) · `.بەیەکەوەبنووسە` (join) · `.دابەشبکە` (split) · `.گەورەبکە` · `.بچووکبکە` · `.لەخۆدەگرێت` · `.دۆزینەوە` · `.ببڕە` ...

**بیرکاری:** `ڕەگ` · `توان` · `خوارکە` · `سەرکە` · `گردبکە` · `ڕەها` · `گەورەترین` · `بچووکترین` · `هەڕەمەکی(١, ١٠٠)` · `پای` · `بکەژمارە` · `بکەدەق`

> هەموو وشە سەرەکییەکان لە [`docs/kodker.js`](docs/kodker.js) لە `KEYWORDS` و `PROPS` دایە. دەتوانیت هەر وشەیەک بگۆڕیت یان زیادی بکەیت.

## 💻 بەکارهێنان

### لە وێبگەڕ
بچۆ بۆ **[hamaleo.github.io/HamaLeo](https://hamaleo.github.io/HamaLeo/)** (دوای چالاککردنی GitHub Pages، بڕوانە خوارەوە).

### لە تێرمیناڵ (پێویستی بە Node.js ≥ 18 هەیە)
```bash
git clone https://github.com/HamaLeo/HamaLeo.git
cd HamaLeo
node bin/kodker.js examples/02-fibonacci.kd       # جێبەجێکردن
node bin/kodker.js --js examples/02-fibonacci.kd  # تەنها JavaScript ـەکەی نیشان بدە
```

### وەک کتێبخانە
```js
const Kodker = require('./docs/kodker.js');
Kodker.transpile('چاپ(١ + ٢)');              // ← کۆدی JavaScript دەگەڕێنێتەوە
Kodker.run('چاپ(١ + ٢)', { print: console.log });
```

## 🌐 چالاککردنی Playground (GitHub Pages)
**Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / فۆڵدەری `/docs`**

## 🧪 تێست
```bash
npm test         # تێستەکان
npm run build    # دوای گۆڕینی examples/*.kd، docs/examples.js نوێ دەکاتەوە
```

## 🗺 پلان بۆ داهاتوو
- [ ] ژمارەی ڕیز (line number) لە هەڵەکاندا
- [ ] تەواوکردنی خۆکار (autocomplete) بۆ وشە سەرەکییەکان
- [ ] کێشانی گرافیک (Canvas) بۆ یاری و وێنە
- [ ] ئێکستێنشنی VS Code

## 🤝 بەشداریکردن
هەموو کەس بەخێرهاتووە! وشەی نوێ پێشنیار بکە، نموونە زیاد بکە، یان هەڵە ڕاست بکەرەوە. Issue یان Pull Request بکەرەوە.

## 📜 مۆڵەت
[MIT](LICENSE)

---

## English summary
**Kodker** (کۆدکەر, "coder") lets people write programs using Kurdish (Sorani) keywords. It is a small, dependency-free transpiler to JavaScript with a browser playground (`docs/`), a CLI (`bin/kodker.js`), Kurdish error messages, support for Kurdish/Arabic-Indic digits, and infinite-loop protection via Web Workers.
