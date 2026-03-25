const FOREIGN_COMPANIES = [
  '诺和诺德',
  '礼来',
  '阿斯利康',
  '赛诺菲',
  '勃林格殷格翰',
  '强生',
  '默沙东',
  '葛兰素史克',
  '诺华',
  '安进',
  'Altimmune'
];

const VIS_CONFIG = {
  margin: { top: 60, right: 40, bottom: 120, left: 100 },
  bubbleMinRadius: 4,
  bubbleMaxRadius: 12,
  colors: {
    international: '#3b82f6',
    domestic_innovator: '#ef4444',
    biosimilar: '#9ca3af',
    oral: { stroke: '#f59e0b', strokeDasharray: '4,2' }
  }
};

const TARGET_DEFINITIONS = [
  { key: 'GLP-1R', label: 'GLP-1R\n单靶点' },
  { key: 'GIPR,GLP-1R', label: 'GLP-1R+GIPR\n双靶点' },
  { key: 'GCGR,GLP-1R', label: 'GLP-1R+GCGR\n双靶点' },
  { key: 'Amylin,GLP-1R', label: 'Amylin+GLP-1R\n复方' },
  { key: 'GCGR,GIPR,GLP-1R', label: 'GIP+GCG\n三靶点' },
  { key: 'FGF21R,GCGR,GLP-1R', label: 'FGF21组合\n特殊' },
  { key: 'GLP-1R,Insulin', label: 'Insulin组合\n复方' }
];

const STAGE_ROWS = [
  { key: 'approved', label: '已上市' },
  { key: 'nda', label: 'NDA' },
  { key: 'phase3', label: 'III期' },
  { key: 'phase2', label: 'II期' },
  { key: 'phase1', label: 'I期' },
  { key: 'preclinical', label: '临床前' }
];

const visualizationState = {
  allData: [],
  currentFilter: 'all',
  targetDefinitions: TARGET_DEFINITIONS.map((definition) => ({ ...definition, count: 0 }))
};

function normalizeVisualizationStage(stage) {
  const value = String(stage || '').trim();

  if (!value) return 'preclinical';
  if (value.includes('已上市')) return 'approved';
  if (value.includes('NDA') || value.includes('申报')) return 'nda';
  if (/III|Ⅲ|3期/.test(value)) return 'phase3';
  if (/II|Ⅱ|2期/.test(value)) return 'phase2';
  if (/I|Ⅰ|1期/.test(value)) return 'phase1';
  if (value.includes('临床前')) return 'preclinical';

  return 'preclinical';
}

function getStageRowLabel(stage) {
  const bucket = normalizeVisualizationStage(stage);
  return STAGE_ROWS.find((row) => row.key === bucket)?.label || '临床前';
}

function getStageClass(stage) {
  const bucket = normalizeVisualizationStage(stage);

  if (bucket === 'approved') return 'stage-approved';
  if (bucket === 'nda') return 'stage-nda';
  if (bucket === 'phase3') return 'stage-phase3';
  if (bucket === 'phase2') return 'stage-phase2';
  if (bucket === 'phase1') return 'stage-phase1';
  return 'stage-preclinical';
}

function getCompanyType(company = '') {
  if (company.includes('诺和诺德') && company.includes('华东')) {
    return 'biosimilar';
  }

  if (
    ['华东医药', '石药', '丽珠', '九源', '正大天晴', '联邦', '通化东宝', '齐鲁'].some(
      (name) => company.includes(name)
    )
  ) {
    return 'biosimilar';
  }

  if (FOREIGN_COMPANIES.some((foreignCompany) => company.includes(foreignCompany))) {
    return 'international';
  }

  return 'domestic_innovator';
}

function getColor(companyType) {
  return VIS_CONFIG.colors[companyType] || VIS_CONFIG.colors.biosimilar;
}

function buildTargetDefinitions(products) {
  const counts = {};
  for (const product of products) {
    const key = (product.targets || []).slice().sort().join(',');
    counts[key] = (counts[key] || 0) + 1;
  }

  const knownKeys = new Set(TARGET_DEFINITIONS.map((definition) => definition.key));
  const dynamicDefinitions = Object.keys(counts)
    .filter((key) => key && !knownKeys.has(key))
    .sort()
    .map((key) => ({
      key,
      label: `${key.replaceAll(',', ' + ')}\n其他`
    }));

  return [...TARGET_DEFINITIONS, ...dynamicDefinitions].map((definition) => ({
    ...definition,
    count: counts[definition.key] || 0
  }));
}

