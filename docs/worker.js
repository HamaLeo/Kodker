// جێبەجێکردنی کۆد لە ناو Web Worker، بۆ ئەوەی بازنەی بێکۆتایی لاپەڕەکە نەوەستێنێت.
// پەیامەکان: {type:'run', src} ← جێبەجێکردن؛ {type:'tick', input} ← یەک فریمی یاری
importScripts('kodker.js');

let game = null;

onmessage = function (e) {
  let m = e.data;
  if (typeof m === 'string') m = { type: 'run', src: m };   // وەشانی کۆن

  if (m.type === 'run') {
    game = null;
    const result = Kodker.run(m.src, {
      print: (text) => postMessage({ type: 'out', text }),
    });
    game = result.game || null;
    postMessage({
      type: 'done', ok: result.ok, js: result.js, error: result.error, gfx: result.gfx,
      interactive: !!game, fps: game ? game.fps : undefined,
    });
  } else if (m.type === 'tick') {
    if (!game) return;
    const t = game.tick(m.input);
    postMessage({ type: 'frame', ok: t.ok, error: t.error, cmds: t.cmds, fps: game.fps });
  }
};
