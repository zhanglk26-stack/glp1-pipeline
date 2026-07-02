// Predictor page — refactored to ES modules
import { mountSiteShell } from '../shared/site-shell.js';
import { escapeHtml } from '../shared/utils.js';

const predictorState = { products: [], loaded: false, loadError: false };

function cleanDisplayName(name) {
  return String(name || '').replace(/（.*?）/g, '').trim();
}

function inferBrand(product, profile) {
  if (profile.brand) return profile.brand;
  if (!product.commercial_name) return '待定';
  return product.commercial_name.split(';')[0].split(',')[0].trim() || '待定';
}

function buildPredictorProducts(pipelineProducts, profileDefs) {
  return Object.entries(profileDefs)
    .map(([nameEn, profile]) => {
      const p = pipelineProducts.find((prod) => prod.name_en === nameEn);
      if (!p) return null;
      return {
        id: nameEn.toLowerCase(),
        name: cleanDisplayName(p.name_cn) || nameEn,
        nameEn,
        brand: inferBrand(p, profile),
        company: p.company,
        type: profile.type,
        administration: p.administration || '-',
        frequency: p.frequency || '-',
        stage: p.stage || '-',
        latestUpdate: p.latest_update || '',
        approvalDate: p.approval_date || '-',
        conditionTags: profile.conditionTags,
        bmiRange: profile.bmiRange,
        pricing: profile.pricing,
        weightLossCurve: profile.weightLossCurve,
        advantages: profile.advantages,
        notes: profile.notes,
      };
    })
    .filter(Boolean);
}

