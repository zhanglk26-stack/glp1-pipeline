// GLP-1 减肥方案智能匹配器

// 产品数据库 - 基于临床终点数据
const products = [
    {
        id: 'tirzepatide',
        name: '替尔泊肽',
        brand: '穆峰达',
        company: '礼来',
        type: 'GLP-1/GIP 双靶点',
        weekly_doses: ['2.5mg', '5mg', '7.5mg', '10mg', '12.5mg', '15mg'],
        // 基于 SURMOUNT-1 试验数据（15mg组）
        weight_loss_curve: {
            week4: 2.8,
            week8: 5.5,
            week12: 8.3,
            week16: 10.8,
            week20: 13.2,
            week24: 15.0,
            week36: 18.5,
            week48: 20.2,
            week52: 22.5
        },
        week12_data: {
            percent: 8.3,
            note: "12周减重约8.3%，效果初显"
        },
        indications: ['obesity', 'diabetes', 'nash', 'osa'],
        bmi_range: [27, 50],
        age_range: [18, 75],
        pricing: {
            monthly_original: 2800,
            monthly_insurance: 560, // 医保后
            monthly_generic_expected: 350, // 仿制药预期
            generic_available: '2028-12' // 专利保护期长
        },
        side_effects: {
            nausea: 31,
            diarrhea: 23,
            vomiting: 13,
            discontinuation: 7.1
        },
        advantages: ['减重效果最强', '脂肪肝改善显著', '已入医保'],
        notes: '目前减重效果最好的药物，适合追求高效减重的患者'
    },
    {
        id: 'semaglutide',
        name: '司美格鲁肽',
        brand: '诺和盈',
        company: '诺和诺德',
        type: 'GLP-1 单靶点',
        weekly_doses: ['0.25mg', '0.5mg', '1mg', '1.7mg', '2.4mg'],
        // 基于 STEP-1 试验数据（2.4mg组）
        weight_loss_curve: {
            week4: 2.4,
            week8: 4.8,
            week12: 7.2,
            week16: 9.5,
            week20: 11.8,
            week24: 13.5,
            week36: 14.8,
            week48: 15.8,
            week68: 17.4
        },
        week12_data: {
            percent: 7.2,
            note: "12周减重约7.2%，稳定起效"
        },
        indications: ['obesity', 'diabetes', 'cvd'],
        bmi_range: [27, 50],
        age_range: [18, 75],
        pricing: {
            monthly_original: 2400,
            monthly_insurance: 480,
            monthly_generic_expected: 280, // 2026年Q4仿制药上市
            generic_available: '2026-04'
        },
        side_effects: {
            nausea: 44,
            diarrhea: 31,
            vomiting: 24,
            discontinuation: 6.8
        },
        advantages: ['心血管获益明确', '仿制药即将上市', '临床经验最丰富'],
        notes: '全球使用最广泛的减肥药，2026年3月专利到期，仿制药价格将大幅下降'
    },
    {
        id: 'mazdutide',
        name: '玛仕度肽',
        brand: '信尔美',
        company: '信达生物',
        type: 'GLP-1/GCG 双靶点',
        weekly_doses: ['4mg', '6mg'],
        // 基于 GLORY-1 试验数据（6mg组）
        weight_loss_curve: {
            week4: 2.5,
            week8: 5.0,
            week12: 7.5,
            week16: 9.8,
            week20: 12.0,
            week24: 13.2,
            week36: 15.8,
            week48: 18.6
        },
        week12_data: {
            percent: 7.5,
            note: "12周减重约7.5%，GCG靶点早期优势"
        },
        indications: ['obesity', 'diabetes', 'nash'],
        bmi_range: [24, 45],
        age_range: [18, 75],
        pricing: {
            monthly_original: 2100,
            monthly_insurance: 420,
            monthly_generic_expected: null,
            generic_available: null // 创新药
        },
        side_effects: {
            nausea: 28,
            diarrhea: 19,
            vomiting: 8,
            discontinuation: 5.2
        },
        advantages: ['副作用最小', '脂肪肝改善最佳', '国产创新药'],
        notes: '2025年6月获批，全球首个GLP-1/GCG双靶点药物，适合有脂肪肝的患者'
    },
    {
        id: 'orforglipron',
        name: 'Orforglipron',
        brand: '口服小分子',
        company: '礼来',
        type: '口服GLP-1 小分子',
        weekly_doses: ['12mg', '24mg', '36mg'],
        // 基于 II期数据外推
        weight_loss_curve: {
            week4: 2.0,
            week8: 4.5,
            week12: 7.0,
            week16: 9.5,
            week20: 11.5,
            week24: 13.5,
            week36: 14.5,
            week48: 14.7
        },
        week12_data: {
            percent: 7.0,
            note: "12周减重约7.0%，口服起效稳健"
        },
        indications: ['obesity', 'diabetes'],
        bmi_range: [27, 50],
        age_range: [18, 75],
        pricing: {
            monthly_original: null, // 未上市
            monthly_insurance: null,
            monthly_generic_expected: null,
            generic_available: '2026-12' // 预计获批
        },
        side_effects: {
            nausea: 35,
            diarrhea: 22,
            vomiting: 18,
            discontinuation: null
        },
        advantages: ['口服方便', '价格低预期', '无需注射'],
        notes: '预计2026年底获批，首款口服小分子GLP-1，适合怕打针的患者'
    },
    {
        id: 'liraglutide',
        name: '利拉鲁肽',
        brand: '诺和力/诺和盈',
        company: '诺和诺德',
        type: 'GLP-1 单靶点（日制剂）',
        weekly_doses: ['0.6mg', '1.2mg', '1.8mg', '3mg'],
        // 基于 SCALE 试验数据
        weight_loss_curve: {
            week4: 1.8,
            week8: 3.5,
            week12: 5.2,
            week16: 6.8,
            week20: 8.0,
            week24: 9.0,
            week36: 10.0,
            week48: 10.5
        },
        week12_data: {
            percent: 5.2,
            note: "12周减重约5.2%，起效相对温和"
        },
        indications: ['obesity', 'diabetes'],
        bmi_range: [27, 50],
        age_range: [18, 75],
        pricing: {
            monthly_original: 1800,
            monthly_insurance: 360,
            monthly_generic_expected: 180,
            generic_available: '已上市' // 华东医药等已上市
        },
        side_effects: {
            nausea: 39,
            diarrhea: 21,
            vomiting: 16,
            discontinuation: 8.5
        },
        advantages: ['价格最低', '仿制药已上市', '可及性高'],
        notes: '减重效果相对较弱但价格最便宜，适合预算有限的患者'
    }
];

