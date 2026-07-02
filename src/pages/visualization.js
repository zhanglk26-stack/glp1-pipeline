// Visualization page — refactored to ES modules
import '../../css/style.css';
import { mountSiteShell } from '../shared/site-shell.js';
import { escapeHtml, sanitizeUrl } from '../shared/utils.js';
import { getCompanyType, normalizeStage, getStageClass, STAGE_ROWS } from '../shared/constants.js';

const TARGET_DEFINITIONS = [
  { key: 'GLP-1R', label: 'GLP-1R\n单靶点' },
  { key: 'GIPR,GLP-1R', label: 'GLP-1R+GIPR\n双靶点' },
  { key: 'GCGR,GLP-1R', label: 'GLP-1R+GCGR\n双靶点' },
  { key: 'Amylin,GLP-1R', label: 'Amylin+GLP-1R\n复方' },
  { key: 'GCGR,GIPR,GLP-1R', label: 'GIP+GCG\n三靶点' },
  { key: 'FGF21R,GCGR,GLP-1R', label: 'FGF21组合\n特殊' },
  { key: 'GLP-1R,Insulin', label: 'Insulin组合\n复方' },
];

const VIS_CONFIG = {
  margin: { top: 60, right: 40, bottom: 120, left: 100 },
  bubbleMinRadius: 4,
  bubbleMaxRadius: 12,
  colors: {
    international: '#3b82f6',
    domestic_innovator: '#ef4444',
    biosimilar: '#9ca3af',
    oral: { stroke: '#f59e0b', strokeDasharray: '4,2' },
  },
};

const state = {
  allData: [],
  currentFilter: 'all',
  targetDefinitions: TARGET_DEFINITIONS.map((d) => ({ ...d, count: 0 })),
};

function normalizeVisualizationStage(stage) {
  const n = normalizeStage(stage);
  return n === 'unknown' || n === 'discontinued' ? 'preclinical' : n;
}

function getStageRowLabel(stage) {
  const bucket = normalizeVisualizationStage(stage);
  return STAGE_ROWS.find((r) => r.key === bucket)?.label || '临床前';
}

function getColor(companyType) {
  return VIS_CONFIG.colors[companyType] || VIS_CONFIG.colors.biosimilar;
}

function buildTargetDefinitions(products) {
  const counts = {};
  for (const p of products) {
    const key = (p.targets || []).slice().sort().join(',');
    counts[key] = (counts[key] || 0) + 1;
  }
  const known = new Set(TARGET_DEFINITIONS.map((d) => d.key));
  const dynamic = Object.keys(counts)
    .filter((k) => k && !known.has(k))
    .sort()
    .map((k) => ({ key: k, label: `${k.replaceAll(',', ' + ')}\n其他` }));

  return [...TARGET_DEFINITIONS, ...dynamic].map((d) => ({
    ...d,
    count: counts[d.key] || 0,
  }));
}

function buildVisualizationProducts(products, targetDefs) {
  const idxMap = new Map(targetDefs.map((d, i) => [d.key, i]));
  return products.map((p) => {
    const targetKey = (p.targets || []).slice().sort().join(',');
    const stageLabel = getStageRowLabel(p.stage);
    const stageIndex = STAGE_ROWS.findIndex((r) => r.label === stageLabel);
    return {
      ...p,
      targetKey,
      companyType: getCompanyType(p.company),
      stageLabel,
      stageIndex: stageIndex === -1 ? STAGE_ROWS.length - 1 : stageIndex,
      targetIndex: idxMap.get(targetKey) ?? targetDefs.length - 1,
    };
  });
}

function getFilteredData() {
  if (state.currentFilter === 'all') return state.allData;
  return state.allData.filter((p) => p.companyType === state.currentFilter);
}

function setVizError(msg) {
  const c = document.getElementById('viz-container');
  if (!c) return;
  c.innerHTML = `<div class="min-h-[320px] flex items-center justify-center rounded-2xl bg-slate-50 text-sm text-red-500">${escapeHtml(msg)}</div>`;
}

function updateStats() {
  const filtered = getFilteredData();
  const marketReady = filtered.filter((p) => {
    const s = normalizeVisualizationStage(p.stage);
    return s === 'approved' || s === 'nda';
  }).length;
  const multi = filtered.filter((p) => (p.targets || []).length >= 2).length;
  const companies = new Set(filtered.map((p) => p.company)).size;

  document.getElementById('totalCount').textContent = filtered.length;
  document.getElementById('marketCount').textContent = marketReady;
  document.getElementById('multiCount').textContent = multi;
  document.getElementById('companyCount').textContent = companies;
}

