const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.goto('file://' + process.cwd() + '/index.html');
  await page.waitForTimeout(1000);

  console.log('Filter count:', await page.innerText('#filterCount'));

  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'fixed_header_scroll.png' });

  // Check top position of a header cell
  const headerTop = await page.evaluate(() => {
    const th = document.querySelector('th');
    return th.getBoundingClientRect().top;
  });
  console.log('Header top position after scroll:', headerTop);

  await browser.close();
})();