// 计算BMI
function calculateBMI(weight, height) {
    if (!weight || !height) return null;
    const heightM = height / 100;
    return (weight / (heightM * heightM)).toFixed(1);
}

// 获取BMI分类
function getBMICategory(bmi) {
    if (bmi < 18.5) return { text: '偏瘦', color: 'bg-gray-500' };
    if (bmi < 24) return { text: '正常', color: 'bg-neon-green' };
    if (bmi < 28) return { text: '超重', color: 'bg-yellow-500' };
    if (bmi < 32) return { text: '肥胖', color: 'bg-orange-500' };
    return { text: '重度肥胖', color: 'bg-red-500' };
}

// 获取腰围状态
function getWaistStatus(waist, gender) {
    if (!waist || !gender) return { text: '--', risk: 'unknown' };
    const threshold = gender === 'male' ? 90 : 85;
    if (waist >= threshold) {
        return { text: '中心性肥胖', risk: 'high', color: 'text-neon-orange' };
    }
    return { text: '正常', risk: 'low', color: 'text-neon-green' };
}

// 匹配算法
function matchProducts(userProfile) {
    const matches = [];
    
    for (const product of products) {
        let score = 0;
        const reasons = [];
        
        // 1. BMI匹配
        if (userProfile.bmi >= product.bmi_range[0] && userProfile.bmi <= product.bmi_range[1]) {
            score += 30;
            reasons.push('BMI范围匹配');
        }
        
        // 2. 适应症匹配（关键）
        if (userProfile.conditions.length > 0) {
            const matchingIndications = userProfile.conditions.filter(c => 
                product.indications.includes(c)
            );
            if (matchingIndications.length > 0) {
                score += 40;
                reasons.push(`适应症匹配: ${matchingIndications.join(', ')}`);
                
                // 玛仕度肽对NASH特别加分
                if (userProfile.conditions.includes('nash') && product.id === 'mazdutide') {
                    score += 20;
                    reasons.push('脂肪肝首选 - GCG靶点优势');
                }
            }
        }
        
        // 3. 预算匹配
        if (userProfile.budget) {
            const monthlyCost = product.pricing.monthly_insurance || product.pricing.monthly_original;
            if (monthlyCost && monthlyCost <= userProfile.budget) {
                score += 15;
                reasons.push('预算内');
            }
        }
        
        // 4. 中心性肥胖 + 腰围改善
        if (userProfile.waistStatus?.risk === 'high' && product.id === 'tirzepatide') {
            score += 10;
            reasons.push('腰围改善佳');
        }
        
        // 5. 可及性
        if (product.pricing.monthly_insurance) {
            score += 5;
            reasons.push('已入医保');
        }
        
        matches.push({
            product,
            score,
            reasons,
            // 计算预期减重
            expectedLoss: calculateExpectedLoss(product, userProfile),
            // 计算费用
            cost: calculateCost(product, userProfile)
        });
    }
    
    // 按分数排序
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, 3); // 返回前3个
}

