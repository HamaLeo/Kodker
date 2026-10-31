// جێبەجێکردنی کۆد لە Web Worker بە کاتی سنووردار؛ ئەگەر Worker نەبوو لە thread ی سەرەکی.
// بۆ یاری: دوای «done» ی interactive، worker دەمێنێتەوە و handle.tick(input, cb) هەر فریمێک دەخوازێت.
(function () {
  'use strict';
  const TIMEOUT_MS = 5000;     // کاتی ئامادەکردنی کۆد (پێش دەستپێکی یاری)
  const TICK_TIMEOUT_MS = 3000; // کاتی یەک فریمی یاری

  /**
   * @param {string} src
   * @param {{out:(text:string)=>void, done:(r:object)=>void}} cb
   * @returns {{stop:()=>void, tick:(input:object, onFrame:(r:object)=>void)=>void}}
   */
  function run(src, cb) {
    let worker = null, timer = null, tickTimer = null, finished = false, localGame = null, stopped = false;
    let pendingFrame = null;

    function stop() {
      stopped = true;
      if (worker) { worker.terminate(); worker = null; }
      clearTimeout(timer); clearTimeout(tickTimer);
    }
    function end(r) {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (!r.interactive) stop();     // یاری worker ی خۆی دەهێڵێتەوە
      cb.done(r);
    }
    const handle = {
      stop,
      tick(input, onFrame) {
        if (stopped) return;
        if (localGame) { onFrame(localGame.tick(input)); return; }
        if (!worker) return;
        pendingFrame = onFrame;
        clearTimeout(tickTimer);
        tickTimer = setTimeout(() => {
          stop();
          onFrame({ ok: false, timedOut: true, error: 'یارییەکە وەڵامی نەدایەوە لە ٣ چرکەدا. لەوانەیە بازنەی بێکۆتایی هەبێت.', cmds: [] });
        }, TICK_TIMEOUT_MS);
        worker.postMessage({ type: 'tick', input });
      },
    };

    function mainThread() {
      const r = Kodker.run(src, { print: cb.out });
      localGame = r.game || null;
      end({ ok: r.ok, js: r.js, error: r.error, gfx: r.gfx, interactive: !!localGame, fps: localGame ? localGame.fps : undefined, timedOut: false });
    }

    try {
      worker = new Worker('worker.js');
    } catch (e) {
      mainThread();
      return handle;
    }
    worker.onmessage = (ev) => {
      const d = ev.data;
      if (d.type === 'out') { if (!stopped) cb.out(d.text); }
      else if (d.type === 'done') end({ ok: d.ok, js: d.js, error: d.error, gfx: d.gfx, interactive: !!d.interactive, fps: d.fps, timedOut: false });
      else if (d.type === 'frame') {
        clearTimeout(tickTimer);
        if (pendingFrame) { const f = pendingFrame; pendingFrame = null; f(d); }
      }
    };
    worker.onerror = () => { stop(); if (!finished) mainThread(); };
    timer = setTimeout(() => {
      end({ ok: false, js: null, gfx: null, timedOut: true, interactive: false,
        error: 'کۆدەکەت زیاتر لە ٥ چرکەی خایاند و وەستێنرا. لەوانەیە بازنەی بێکۆتایی هەبێت.' });
    }, TIMEOUT_MS);
    worker.postMessage({ type: 'run', src });
    return handle;
  }

  window.KodkerRunner = { run };
})();
