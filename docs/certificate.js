// بڕوانامەی تەواوکردنی فێرکاری: بە Canvas دەکێشرێت (خۆری ٢١ تیشکی کوردستان لە سەرەوە)
(function () {
  'use strict';
  const W = 1400, H = 990;
  const FONT = '"Vazirmatn","Noto Naskh Arabic","Segoe UI",Tahoma,sans-serif';

  const MONTHS = ['کانوونی دووەم', 'شوبات', 'ئازار', 'نیسان', 'ئایار', 'حوزەیران', 'تەمموز', 'ئاب', 'ئەیلوول', 'تشرینی یەکەم', 'تشرینی دووەم', 'کانوونی یەکەم'];

  function toKurdishDigits(s) { return String(s).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]); }

  function draw(canvas, opts) {
    const name = (opts.name || '').trim() || '………………';
    const count = opts.count;
    const dpr = 1;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl';

    // پاشبنەما
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#12183a'); bg.addColorStop(1, '#0a0e1f');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const glow = ctx.createRadialGradient(W / 2, 170, 20, W / 2, 170, 520);
    glow.addColorStop(0, 'rgba(254,189,17,.22)'); glow.addColorStop(1, 'rgba(254,189,17,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

    // چوارچێوە
    const gold = ctx.createLinearGradient(0, 0, W, 0);
    gold.addColorStop(0, '#ffd64d'); gold.addColorStop(1, '#ff8420');
    ctx.strokeStyle = gold; ctx.lineWidth = 6; ctx.strokeRect(36, 36, W - 72, H - 72);
    ctx.strokeStyle = 'rgba(254,189,17,.35)'; ctx.lineWidth = 2; ctx.strokeRect(58, 58, W - 116, H - 116);

    // هێڵی ڕەنگی ئاڵا لە سەرەوە
    const stripes = ['#ed2024', '#ffffff', '#278e43'];
    stripes.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(36 + (i * (W - 72)) / 3, 36, (W - 72) / 3, 12); });

    // خۆر
    const sunGrad = ctx.createLinearGradient(0, 90, 0, 250);
    sunGrad.addColorStop(0, '#ffd64d'); sunGrad.addColorStop(1, '#ff8420');
    ctx.fillStyle = sunGrad;
    KodkerCanvas.apply(ctx, ['sun', W / 2, 175, 42], W, H);
    ctx.fillStyle = '#0e1220';
    ctx.font = '700 46px ' + FONT;
    ctx.fillText('{ }', W / 2, 177);

    // دەق
    ctx.fillStyle = '#ffd64d';
    ctx.font = '800 76px ' + FONT;
    ctx.fillText('بڕوانامەی تەواوکردن', W / 2, 345);

    ctx.fillStyle = '#b3bde0';
    ctx.font = '400 34px ' + FONT;
    ctx.fillText('ئەم بڕوانامەیە پێشکەش دەکرێت بە', W / 2, 440);

    ctx.fillStyle = '#ffffff';
    let size = 96;
    ctx.font = '800 ' + size + 'px ' + FONT;
    while (ctx.measureText(name).width > W - 300 && size > 40) { size -= 4; ctx.font = '800 ' + size + 'px ' + FONT; }
    ctx.fillText(name, W / 2, 570);
    ctx.strokeStyle = 'rgba(254,189,17,.6)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(W / 2 - 360, 640); ctx.lineTo(W / 2 + 360, 640); ctx.stroke();

    ctx.fillStyle = '#d6def5';
    ctx.font = '400 36px ' + FONT;
    ctx.fillText('بۆ تەواوکردنی هەموو ' + toKurdishDigits(count) + ' وانەی فێرکاریی کۆدکەر', W / 2, 722);
    ctx.fillStyle = '#8d99bf';
    ctx.font = '400 30px ' + FONT;
    ctx.fillText('پڕۆگرامینگ بە زمانی کوردی: لە «چاپ» هەتا کێشان و ئەنیمەیشن', W / 2, 778);

    // بەروار و لینک (ناوی مانگەکان بە سۆرانی)
    const date = opts.date || new Date();
    const dateText = toKurdishDigits(date.getDate()) + ' ی ' + MONTHS[date.getMonth()] + '، ' + toKurdishDigits(date.getFullYear());
    ctx.fillStyle = '#b3bde0';
    ctx.font = '400 28px ' + FONT;
    ctx.fillText(dateText, W / 2 - 400, 880);
    ctx.fillStyle = '#ffd64d';
    ctx.font = '700 28px ui-monospace, Menlo, Consolas, monospace';
    ctx.direction = 'ltr';
    ctx.fillText('hamaleo.github.io/kodker', W / 2 + 300, 880);
    ctx.direction = 'rtl';
  }

  window.KodkerCertificate = { draw, W, H };
})();