// 计算预期减重
function calculateExpectedLoss(product, userProfile) {
    const curve = product.weight_loss_curve;
    const duration = parseInt(userProfile.duration) || 48;
    
    // 找到最接近的时间点
    const weeks = Object.keys(curve).map(w => parseInt(w.replace('week', '')));
    const targetWeek = weeks.find(w => w >= duration) || weeks[weeks.length - 1];
    const loss = curve[`week${targetWeek}`];
    
    return {
        percent: loss,
        kg: (userProfile.weight * loss / 100).toFixed(1),
        week: targetWeek
    };
}

// 计算费用
function calculateCost(product, userProfile) {
    const duration = parseInt(userProfile.duration) || 48;
    const months = duration / 4;
    
    const pricing = product.pricing;
    const monthlyCost = pricing.monthly_insurance || pricing.monthly_original || 0;
    const total = monthlyCost * months;
    
    // 仿制药节省
    let genericSavings = 0;
    if (pricing.monthly_generic_expected) {
        const genericMonthly = pricing.monthly_generic_expected;
        genericSavings = (monthlyCost - genericMonthly) * months;
    }
    
    return {
        monthly: monthlyCost,
        total: total,
        genericMonthly: pricing.monthly_generic_expected,
        genericSavings: genericSavings,
        genericDate: pricing.generic_available
    };
}

// 生成减肥曲线数据
function generateCurveData(matches, userProfile) {
    const labels = ['起始', '4周', '8周', '12周', '24周', '36周', '48周', '52周'];
    const datasets = [];
    
    const colors = ['#00d4ff', '#8b5cf6', '#f59e0b'];
    
    matches.forEach((match, index) => {
        const product = match.product;
        const curve = product.weight_loss_curve;
        const startWeight = userProfile.weight;
        
        const data = [
            0, // 起始
            curve.week4,
            curve.week8,
            curve.week12,
            curve.week24,
            curve.week36 || (curve.week24 + (curve.week48 - curve.week24) * 0.5),
            curve.week48,
            curve.week52 || curve.week48
        ];
        
        datasets.push({
            label: product.name,
            data: data,
            borderColor: colors[index],
            backgroundColor: colors[index] + '20',
            tension: 0.4,
            fill: true
        });
    });
    
    return { labels, datasets };
}

