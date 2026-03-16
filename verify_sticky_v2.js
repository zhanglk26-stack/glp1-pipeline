const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Navigate to index.html
  const filePath = 'file://' + path.resolve('index.html');
  await page.goto(filePath);

  // Wait for products to load (they are fetched from local products.json)
  await page.waitForSelector('.product-row');

  // 1. Verify filter count updates
  const initialText = await page.innerText('#filterCount');
  console.log('Initial filter count:', initialText);

  // Click a filter (e.g., 'Apple')
  await page.click('label:has-text("Apple")');
  await page.waitForTimeout(500); // Wait for filter to apply

  const filteredText = await page.innerText('#filterCount');
  console.log('Filtered filter count:', filteredText);

  if (initialText !== filteredText) {
    console.log('SUCCESS: Filter count updated.');
  } else {
    console.log('FAILURE: Filter count did not update.');
  }

  // 2. Verify sticky header
  // Scroll down a bit
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);

  const headerBox = await page.evaluate(() => {
    const th = document.querySelector('thead th');
    const rect = th.getBoundingClientRect();
    return { top: rect.top, height: rect.height };
  });

  console.log('Header bounding box top after scroll:', headerBox.top);

  // The nav bar is 64px high and is sticky top-0.
  // So the header (top-[64px]) should be at 64px from the viewport top.
  if (Math.abs(headerBox.top - 64) < 5) {
    console.log('SUCCESS: Header is sticky at 64px.');
  } else {
    console.log('FAILURE: Header is at', headerBox.top, 'instead of 64px.');
  }

  // 3. Verify filter count is visible (not hidden)
  const isFilterCountVisible = await page.isVisible('#filterCount');
  console.log('Filter count visible:', isFilterCountVisible);

  await browser.close();
})();
