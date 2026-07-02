// Shared constants for GLP-1 pipeline domain logic

export const FOREIGN_COMPANIES = [
  '诺和诺德',
  '礼来',
  '阿斯利康',
  '赛诺菲',
  '勃林格殷格翰',
  '强生',
  '默沙东',
  '葛兰素史克',
  '诺华',
  'Ionis',
  'Alnylam',
  'Altimmune',
  '安进',
  'vTv',
  '百特',
  '辉瑞',
  'Pfizer',
];

export const BIOSIMILAR_COMPANIES = [
  '华东医药',
  '石药',
  '丽珠',
  '九源',
  '正大天晴',
  '联邦',
  '通化东宝',
  '齐鲁',
];

export const STAGE_ORDER = {
  approved: 6,
  nda: 5,
  phase3: 4,
  phase2: 3,
  phase1: 2,
  preclinical: 1,
  discontinued: 0,
  unknown: 0,
};

export const STAGE_ROWS = [
  { key: 'approved', label: '已上市' },
  { key: 'nda', label: 'NDA' },
  { key: 'phase3', label: 'III期' },
  { key: 'phase2', label: 'II期' },
  { key: 'phase1', label: 'I期' },
  { key: 'preclinical', label: '临床前' },
];

export const INDICATION_ALIASES = {
  NASH: 'MASH',
  MASH: 'MASH',
  CKD: 'CKD',
  '慢性肾病': 'CKD',
};

export function normalizeStage(stage) {
  const v = String(stage || '').trim();
  if (!v) return 'unknown';
  if (v.includes('退市') || v.includes('终止')) return 'discontinued';
  if (v.includes('已上市')) return 'approved';
  if (v.includes('NDA') || v.includes('申报')) return 'nda';
  if (/III|Ⅲ|3期/.test(v)) return 'phase3';
  if (/II|Ⅱ|2期/.test(v)) return 'phase2';
  if (/I|Ⅰ|1期/.test(v)) return 'phase1';
  if (v.includes('临床前')) return 'preclinical';
  return 'unknown';
}

export function getStageWeight(stage) {
  return STAGE_ORDER[normalizeStage(stage)] ?? STAGE_ORDER.unknown;
}

export function isApprovedStage(stage) {
  return normalizeStage(stage) === 'approved';
}

export function getStageClass(stage) {
  const n = normalizeStage(stage);
  return `stage-${n === 'unknown' ? 'preclinical' : n}`;
}

export function isChineseCompany(company) {
  if (!company) return false;
  return !FOREIGN_COMPANIES.some((fc) => company.includes(fc));
}

export function getCompanyType(company = '') {
  if (company.includes('诺和诺德') && company.includes('华东')) return 'biosimilar';
  if (BIOSIMILAR_COMPANIES.some((name) => company.includes(name))) return 'biosimilar';
  if (FOREIGN_COMPANIES.some((fc) => company.includes(fc))) return 'international';
  return 'domestic_innovator';
}

export function normalizeIndicationValue(value) {
  return INDICATION_ALIASES[value] || value;
}

export function normalizeIndications(indications) {
  return (indications || []).map(normalizeIndicationValue);
}

export function getLastUpdated(data) {
  return data?.metadata?.last_updated || data?.last_updated || '--';
}

export function getSearchableFields(product) {
  return [
    product.name_cn,
    product.name_en,
    product.company,
    product.company_en,
    product.commercial_name,
    product.code_name,
    ...(product.targets || []),
    ...(product.indications || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function parseApprovalDateValue(value) {
  const text = String(value || '').trim();
  if (!text || text === '-' || text.includes('预计') || text.includes('以后')) return null;
  const match = text.match(/(\d{4})年(?:0?(\d{1,2})月)?/);
  if (!match) return null;
  const year = match[1];
  const month = String(match[2] || '12').padStart(2, '0');
  return Number(`${year}${month}`);
}

export function compareProductsByApprovalDate(a, b, dir) {
  const dateA = parseApprovalDateValue(a.approval_date);
  const dateB = parseApprovalDateValue(b.approval_date);
  if (dateA === null && dateB !== null) return 1;
  if (dateB === null && dateA !== null) return -1;
  if (dateA !== null && dateB !== null) {
    const result = dateA - dateB;
    return dir === 'asc' ? result : -result;
  }
  const fallback = compareValues(a.name_cn, b.name_cn);
  return dir === 'asc' ? fallback : -fallback;
}

export function compareValues(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'zh-CN');
}
