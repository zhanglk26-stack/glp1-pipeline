const test = require('node:test');
const assert = require('node:assert');
const { isChineseCompany } = require('./app.js');

test('isChineseCompany function', async (t) => {
    await t.test('should return true for Chinese companies', () => {
        assert.strictEqual(isChineseCompany('银诺医药'), true);
        assert.strictEqual(isChineseCompany('恒瑞医药'), true);
        assert.strictEqual(isChineseCompany('博瑞医药'), true);
        assert.strictEqual(isChineseCompany('众生药业'), true);
    });

    await t.test('should return false for foreign companies', () => {
        assert.strictEqual(isChineseCompany('诺和诺德'), false);
        assert.strictEqual(isChineseCompany('礼来'), false);
        assert.strictEqual(isChineseCompany('阿斯利康'), false);
        assert.strictEqual(isChineseCompany('赛诺菲'), false);
    });

    await t.test('should return false if name contains a foreign company name', () => {
        assert.strictEqual(isChineseCompany('信达生物/礼来'), false);
        assert.strictEqual(isChineseCompany('诺和诺德/华东医药'), false);
    });

    await t.test('should return false for empty, null or undefined input', () => {
        assert.strictEqual(isChineseCompany(''), false);
        assert.strictEqual(isChineseCompany(null), false);
        assert.strictEqual(isChineseCompany(undefined), false);
    });
});
