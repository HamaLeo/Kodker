// جێبەجێکردنی کۆد لە Web Worker بە کاتی سنووردار؛ ئەگەر Worker نەبوو لە thread ی سەرەکی
(function () {
  'use strict';
  const TIMEOUT_MS = 5000;

  /**
   * @param {string} src
   * @param {{out:(text:string)=>void, done:(r:{ok:boolean,js:string|null,error:string|null,timedOut:boolean})=>void}} cb
   * @returns {{stop:()=>void}}
   */
  function run(src, cb) {
    let worker = null, timer = null, finished = false;

    function stop() {
      if (worker) { worker.terminate(); worker = null; }
      clearTimeout(timer);
    }
    function end(r) {
      if (finished) return;
      finished = true;
      stop();
      cb.done(r);
    }
    function mainThread() {
      const r = Kodker.run(src, { print: cb.out });
      end({ ok: r.ok, js: r.js, error: r.error, gfx: r.gfx, timedOut: false });
    }

    try {
      worker = new Worker('worker.js');
    } catch (e) {
      mainThread();
      return { stop };
    }
    worker.onmessage = (ev) => {
      const d = ev.data;
      if (d.type === 'out') { if (!finished) cb.out(d.text); }
      else if (d.type === 'done') end({ ok: d.ok, js: d.js, error: d.error, gfx: d.gfx, timedOut: false });
    };
    worker.onerror = () => { stop(); if (!finished) mainThread(); };
    timer = setTimeout(() => {
      end({ ok: false, js: null, gfx: null, timedOut: true,
        error: 'کۆدەکەت زیاتر لە ٥ چرکەی خایاند و وەستێنرا. لەوانەیە بازنەی بێکۆتایی هەبێت.' });
    }, TIMEOUT_MS);
    worker.postMessage(src);
    return { stop: () => { finished = true; stop(); } };
  }

  window.KodkerRunner = { run };
})();
