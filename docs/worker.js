// جێبەجێکردنی کۆد لە ناو Web Worker، بۆ ئەوەی بازنەی بێکۆتایی لاپەڕەکە نەوەستێنێت
importScripts('kodker.js');

onmessage = function (e) {
  const result = Kodker.run(e.data, {
    print: (text) => postMessage({ type: 'out', text }),
  });
  postMessage({ type: 'done', ok: result.ok, js: result.js, error: result.error });
};