function buildVisualizationProducts(products, targetDefinitions) {
  const targetIndexMap = new Map(
    targetDefinitions.map((definition, index) => [definition.key, index])
  );

  return products.map((product) => {
    const targetKey = (product.targets || []).slice().sort().join(',');
    const stageLabel = getStageRowLabel(product.stage);
    const stageIndex = STAGE_ROWS.findIndex((row) => row.label === stageLabel);

    return {
      ...product,
      targetKey,
      companyType: getCompanyType(product.company),
      stageLabel,
      stageIndex: stageIndex === -1 ? STAGE_ROWS.length - 1 : stageIndex,
      targetIndex: targetIndexMap.get(targetKey) ?? targetDefinitions.length - 1
    };
  });
}

function setVisualizationError(message) {
  const container = document.getElementById('viz-container');
  if (!container) return;

  container.innerHTML = `<div class="min-h-[320px] flex items-center justify-center rounded-2xl bg-slate-50 text-sm text-red-500">${message}</div>`;
}

function getFilteredData() {
  if (visualizationState.currentFilter === 'all') {
    return visualizationState.allData;
  }

  return visualizationState.allData.filter(
    (product) => product.companyType === visualizationState.currentFilter
  );
}

async function loadVisualizationData() {
  try {
    const response = await fetch('data/pipeline.json');
    const data = await response.json();
    const products = data.products || [];

    visualizationState.targetDefinitions = buildTargetDefinitions(products);
    visualizationState.allData = buildVisualizationProducts(
      products,
      visualizationState.targetDefinitions
    );

    updateVisualizationStats();
    renderVisualizationChart();
  } catch (error) {
    console.error('Failed to load visualization data:', error);
    setVisualizationError('可视化数据加载失败，请刷新页面后重试。');
  }
}

function updateVisualizationStats() {
  const filteredData = getFilteredData();
  const marketReadyCount = filteredData.filter((product) => {
    const stage = normalizeVisualizationStage(product.stage);
    return stage === 'approved' || stage === 'nda';
  }).length;
  const multiTargetCount = filteredData.filter((product) => (product.targets || []).length >= 2).length;
  const companyCount = new Set(filteredData.map((product) => product.company)).size;

  document.getElementById('totalCount').textContent = filteredData.length;
  document.getElementById('marketCount').textContent = marketReadyCount;
  document.getElementById('multiCount').textContent = multiTargetCount;
  document.getElementById('companyCount').textContent = companyCount;
}