function renderChart() {
  const container = document.getElementById('viz-container');
  if (!container) return;
  container.innerHTML = '';

  const filtered = getFilteredData();
  if (filtered.length === 0) {
    setVizError('当前筛选条件下没有可展示的产品。');
    return;
  }

  const chartW = Math.max(900, container.clientWidth) - VIS_CONFIG.margin.left - VIS_CONFIG.margin.right;
  const chartH = 500;
  const stageLabels = STAGE_ROWS.map((r) => r.label);
  const targetKeys = state.targetDefinitions.map((d) => d.key);
  const maxNews = Math.max(...filtered.map((p) => p.news?.length || 1), 1);

  const svg = d3.select('#viz-container')
    .append('svg')
    .attr('width', chartW + VIS_CONFIG.margin.left + VIS_CONFIG.margin.right)
    .attr('height', chartH + VIS_CONFIG.margin.top + VIS_CONFIG.margin.bottom);

  const g = svg.append('g')
    .attr('transform', `translate(${VIS_CONFIG.margin.left},${VIS_CONFIG.margin.top})`);

  const xScale = d3.scaleBand().domain(targetKeys).range([0, chartW]).padding(0.1);
  const yScale = d3.scaleBand().domain(stageLabels).range([0, chartH]).padding(0.1);
  const sizeScale = d3.scaleSqrt().domain([0, maxNews]).range([VIS_CONFIG.bubbleMinRadius, VIS_CONFIG.bubbleMaxRadius]);

  // Grid lines
  g.selectAll('.grid-x').data(state.targetDefinitions).enter().append('line')
    .attr('class', 'grid-line')
    .attr('x1', (d) => xScale(d.key) + xScale.bandwidth() / 2)
    .attr('x2', (d) => xScale(d.key) + xScale.bandwidth() / 2)
    .attr('y1', 0).attr('y2', chartH);

  g.selectAll('.grid-y').data(stageLabels).enter().append('line')
    .attr('class', 'grid-line')
    .attr('x1', 0).attr('x2', chartW)
    .attr('y1', (l) => yScale(l) + yScale.bandwidth() / 2)
    .attr('y2', (l) => yScale(l) + yScale.bandwidth() / 2);

  // X labels
  g.selectAll('.x-label').data(state.targetDefinitions).enter().append('text')
    .attr('class', 'target-label')
    .attr('x', (d) => xScale(d.key) + xScale.bandwidth() / 2)
    .attr('y', chartH + 25)
    .attr('text-anchor', 'middle')
    .selectAll('tspan')
    .data((d) => d.label.split('\n')).enter().append('tspan')
    .attr('x', function () { return d3.select(this.parentNode).attr('x'); })
    .attr('dy', (_, i) => (i === 0 ? 0 : 14))
    .text((v) => v);

  g.selectAll('.x-count').data(state.targetDefinitions).enter().append('text')
    .attr('class', 'axis-label')
    .attr('x', (d) => xScale(d.key) + xScale.bandwidth() / 2)
    .attr('y', chartH + 60).attr('text-anchor', 'middle')
    .text((d) => `${d.count}款`);

  // Y labels
  g.selectAll('.y-label').data(stageLabels).enter().append('text')
    .attr('class', 'stage-label')
    .attr('x', -10)
    .attr('y', (l) => yScale(l) + yScale.bandwidth() / 2 + 4)
    .attr('text-anchor', 'end').text((l) => l);

  // Separator
  g.append('line').attr('class', 'stage-separator')
    .attr('x1', 0).attr('x2', chartW)
    .attr('y1', yScale('NDA') + yScale.bandwidth())
    .attr('y2', yScale('NDA') + yScale.bandwidth());

  // Section labels
  g.append('text').attr('class', 'axis-label').attr('x', chartW + 10)
    .attr('y', yScale('已上市') / 2).attr('font-weight', 'bold').attr('fill', '#166534').text('已获批');
  g.append('text').attr('class', 'axis-label').attr('x', chartW + 10)
    .attr('y', (yScale('III期') + yScale('已上市')) / 2 + 20).attr('font-weight', 'bold').attr('fill', '#92400e').text('即将上市');
  g.append('text').attr('class', 'axis-label').attr('x', chartW + 10)
    .attr('y', (yScale('临床前') + yScale('III期')) / 2 + 40).attr('font-weight', 'bold').attr('fill', '#64748b').text('早期阶段');

  // Cell grouping
  const cellGroups = {};
  filtered.forEach((p) => {
    const key = `${p.targetKey}|${p.stageLabel}`;
    if (!cellGroups[key]) cellGroups[key] = [];
    cellGroups[key].push(p);
  });

  filtered.forEach((p) => {
    const key = `${p.targetKey}|${p.stageLabel}`;
    const group = cellGroups[key];
    const idx = group.indexOf(p);
    const count = group.length;
    const maxCols = Math.ceil(Math.sqrt(count));
    const col = idx % maxCols;
    const row = Math.floor(idx / maxCols);
    const cellW = xScale.bandwidth() * 0.7;
    const cellH = yScale.bandwidth() * 0.7;

    p.cellOffsetX = count === 1 ? 0 :
      (col - (maxCols - 1) / 2) * (cellW / Math.max(1, maxCols - 1 || 1)) * 0.8;
    p.cellOffsetY = count === 1 ? 0 :
      (row - (Math.ceil(count / maxCols) - 1) / 2) * (cellH / Math.max(1, Math.ceil(count / maxCols) - 1 || 1)) * 0.8;
  });

  const tooltip = d3.select('#tooltip');

  const bubbles = g.selectAll('.bubble').data(filtered).enter().append('circle')
    .attr('class', 'bubble')
    .attr('cx', (p) => xScale(p.targetKey) + xScale.bandwidth() / 2 + p.cellOffsetX)
    .attr('cy', (p) => yScale(p.stageLabel) + yScale.bandwidth() / 2 + p.cellOffsetY)
    .attr('r', 0)
    .attr('fill', (p) => getColor(p.companyType))
    .attr('fill-opacity', 0.85)
    .attr('stroke', (p) => p.administration?.includes('口服') ? VIS_CONFIG.colors.oral.stroke : 'white')
    .attr('stroke-width', (p) => p.administration?.includes('口服') ? 2 : 1.5)
    .attr('stroke-dasharray', (p) => p.administration?.includes('口服') ? VIS_CONFIG.colors.oral.strokeDasharray : null);

  bubbles.transition().duration(800).delay((_, i) => i * 30)
    .attr('r', (p) => sizeScale(p.news?.length || 1));

  bubbles
    .on('mouseenter', function (event, p) {
      tooltip.classed('hidden', false).html(`
        <div class="font-bold text-slate-900 mb-1">${escapeHtml(p.name_cn)}</div>
        <div class="text-slate-600 text-xs mb-2">${escapeHtml(p.company)}</div>
        <div class="flex gap-2 mb-2">
          <span class="px-2 py-0.5 bg-slate-100 rounded text-xs">${escapeHtml(p.stage)}</span>
          <span class="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">${escapeHtml((p.targets || []).join('+'))}</span>
        </div>
        <div class="text-xs text-slate-500">${escapeHtml(String(p.latest_update || '').substring(0, 60))}...</div>
      `).style('left', `${event.pageX + 10}px`).style('top', `${event.pageY - 10}px`);
    })
    .on('mousemove', function (event) {
      tooltip.style('left', `${event.pageX + 10}px`).style('top', `${event.pageY - 10}px`);
    })
    .on('mouseleave', () => tooltip.classed('hidden', true))
    .on('click', (_, p) => showDetailModal(p));
}