// 主要计算函数
function calculateMatch() {
    // 获取用户输入
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const waist = parseFloat(document.getElementById('waist').value);
    const budgetSelect = document.getElementById('budget').value;
    const duration = document.getElementById('duration').value;
    
    // 验证必填
    if (!weight || !height) {
        alert('请填写体重和身高');
        return;
    }
    
    // 获取健康状况
    const conditions = Array.from(document.querySelectorAll('input[name="condition"]:checked'))
        .map(cb => cb.value);
    
    // 计算BMI
    const bmi = calculateBMI(weight, height);
    const bmiCategory = getBMICategory(bmi);
    const waistStatus = getWaistStatus(waist, gender);
    
    // 解析预算
    let budget = null;
    if (budgetSelect) {
        budget = budgetSelect === 'unlimited' ? 99999 : parseInt(budgetSelect);
    }
    
    // 用户画像
    const userProfile = {
        weight,
        height,
        bmi,
        age,
        gender,
        waist,
        waistStatus,
        conditions,
        budget,
        duration
    };
    
    // 显示结果区
    document.getElementById('results').classList.remove('hidden');
    
    // 更新BMI显示
    document.getElementById('bmiValue').textContent = bmi;
    document.getElementById('bmiCategory').textContent = bmiCategory.text;
    document.getElementById('bmiCategory').className = `mt-2 px-3 py-1 rounded-full text-sm font-medium inline-block ${bmiCategory.color}`;
    
    document.getElementById('targetWeight').textContent = (weight * 0.85).toFixed(1) + 'kg';
    document.getElementById('waistStatus').textContent = waistStatus.text;
    document.getElementById('waistStatus').className = `text-4xl font-bold mb-2 ${waistStatus.color}`;
    
    // 匹配产品
    const matches = matchProducts(userProfile);
    
    // 渲染推荐卡片
    renderRecommendations(matches, userProfile);
    
    // 渲染费用表
    renderCostTable(matches);
    
    // 渲染图表
    renderChart(matches, userProfile);
    
    // 滚动到结果
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
}

// 渲染推荐卡片
function renderRecommendations(matches, userProfile) {
    const container = document.getElementById('recommendations');
    
    container.innerHTML = matches.map((match, index) => {
        const product = match.product;
        const loss = match.expectedLoss;
        const cost = match.cost;
        const isBest = index === 0;
        
        const colors = ['from-neon-blue to-neon-purple', 'from-neon-purple to-pink-500', 'from-orange-400 to-yellow-500'];
        const rankEmoji = ['🥇', '🥈', '🥉'];
        
        return `
            <div class="${isBest ? 'best-match' : 'recommendation-card'} rounded-2xl p-6 card-hover transition relative overflow-hidden">
                ${isBest ? '<div class="absolute top-0 right-0 bg-gradient-to-l from-yellow-500 to-orange-500 text-dark-900 text-xs font-bold px-4 py-1 rounded-bl-lg">最佳匹配</div>' : ''}
                
                <div class="flex items-center gap-3 mb-4">
                    <div class="text-2xl">${rankEmoji[index]}</div>
                    <div>
                        <h3 class="text-xl font-bold text-white">${product.name}</h3>
                        <p class="text-sm text-gray-400">${product.brand} · ${product.company}</p>
                    </div>
                </div>
                
                <div class="mb-4">
                    <span class="inline-block bg-gradient-to-r ${colors[index]} text-dark-900 text-xs font-bold px-3 py-1 rounded-full">
                        ${product.type}
                    </span>
                    ${match.reasons.slice(0, 2).map(r => `<span class="inline-block bg-dark-700 text-gray-300 text-xs px-2 py-1 rounded ml-2">${r}</span>`).join('')}
                </div>
                
                <div class="grid grid-cols-3 gap-3 mb-4">
                    <div class="bg-dark-700/50 rounded-lg p-3 text-center">
                        <div class="text-xl font-bold text-neon-blue">${product.week12_data.percent}%</div>
                        <div class="text-xs text-gray-400">12周减重</div>
                        <div class="text-xs text-neon-blue mt-1">3个月</div>
                    </div>
                    <div class="bg-dark-700/50 rounded-lg p-3 text-center">
                        <div class="text-xl font-bold text-neon-green">${loss.percent}%</div>
                        <div class="text-xs text-gray-400">${loss.week}周减重</div>
                    </div>
                    <div class="bg-dark-700/50 rounded-lg p-3 text-center">
                        <div class="text-xl font-bold text-neon-orange">${loss.kg}kg</div>
                        <div class="text-xs text-gray-400">总体重下降</div>
                    </div>
                </div>
                
                <div class="bg-dark-700/50 rounded-lg p-3 mb-4">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm text-gray-400">月费用</span>
                        <span class="text-lg font-bold text-white">¥${cost.monthly}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-gray-400">总费用(${userProfile.duration/4}个月)</span>
                        <span class="text-lg font-bold text-neon-blue">¥${cost.total.toLocaleString()}</span>
                    </div>
                    ${cost.genericMonthly ? `
                        <div class="mt-2 pt-2 border-t border-dark-500 text-xs text-gray-500">
                            仿制药上市后可节省 ¥${cost.genericSavings.toLocaleString()}
                        </div>
                    ` : ''}
                </div>
                
                <div class="mb-4">
                    <p class="text-xs text-gray-400 mb-2">常见副作用发生率</p>
                    <div class="space-y-1">
                        <div class="flex justify-between text-xs">
                            <span class="text-gray-500">恶心</span>
                            <span class="text-yellow-400">${product.side_effects.nausea || '--'}%</span>
                        </div>
                        <div class="flex justify-between text-xs">
                            <span class="text-gray-500">腹泻</span>
                            <span class="text-yellow-400">${product.side_effects.diarrhea || '--'}%</span>
                        </div>
                        <div class="flex justify-between text-xs">
                            <span class="text-gray-500">停药率</span>
                            <span class="text-red-400">${product.side_effects.discontinuation || '--'}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="space-y-2">
                    ${product.advantages.map(adv => `
                        <div class="flex items-center gap-2 text-xs text-gray-300">
                            <span class="text-neon-green">✓</span>
                            ${adv}
                        </div>
                    `).join('')}
                </div>
                
                <div class="mt-4 pt-4 border-t border-dark-500">
                    <p class="text-xs text-gray-500 italic">${product.notes}</p>
                </div>
            </div>
        `;
    }).join('');
}