function setStatus(msg, isError = false) {
  const el = document.getElementById('predictorStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = isError ? 'mt-3 text-xs text-red-500' : 'mt-3 text-xs text-slate-500';
}

function setButton(label, disabled) {
  const btn = document.getElementById('matchButton');
  if (!btn) return;
  btn.textContent = label;
  btn.disabled = disabled;
  btn.classList.toggle('opacity-60', disabled);
  btn.classList.toggle('cursor-not-allowed', disabled);
}

async function loadProducts() {
  setButton('正在加载数据...', true);
  setStatus('正在同步主数据源中的药品信息...');

  try {
    const [pipeResp, profResp] = await Promise.all([
      fetch('/data/pipeline.json'),
      fetch('/data/predictor-profiles.json'),
    ]);
    const [pipeData, profDefs] = await Promise.all([pipeResp.json(), profResp.json()]);
    const products = buildPredictorProducts(pipeData.products || [], profDefs || {});

    if (products.length === 0) throw new Error('No predictor products found');

    predictorState.products = products;
    predictorState.loaded = true;
    predictorState.loadError = false;

    setButton('开始智能匹配', false);
    setStatus(`已载入 ${products.length} 个候选方案，基础信息与主数据库保持同步。`);
  } catch (err) {
    console.error('Failed to load predictor products:', err);
    predictorState.products = [];
    predictorState.loaded = false;
    predictorState.loadError = true;
    setButton('数据加载失败', true);
    setStatus('主数据加载失败，请刷新页面后重试。', true);
  }
}

function calculateBMI(weight, height) {
  if (!weight || !height) return null;
  return (weight / (height / 100) ** 2).toFixed(1);
}

function getBmiCategory(bmi) {
  if (!Number.isFinite(bmi)) return '--';
  if (bmi < 18.5) return '偏瘦';
  if (bmi < 24) return '正常';
  if (bmi < 28) return '超重';
  return '肥胖';
}

function calculateMatchScore(product, bmi, conditions) {
  let score = 50;
  if (bmi >= product.bmiRange[0] && bmi <= product.bmiRange[1]) score += 20;
  const matched = conditions.filter((c) => product.conditionTags.includes(c));
  score += matched.length * 15;
  if (product.nameEn === 'Mazdutide' && conditions.includes('nash')) score += 10;
  return score;
}

function calculateMatch() {
  if (!predictorState.loaded) {
    alert('候选药物数据尚未加载完成，请稍后再试。');
    return;
  }

  const weight = parseFloat(document.getElementById('weight').value);
  const height = parseFloat(document.getElementById('height').value);
  const duration = parseInt(document.getElementById('duration').value, 10);
  const conditions = Array.from(document.querySelectorAll('input[name="condition"]:checked')).map((c) => c.value);

  if (!weight || !height) {
    alert('请输入完整的体重和身高信息');
    return;
  }

  const bmi = Number(calculateBMI(weight, height));
  const results = predictorState.products
    .map((p) => ({
      product: p,
      score: calculateMatchScore(p, bmi, conditions),
      loss: p.weightLossCurve.week48,
      lossKg: (weight * p.weightLossCurve.week48 / 100).toFixed(1),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  document.getElementById('results').classList.remove('hidden');
  document.getElementById('bmiValue').textContent = bmi.toFixed(1);
  document.getElementById('bmiCategory').textContent = getBmiCategory(bmi);
  document.getElementById('targetWeight').textContent = `-${(weight * 0.15).toFixed(1)}kg`;
  document.getElementById('waistStatus').textContent = bmi > 28 ? '高风险' : '中等风险';

  renderCards(results);
  renderCostTable(results, duration);
  renderChart(results);

  document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

function renderCards(matches) {
  const container = document.getElementById('recommendations');
  container.innerHTML = matches.map((m, i) => `
<div class="card p-6 ${i === 0 ? 'border-blue-600 ring-4 ring-blue-50' : ''} relative">
  ${i === 0 ? '<span class="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-tighter">Best Match</span>' : ''}
  <div class="mb-4">
    <h3 class="text-xl font-bold text-slate-900 mb-1">${escapeHtml(m.product.name)}</h3>
    <p class="text-xs font-bold text-slate-400 uppercase">${escapeHtml(m.product.brand)} &middot; ${escapeHtml(m.product.company)}</p>
  </div>
  <div class="bg-blue-50 rounded-2xl p-4 mb-6 text-center">
    <div class="text-3xl font-bold text-blue-600 mb-1">${escapeHtml(m.loss)}%</div>
    <div class="text-[10px] font-bold text-blue-400 uppercase">预期减重幅 (48周)</div>
  </div>
  <div class="space-y-3 mb-6">
    ${m.product.advantages.map((a) => `
    <div class="flex items-start gap-2 text-xs text-slate-600 font-medium">
      <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
      ${escapeHtml(a)}
    </div>`).join('')}
  </div>
  <div class="grid grid-cols-2 gap-3 mb-4 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg">
    <div>
      <div class="text-[10px] uppercase font-bold text-slate-400 mb-0.5">给药方式</div>
      <div class="text-slate-900 font-semibold">${escapeHtml(m.product.administration)}</div>
    </div>
    <div>
      <div class="text-[10px] uppercase font-bold text-slate-400 mb-0.5">频率 / 阶段</div>
      <div class="text-slate-900 font-semibold">${escapeHtml(m.product.frequency)} / ${escapeHtml(m.product.stage)}</div>
    </div>
  </div>
  <p class="text-[11px] text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">${escapeHtml(m.product.notes)}</p>
</div>`).join('');
}

function renderCostTable(matches, duration) {
  const months = duration / 4;
  const tableBody = document.getElementById('costTable');
  tableBody.innerHTML = matches.map((m) => {
    const insured = Number.isFinite(m.product.pricing?.monthlyInsurance);
    const monthly = insured ? m.product.pricing.monthlyInsurance : m.product.pricing.monthlyOriginal;
    return `<tr>
  <td class="px-4 py-4 font-bold text-slate-900">${escapeHtml(m.product.name)}</td>
  <td class="px-4 py-4 text-slate-600">&yen;${escapeHtml(monthly)}</td>
  <td class="px-4 py-4 font-bold text-blue-600">&yen;${escapeHtml((monthly * months).toLocaleString())}</td>
  <td class="px-4 py-4"><span class="stage-pill ${insured ? 'stage-approved' : 'stage-phase2'}">${insured ? '已纳入医保' : '未纳入医保'}</span></td>
  <td class="px-4 py-4 text-xs text-slate-500">${escapeHtml(m.product.pricing.genericAvailable || '创新药保护中')}</td>
</tr>`;
  }).join('');
}

function renderChart(matches) {
  const canvas = document.getElementById('weightLossChart');
  const host = canvas?.parentElement;
  if (!canvas || !host) return;

  if (typeof Chart === 'undefined') {
    host.innerHTML = '<div class="h-full flex items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">图表库加载失败，已展示文字版推荐结果，可刷新后重试图表。</div>';
    return;
  }

  host.innerHTML = '<canvas id="weightLossChart"></canvas>';
  const ctx = document.getElementById('weightLossChart').getContext('2d');
  if (window.lossChart) window.lossChart.destroy();

  window.lossChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['0', '4w', '8w', '12w', '24w', '48w'],
      datasets: matches.map((m, i) => ({
        label: m.product.name,
        data: [0, m.product.weightLossCurve.week4, m.product.weightLossCurve.week8, m.product.weightLossCurve.week12, m.product.weightLossCurve.week24, m.product.weightLossCurve.week48],
        borderColor: ['#3b82f6', '#8b5cf6', '#10b981'][i],
        tension: 0.4,
        fill: false,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: { y: { beginAtZero: true, title: { display: true, text: '体重下降 (%)' } } },
    },
  });
}

// Expose for inline onclick
window.calculateMatch = calculateMatch;

function init() {
  mountSiteShell();
  loadProducts();
}

document.addEventListener('DOMContentLoaded', init);
