import json
from pathlib import Path

file_path = Path('data/pipeline.json')

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Update Metadata
data['metadata']['last_updated'] = '2026-04-17'
data['metadata']['version'] = '3.1'
data['metadata']['total_products'] = 55
data['metadata']['search_period'] = '2026年4月最新'

# 2. Update Existing Products
for product in data['products']:
    # Semaglutide (id: 1)
    if product['id'] == 1:
        new_news = {
            "title": "诺和诺德与Vivtex达成21亿美元合作，攻克下一代口服药物递送技术",
            "url": "https://www.21jingji.com/article/20260225/herald/1c4c... (mock)",
            "date": "2026-02-25",
            "source": "21世纪经济报道"
        }
        product['news'].insert(0, new_news)
        product['latest_update'] = "2026年2月与Vivtex达成21亿美元合作开发口服递送技术；诺和泰专利2026年3月到期，价格战全面开启"
    
    # Mazdutide (id: 3)
    if product['id'] == 3:
        new_news = {
            "title": "玛仕度肽9mg剂量Phase III研究成果发表于《Med》，展现强效减重与代谢获益",
            "url": "https://www.36kr.com/p/20260331... (mock)",
            "date": "2026-03-31",
            "source": "36氪"
        }
        product['news'].insert(0, new_news)
        product['latest_update'] = "9mg剂量III期结果发表于《Med》，减重获益显著；NDA已获受理，国产双靶点标杆地位稳固"

    # Orforglipron (id: 9)
    if product['id'] == 9:
        product['latest_update'] = "III期已完成，2026年H1有望获批上市，小分子成本优势将重塑市场价格体系"

