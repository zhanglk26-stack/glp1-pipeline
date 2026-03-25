const test = require('node:test');
const assert = require('node:assert');
const {
    buildPredictorProducts,
    calculateMatchScore,
    cleanDisplayName,
    inferBrand
} = require('./predictor.js');

test('predictor product builders', async (t) => {
    const profileDefinitions = {
        Tirzepatide: {
            brand: '穆峰达',
            type: 'GLP-1/GIP 双靶点',
            conditionTags: ['obesity', 'diabetes', 'nash'],
            bmiRange: [27, 50],
            pricing: { monthlyOriginal: 2800 },
            weightLossCurve: { week48: 20.2 },
            advantages: ['A'],
            notes: 'N1'
        },
        Semaglutide: {
            brand: '诺和盈',
            type: 'GLP-1 单靶点',
            conditionTags: ['obesity', 'diabetes', 'cvd'],
            bmiRange: [27, 50],
            pricing: { monthlyOriginal: 2400 },
            weightLossCurve: { week48: 15.8 },
            advantages: ['B'],
            notes: 'N2'
        },
        Mazdutide: {
            brand: '信尔美',
            type: 'GLP-1/GCG 双靶点',
            conditionTags: ['obesity', 'diabetes', 'nash'],
            bmiRange: [24, 45],
            pricing: { monthlyOriginal: 2100 },
            weightLossCurve: { week48: 18.6 },
            advantages: ['C'],
            notes: 'N3'
        },
        Liraglutide: {
            brand: '利鲁平/诺和力',
            type: 'GLP-1 单靶点 (日制剂)',
            conditionTags: ['obesity', 'diabetes'],
            bmiRange: [27, 50],
            pricing: { monthlyOriginal: 1600 },
            weightLossCurve: { week48: 10.5 },
            advantages: ['D'],
            notes: 'N4'
        }
    };

    const pipelineProducts = [
        {
            name_en: 'Semaglutide',
            name_cn: '司美格鲁肽（诺和泰）',
            company: '诺和诺德',
            commercial_name: '诺和泰/Ozempic(降糖), 诺和盈/Wegovy(减重)',
            administration: '注射/口服',
            frequency: '天',
            stage: '已上市',
            latest_update: '最新进展A',
            approval_date: '2024年06月(减重)'
        },
        {
            name_en: 'Tirzepatide',
            name_cn: '替尔泊肽（穆峰达）',
            company: '礼来',
            commercial_name: '穆峰达/Mounjaro(降糖), Zepbound(减重)',
            administration: '注射',
            frequency: '周',
            stage: '已上市',
            latest_update: '最新进展B',
            approval_date: '2024年07月(减重)'
        },
        {
            name_en: 'Mazdutide',
            name_cn: '玛仕度肽（信尔美）',
            company: '信达生物/礼来',
            commercial_name: '信尔美',
            administration: '注射',
            frequency: '周',
            stage: '已上市',
            latest_update: '最新进展C',
            approval_date: '2025年06月(肥胖)'
        },
        {
            name_en: 'Liraglutide',
            name_cn: '利拉鲁肽（诺和力）',
            company: '诺和诺德/华东医药',
            commercial_name: '诺和力/Victoza(降糖), Saxenda(减重)',
            administration: '注射',
            frequency: '天',
            stage: '已上市',
            latest_update: '最新进展D',
            approval_date: '2023年07月(减重)'
        }
    ];

    await t.test('should derive predictor products from pipeline data', () => {
        const products = buildPredictorProducts(pipelineProducts, profileDefinitions);

        assert.strictEqual(products.length, 4);
        assert.strictEqual(products[0].name, '替尔泊肽');
        assert.strictEqual(products[1].administration, '注射/口服');
        assert.deepStrictEqual(products[2].conditionTags, ['obesity', 'diabetes', 'nash']);
    });

    await t.test('should clean display names and infer brand from commercial name', () => {
        assert.strictEqual(cleanDisplayName('司美格鲁肽（诺和泰）'), '司美格鲁肽');
        assert.strictEqual(
            inferBrand({ commercial_name: '诺和泰/Ozempic(降糖), 诺和盈/Wegovy(减重)' }, {}),
            '诺和泰/Ozempic(降糖)'
        );
    });
});

test('predictor scoring', async (t) => {
    const product = {
        nameEn: 'Mazdutide',
        conditionTags: ['obesity', 'diabetes', 'nash'],
        bmiRange: [24, 45]
    };

    await t.test('should reward bmi range and matched conditions', () => {
        assert.strictEqual(calculateMatchScore(product, 30, ['diabetes']), 85);
    });

    await t.test('should apply mazdutide nash bonus', () => {
        assert.strictEqual(calculateMatchScore(product, 30, ['nash']), 95);
    });
});
