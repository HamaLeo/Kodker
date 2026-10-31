// دانانی ئینپووتی یاری (کیبۆرد، ماوس، تەچ) و بازنەی ڕەندەرکردن
// ئەمە لەگەڵ KodkerRunner (worker) و لەگەڵ session ی ناوخۆیی هەردووکیان کار دەکات.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KodkerGame = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ناوی کلیلەکان بۆ کۆدکەر: کوردی + ناوی ئینگلیزی بچووک (arrowleft، a، w ...)
  const KEYMAP = {
    ArrowLeft: 'چەپ', ArrowRight: 'ڕاست', ArrowUp: 'سەرەوە', ArrowDown: 'خوارەوە',
    ' ': 'بۆشایی', Enter: 'ئینتەر', Escape: 'ئێسکەیپ', Shift: 'شیفت', Control: 'کۆنترۆڵ', Tab: 'تاب',
  };
  const GAME_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ']);

  /** @returns {string[]} هەموو ناوە گونجاوەکانی کلیلێک */
  function keyNames(key) {
    const names = [String(key).toLowerCase()];
    if (KEYMAP[key]) names.push(KEYMAP[key]);
    return names;
  }

  /**
   * @param {{canvas: HTMLCanvasElement, player: object, gfx: {width:number,height:number}, fps?: number,
   *          tick: (input:object, cb:(r:object)=>void)=>void, onError?: (msg:string)=>void}} o
   */
  function start(o) {
    const canvas = o.canvas;
    const keys = {};
    const mouse = { x: -1, y: -1, down: false, clicked: false };
    let fps = o.fps || 60;
    let raf = 0, stopped = false, waiting = false, last = 0, frames = 0;

    canvas.tabIndex = 0;
    canvas.style.outline = 'none';
    canvas.style.touchAction = 'none';
    canvas.style.cursor = 'crosshair';
    try { canvas.focus({ preventScroll: true }); } catch (e) { /* ئاسایییە */ }

    const typing = () => {
      const a = document.activeElement;
      return a && (a.tagName === 'TEXTAREA' || a.tagName === 'INPUT' || a.tagName === 'SELECT');
    };
    const active = () => !typing() && (document.activeElement === canvas || canvas.matches(':hover'));

    function onKeyDown(e) {
      if (!active()) return;
      for (const n of keyNames(e.key)) keys[n] = true;
      if (GAME_KEYS.has(e.key)) e.preventDefault();      // پەڕەکە scroll نەکات
    }
    function onKeyUp(e) { for (const n of keyNames(e.key)) delete keys[n]; }
    function blurAll() { for (const k in keys) delete keys[k]; mouse.down = false; }

    function toCanvas(clientX, clientY) {
      const r = canvas.getBoundingClientRect();
      mouse.x = ((clientX - r.left) * o.gfx.width) / r.width;
      mouse.y = ((clientY - r.top) * o.gfx.height) / r.height;
    }
    const onMove = (e) => toCanvas(e.clientX, e.clientY);
    const onDown = (e) => { toCanvas(e.clientX, e.clientY); mouse.down = true; mouse.clicked = true; try { canvas.focus({ preventScroll: true }); } catch (x) { /* */ } };
    const onUp = () => { mouse.down = false; };
    const onLeave = () => { mouse.down = false; };
    const touch = (fn) => (e) => { if (e.touches.length) { e.preventDefault(); fn(e.touches[0]); } else { mouse.down = false; } };
    const tStart = touch((t) => { toCanvas(t.clientX, t.clientY); mouse.down = true; mouse.clicked = true; });
    const tMove = touch((t) => toCanvas(t.clientX, t.clientY));

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', blurAll);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onLeave);
    canvas.addEventListener('touchstart', tStart, { passive: false });
    canvas.addEventListener('touchmove', tMove, { passive: false });
    canvas.addEventListener('touchend', () => { mouse.down = false; });

    function snapshot() {
      const s = { keys: Object.assign({}, keys), mx: mouse.x, my: mouse.y, down: mouse.down, clicked: mouse.clicked };
      mouse.clicked = false;          // کلیک تەنها یەک tick دەخایەنێت
      return s;
    }

    function frame(now) {
      if (stopped) return;
      raf = requestAnimationFrame(frame);
      if (waiting) return;
      if (now - last < 1000 / fps - 1) return;
      last = now;
      waiting = true;
      o.tick(snapshot(), (r) => {
        waiting = false;
        if (stopped) return;
        if (!r.ok) { stop(); if (o.onError) o.onError(r.error); return; }
        o.player.draw(r.cmds);
        frames++;
        if (r.fps) fps = r.fps;
      });
    }

    function stop() {
      if (stopped) return;
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', blurAll);
      window.removeEventListener('mouseup', onUp);
      canvas.style.cursor = '';
    }

    raf = requestAnimationFrame(frame);
    return { stop, get frames() { return frames; }, get running() { return !stopped; } };
  }

  /**
   * بۆ وێنە بچووکەکانی گەلەری: یاری بۆ چەند tick دەخوێنێتەوە بە ئینپووتێکی دیاریکراو و دوایین فریم دەکێشێت.
   * @returns {boolean} ئایا یاری بوو
   */
  function preview(Kodker, KodkerCanvas, canvas, src, ticks, inputFor) {
    const r = Kodker.run(src, { print() {} });
    if (!r.gfx) return false;
    const player = KodkerCanvas.mount(canvas);
    player.begin(r.gfx);
    if (r.game) {
      for (let i = 0; i < (ticks || 40); i++) {
        const t = r.game.tick(inputFor ? inputFor(i) : {});
        if (!t.ok) break;
        player.draw(t.cmds);
      }
      return true;
    }
    return false;       // ئەنیمەیشنی ئاسایی: begin() هەموو فریمەکانی کێشا
  }

  return { start, preview, keyNames, KEYMAP };
});
