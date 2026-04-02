const test = require('node:test');
const assert = require('node:assert/strict');

const { renderHeader, renderFooter } = require('./site-shell.js');

test('renderHeader highlights the active desktop nav item', () => {
  const header = renderHeader('predictor');

  assert.match(header, /href="\/predictor" class="text-slate-900 hover:text-blue-600 font-semibold transition-colors"/);
  assert.match(header, /href="\/" class="text-slate-600 hover:text-blue-600 font-semibold transition-colors"/);
});

test('renderHeader includes mobile navigation and optional tagline', () => {
  const header = renderHeader('index', '全球GLP-1靶点药物研发进展追踪平台');

  assert.match(header, /id="mobileMenuBtn"/);
  assert.match(header, /全球GLP-1靶点药物研发进展追踪平台/);
});

test('renderFooter renders data footer with last updated placeholder', () => {
  const footer = renderFooter('data');

  assert.match(footer, /id="lastUpdated"/);
  assert.match(footer, /数据最后更新/);
});

test('renderFooter renders simple footer by default', () => {
  const footer = renderFooter();

  assert.match(footer, /All rights reserved/);
  assert.doesNotMatch(footer, /lastUpdated/);
});
