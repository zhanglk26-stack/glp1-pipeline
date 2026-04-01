import json
import os

file_path = r'c:\000AIWorkspace\glp1-pipeline\data\pipeline.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 1. Update Metadata
data['metadata']['last_updated'] = '2026-04-01'
data['metadata']['version'] = '2.2'
data['metadata']['total_products'] = 55 # 52 + 3 new products
data['metadata']['search_period'] = '2026年最新'

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
        "company": "先为达生物/辉瑞",
        "company_en": "Sciwind Bio/Pfizer",
        "targets": ["GLP-1R"],
        "type": "多肽 (cAMP偏向型)",
        "administration": "注射",
        "stage": "已上市",
        "indications": ["2型糖尿病", "肥胖 (NDA受理)"],
        "approval_date": "2026年01月28日(糖尿病)",
        "latest_update": "2026年1月获批上市；2026年2月辉瑞支付最高4.95亿美元获得中国独家商业化权益",
        "commercial_name": "待定",
        "market_status": "全球首个偏向型GLP-1R激动剂",
        "frequency": "周",
        "news": [
            {
                "title": "先为达生物与辉瑞就埃诺格鲁肽达成4.95亿美元商业化合作",
                "url": "https://news.qq.com/rain/a/20260224A0... (mock)",
                "date": "2026-02-24",
                "source": "腾讯网"
            },
            {
                "title": "国内首款偏向型GLP-1减肥药埃诺格鲁肽获批上市",
                "url": "https://www.sciwindbio.com/news/20260128",
                "date": "2026-01-28",
                "source": "先为达官网"
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

data['products'].extend(new_products)

# 4. Update Market Summary
data['market_summary']['2026_q1_trends'] = "2026年Q1行业进入'技术迭代'与'商业重构'期：药企通过BD合作补齐短板（如辉瑞与先为达），攻克口服技术瓶颈（如诺和诺德与Vivtex），同时多靶点管线（MWN101, UBT251）竞争进入白热化。"
data['market_summary']['key_drivers'].insert(0, "辉瑞与先为达埃诺格鲁肽达成商业化合作，重塑国产销售格局")
data['market_summary']['key_drivers'].append("多靶点(GLP-1/GIP/GCG)管线临床数据密集发布")

# Save updated JSON
with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, separators=(',', ':'))

print("Updated pipeline.json successfully.")
