const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildTargetDefinitions,
  buildVisualizationProducts,
  getCompanyType,
  normalizeVisualizationStage
} = require('./visualization.js');

test('normalizeVisualizationStage handles real-world stage variants', () => {
  assert.equal(normalizeVisualizationStage('已上市(依苏帕格鲁肽)'), 'approved');
  assert.equal(normalizeVisualizationStage('NDA审评中'), 'nda');
  assert.equal(normalizeVisualizationStage('中国申报中'), 'nda');
  assert.equal(normalizeVisualizationStage('III期临床'), 'phase3');
  assert.equal(normalizeVisualizationStage('临床前'), 'preclinical');
});

test('getCompanyType keeps biosimilar and international buckets stable', () => {
  assert.equal(getCompanyType('礼来'), 'international');
  assert.equal(getCompanyType('诺和诺德/华东医药'), 'biosimilar');
  assert.equal(getCompanyType('信达生物'), 'domestic_innovator');
});

test('buildTargetDefinitions counts known target combinations', () => {
  const definitions = buildTargetDefinitions([
    { targets: ['GLP-1R'] },
    { targets: ['GLP-1R'] },
    { targets: ['GIPR', 'GLP-1R'] }
  ]);

  const singleTarget = definitions.find((definition) => definition.key === 'GLP-1R');
  const dualTarget = definitions.find((definition) => definition.key === 'GIPR,GLP-1R');

  assert.equal(singleTarget.count, 2);
  assert.equal(dualTarget.count, 1);
});

test('buildVisualizationProducts derives stage row and company type', () => {
  const sourceProducts = [
    {
      name_cn: '测试产品',
      company: '礼来',
      stage: '已上市(依苏帕格鲁肽)',
      targets: ['GLP-1R']
    }
  ];
  const definitions = buildTargetDefinitions(sourceProducts);
  const [product] = buildVisualizationProducts(sourceProducts, definitions);

  assert.equal(product.stageLabel, '已上市');
  assert.equal(product.companyType, 'international');
  assert.equal(product.targetKey, 'GLP-1R');
});
