(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const { lessons, chapters, check, legacyToIds, LEGACY_ORDER, LEVELS } = KodkerLessons;

  const PROGRESS_KEY = 'kodker:progress:v2';
  const OLD_PROGRESS_KEY = 'kodker:progress';
  const DRAFT_KEY = (id) => 'kodker:draft:v2:' + id;
  const NAME_KEY = 'kodker:cert-name';

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ئاسایییە */ } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ئاسایییە */ } },
  };

  const kd = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ── پێشکەوتن: ڕاگرتن بە id (و گواستنەوەی وەشانی کۆن کە ژمارەی بەکاردەهێنا) ──
  function loadDone() {
    let ids = store.get(PROGRESS_KEY, null);
    if (ids === null) {
      ids = legacyToIds(store.get(OLD_PROGRESS_KEY, []));
      LEGACY_ORDER.forEach((id, i) => {
        const d = store.get('kodker:draft:' + i, undefined);
        if (d !== undefined && store.get(DRAFT_KEY(id), undefined) === undefined) store.set(DRAFT_KEY(id), d);
      });
      store.set(PROGRESS_KEY, ids);
    }
    return new Set(ids.filter((id) => lessons.some((l) => l.id === id)));
  }

  let done = loadDone();
  let cur = 0;
  let job = null;

  const output = $('output'), cvPane = $('canvas-pane'), msg = $('msg'), status = $('status'), hintbox = $('hintbox');
  const editor = KodkerEditor.create($('editor'), { onRun: () => run() });
  const player = KodkerCanvas.mount($('cv'), {
    onProgress: (i, n) => { $('cv-info').textContent = n > 1 ? 'فریم ' + i + ' / ' + n : ''; },
  });
  $('cv-replay').addEventListener('click', () => player.replay());

  // ── لیستی وانەکان بە بەش ──
  function renderSidebar() {
    const root = $('chapters');
    root.textContent = '';
    chapters.forEach((ch) => {
      const list = lessons.map((l, i) => ({ l, i })).filter((x) => x.l.chapter === ch.id);
      const n = list.filter((x) => done.has(x.l.id)).length;
      const sec = document.createElement('section');
      sec.className = 'chap' + (n === list.length ? ' complete' : '');
      const h = document.createElement('h3');
      h.innerHTML = '<span class="chap-ico">' + ch.icon + '</span><span class="chap-name">' + esc(ch.title) + '</span><span class="chap-count">' + kd(n) + '/' + kd(list.length) + '</span>';
      const ol = document.createElement('ol');
      list.forEach(({ l, i }) => {
        const li = document.createElement('li');
        if (done.has(l.id)) li.className = 'done';
        const b = document.createElement('button');
        if (i === cur) { b.className = 'cur'; b.setAttribute('aria-current', 'true'); }
        const num = document.createElement('span'); num.className = 'num'; num.textContent = done.has(l.id) ? '✓' : kd(i + 1);
        const t = document.createElement('span'); t.className = 'ttl'; t.textContent = l.title;
        b.append(num, t);
        b.addEventListener('click', () => go(i));
        li.appendChild(b);
        ol.appendChild(li);
      });
      sec.append(h, ol);
      root.appendChild(sec);
    });
    const pct = Math.round((done.size / lessons.length) * 100);
    $('bar').style.width = pct + '%';
    $('pbar').setAttribute('aria-valuenow', String(pct));
    $('progtxt').textContent = kd(done.size) + ' لە ' + kd(lessons.length) + ' وانە';
    $('progpct').textContent = kd(pct) + '٪';
    $('cert').hidden = done.size < lessons.length;
  }

  function setMsg(html, cls) { msg.className = 'msg ' + (cls || ''); msg.innerHTML = html; }
  function setStatus(text, cls) { status.textContent = text; status.className = 'status ' + (cls || ''); }

  function indexFromHash() {
    const h = decodeURIComponent(location.hash.replace(/^#/, ''));
    if (!h) return -1;
    const byId = lessons.findIndex((l) => l.id === h);
    if (byId !== -1) return byId;
    if (/^\d+$/.test(h)) {                       // بەستەری کۆن: #٣ = وانەی ٣ی وەشانی کۆن
      const id = LEGACY_ORDER[Number(h) - 1];
      return lessons.findIndex((l) => l.id === id);
    }
    return -1;
  }

  function go(i) {
    if (job) { job.stop(); job = null; }
    cur = Math.max(0, Math.min(lessons.length - 1, i));
    const l = lessons[cur];
    const ch = chapters.find((c) => c.id === l.chapter);
    const chIndex = chapters.indexOf(ch);
    $('crumb').innerHTML = '<span>' + ch.icon + '</span> بەشی ' + kd(chIndex + 1) + ' · ' + esc(ch.title);
    $('title').innerHTML = esc(l.title) + '<small>وانەی ' + kd(cur + 1) + ' لە ' + kd(lessons.length) + '</small>';
    $('chips').innerHTML =
      '<span class="chip">⏱ نزیکەی ' + kd(l.minutes) + ' خولەک</span>' +
      '<span class="chip lvl-' + l.level + '">' + '●'.repeat(l.level) + '○'.repeat(3 - l.level) + ' ' + LEVELS[l.level] + '</span>' +
      (done.has(l.id) ? '<span class="chip ok">✓ تەواو کراوە</span>' : '');
    $('body').innerHTML = l.body;
    $('task').innerHTML = '<b>🎯 ئەرک:</b> ' + l.task;
    // کۆدی نموونەکانی ناو وانە هایلایت بکە
    document.querySelectorAll('#body pre.ex').forEach((p) => { p.innerHTML = Kodker.highlight(p.textContent); });
    editor.setValue(store.get(DRAFT_KEY(l.id), l.starter));
    output.textContent = '';
    player.stop();
    cvPane.hidden = true;
    setStatus('');
    hintbox.hidden = true;
    setMsg(done.has(l.id) ? '✅ ئەم وانەیەت پێشتر تەواو کردووە. دەتوانیت دووبارە تاقی بکەیتەوە یان بچیتە وانەی داهاتوو.' : 'کۆدەکەت بنووسە و «جێبەجێبکە» دابگرە.', done.has(l.id) ? 'ok' : '');
    $('prev').disabled = cur === 0;
    $('next').disabled = !done.has(l.id) || cur === lessons.length - 1;
    history.replaceState(null, '', '#' + l.id);
    document.title = l.title + ' — فێرکاری کۆدکەر';
    renderSidebar();
    window.scrollTo({ top: 0 });
  }

  function recapHtml(l) {
    return '<div class="recap"><b>🔑 بیرت بێت:</b><ul>' + l.recap.map((r) => '<li>' + r + '</li>').join('') + '</ul></div>';
  }

  function run() {
    if (job) job.stop();
    output.textContent = '';
    setStatus('...');
    const src = editor.getValue();
    const l = lessons[cur];
    store.set(DRAFT_KEY(l.id), src);
    const lines = [];
    job = KodkerRunner.run(src, {
      out: (t) => {
        lines.push(t);
        const d = document.createElement('div'); d.textContent = t; output.appendChild(d);
      },
      done: (r) => {
        if (r.gfx) { cvPane.hidden = false; player.play(r.gfx); } else { player.stop(); cvPane.hidden = true; }
        if (!r.ok) {
          const d = document.createElement('div'); d.className = 'err'; d.textContent = '✖ ' + r.error; output.appendChild(d);
          setStatus('هەڵە', 'bad');
          setMsg('✖ هەڵەیەک هەیە: ' + esc(r.error), 'bad');
          return;
        }
        const c = check(l, lines, src, Kodker, r.gfx);
        if (c.ok) {
          setStatus('✓ ڕاستە', 'ok');
          const wasDone = done.has(l.id);
          done.add(l.id);
          store.set(PROGRESS_KEY, [...done]);
          const last = done.size === lessons.length;
          let html = last && !wasDone
            ? '🎉 <b>پیرۆزە! هەموو ' + kd(lessons.length) + ' وانەکەت تەواو کرد!</b> بڕوانامەکەت ئامادەیە: دوگمەی 🏆 لە لایەنی چەپ دابگرە.'
            : '✅ ڕاستە! ' + (cur < lessons.length - 1 ? 'دەتوانیت بچیتە وانەی داهاتوو.' : 'ئەمە دوایین وانە بوو.');
          html += recapHtml(l);
          setMsg(html, 'ok');
          $('next').disabled = cur === lessons.length - 1;
          $('chips').innerHTML = $('chips').innerHTML.replace(/<span class="chip ok">.*?<\/span>/, '') + '<span class="chip ok">✓ تەواو کراوە</span>';
          renderSidebar();
          if (last && !wasDone) openCertificate();
        } else {
          setStatus('هێشتا نا', 'bad');
          let html = '🤔 ' + esc(c.reason);
          if (c.expected) {
            html += '<div class="diff">چاوەڕوان دەکرا:\n' + esc(c.expected.join('\n')) +
              '\n\nتۆ ئەمەت چاپ کرد:\n' + (c.got.length ? esc(c.got.join('\n')) : '(هیچ)') + '</div>';
          }
          setMsg(html, 'bad');
        }
      },
    });
  }

  // ── بڕوانامە ──
  const dlg = $('certdlg'), nameInput = $('cert-name');
  function paintCert() {
    KodkerCertificate.draw($('cert-cv'), { name: nameInput.value, count: lessons.length });
  }
  function openCertificate() {
    nameInput.value = store.get(NAME_KEY, '');
    paintCert();
    // فۆنتی وێب پێش کێشانی Canvas دەبێت بار بکرێت، ئەگینا بڕوانامە بە فۆنتی یەدەگ دەکێشرێت
    if (document.fonts && document.fonts.load) {
      Promise.all(['400', '700', '800'].map((w) => document.fonts.load(w + ' 40px Vazirmatn', 'ئابپ')))
        .then(paintCert).catch(() => {});
    }
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    nameInput.focus();
  }
  nameInput.addEventListener('input', () => { store.set(NAME_KEY, nameInput.value); paintCert(); });
  $('cert').addEventListener('click', openCertificate);
  $('cert-save').addEventListener('click', () => {
    const a = document.createElement('a');
    a.href = $('cert-cv').toDataURL('image/png');
    a.download = 'kodker-certificate.png';
    a.click();
  });

  // ── دوگمەکان ──
  $('run').addEventListener('click', run);
  editor.onChange(() => store.set(DRAFT_KEY(lessons[cur].id), editor.getValue()));
  $('hint').addEventListener('click', () => {
    hintbox.hidden = !hintbox.hidden;
    if (!hintbox.hidden) hintbox.innerHTML = '<b>💡 ئاماژە:</b><pre class="ex">' + Kodker.highlight(lessons[cur].hint) + '</pre>';
  });
  $('reset').addEventListener('click', () => {
    if (confirm('کۆدەکەت دەگەڕێتەوە بۆ دەستپێک. دڵنیایت؟')) { editor.setValue(lessons[cur].starter); store.set(DRAFT_KEY(lessons[cur].id), lessons[cur].starter); }
  });
  $('solution').addEventListener('click', () => {
    if (confirm('وەڵامەکە جێگەی کۆدەکەت دەگرێتەوە. دڵنیایت؟')) { editor.setValue(lessons[cur].solution); store.set(DRAFT_KEY(lessons[cur].id), lessons[cur].solution); }
  });
  $('reset-progress').addEventListener('click', () => {
    if (!confirm('هەموو پێشکەوتنەکەت دەسڕدرێتەوە (کۆدە هەڵگیراوەکان ناسڕدرێنەوە). دڵنیایت؟')) return;
    done = new Set(); store.set(PROGRESS_KEY, []); go(0);
  });
  $('prev').addEventListener('click', () => go(cur - 1));
  $('next').addEventListener('click', () => go(cur + 1));

  window.addEventListener('hashchange', () => {
    const i = indexFromHash();
    if (i !== -1 && i !== cur) go(i);
  });

  const start = indexFromHash();
  const firstTodo = lessons.findIndex((l) => !done.has(l.id));
  go(start !== -1 ? start : (firstTodo === -1 ? 0 : firstTodo));
})();
