// ئێدیتەری کۆد بە هایلایتکردنی سینتاکس و تەواوکردنی خۆکار:
// textarea ی شەفاف لەسەر <pre> ی ڕەنگکراو
(function () {
  'use strict';

  const KIND_LABEL = { kw: 'وشە', fn: 'کار', prop: 'میتۆد', var: 'ناو' };

  function create(container, opts) {
    opts = opts || {};
    container.classList.add('editor');
    container.textContent = '';

    const pre = document.createElement('pre');
    pre.className = 'hl';
    pre.setAttribute('aria-hidden', 'true');
    const ta = document.createElement('textarea');
    ta.spellcheck = false;
    ta.autocapitalize = 'off';
    ta.autocomplete = 'off';
    ta.setAttribute('autocorrect', 'off');
    ta.setAttribute('aria-label', opts.label || 'کۆد');
    ta.dir = 'rtl';
    pre.dir = 'rtl';
    container.append(pre, ta);

    // ── پۆپئەپی تەواوکردن ──
    const useAC = opts.autocomplete !== false;
    const menu = document.createElement('ul');
    menu.className = 'ac';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;
    if (useAC) document.body.appendChild(menu);
    let state = null; // { from, to, items, sel }
    let accepting = false;

    function paint() {
      // ڕیزی نوێی کۆتایی بۆ ئەوەی بەرزی دوایین دێڕ لەگەڵ textarea یەک بێت
      pre.innerHTML = Kodker.highlight(ta.value) + '\n';
      sync();
    }
    function sync() {
      pre.scrollTop = ta.scrollTop;
      pre.scrollLeft = ta.scrollLeft;
    }

    // ڕێکخستنی شوێنی پیتێک لە <pre> بۆ دۆزینەوەی شوێنی پۆپئەپ
    function rectOfChar(index) {
      const walker = document.createTreeWalker(pre, NodeFilter.SHOW_TEXT);
      let n, acc = 0;
      while ((n = walker.nextNode())) {
        const len = n.nodeValue.length;
        if (index < acc + len) {
          const r = document.createRange();
          r.setStart(n, index - acc);
          r.setEnd(n, index - acc + 1);
          return r.getBoundingClientRect();
        }
        acc += len;
      }
      return null;
    }

    function hideMenu() {
      state = null;
      menu.hidden = true;
    }

    function renderMenu() {
      menu.textContent = '';
      state.items.forEach((it, i) => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.className = 'ac-item' + (i === state.sel ? ' sel' : '');
        const badge = document.createElement('span');
        badge.className = 'ac-kind k-' + it.kind;
        badge.textContent = KIND_LABEL[it.kind] || '';
        const label = document.createElement('span');
        label.className = 'ac-label';
        label.textContent = it.label;
        const detail = document.createElement('span');
        detail.className = 'ac-detail';
        detail.textContent = it.detail || '';
        li.append(badge, label, detail);
        // mousedown نەک click، بۆ ئەوەی textarea focus ی لەدەست نەدات
        li.addEventListener('mousedown', (e) => { e.preventDefault(); state.sel = i; accept(); });
        menu.appendChild(li);
      });
      const sel = menu.querySelector('.sel');
      if (sel && sel.scrollIntoView) sel.scrollIntoView({ block: 'nearest' });
    }

    function placeMenu() {
      const r = rectOfChar(state.from);
      if (!r) return hideMenu();
      menu.hidden = false;
      const w = menu.offsetWidth, h = menu.offsetHeight;
      // لێوی ڕاستی پۆپئەپ لەگەڵ سەرەتای وشەکە (RTL)
      let left = r.right - w;
      left = Math.max(8, Math.min(left, window.innerWidth - w - 8));
      let top = r.bottom + 4;
      if (top + h > window.innerHeight - 8) top = Math.max(8, r.top - h - 4);
      menu.style.left = left + 'px';
      menu.style.top = top + 'px';
    }

    function showMenu(res) {
      state = { from: res.from, to: res.to, items: res.items, sel: 0 };
      renderMenu();
      placeMenu();
    }

    function update(inputType) {
      if (!useAC) return;
      // تەنها کاتێک بە دەست دەنووسرێت (نەک paste/undo/drop)
      if (inputType !== 'insertText' && inputType !== 'deleteContentBackward') return hideMenu();
      if (ta.selectionStart !== ta.selectionEnd) return hideMenu();
      const res = Kodker.completions(ta.value, ta.selectionStart);
      if (res) showMenu(res); else hideMenu();
    }

    // قاڵبەکە بگۆڕە بۆ دەق: دێڕە نوێیەکان بە هەمان نزمکردنەوەی دێڕی ئێستا، و $0 = شوێنی نیشانە
    function expand(template, from) {
      const lineStart = ta.value.lastIndexOf('\n', from - 1) + 1;
      const indent = (ta.value.slice(lineStart, from).match(/^[ \t]*/) || [''])[0];
      let text = template.replace(/\n/g, '\n' + indent);
      // ئەگەر دوای وشەکە پێشتر "(" هەیە، دووبارەی مەکەرەوە
      if (/\(\$0\)$/.test(text) && ta.value[ta.selectionEnd] === '(') text = text.replace(/\(\$0\)$/, '$0');
      const caret = text.indexOf('$0');
      return caret === -1 ? { text, caret: text.length } : { text: text.replace('$0', ''), caret };
    }

    function accept() {
      if (!state) return;
      const it = state.items[state.sel];
      const { from, to } = state;
      const { text, caret } = expand(it.template, from);
      hideMenu();
      accepting = true;
      ta.focus();
      ta.setSelectionRange(from, to);
      let ok = false;
      try { ok = document.execCommand && document.execCommand('insertText', false, text); } catch (e) { ok = false; }
      if (!ok) ta.setRangeText(text, from, to, 'end');
      ta.setSelectionRange(from + caret, from + caret);
      accepting = false;
      paint();
      hideMenu();
    }

    ta.addEventListener('input', (e) => {
      paint();
      if (!accepting) update(e.inputType);
    });
    ta.addEventListener('scroll', () => { sync(); hideMenu(); });
    ta.addEventListener('blur', hideMenu);
    ta.addEventListener('mousedown', hideMenu);
    window.addEventListener('resize', hideMenu);

    ta.addEventListener('keydown', (e) => {
      if (state && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'ArrowDown') { e.preventDefault(); state.sel = (state.sel + 1) % state.items.length; renderMenu(); return; }
        if (e.key === 'ArrowUp') { e.preventDefault(); state.sel = (state.sel - 1 + state.items.length) % state.items.length; renderMenu(); return; }
        if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); accept(); return; }
        if (e.key === 'Escape') { e.preventDefault(); hideMenu(); return; }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        hideMenu();
        if (opts.onRun) opts.onRun();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand && document.execCommand('insertText', false, '  ') ||
          ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end');
        paint();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Home' || e.key === 'End') {
        hideMenu();
      }
    });

    return {
      textarea: ta,
      getValue: () => ta.value,
      setValue: (v) => { ta.value = v; ta.scrollTop = 0; hideMenu(); paint(); },
      onChange: (fn) => ta.addEventListener('input', fn),
      focus: () => ta.focus(),
    };
  }

  window.KodkerEditor = { create };
})();
