// docs/og-image.png دروست دەکات لە scripts/og.html (پێویستی بە Playground ی نصب کراو هەیە)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.goto('file://' + path.join(__dirname, 'og.html'));
  await p.waitForTimeout(400);
  await p.screenshot({ path: path.join(__dirname, '..', 'docs', 'og-image.png') });
  await b.close();
  console.log('docs/og-image.png دروست کرا');
})();
