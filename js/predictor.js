const predictorState = {
  products: [],
  loaded: false,
  loadError: false
};

const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

function cleanDisplayName(name) {
  return String(name || '').replace(/（.*?）/g, '').trim();
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => HTML_ESCAPE_MAP[character]);
}

function inferBrand(product, profile) {
  if (profile.brand) return profile.brand;
  if (!product.commercial_name) return '待定';

  const first = product.commercial_name.split(';')[0].split(',')[0];
  return first.trim() || '待定';
}

function buildPredictorProducts(pipelineProducts, profileDefinitions) {
  return Object.entries(profileDefinitions)
    .map(([nameEn, profile]) => {
      const pipelineProduct = pipelineProducts.find((product) => product.name_en === nameEn);
      if (!pipelineProduct) return null;

      return {
        id: nameEn.toLowerCase(),
        name: cleanDisplayName(pipelineProduct.name_cn) || nameEn,
        nameEn,
        brand: inferBrand(pipelineProduct, profile),
        company: pipelineProduct.company,
        type: profile.type,
        administration: pipelineProduct.administration || '-',
        frequency: pipelineProduct.frequency || '-',
        stage: pipelineProduct.stage || '-',
        latestUpdate: pipelineProduct.latest_update || '',
        approvalDate: pipelineProduct.approval_date || '-',
        conditionTags: profile.conditionTags,
        bmiRange: profile.bmiRange,
        pricing: profile.pricing,
        weightLossCurve: profile.weightLossCurve,
        advantages: profile.advantages,
        notes: profile.notes
      };
    })
    .filter(Boolean);
}

function setPredictorStatus(message, isError = false) {
  const status = document.getElementById('predictorStatus');
  if (!status) return;

  status.textContent = message;
  status.className = isError
    ? 'mt-3 text-xs text-red-500'
    : 'mt-3 text-xs text-slate-500';
}

function setMatchButtonState(label, disabled) {
  const button = document.getElementById('matchButton');
  if (!button) return;

  button.textContent = label;
  button.disabled = disabled;
  button.classList.toggle('opacity-60', disabled);
  button.classList.toggle('cursor-not-allowed', disabled);
}