function renderVisualizationChart() {
  const container = document.getElementById('viz-container');
  if (!container) return;

  container.innerHTML = '';

  const filteredData = getFilteredData();
  if (filteredData.length === 0) {
    setVisualizationError('当前筛选条件下没有可展示的产品。');
    return;
  }

  const chartWidth =
    Math.max(900, container.clientWidth) - VIS_CONFIG.margin.left - VIS_CONFIG.margin.right;
  const chartHeight = 500;
  const stageLabels = STAGE_ROWS.map((row) => row.label);
  const targetKeys = visualizationState.targetDefinitions.map((definition) => definition.key);
  const maxNewsCount = Math.max(...filteredData.map((product) => product.news?.length || 1), 1);

  const svg = d3
    .select('#viz-container')
    .append('svg')
    .attr('width', chartWidth + VIS_CONFIG.margin.left + VIS_CONFIG.margin.right)
    .attr('height', chartHeight + VIS_CONFIG.margin.top + VIS_CONFIG.margin.bottom);

  const chartGroup = svg
    .append('g')
    .attr('transform', `translate(${VIS_CONFIG.margin.left},${VIS_CONFIG.margin.top})`);

  const xScale = d3.scaleBand().domain(targetKeys).range([0, chartWidth]).padding(0.1);
  const yScale = d3.scaleBand().domain(stageLabels).range([0, chartHeight]).padding(0.1);
  const sizeScale = d3
    .scaleSqrt()
    .domain([0, maxNewsCount])
    .range([VIS_CONFIG.bubbleMinRadius, VIS_CONFIG.bubbleMaxRadius]);

  chartGroup
    .selectAll('.grid-x')
    .data(visualizationState.targetDefinitions)
    .enter()
    .append('line')
    .attr('class', 'grid-line')
    .attr('x1', (definition) => xScale(definition.key) + xScale.bandwidth() / 2)
    .attr('x2', (definition) => xScale(definition.key) + xScale.bandwidth() / 2)
    .attr('y1', 0)
    .attr('y2', chartHeight);

  chartGroup
    .selectAll('.grid-y')
    .data(stageLabels)
    .enter()
    .append('line')
    .attr('class', 'grid-line')
    .attr('x1', 0)
    .attr('x2', chartWidth)
    .attr('y1', (label) => yScale(label) + yScale.bandwidth() / 2)
    .attr('y2', (label) => yScale(label) + yScale.bandwidth() / 2);

  chartGroup
    .selectAll('.x-label')
    .data(visualizationState.targetDefinitions)
    .enter()
    .append('text')
    .attr('class', 'target-label')
    .attr('x', (definition) => xScale(definition.key) + xScale.bandwidth() / 2)
    .attr('y', chartHeight + 25)
    .attr('text-anchor', 'middle')
    .selectAll('tspan')
    .data((definition) => definition.label.split('\n'))
    .enter()
    .append('tspan')
    .attr('x', function () {
      return d3.select(this.parentNode).attr('x');
    })
    .attr('dy', (_, index) => (index === 0 ? 0 : 14))
    .text((value) => value);

  chartGroup
    .selectAll('.x-count')
    .data(visualizationState.targetDefinitions)
    .enter()
    .append('text')
    .attr('class', 'axis-label')
    .attr('x', (definition) => xScale(definition.key) + xScale.bandwidth() / 2)
    .attr('y', chartHeight + 60)
    .attr('text-anchor', 'middle')
    .text((definition) => `${definition.count}款`);

  chartGroup
    .selectAll('.y-label')
    .data(stageLabels)
    .enter()
    .append('text')
    .attr('class', 'stage-label')
    .attr('x', -10)
    .attr('y', (label) => yScale(label) + yScale.bandwidth() / 2 + 4)
    .attr('text-anchor', 'end')
    .text((label) => label);

  chartGroup
    .append('line')
    .attr('class', 'stage-separator')
    .attr('x1', 0)
    .attr('x2', chartWidth)
    .attr('y1', yScale('NDA') + yScale.bandwidth())
    .attr('y2', yScale('NDA') + yScale.bandwidth());

  chartGroup
    .append('text')
    .attr('class', 'axis-label')
    .attr('x', chartWidth + 10)
    .attr('y', yScale('已上市') / 2)
    .attr('font-weight', 'bold')
    .attr('fill', '#166534')
    .text('已获批');

  chartGroup
    .append('text')
    .attr('class', 'axis-label')
    .attr('x', chartWidth + 10)
    .attr('y', (yScale('III期') + yScale('已上市')) / 2 + 20)
    .attr('font-weight', 'bold')
    .attr('fill', '#92400e')
    .text('即将上市');

  chartGroup
    .append('text')
    .attr('class', 'axis-label')
    .attr('x', chartWidth + 10)
    .attr('y', (yScale('临床前') + yScale('III期')) / 2 + 40)
    .attr('font-weight', 'bold')
    .attr('fill', '#64748b')
    .text('早期阶段');

  const cellGroups = {};
  filteredData.forEach((product) => {
    const key = `${product.targetKey}|${product.stageLabel}`;
    if (!cellGroups[key]) {
      cellGroups[key] = [];
    }
    cellGroups[key].push(product);
  });

  filteredData.forEach((product) => {
    const key = `${product.targetKey}|${product.stageLabel}`;
    const group = cellGroups[key];
    const index = group.indexOf(product);
    const count = group.length;
    const maxColumns = Math.ceil(Math.sqrt(count));
    const column = index % maxColumns;
    const row = Math.floor(index / maxColumns);
    const cellWidth = xScale.bandwidth() * 0.7;
    const cellHeight = yScale.bandwidth() * 0.7;

    product.cellOffsetX =
      (column - (maxColumns - 1) / 2) *
      (cellWidth / Math.max(1, maxColumns - 1 || 1)) *
      0.8;
    product.cellOffsetY =
      (row - (Math.ceil(count / maxColumns) - 1) / 2) *
      (cellHeight / Math.max(1, Math.ceil(count / maxColumns) - 1 || 1)) *
      0.8;

    if (count === 1) {
      product.cellOffsetX = 0;
      product.cellOffsetY = 0;
    }
  });

  const tooltip = d3.select('#tooltip');
  const bubbles = chartGroup
    .selectAll('.bubble')
    .data(filteredData)
    .enter()
    .append('circle')
    .attr('class', 'bubble')
    .attr('cx', (product) => xScale(product.targetKey) + xScale.bandwidth() / 2 + product.cellOffsetX)
    .attr('cy', (product) => yScale(product.stageLabel) + yScale.bandwidth() / 2 + product.cellOffsetY)
    .attr('r', 0)
    .attr('fill', (product) => getColor(product.companyType))
    .attr('fill-opacity', 0.85)
    .attr('stroke', (product) =>
      product.administration?.includes('口服') ? VIS_CONFIG.colors.oral.stroke : 'white'
    )
    .attr('stroke-width', (product) => (product.administration?.includes('口服') ? 2 : 1.5))
    .attr('stroke-dasharray', (product) =>
      product.administration?.includes('口服') ? VIS_CONFIG.colors.oral.strokeDasharray : null
    );

  bubbles
    .transition()
    .duration(800)
    .delay((_, index) => index * 30)
    .attr('r', (product) => sizeScale(product.news?.length || 1));

  bubbles
    .on('mouseenter', function (event, product) {
      tooltip
        .classed('hidden', false)
        .html(`
          <div class="font-bold text-slate-900 mb-1">${product.name_cn}</div>
          <div class="text-slate-600 text-xs mb-2">${product.company}</div>
          <div class="flex gap-2 mb-2">
            <span class="px-2 py-0.5 bg-slate-100 rounded text-xs">${product.stage}</span>
            <span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">${(product.targets || []).join('+')}</span>
          </div>
          <div class="text-xs text-slate-500">${String(product.latest_update || '').substring(0, 60)}...</div>
        `)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY - 10}px`);
    })
    .on('mousemove', function (event) {
      tooltip.style('left', `${event.pageX + 10}px`).style('top', `${event.pageY - 10}px`);
    })
    .on('mouseleave', function () {
      tooltip.classed('hidden', true);
    })
    .on('click', function (_, product) {
      showDetailModal(product);
    });
}

function showDetailModal(product) {
  document.getElementById('modalTitle').textContent = product.name_cn;
  document.getElementById('modalContent').innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <span class="text-sm text-slate-500">研发企业</span>
        <span class="font-semibold text-slate-900">${product.company}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm text-slate-500">研发阶段</span>
        <span class="stage-pill ${getStageClass(product.stage)}">${product.stage}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm text-slate-500">作用靶点</span>
        <span class="font-semibold text-slate-900">${(product.targets || []).join(' + ')}</span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-sm text-slate-500">给药途径</span>
        <span class="font-semibold text-slate-900">${product.administration || '-'}</span>
      </div>
      <div class="border-t pt-4">
        <div class="text-sm text-slate-500 mb-2">最新进展</div>
        <p class="text-sm text-slate-700">${product.latest_update || '-'}</p>
      </div>
      ${
        product.news?.length
          ? `
      <div class="border-t pt-4">
        <div class="text-sm text-slate-500 mb-2">相关新闻</div>
        <div class="space-y-2">
          ${product.news
            .slice(0, 3)
            .map(
              (newsItem) =>
                `<a href="${newsItem.url}" target="_blank" rel="noopener noreferrer" class="block text-sm text-blue-600 hover:underline">${newsItem.title}</a>`
            )
            .join('')}
        </div>
      </div>
      `
          : ''
      }
    </div>
  `;
  document.getElementById('detailModal').classList.remove('hidden');
}

function bindVisualizationEvents() {
  document.querySelectorAll('.filter-btn').forEach((button) => {
    button.addEventListener('click', function () {
      document
        .querySelectorAll('.filter-btn')
        .forEach((candidate) => candidate.classList.remove('active', 'bg-blue-600', 'text-white'));
      this.classList.add('active');
      visualizationState.currentFilter = this.dataset.filter;
      updateVisualizationStats();
      renderVisualizationChart();
    });
  });

  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('detailModal').classList.add('hidden');
  });

  document.getElementById('detailModal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) {
      document.getElementById('detailModal').classList.add('hidden');
    }
  });

  window.addEventListener('resize', () => {
    if (visualizationState.allData.length) {
      renderVisualizationChart();
    }
  });
}

function initVisualizationPage() {
  if (typeof document === 'undefined') return;

  bindVisualizationEvents();
  loadVisualizationData();
}

if (typeof document !== 'undefined') {
  initVisualizationPage();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildTargetDefinitions,
    buildVisualizationProducts,
    getCompanyType,
    normalizeVisualizationStage
  };
}
