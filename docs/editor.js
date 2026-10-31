// ئێدیتەری کۆد بە هایلایتکردنی سینتاکس: textarea ی شەفاف لەسەر <pre> ی ڕەنگکراو
(function () {
  'use strict';

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

    function paint() {
      // ڕیزی نوێی کۆتایی بۆ ئەوەی بەرزی دوایین دێڕ لەگەڵ textarea یەک بێت
      pre.innerHTML = Kodker.highlight(ta.value) + '\n';
      sync();
    }
    function sync() {
      pre.scrollTop = ta.scrollTop;
      pre.scrollLeft = ta.scrollLeft;
    }

    ta.addEventListener('input', paint);
    ta.addEventListener('scroll', sync);
    ta.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (opts.onRun) opts.onRun();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand && document.execCommand('insertText', false, '  ') ||
          ta.setRangeText('  ', ta.selectionStart, ta.selectionEnd, 'end');
        paint();
      }
    });

    return {
      textarea: ta,
      getValue: () => ta.value,
      setValue: (v) => { ta.value = v; ta.scrollTop = 0; paint(); },
      onChange: (fn) => ta.addEventListener('input', fn),
      focus: () => ta.focus(),
    };
  }

  window.KodkerEditor = { create };
})();
