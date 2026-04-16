const test = require('node:test');
const assert = require('node:assert');
const {
    getLastUpdated,
    isApprovedStage,
    isChineseCompany,
    matchesIndication,
    matchesSearch,
    normalizeStage,
    parseApprovalDateValue
} = require('./app.js');

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
        assert.strictEqual(isChineseCompany('先为达生物/辉瑞'), false);
    });

    await t.test('should return false for empty, null or undefined input', () => {
        assert.strictEqual(isChineseCompany(''), false);
        assert.strictEqual(isChineseCompany(null), false);
        assert.strictEqual(isChineseCompany(undefined), false);
    });
});

test('stage normalization helpers', async (t) => {
    await t.test('should normalize real stage variants correctly', () => {
        assert.strictEqual(normalizeStage('已上市(依苏帕格鲁肽)'), 'approved');
        assert.strictEqual(normalizeStage('NDA审评中'), 'nda');
        assert.strictEqual(normalizeStage('中国申报中'), 'nda');
        assert.strictEqual(normalizeStage('III期临床'), 'phase3');
        assert.strictEqual(normalizeStage('II期完成'), 'phase2');
        assert.strictEqual(normalizeStage('I期临床'), 'phase1');
    });

    await t.test('should treat all approved variants as approved', () => {
        assert.strictEqual(isApprovedStage('已上市'), true);
        assert.strictEqual(isApprovedStage('已上市(依苏帕格鲁肽)'), true);
        assert.strictEqual(isApprovedStage('NDA审评中'), false);
    });
});

test('data helpers', async (t) => {
    await t.test('should read last updated from metadata first', () => {
        assert.strictEqual(
            getLastUpdated({ metadata: { last_updated: '2026-03-10' } }),
            '2026-03-10'
        );
        assert.strictEqual(getLastUpdated({ last_updated: '2026-03-09' }), '2026-03-09');
        assert.strictEqual(getLastUpdated({}), '--');
    });

    await t.test('should parse concrete approval dates and ignore fuzzy dates', () => {
        assert.strictEqual(parseApprovalDateValue('2025年8月5日上市申请获受理'), 202508);
        assert.strictEqual(parseApprovalDateValue('2024年06月(减重)'), 202406);
        assert.strictEqual(parseApprovalDateValue('预计2026年-2027年'), null);
    });
});

test('search and indication filters', async (t) => {
    const product = {
        name_cn: '司美格鲁肽（诺和泰）',
        name_en: 'Semaglutide',
        company: '诺和诺德',
        company_en: 'Novo Nordisk',
        commercial_name: '诺和泰/Ozempic',
        targets: ['GLP-1R', 'GIPR'],
        indications: ['肥胖', 'MASH']
    };

    await t.test('should match search term against targets and english fields', () => {
        assert.strictEqual(matchesSearch(product, 'semaglutide'), true);
        assert.strictEqual(matchesSearch(product, 'glp-1r'), true);
        assert.strictEqual(matchesSearch(product, 'novo nordisk'), true);
        assert.strictEqual(matchesSearch(product, 'tirzepatide'), false);
    });

    await t.test('should treat NASH and MASH as the same indication family', () => {
        assert.strictEqual(matchesIndication(product, ['NASH']), true);
        assert.strictEqual(matchesIndication(product, ['MASH']), true);
        assert.strictEqual(matchesIndication(product, ['CKD']), false);
    });
});
