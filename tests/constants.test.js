import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeStage, getStageWeight, isApprovedStage, isChineseCompany,
  getStageClass, getLastUpdated, normalizeIndicationValue,
  parseApprovalDateValue, compareProductsByApprovalDate, getCompanyType,
} from '../src/shared/constants.js';

describe('normalizeStage', () => {
  it('returns approved for 已上市', () => assert.equal(normalizeStage('已上市'), 'approved'));
  it('returns nda for NDA', () => assert.equal(normalizeStage('NDA'), 'nda'));
  it('returns phase3 for III期', () => assert.equal(normalizeStage('III期'), 'phase3'));
  it('returns phase2 for II期', () => assert.equal(normalizeStage('II期'), 'phase2'));
  it('returns phase1 for I期', () => assert.equal(normalizeStage('I期'), 'phase1'));
  it('returns preclinical for 临床前', () => assert.equal(normalizeStage('临床前'), 'preclinical'));
  it('returns discontinued for 终止', () => assert.equal(normalizeStage('终止研发'), 'discontinued'));
  it('returns unknown for empty', () => assert.equal(normalizeStage(''), 'unknown'));
  it('returns unknown for null', () => assert.equal(normalizeStage(null), 'unknown'));
});

describe('getStageWeight', () => {
  it('approved has highest weight', () => assert.equal(getStageWeight('已上市'), 6));
  it('preclinical has low weight', () => assert.equal(getStageWeight('临床前'), 1));
});

describe('isApprovedStage', () => {
  it('returns true for 已上市', () => assert.ok(isApprovedStage('已上市')));
  it('returns false for III期', () => assert.ok(!isApprovedStage('III期')));
});

describe('isChineseCompany', () => {
  it('returns true for Chinese company', () => assert.ok(isChineseCompany('信达生物')));
  it('returns false for foreign company', () => assert.ok(!isChineseCompany('诺和诺德')));
  it('returns false for null', () => assert.ok(!isChineseCompany(null)));
});

describe('getStageClass', () => {
  it('returns stage-approved for approved', () => assert.equal(getStageClass('已上市'), 'stage-approved'));
  it('returns stage-nda for NDA', () => assert.equal(getStageClass('NDA'), 'stage-nda'));
});

describe('getLastUpdated', () => {
  it('returns metadata.last_updated', () => assert.equal(getLastUpdated({ metadata: { last_updated: '2026-04-17' } }), '2026-04-17'));
  it('returns -- for missing', () => assert.equal(getLastUpdated({}), '--'));
});

describe('normalizeIndicationValue', () => {
  it('maps NASH to MASH', () => assert.equal(normalizeIndicationValue('NASH'), 'MASH'));
  it('keeps 肥胖', () => assert.equal(normalizeIndicationValue('肥胖'), '肥胖'));
});

describe('parseApprovalDateValue', () => {
  it('parses year and month', () => assert.equal(parseApprovalDateValue('2026年3月'), 202603));
  it('returns null for empty', () => assert.equal(parseApprovalDateValue('-'), null));
  it('returns null for 预计', () => assert.equal(parseApprovalDateValue('预计2027年'), null));
});

describe('compareProductsByApprovalDate', () => {
  it('sorts earlier date first (asc)', () => {
    const a = { approval_date: '2026年3月' };
    const b = { approval_date: '2026年6月' };
    assert.ok(compareProductsByApprovalDate(a, b, 'asc') < 0);
  });
});

describe('getCompanyType', () => {
  it('identifies international', () => assert.equal(getCompanyType('诺和诺德'), 'international'));
  it('identifies biosimilar', () => assert.equal(getCompanyType('华东医药'), 'biosimilar'));
  it('identifies domestic_innovator', () => assert.equal(getCompanyType('信达生物'), 'domestic_innovator'));
});