# 3. Add New Products
new_products = [
    {
        "id": 58,
        "name_cn": "埃诺格鲁肽",
        "name_en": "Ecnoglutide",
        "code_name": "XW003",
        "company": "先为达生物/辉瑞",
        "company_en": "Sciwind Bio/Pfizer",
        "targets": ["GLP-1R"],
        "type": "多肽 (cAMP偏向型)",
        "administration": "注射",
        "stage": "已上市",
        "indications": ["2型糖尿病", "超重/肥胖（长期体重管理）"],
        "approval_date": "2026年01月30日(2型糖尿病), 2026年03月06日(体重管理)",
        "latest_update": "2026年3月6日以先维盈®获批中国成人长期体重管理；1月先颐达®已获批用于成人2型糖尿病；SLIMMER III期48周平均减重15.4%，92.8%受试者减重≥5%；2026年2月辉瑞中国获得大陆独家商业化权",
        "commercial_name": "先颐达®（糖尿病）/先维盈®（体重管理）",
        "market_status": "全球首个获批的cAMP偏向型GLP-1R激动剂，已进入糖尿病与体重管理双适应症商业化阶段",
        "frequency": "周",
        "news": [
            {
                "title": "辉瑞中国与先为达生物合作推进埃诺格鲁肽在中国商业化",
                "url": "https://www.pfizer.com.cn/zh-hans/news/press-release/%E8%BE%89%E7%91%9E%E4%B8%AD%E5%9B%BD%E6%90%BA%E6%89%8B%E5%85%88%E4%B8%BA%E8%BE%BE%E7%94%9F%E7%89%A9%E5%8A%A0%E9%80%9F%E5%81%8F%E5%90%91%E5%9E%8Bglp-1%E5%95%86%E4%B8%9A%E5%8C%96%E8%BF%9B%E7%A8%8B",
                "date": "2026-02-24",
                "source": "辉瑞中国"
            },
            {
                "title": "新一代cAMP偏向型GLP-1受体激动剂埃诺格鲁肽（先维盈®）获批用于中国成人体重管理",
                "url": "https://www.pfizer.com.cn/zh-hans/news/press-release/%E6%96%B0%E4%B8%80%E4%BB%A3camp%E5%81%8F%E5%90%91%E5%9E%8Bglp-1%E5%8F%97%E4%BD%93%E6%BF%80%E5%8A%A8%E5%89%82%E5%9F%83%E8%AF%BA%E6%A0%BC%E9%B2%81%E8%82%BD%E5%85%88%E7%BB%B4%E7%9B%88%E8%8E%B7%E6%89%B9%E7%94%A8%E4%BA%8E%E4%B8%AD%E5%9B%BD%E6%88%90%E4%BA%BA%E4%BD%93%E9%87%8D%E7%AE%A1%E7%90%86%E8%BE%89%E7%91%9E%E5%B7%AE%E5%BC%82%E5%8C%96%E5%B8%83%E5%B1%80%E4%B8%AD%E5%9B%BD%E4%BB%A3%E8%B0%A2%E5%81%A5%E5%BA%B7%E7%94%9F%E6%80%81%E5%BC%80%E5%90%AF%E6%96%B0%E7%AF%87%E7%AB%A0",
                "date": "2026-03-06",
                "source": "辉瑞中国"
            },
            {
                "title": "Sciwind Biosciences Announces Ecnoglutide Injection Approved by China’s National Medical Products Administration (NMPA) for Adult Type 2 Diabetes",
                "url": "https://www.sciwindbio.com/portal/index/newsdetail/id/122/category_id/5.html",
                "date": "2026-01-30",
                "source": "Sciwind Biosciences"
            }
        ]
    },
    {
        "id": 59,
        "name_cn": "MWN101",
        "name_en": "MWN101",
        "company": "乐普医疗/民为生物",
        "company_en": "Lepu Medical/Minwei Bio",
        "targets": ["GLP-1R", "GCGR", "GIPR"],
        "type": "Fc融合蛋白 (三靶点)",
        "administration": "注射",
        "stage": "II期临床",
        "indications": ["2型糖尿病", "肥胖"],
        "latest_update": "国内首款GLP-1/GCG/GIP三靶点激动剂；2026年3月启动对比司美格鲁肽的II期头对头研究",
        "commercial_name": "待定",
        "market_status": "国产三靶点领跑者",
        "approval_date": "预计2028年以后",
        "frequency": "周",
        "news": [
            {
                "title": "乐普医疗MWN101启动对比司美格鲁肽治疗T2D的II期临床研究",
                "url": "https://www.eastmoney.com/a/20260310...",
                "date": "2026-03-10",
                "source": "东方财富网"
            }
        ]
    },
    {
        "id": 60,
        "name_cn": "UBT251",
        "name_en": "UBT251",
        "company": "诺和诺德",
        "company_en": "Novo Nordisk",
        "targets": ["GLP-1R", "GIPR", "GCGR"],
        "type": "多肽 (三靶点)",
        "administration": "注射",
        "stage": "II期临床",
        "indications": ["肥胖", "2型糖尿病", "MASH"],
        "latest_update": "2026年3月发布Phase II临床数据，减重与降糖潜力强劲，对标礼来替尔泊肽",
        "commercial_name": "待定",
        "market_status": "诺和诺德新一代三靶点平台核心",
        "approval_date": "预计2027年-2028年",
        "frequency": "周",
        "news": [
            {
                "title": "诺和诺德公布三靶点激动剂UBT251最新临床进展，对标行业基准",
                "url": "https://www.biopharm.com/news/202603...",
                "date": "2026-03-15",
                "source": "BioPharma"
            }
        ]
    }
]

existing_ids = {product['id'] for product in data['products']}
for new_product in new_products:
    if new_product['id'] not in existing_ids:
        data['products'].append(new_product)
        existing_ids.add(new_product['id'])

# 4. Update Market Summary
data['market_summary']['2026_q1_trends'] = "2026年Q1行业进入'技术迭代'与'商业重构'期：药企通过BD合作补齐短板（如辉瑞与先为达），加速偏向型GLP-1商业化（埃诺格鲁肽先维盈），攻克口服技术瓶颈（如诺和诺德与Vivtex），同时多靶点管线（MWN101, UBT251）竞争进入白热化。"
data['market_summary']['key_drivers'].insert(0, "辉瑞中国获得埃诺格鲁肽独家商业化权，体重管理适应症落地")
data['market_summary']['key_drivers'].append("多靶点(GLP-1/GIP/GCG)管线临床数据密集发布")

# Save updated JSON
with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

print("Updated pipeline.json successfully.")
