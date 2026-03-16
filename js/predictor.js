// GLP-1 减肥方案智能匹配器

const products = [
    {
        id: 'tirzepatide',
        name: '替尔泊肽',
        brand: '穆峰达',
        company: '礼来',
        type: 'GLP-1/GIP 双靶点',
        weight_loss_curve: {
            week4: 2.8, week8: 5.5, week12: 8.3, week24: 15.0, week36: 18.5, week48: 20.2
        },
        indications: ['obesity', 'diabetes', 'nash'],
        bmi_range: [27, 50],
        pricing: { monthly_original: 2800, monthly_insurance: 560, monthly_generic_expected: 350, generic_available: '2028-12' },
        side_effects: { nausea: 31, diarrhea: 23, discontinuation: 7.1 },
        advantages: ['目前全球减重效果最强', '脂肪肝改善显著', '已纳入医保'],
        notes: '适合追求极效减重及合并脂肪肝/糖尿病的患者'
    },
    {
        id: 'semaglutide',
        name: '司美格鲁肽',
        brand: '诺和盈',
        company: '诺和诺德',
        type: 'GLP-1 单靶点',
        weight_loss_curve: {
            week4: 2.4, week8: 4.8, week12: 7.2, week24: 13.5, week36: 14.8, week48: 15.8
        },
        indications: ['obesity', 'diabetes', 'cvd'],
        bmi_range: [27, 50],
        pricing: { monthly_original: 2400, monthly_insurance: 480, monthly_generic_expected: 280, generic_available: '2026-04' },
        side_effects: { nausea: 44, diarrhea: 31, discontinuation: 6.8 },
        advantages: ['心血管保护证据最充分', '仿制药2026年上市', '全球使用最广泛'],
        notes: '适合合并心血管疾病或追求长期用药性价比的患者'
    },
    {
        id: 'mazdutide',
        name: '玛仕度肽',
        brand: '信尔美',
        company: '信达生物',
        type: 'GLP-1/GCG 双靶点',
        weight_loss_curve: {
            week4: 2.5, week8: 5.0, week12: 7.5, week24: 13.2, week36: 15.8, week48: 18.6
        },
        indications: ['obesity', 'diabetes', 'nash'],
        bmi_range: [24, 45],
        pricing: { monthly_original: 2100, monthly_insurance: 420, monthly_generic_expected: null, generic_available: null },
        side_effects: { nausea: 28, diarrhea: 19, discontinuation: 5.2 },
        advantages: ['首款国产双靶点创新药', '胃肠道副作用相对较小', '代谢改善综合效果优'],
        notes: '适合对副作用敏感或关注血脂/肝功能改善的患者'
    },
    {
        id: 'liraglutide',
        name: '利拉鲁肽',
        brand: '利鲁平/诺和力',
        company: '华东医药/诺和诺德',
        type: 'GLP-1 单靶点 (日制剂)',
        weight_loss_curve: {
            week4: 1.8, week8: 3.5, week12: 5.2, week24: 9.0, week36: 10.0, week48: 10.5
        },
        indications: ['obesity', 'diabetes'],
        bmi_range: [27, 50],
        pricing: { monthly_original: 1600, monthly_insurance: 320, monthly_generic_expected: 150, generic_available: '已上市' },
        side_effects: { nausea: 39, diarrhea: 21, discontinuation: 8.5 },
        advantages: ['价格最亲民', '可随时停药 (短效)', '临床可及性极高'],
        notes: '适合预算有限或需短期控制权 (如备孕前) 的患者'
    }
];

function calculateBMI(weight, height) {
    if (!weight || !height) return null;
    return (weight / ((height / 100) ** 2)).toFixed(1);
}

function calculateMatch() {
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const duration = parseInt(document.getElementById('duration').value);
    const conditions = Array.from(document.querySelectorAll('input[name="condition"]:checked')).map(cb => cb.value);

    if (!weight || !height) return alert('请输入完整的体重和身高信息');

    const bmi = calculateBMI(weight, height);
    const results = products.map(p => {
        let score = 50;
        if (bmi >= p.bmi_range[0] && bmi <= p.bmi_range[1]) score += 20;
        const matchCond = conditions.filter(c => p.indications.includes(c));
        score += matchCond.length * 15;
        if (p.id === 'mazdutide' && conditions.includes('nash')) score += 10;

        return {
            product: p,
            score,
            loss: p.weight_loss_curve.week48,
            lossKg: (weight * p.weight_loss_curve.week48 / 100).toFixed(1)
        };
    }).sort((a, b) => b.score - a.score).slice(0, 3);

    document.getElementById('results').classList.remove('hidden');
    document.getElementById('bmiValue').textContent = bmi;
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
                <h3 class="text-xl font-bold text-slate-900 mb-1">${m.product.name}</h3>
                <p class="text-xs font-bold text-slate-400 uppercase">${m.product.brand} · ${m.product.company}</p>
            </div>
            <div class="bg-blue-50 rounded-2xl p-4 mb-6 text-center">
                <div class="text-3xl font-bold text-blue-600 mb-1">${m.loss}%</div>
                <div class="text-[10px] font-bold text-blue-400 uppercase">预期减重幅 (48周)</div>
            </div>
            <div class="space-y-3 mb-6">
                ${m.product.advantages.map(adv => `
                    <div class="flex items-start gap-2 text-xs text-slate-600 font-medium">
                        <svg class="w-4 h-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                        ${adv}
                    </div>
                `).join('')}
            </div>
            <p class="text-[11px] text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-100">${m.product.notes}</p>
        </div>
    `).join('');
}

function renderCostTable(matches, duration) {
    const months = duration / 4;
    document.getElementById('costTable').innerHTML = matches.map(m => `
        <tr>
            <td class="px-4 py-4 font-bold text-slate-900">${m.product.name}</td>
            <td class="px-4 py-4 text-slate-600">¥${m.product.pricing.monthly_insurance || m.product.pricing.monthly_original}</td>
            <td class="px-4 py-4 font-bold text-blue-600">¥${((m.product.pricing.monthly_insurance || m.product.pricing.monthly_original) * months).toLocaleString()}</td>
            <td class="px-4 py-4"><span class="stage-pill stage-approved">已入医保</span></td>
            <td class="px-4 py-4 text-xs text-slate-500">${m.product.pricing.generic_available || '创新药保护中'}</td>
        </tr>
    `).join('');
}

function renderChart(matches) {
    const ctx = document.getElementById('weightLossChart').getContext('2d');
    if (window.lossChart) window.lossChart.destroy();
    
    window.lossChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['0', '4w', '8w', '12w', '24w', '48w'],
            datasets: matches.map((m, i) => ({
                label: m.product.name,
                data: [0, m.product.weight_loss_curve.week4, m.product.weight_loss_curve.week8, m.product.weight_loss_curve.week12, m.product.weight_loss_curve.week24, m.product.weight_loss_curve.week48],
                borderColor: ['#3b82f6', '#8b5cf6', '#10b981'][i],
                tension: 0.4,
                fill: false
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, title: { display: true, text: '体重下降 (%)' } }
            }
        }
    });
}
