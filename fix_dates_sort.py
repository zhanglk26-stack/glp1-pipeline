import json
import re

json_path = r"d:\Programs\AI-Workspace\glp1-pipeline\data\pipeline.json"

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Hardcode the accurate Chinese approval dates
approval_updates = {
    1: "2021年04月(糖尿病), 2024年06月(减重)", # 司美格鲁肽 (诺和诺德)
    2: "2024年05月(糖尿病), 2024年07月(减重)", # 替尔泊肽
    3: "2025年06月(肥胖), 2025年09月(糖尿病)", # 玛仕度肽
    4: "2019年02月(糖尿病)", # 度拉糖肽 (度易达中国上市时间)
    5: "2011年03月(糖尿病), 2023年03月(糖尿病-华东), 2023年07月(减重-华东)", # 利拉鲁肽
    6: "2025年01月(糖尿病)", # 依苏帕格鲁肽
    20: "2019年05月(糖尿病)", # 聚乙二醇洛塞那肽
    21: "2016年12月(糖尿病), 2023年07月(减重)", # 贝那鲁肽
    22: "2009年08月(糖尿病)", # 艾塞那肽 (百泌达中国上市时间)
    23: "2018年01月(糖尿病)", # 艾塞那肽微球 (百达扬中国上市)
    24: "2017年12月(糖尿病)", # 利司那肽 (利时敏中国上市)
    37: "2024年07月(糖尿病)", # 度拉糖肽 (信达)
    40: "2023年12月(糖尿病)", # 利拉鲁肽 (通化东宝)
    41: "2024年08月(糖尿病)", # 利拉鲁肽 (正大天晴)
    50: "2016年12月(糖尿病)", # 重组人胰高血糖素样肽 (仁会谊生泰同样是贝那鲁肽)
    52: "2025年01月(糖尿病)"  # 依苏帕格鲁肽
}

for product in data['products']:
    # Replace approval dates and default to missing for those not listed above
    if product['stage'] == '已上市':
        if product['id'] in approval_updates:
            product['approval_date'] = approval_updates[product['id']]

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# Fix app.js sorting logic
app_js_path = r"d:\Programs\AI-Workspace\glp1-pipeline\js\app.js"
with open(app_js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the specific block of approval_date sorting logic
sort_block_old = """        } else if (field === 'approval_date') {
            // First sort by stage (已上市 at the top)
            const stageA = stageWeights[a.stage] || 0;
            const stageB = stageWeights[b.stage] || 0;
            if (stageA !== stageB) {
                return stageA > stageB ? -1 : 1; 
            }
            // For 已上市, sort by approval year/date
            const dateA = a.approval_date ? parseInt(a.approval_date.match(/\d{4}/)?.[0] || '9999') : 9999;
            const dateB = b.approval_date ? parseInt(b.approval_date.match(/\d{4}/)?.[0] || '9999') : 9999;
            valA = dateA;
            valB = dateB;
        }"""

sort_block_new = """        } else if (field === 'approval_date') {
            // First sort by stage (已上市 at the top)
            const stageA = stageWeights[a.stage] || 0;
            const stageB = stageWeights[b.stage] || 0;
            if (stageA !== stageB) {
                return stageA > stageB ? -1 : 1; 
            }
            
            // For 已上市, extract the EARLIEST YYYYMM date for proper chronological sorting
            const extractEarliestDateStr = (dateStr) => {
                if (!dateStr || dateStr === '-') return "999999"; 
                // match all YYYY年MM月 or YYYY年
                const matches = [...dateStr.matchAll(/(\\d{4})年(?:(\\d{1,2})月)?/g)];
                if (matches.length === 0) return "999999";
                
                // Find minimum
                let minVal = "999999";
                for (const match of matches) {
                    const year = match[1];
                    const month = match[2] ? match[2].padStart(2, '0') : "12"; // default to end of year if no month
                    const formatted = year + month;
                    if (formatted < minVal) minVal = formatted;
                }
                return minVal;
            };
            
            const dateA = extractEarliestDateStr(a.approval_date);
            const dateB = extractEarliestDateStr(b.approval_date);
            
            valA = parseInt(dateA);
            valB = parseInt(dateB);
        }"""
        
content = content.replace(sort_block_old, sort_block_new)

# Make sure default sorting direction correctly targets "oldest dates first" (valA < valB applies ascending normally)
# Actually, the logic is: valA < valB return asc?-1:1. 
# It means low values go to top if asc is true. 9999 goes to bottom.
content = content.replace("state.sortDirection = field === 'approval_date' ? 'asc' : 'desc';", "state.sortDirection = field === 'approval_date' ? 'asc' : 'desc'; // 默认降序，但上市时间按升序（老产品在前）")

with open(app_js_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Dates formatted and sorting logic updated.")
