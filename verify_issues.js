const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });

  // Go to the local page
  await page.goto('file://' + process.cwd() + '/index.html');

  // Wait for data to load
  await page.waitForTimeout(1000);

  // Check filter count
  const filterCountBefore = await page.innerText('#filterCount');
  console.log('Filter count before:', filterCountBefore);

  // Apply a filter (e.g., click "已上市")
  await page.click('input[value="已上市"] + span');
  await page.waitForTimeout(500);

  const filterCountAfter = await page.innerText('#filterCount');
  console.log('Filter count after:', filterCountAfter);

  // Take a screenshot of the table area
  await page.screenshot({ path: 'table_header_check.png', fullPage: false });

  // Scroll down and take another screenshot to see if header is sticky
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'table_header_scroll_check.png', fullPage: false });

  await browser.close();
})();
