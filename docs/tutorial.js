(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const { lessons, check } = KodkerLessons;
  const PROGRESS_KEY = 'kodker:progress';
  const DRAFT_KEY = (i) => 'kodker:draft:' + i;

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* ئاسایییە */ }
    },
  };

  let done = new Set(store.get(PROGRESS_KEY, []));
  let cur = 0;
  let job = null;

  const output = $('output'), msg = $('msg'), status = $('status'), hintbox = $('hintbox');
  const editor = KodkerEditor.create($('editor'), { onRun: () => run() });

  function renderList() {
    const ol = $('list');
    ol.textContent = '';
    lessons.forEach((l, i) => {
      const li = document.createElement('li');
      if (done.has(i)) li.className = 'done';
      const b = document.createElement('button');
      if (i === cur) b.className = 'cur';
      const n = document.createElement('span'); n.className = 'num'; n.textContent = done.has(i) ? '✓' : String(i + 1);
      const t = document.createElement('span'); t.className = 'ttl'; t.textContent = l.title;
      b.append(n, t);
      b.addEventListener('click', () => go(i));
      li.appendChild(b);
      ol.appendChild(li);
    });
    $('bar').style.width = (done.size / lessons.length * 100) + '%';
  }

  function setMsg(html, cls) { msg.className = 'msg ' + (cls || ''); msg.innerHTML = html; }
  function setStatus(text, cls) { status.textContent = text; status.className = 'status ' + (cls || ''); }
  function escapeHtml(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function go(i) {
    if (job) { job.stop(); job = null; }
    cur = Math.max(0, Math.min(lessons.length - 1, i));
    const l = lessons[cur];
    $('title').innerHTML = escapeHtml(l.title) + '<small>وانەی ' + (cur + 1) + ' لە ' + lessons.length + '</small>';
    $('body').innerHTML = l.body;
    $('task').innerHTML = '<b>🎯 ئەرک:</b> ' + l.task;
    // کۆدی نموونەکانی ناو وانە هایلایت بکە
    document.querySelectorAll('#body pre.ex').forEach((p) => { p.innerHTML = Kodker.highlight(p.textContent); });
    editor.setValue(store.get(DRAFT_KEY(cur), l.starter));
    output.textContent = '';
    setStatus('');
    hintbox.hidden = true;
    setMsg('کۆدەکەت بنووسە و «جێبەجێبکە» دابگرە.');
    $('prev').disabled = cur === 0;
    $('next').disabled = !done.has(cur) || cur === lessons.length - 1;
    history.replaceState(null, '', '#' + (cur + 1));
    renderList();
    window.scrollTo({ top: 0 });
  }

  function run() {
    if (job) job.stop();
    output.textContent = '';
    setStatus('...');
    const src = editor.getValue();
    store.set(DRAFT_KEY(cur), src);
    const lines = [];
    const l = lessons[cur];
    job = KodkerRunner.run(src, {
      out: (t) => {
        lines.push(t);
        const d = document.createElement('div'); d.textContent = t; output.appendChild(d);
      },
      done: (r) => {
        if (!r.ok) {
          const d = document.createElement('div'); d.className = 'err'; d.textContent = '✖ ' + r.error; output.appendChild(d);
          setStatus('هەڵە', 'bad');
          setMsg('✖ هەڵەیەک هەیە: ' + escapeHtml(r.error), 'bad');
          return;
        }
        const c = check(l, lines, src, Kodker);
        if (c.ok) {
          setStatus('✓ ڕاستە', 'ok');
          const last = cur === lessons.length - 1;
          setMsg(last ? '🎉 پیرۆزە! هەموو وانەکانت تەواو کرد. ئێستا دەچیتە Playground و پڕۆژەی خۆت دروست دەکەیت!' : '✅ ڕاستە! دەتوانیت بچیتە وانەی داهاتوو.', 'ok');
          done.add(cur);
          store.set(PROGRESS_KEY, [...done]);
          $('next').disabled = last;
          renderList();
        } else {
          setStatus('هێشتا نا', 'bad');
          let html = '🤔 ' + escapeHtml(c.reason);
          if (c.expected) {
            html += '<div class="diff">چاوەڕوان دەکرا:\n' + escapeHtml(c.expected.join('\n')) +
              '\n\nتۆ ئەمەت چاپ کرد:\n' + (c.got.length ? escapeHtml(c.got.join('\n')) : '(هیچ)') + '</div>';
          }
          setMsg(html, 'bad');
        }
      },
    });
  }

  $('run').addEventListener('click', run);
  editor.onChange(() => store.set(DRAFT_KEY(cur), editor.getValue()));
  $('hint').addEventListener('click', () => {
    hintbox.hidden = !hintbox.hidden;
    if (!hintbox.hidden) hintbox.innerHTML = '<b>💡 ئاماژە:</b><pre class="ex">' + Kodker.highlight(lessons[cur].hint) + '</pre>';
  });
  $('reset').addEventListener('click', () => {
    if (confirm('کۆدەکەت دەگەڕێتەوە بۆ دەستپێک. دڵنیایت؟')) { editor.setValue(lessons[cur].starter); store.set(DRAFT_KEY(cur), lessons[cur].starter); }
  });
  $('solution').addEventListener('click', () => {
    if (confirm('وەڵامەکە جێگەی کۆدەکەت دەگرێتەوە. دڵنیایت؟')) { editor.setValue(lessons[cur].solution); store.set(DRAFT_KEY(cur), lessons[cur].solution); }
  });
  $('prev').addEventListener('click', () => go(cur - 1));
  $('next').addEventListener('click', () => go(cur + 1));

  window.addEventListener('hashchange', () => {
    const h = location.hash.match(/^#(\d+)$/);
    if (h && Number(h[1]) - 1 !== cur) go(Number(h[1]) - 1);
  });

  const m = location.hash.match(/^#(\d+)$/);
  const firstTodo = lessons.findIndex((_, i) => !done.has(i));
  go(m ? Number(m[1]) - 1 : (firstTodo === -1 ? 0 : firstTodo));
})();
