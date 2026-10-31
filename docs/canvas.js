// لێدانەوەی ئەو فەرمانانەی کۆدکەر تۆماری کردوون بۆ سەر <canvas>
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KodkerCanvas = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const FONT = '"Noto Naskh Arabic","Segoe UI",Tahoma,sans-serif';
  const SUN_RAYS = 21; // ژمارەی تیشکەکانی خۆری ئاڵای کوردستان

  function defaults(ctx, w, h) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#111111';
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
  }

  function paint(ctx, mode) {
    if (mode === 's') ctx.stroke(); else ctx.fill();
  }

  // یەک فەرمان لەسەر ctx جێبەجێ دەکات
  function apply(ctx, c, W, H) {
    switch (c[0]) {
      case 'bg': ctx.save(); ctx.fillStyle = c[1]; ctx.fillRect(0, 0, W, H); ctx.restore(); break;
      case 'fill': ctx.fillStyle = c[1]; break;
      case 'stroke': ctx.strokeStyle = c[1]; break;
      case 'lw': ctx.lineWidth = c[1]; break;
      case 'rect': if (c[5] === 's') ctx.strokeRect(c[1], c[2], c[3], c[4]); else ctx.fillRect(c[1], c[2], c[3], c[4]); break;
      case 'circle': ctx.beginPath(); ctx.arc(c[1], c[2], Math.max(0, c[3]), 0, Math.PI * 2); paint(ctx, c[4]); break;
      case 'line': ctx.beginPath(); ctx.moveTo(c[1], c[2]); ctx.lineTo(c[3], c[4]); ctx.stroke(); break;
      case 'tri':
        ctx.beginPath(); ctx.moveTo(c[1], c[2]); ctx.lineTo(c[3], c[4]); ctx.lineTo(c[5], c[6]); ctx.closePath(); paint(ctx, c[7]);
        break;
      case 'star': {
        const [, x, y, r, n, mode] = c;
        ctx.beginPath();
        for (let i = 0; i < n * 2; i++) {
          const rad = i % 2 === 0 ? r : r * (n === 5 ? 0.382 : 0.45);
          const a = -Math.PI / 2 + (i * Math.PI) / n;
          if (i === 0) ctx.moveTo(x + rad * Math.cos(a), y + rad * Math.sin(a));
          else ctx.lineTo(x + rad * Math.cos(a), y + rad * Math.sin(a));
        }
        ctx.closePath(); paint(ctx, mode);
        break;
      }
      case 'sun': {
        // خۆری ئاڵای کوردستان: بازنە + ٢١ تیشک
        const [, x, y, r] = c;
        const inner = r * 1.15, outer = r * 2, half = 0.0944;
        ctx.beginPath();
        for (let i = 0; i < SUN_RAYS; i++) {
          const t = (i * 2 * Math.PI) / SUN_RAYS - Math.PI / 2;
          ctx.moveTo(x + inner * Math.cos(t - half), y + inner * Math.sin(t - half));
          ctx.lineTo(x + outer * Math.cos(t), y + outer * Math.sin(t));
          ctx.lineTo(x + inner * Math.cos(t + half), y + inner * Math.sin(t + half));
          ctx.closePath();
        }
        ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'text': ctx.font = c[4] + 'px ' + FONT; ctx.fillText(c[1], c[2], c[3]); break;
      default: break;
    }
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @returns {{play:(gfx:object, onEnd?:Function)=>void, stop:()=>void, png:()=>string, replay:()=>void}}
   */
  function mount(canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    let raf = 0, token = 0, current = null;

    function setup(gfx) {
      const dpr = Math.min((typeof window !== 'undefined' && window.devicePixelRatio) || 1, 2);
      canvas.width = Math.round(gfx.width * dpr);
      canvas.height = Math.round(gfx.height * dpr);
      canvas.style.width = '100%';
      canvas.style.maxWidth = gfx.width + 'px';
      canvas.style.height = 'auto';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      defaults(ctx, gfx.width, gfx.height);
    }

    function stop() {
      token++;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    function play(gfx) {
      stop();
      current = gfx;
      setup(gfx);
      const my = token;
      const frames = gfx.frames;
      const drawFrame = (i) => frames[i].forEach((c) => apply(ctx, c, gfx.width, gfx.height));
      const info = (i) => opts.onProgress && opts.onProgress(i, frames.length);
      if (frames.length <= 1) {
        if (frames[0]) drawFrame(0);
        info(frames.length);
        return;
      }
      const interval = 1000 / gfx.fps;
      let i = 0;
      let last = null;
      function tick(now) {
        if (my !== token) return;
        if (last === null) last = now - interval;       // یەکەم فریم دەستبەجێ
        const behind = Math.floor((now - last) / interval);
        const steps = Math.min(4, behind);
        for (let s = 0; s < steps && i < frames.length; s++) { drawFrame(i++); last += interval; }
        if (behind > 4) last = now;                      // دوای وەستانی تاب (throttle) دووبارە ڕێکبخەرەوە
        info(i);
        raf = i < frames.length ? requestAnimationFrame(tick) : 0;
      }
      raf = requestAnimationFrame(tick);
    }

    return {
      play,
      stop,
      replay: () => { if (current) play(current); },
      png: () => canvas.toDataURL('image/png'),
    };
  }

  return { mount, apply, defaults };
});