function showDetailModal(product) {
  document.getElementById('modalTitle').textContent = product.name_cn;
  document.getElementById('modalContent').innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-center"><span class="text-sm text-slate-500">研发企业</span><span class="font-semibold text-slate-900">${escapeHtml(product.company)}</span></div>
      <div class="flex justify-between items-center"><span class="text-sm text-slate-500">研发阶段</span><span class="stage-pill ${getStageClass(product.stage)}">${escapeHtml(product.stage)}</span></div>
      <div class="flex justify-between items-center"><span class="text-sm text-slate-500">作用靶点</span><span class="font-semibold text-slate-900">${escapeHtml((product.targets || []).join(' + '))}</span></div>
      <div class="flex justify-between items-center"><span class="text-sm text-slate-500">给药途径</span><span class="font-semibold text-slate-900">${escapeHtml(product.administration || '-')}</span></div>
      <div class="border-t pt-4"><div class="text-sm text-slate-500 mb-2">最新进展</div><p class="text-sm text-slate-700">${escapeHtml(product.latest_update || '-')}</p></div>
      ${product.news?.length ? `<div class="border-t pt-4"><div class="text-sm text-slate-500 mb-2">相关新闻</div><div class="space-y-2">${product.news.slice(0, 3).map((n) => `<a href="${sanitizeUrl(n.url)}" target="_blank" rel="noopener noreferrer" class="block text-sm text-blue-600 hover:underline">${escapeHtml(n.title)}</a>`).join('')}</div></div>` : ''}
    </div>`;
  document.getElementById('detailModal').classList.remove('hidden');
}

function bindEvents() {
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active', 'bg-blue-600', 'text-white'));
      this.classList.add('active');
      state.currentFilter = this.dataset.filter;
      updateStats();
      renderChart();
    });
  });

  document.getElementById('closeModal')?.addEventListener('click', () => {
    document.getElementById('detailModal')?.classList.add('hidden');
  });

  document.getElementById('detailModal')?.addEventListener('click', (e) => {
    if (e.target === e.currentTarget) e.currentTarget.classList.add('hidden');
  });

  window.addEventListener('resize', () => {
    if (state.allData.length) renderChart();
  });
}

async function init() {
  mountSiteShell();
  bindEvents();

  try {
    const resp = await fetch('/data/pipeline.json');
    const data = await resp.json();
    const products = data.products || [];

    state.targetDefinitions = buildTargetDefinitions(products);
    state.allData = buildVisualizationProducts(products, state.targetDefinitions);

    updateStats();
    renderChart();
  } catch (err) {
    console.error('Failed to load visualization data:', err);
    setVizError('可视化数据加载失败，请刷新页面后重试。');
  }
}

document.addEventListener('DOMContentLoaded', init);