async function loadPredictorProducts() {
  setMatchButtonState('正在加载数据...', true);
  setPredictorStatus('正在同步主数据源中的药品信息...');

  try {
    const [pipelineResponse, profileResponse] = await Promise.all([
      fetch('data/pipeline.json'),
      fetch('data/predictor-profiles.json')
    ]);
    const [pipelineData, profileDefinitions] = await Promise.all([
      pipelineResponse.json(),
      profileResponse.json()
    ]);
    const products = buildPredictorProducts(pipelineData.products || [], profileDefinitions || {});

    if (products.length === 0) {
      throw new Error('No predictor products found');
    }

    predictorState.products = products;
    predictorState.loaded = true;
    predictorState.loadError = false;

    setMatchButtonState('开始智能匹配', false);
    setPredictorStatus(`已载入 ${products.length} 个候选方案，基础信息与主数据库保持同步。`);
  } catch (error) {
    console.error('Failed to load predictor products:', error);
    predictorState.products = [];
    predictorState.loaded = false;
    predictorState.loadError = true;

    setMatchButtonState('数据加载失败', true);
    setPredictorStatus('主数据加载失败，请刷新页面后重试。', true);
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

function getInsuranceStatus(pricing) {
  return Number.isFinite(pricing?.monthlyInsurance);
}

function calculateMatchScore(product, bmi, conditions) {
  let score = 50;

  if (bmi >= product.bmiRange[0] && bmi <= product.bmiRange[1]) score += 20;

  const matchedConditions = conditions.filter((condition) => product.conditionTags.includes(condition));
  score += matchedConditions.length * 15;

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
  const conditions = Array.from(document.querySelectorAll('input[name="condition"]:checked')).map(
    (checkbox) => checkbox.value
  );

  if (!weight || !height) {
    alert('请输入完整的体重和身高信息');
    return;
  }

  const bmi = Number(calculateBMI(weight, height));
  const results = predictorState.products
    .map((product) => ({
      product,
      score: calculateMatchScore(product, bmi, conditions),
      loss: product.weightLossCurve.week48,
      lossKg: (weight * product.weightLossCurve.week48 / 100).toFixed(1)
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

  container.innerHTML = matches
    .map(
      (match, index) => `
<div class="card p-6 ${index === 0 ? 'border-blue-600 ring-4 ring-blue-50' : ''} relative">
  ${index === 0 ? '<span class="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-tighter">Best Match</span>' : ''}
  <div class="mb-4">
    <h3 class="text-xl font-bold text-slate-900 mb-1">${escapeHtml(match.product.name)}</h3>
    <p class="text-xs font-bold text-slate-400 uppercase">${escapeHtml(match.product.brand)} · ${escapeHtml(match.product.company)}</p>
  </div>
  <div class="bg-blue-50 rounded-2xl p-4 mb-6 text-center">
    <div class="text-3xl font-bold text-blue-600 mb-1">${escapeHtml(match.loss)}%</div>
    <div class="text-[10px] font-bold text-blue-400 uppercase">预期减重幅 (48周)</div>
  </div>
  <div class="space-y-3 mb-6">
    ${match.product.advantages
      .map(
        (advantage) => `
    <div class="flex items-start gap-2 text-xs text-slate-600 font-medium">
      <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
      ${escapeHtml(advantage)}
    </div>`
      )
      .join('')}
  </div>
  <div class="grid grid-cols-2 gap-3 mb-4 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-lg">
    <div>
      <div class="text-[10px] uppercase font-bold text-slate-400 mb-0.5">给药方式</div>
      <div class="text-slate-900 font-semibold">${escapeHtml(match.product.administration)}</div>
    </div>
    <div>
      <div class="text-[10px] uppercase font-bold text-slate-400 mb-0.5">频率 / 阶段</div>
      <div class="text-slate-900 font-semibold">${escapeHtml(match.product.frequency)} / ${escapeHtml(match.product.stage)}</div>
    </div>
  </div>
  <p class="text-[11px] text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">${escapeHtml(match.product.notes)}</p>
</div>`
    )
    .join('');
}

function renderCostTable(matches, duration) {
  const months = duration / 4;
  const tableBody = document.getElementById('costTable');

  tableBody.innerHTML = matches
    .map((match) => {
      const hasInsurance = getInsuranceStatus(match.product.pricing);
      const monthlyCost = hasInsurance
        ? match.product.pricing.monthlyInsurance
        : match.product.pricing.monthlyOriginal;

      return `
<tr>
  <td class="px-4 py-4 font-bold text-slate-900">${escapeHtml(match.product.name)}</td>
  <td class="px-4 py-4 text-slate-600">¥${escapeHtml(monthlyCost)}</td>
  <td class="px-4 py-4 font-bold text-blue-600">¥${escapeHtml((monthlyCost * months).toLocaleString())}</td>
  <td class="px-4 py-4"><span class="stage-pill ${hasInsurance ? 'stage-approved' : 'stage-phase2'}">${hasInsurance ? '已纳入医保' : '未纳入医保'}</span></td>
  <td class="px-4 py-4 text-xs text-slate-500">${escapeHtml(match.product.pricing.genericAvailable || '创新药保护中')}</td>
</tr>`;
    })
    .join('');
}

function renderChart(matches) {
  const canvas = document.getElementById('weightLossChart');
  const chartHost = canvas?.parentElement;
  if (!canvas || !chartHost) return;

  if (typeof Chart === 'undefined') {
    chartHost.innerHTML =
      '<div class="h-full flex items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">图表库加载失败，已展示文字版推荐结果，可刷新后重试图表。</div>';
    return;
  }

  chartHost.innerHTML = '<canvas id="weightLossChart"></canvas>';
  const context = document.getElementById('weightLossChart').getContext('2d');

  if (window.lossChart) {
    window.lossChart.destroy();
  }

  window.lossChart = new Chart(context, {
    type: 'line',
    data: {
      labels: ['0', '4w', '8w', '12w', '24w', '48w'],
      datasets: matches.map((match, index) => ({
        label: match.product.name,
        data: [
          0,
          match.product.weightLossCurve.week4,
          match.product.weightLossCurve.week8,
          match.product.weightLossCurve.week12,
          match.product.weightLossCurve.week24,
          match.product.weightLossCurve.week48
        ],
        borderColor: ['#3b82f6', '#8b5cf6', '#10b981'][index],
        tension: 0.4,
        fill: false
      }))
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: '体重下降 (%)'
          }
        }
      }
    }
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', loadPredictorProducts);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    buildPredictorProducts,
    calculateMatchScore,
    cleanDisplayName,
    inferBrand,
    getBmiCategory
  };
}