// 渲染费用表
function renderCostTable(matches) {
    const tbody = document.getElementById('costTable');
    
    tbody.innerHTML = matches.map(match => {
        const product = match.product;
        const cost = match.cost;
        
        return `
            <tr class="border-b border-dark-500">
                <td class="py-3 px-4">
                    <div class="font-medium text-white">${product.name}</div>
                    <div class="text-xs text-gray-500">${product.company}</div>
                </td>
                <td class="py-3 px-4 text-center text-gray-300">
                    ${cost.monthly ? `¥${cost.monthly}` : '未上市'}
                </td>
                <td class="py-3 px-4 text-center text-white font-medium">
                    ${cost.total ? `¥${cost.total.toLocaleString()}` : '--'}
                </td>
                <td class="py-3 px-4 text-center text-neon-green">
                    ${cost.monthly ? `¥${cost.monthly}` : '--'}
                </td>
                <td class="py-3 px-4 text-center">
                    ${cost.genericMonthly ? `
                        <div class="text-neon-orange">¥${cost.genericMonthly}/月</div>
                        <div class="text-xs text-gray-500">${cost.genericDate}</div>
                    ` : '<span class="text-gray-500">创新药</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

// 渲染图表
function renderChart(matches, userProfile) {
    const ctx = document.getElementById('weightLossChart').getContext('2d');
    
    // 销毁旧图表
    if (window.weightLossChartInstance) {
        window.weightLossChartInstance.destroy();
    }
    
    const curveData = generateCurveData(matches, userProfile);
    
    window.weightLossChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: curveData.labels,
            datasets: curveData.datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#9ca3af',
                        usePointStyle: true
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(26, 26, 37, 0.9)',
                    titleColor: '#fff',
                    bodyColor: '#9ca3af',
                    borderColor: 'rgba(0, 212, 255, 0.3)',
                    borderWidth: 1
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '体重下降 (%)',
                        color: '#9ca3af'
                    },
                    ticks: {
                        color: '#9ca3af'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: '#9ca3af'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}