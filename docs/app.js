(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const code = $('code'), output = $('output'), jsOut = $('js'), status = $('status'), sel = $('examples');
  const TIMEOUT_MS = 5000;
  const examples = window.KODKER_EXAMPLES || [];

  $('ver').textContent = 'v' + Kodker.VERSION;

  // ── نموونەکان ──
  examples.forEach((ex, i) => {
    const o = document.createElement('option');
    o.value = i; o.textContent = ex.title;
    sel.appendChild(o);
  });
  sel.addEventListener('change', () => { code.value = examples[sel.value].code; run(); });

  // ── بارکردنی کۆد لە URL ──
  function encode(s) {
    const bytes = new TextEncoder().encode(s);
    let bin = ''; bytes.forEach((b) => (bin += String.fromCharCode(b)));
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function decode(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(s);
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  }
  const m = location.hash.match(/^#code=(.+)$/);
  try { code.value = m ? decode(m[1]) : examples[0].code; } catch (e) { code.value = examples[0] ? examples[0].code : ''; }

  // ── دەرچوون ──
  function addLine(text, cls) {
    const span = document.createElement('div');
    if (cls) span.className = cls;
    span.textContent = text;
    output.appendChild(span);
  }
  function setStatus(text, cls) { status.textContent = text; status.className = 'status ' + (cls || ''); }

  // ── جێبەجێکردن (لە Worker، بە کاتی سنووردار) ──
  let worker = null, timer = null;
  function stop() { if (worker) { worker.terminate(); worker = null; } clearTimeout(timer); }

  function finish(ok, js, error) {
    stop();
    if (js != null) jsOut.textContent = js;
    if (!ok) { addLine('✖ ' + error, 'err'); setStatus('هەڵە', 'bad'); }
    else { if (!output.childNodes.length) addLine('(هیچ دەرچوونێک نییە)', 'info'); setStatus('✓ تەواو بوو', 'ok'); }
  }

  function runOnMainThread(src) {
    const r = Kodker.run(src, { print: (t) => addLine(t) });
    finish(r.ok, r.js, r.error);
  }

  function run() {
    stop();
    output.textContent = '';
    setStatus('...');
    const src = code.value;
    try {
      worker = new Worker('worker.js');
    } catch (e) {
      return runOnMainThread(src); // نموونە: کاتێک لە file:// دەکرێتەوە
    }
    worker.onmessage = (ev) => {
      const d = ev.data;
      if (d.type === 'out') addLine(d.text);
      else if (d.type === 'done') finish(d.ok, d.js, d.error);
    };
    worker.onerror = () => { stop(); runOnMainThread(src); };
    timer = setTimeout(() => {
      stop();
      addLine('✖ کۆدەکەت زیاتر لە ٥ چرکەی خایاند و وەستێنرا. لەوانەیە بازنەی بێکۆتایی هەبێت.', 'err');
      setStatus('کاتی تەواو بوو', 'bad');
    }, TIMEOUT_MS);
    worker.postMessage(src);
    try { jsOut.textContent = Kodker.transpile(src); } catch (e) { jsOut.textContent = '// ' + e.message; }
  }

  $('run').addEventListener('click', run);
  code.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
    else if (e.key === 'Tab') {
      e.preventDefault();
      const s = code.selectionStart;
      code.setRangeText('  ', s, code.selectionEnd, 'end');
    }
  });

  $('share').addEventListener('click', async () => {
    const url = location.origin + location.pathname + '#code=' + encode(code.value);
    history.replaceState(null, '', url);
    try { await navigator.clipboard.writeText(url); setStatus('✓ بەستەر کۆپی کرا', 'ok'); }
    catch (e) { setStatus('بەستەر لە ناونیشانەکە دایە', 'ok'); }
  });

  // ── تابەکان ──
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === b));
    output.hidden = b.dataset.tab !== 'output';
    jsOut.hidden = b.dataset.tab !== 'js';
  }));

  // ── ڕێنمایی ──
  const guide = [
    ['گۆڕاو و نەگۆڕ', [['گۆڕاو x = ٥', 'let'], ['نەگۆڕ ناو = "هەژار"', 'const'], ['ڕاست · هەڵە · هیچ', 'true · false · null']]],
    ['چاپکردن', [['چاپ("سڵاو", ناو)', 'console.log']]],
    ['مەرج', [['ئەگەر x > ٥ { }', 'if'], ['ئەگەرنا ئەگەر ... { }', 'else if'], ['ئەگەرنا { }', 'else'], ['و · یان · نەک', '&& · || · !']]],
    ['بازنە', [['بۆ i لە ١ تا ١٠ { }', 'for'], ['... هەنگاو ٢', 'step'], ['بۆ هەر x لە لیست { }', 'for…of'], ['هەتا ڕاست { }', 'while'], ['بشکێنە · بەردەوامبە', 'break · continue']]],
    ['کار (فەنکشن)', [['کار کۆ(a, b) { }', 'function'], ['گەڕێنەوە a + b', 'return'], ['(a) => a * ٢', 'arrow']]],
    ['لیست', [['ل.درێژی', 'length'], ['ل.زیادبکە(x)', 'push'], ['ل.نەخشە(f)', 'map'], ['ل.پاڵاوتن(f)', 'filter'], ['ل.کۆکردنەوە(f, ٠)', 'reduce'], ['ل.ڕیزبکە()', 'sort']]],
    ['پۆل', [['پۆل ئاژەڵ { }', 'class'], ['کۆنستراکتەر() { }', 'constructor'], ['نوێ ئاژەڵ()', 'new'], ['ئەمە.ناو', 'this']]],
    ['هەڵە', [['تاقیبکەرەوە { }', 'try'], ['گیرکە (کێشە) { }', 'catch'], ['فڕێبدە نوێ Error("..")', 'throw']]],
    ['بیرکاری', [['ڕەگ(x) · توان(a, b)', 'sqrt · pow'], ['خوارکە · سەرکە · گردبکە', 'floor · ceil · round'], ['هەڕەمەکی(١, ١٠٠)', 'random int'], ['بکەژمارە(x) · بکەدەق(x)', 'Number · String']]],
  ];
  const cards = $('cards');
  guide.forEach(([title, rows]) => {
    const c = document.createElement('div'); c.className = 'card';
    const h = document.createElement('h3'); h.textContent = title; c.appendChild(h);
    const t = document.createElement('table');
    rows.forEach(([k, js]) => {
      const tr = document.createElement('tr');
      const a = document.createElement('td'); a.textContent = k;
      const b = document.createElement('td'); b.className = 'js'; b.textContent = js;
      tr.append(a, b); t.appendChild(tr);
    });
    c.appendChild(t); cards.appendChild(c);
  });

  run();
})();
