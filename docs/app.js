(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const output = $('output'), jsOut = $('js'), cvPane = $('canvas-pane'), tabCanvas = $('tab-canvas'), status = $('status'), sel = $('examples');
  const examples = window.KODKER_EXAMPLES || [];

  $('ver').textContent = 'v' + Kodker.VERSION;

  // ── نموونەکان ──
  examples.forEach((ex, i) => {
    const o = document.createElement('option');
    o.value = i; o.textContent = ex.title;
    sel.appendChild(o);
  });
  sel.addEventListener('change', () => { editor.setValue(examples[sel.value].code); run(); });

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
  const editor = KodkerEditor.create($('editor'), { onRun: () => run() });
  try { editor.setValue(m ? decode(m[1]) : examples[0].code); } catch (e) { editor.setValue(examples[0] ? examples[0].code : ''); }

  // ── دەرچوون ──
  function addLine(text, cls) {
    const span = document.createElement('div');
    if (cls) span.className = cls;
    span.textContent = text;
    output.appendChild(span);
  }
  function setStatus(text, cls) { status.textContent = text; status.className = 'status ' + (cls || ''); }

  // ── جێبەجێکردن (لە Worker، بە کاتی سنووردار) ──
  let job = null;
  function run() {
    if (job) job.stop();
    output.textContent = '';
    setStatus('...');
    const src = editor.getValue();
    try { jsOut.textContent = Kodker.transpile(src); } catch (e) { jsOut.textContent = '// ' + e.message; }
    job = KodkerRunner.run(src, {
      out: (t) => addLine(t),
      done: (r) => {
        if (r.js != null) jsOut.textContent = r.js;
        // وێنە: ئەگەر کۆدەکە شتێکی کێشا، تابی وێنە نیشان بدە
        if (r.gfx) {
          tabCanvas.hidden = false;
          player.play(r.gfx);
          showTab('canvas');
        } else {
          player.stop();
          tabCanvas.hidden = true;
          if (!cvPane.hidden) showTab('output');
        }
        if (r.timedOut) { addLine('✖ ' + r.error, 'err'); setStatus('کاتی تەواو بوو', 'bad'); }
        else if (!r.ok) { addLine('✖ ' + r.error, 'err'); setStatus('هەڵە', 'bad'); }
        else { if (!output.childNodes.length && !r.gfx) addLine('(هیچ دەرچوونێک نییە)', 'info'); setStatus('✓ تەواو بوو', 'ok'); }
      },
    });
  }

  $('run').addEventListener('click', run);

  $('share').addEventListener('click', async () => {
    const url = location.origin + location.pathname + '#code=' + encode(editor.getValue());
    history.replaceState(null, '', url);
    try { await navigator.clipboard.writeText(url); setStatus('✓ بەستەر کۆپی کرا', 'ok'); }
    catch (e) { setStatus('بەستەر لە ناونیشانەکە دایە', 'ok'); }
  });

  // ── تابەکان ──
  function showTab(name) {
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x.dataset.tab === name));
    output.hidden = name !== 'output';
    jsOut.hidden = name !== 'js';
    cvPane.hidden = name !== 'canvas';
  }
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

  // ── وێنە (Canvas) ──
  const player = KodkerCanvas.mount($('cv'), {
    onProgress: (i, n) => { $('cv-info').textContent = n > 1 ? 'فریم ' + i + ' / ' + n : ''; },
  });
  $('cv-replay').addEventListener('click', () => player.replay());
  $('cv-save').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = player.png(); a.download = 'kodker.png'; a.click();
  });

  // ── ڕێنمایی ──
  const guide = [
    ['گۆڕاو و نەگۆڕ', [['گۆڕاو x = ٥', 'let'], ['نەگۆڕ ناو = "هەژار"', 'const'], ['ڕاست · هەڵە · هیچ', 'true · false · null']]],
    ['چاپکردن', [['چاپ("سڵاو", ناو)', 'console.log'], ['ئەمە // کۆمێنتە', '// comment']]],
    ['مەرج', [['ئەگەر x > ٥ { }', 'if'], ['ئەگەرنا ئەگەر ... { }', 'else if'], ['ئەگەرنا { }', 'else'], ['و · یان · نەک', '&& · || · !']]],
    ['بازنە', [['بۆ i لە ١ تا ١٠ { }', 'for'], ['... هەنگاو ٢', 'step'], ['بۆ هەر x لە لیست { }', 'for…of'], ['هەتا ڕاست { }', 'while'], ['بشکێنە · بەردەوامبە', 'break · continue']]],
    ['کار (فەنکشن)', [['کار کۆ(a, b) { }', 'function'], ['گەڕێنەوە a + b', 'return'], ['(a) => a * ٢', 'arrow']]],
    ['لیست', [['ل.درێژی', 'length'], ['ل.زیادبکە(x)', 'push'], ['ل.نەخشە(f)', 'map'], ['ل.پاڵاوتن(f)', 'filter'], ['ل.کۆکردنەوە(f, ٠)', 'reduce'], ['ل.ڕیزبکە()', 'sort']]],
    ['پۆل', [['پۆل ئاژەڵ { }', 'class'], ['کۆنستراکتەر() { }', 'constructor'], ['نوێ ئاژەڵ()', 'new'], ['ئەمە.ناو', 'this']]],
    ['هەڵە', [['تاقیبکەرەوە { }', 'try'], ['گیرکە (کێشە) { }', 'catch'], ['فڕێبدە نوێ Error("..")', 'throw']]],
    ['کێشان 🎨', [['قەبارە(٤٠٠، ٣٠٠)', 'canvas size'], ['بازنە(x, y, r)', 'circle'], ['لاکێش(x, y, پان, بەرز)', 'rect'], ['هێڵ(x١, y١, x٢, y٢)', 'line'], ['سێگۆشە · ئەستێرە · خۆر', 'triangle · star · sun'], ['نووسین("دەق", x, y)', 'text']]],
    ['ڕەنگ', [['ڕەنگبکە("سوور")', 'fill'], ['هێڵڕەنگبکە("شین")', 'stroke'], ['ئەستووریبکە(٣)', 'line width'], ['پاشبنەمابکە("ڕەش")', 'background'], ['ڕەنگی(٢٥٥، ٠، ٠)', 'rgb'], ['پەلکەزێڕینە(i * ٣٠)', 'rainbow']]],
    ['قەڵەمی کیسە و ئەنیمەیشن', [['پێشەوە(n) · دواوە(n)', 'forward · back'], ['بۆچەپ(d) · بۆڕاست(d)', 'turn'], ['قەڵەمبەرز() · قەڵەمدابنێ()', 'pen up · down'], ['فریم()', 'next frame'], ['خێرایی(٦٠)', 'fps']]],
    ['بیرکاری', [['ڕەگ(x) · توان(a, b)', 'sqrt · pow'], ['خوارکە · سەرکە · گردبکە', 'floor · ceil · round'], ['هەڕەمەکی(١, ١٠٠)', 'random int'], ['سینۆس · کۆسینۆس · پای', 'sin · cos · π'], ['بکەژمارە · بکەدەق', 'Number · String']]],
  ];
  const cards = $('cards');
  guide.forEach(([title, rows]) => {
    const c = document.createElement('div'); c.className = 'card';
    const h = document.createElement('h3'); h.textContent = title; c.appendChild(h);
    rows.forEach(([k, js]) => {
      const r = document.createElement('div'); r.className = 'row';
      const a = document.createElement('code'); a.textContent = k;
      const b = document.createElement('span'); b.className = 'js'; b.textContent = js;
      r.append(a, b); c.appendChild(r);
    });
    cards.appendChild(c);
  });

  // ── نموونەی «چۆن کار دەکات؟» ──
  const demo = [
    'نەگۆڕ میوە = ["سێو"، "مۆز"، "هەنار"]',
    '',
    'بۆ هەر م لە میوە {',
    '  ئەگەر م.درێژی > ٣ {',
    '    چاپ("میوەی درێژ:", م)',
    '  }',
    '}',
  ].join('\n');
  $('demo-kd').innerHTML = Kodker.highlight(demo);
  $('demo-js').textContent = Kodker.transpile(demo);

  // ── ئاڵای کوردستان (پیشاندانی زیندوو) ──
  const flagEx = examples.find((e) => e.id === '10-flag');
  if (flagEx) {
    $('flag-kd').innerHTML = Kodker.highlight(flagEx.code);
    const r = Kodker.run(flagEx.code, { print() {} });
    if (r.gfx) KodkerCanvas.mount($('flag-cv')).play(r.gfx);
    document.querySelector('[data-example="10-flag"]').addEventListener('click', () => {
      const i = examples.findIndex((e) => e.id === '10-flag');
      sel.value = i; editor.setValue(examples[i].code); run();
    });
  }

  run();
})();
