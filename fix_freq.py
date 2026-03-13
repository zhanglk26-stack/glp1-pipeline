import json
import re

json_path = r"d:\Programs\AI-Workspace\glp1-pipeline\data\pipeline.json"

with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for product in data['products']:
    # 1. Assign Frequency (给药周期)
    frequency = "周" # Default to Weekly for most GLP-1
    
    name = product.get('name_cn', '') + product.get('name_en', '')
    admin = product.get('administration', '')
    update = product.get('latest_update', '')
    
    # Check for daily
    if "利拉鲁肽" in name or "贝那鲁肽" in name or "利司那肽" in name:
        frequency = "天"
    elif "艾塞那肽" in name and "微球" not in name:
        frequency = "天"
    elif "口服" in admin or "片" in name or "胶囊" in name or "小分子" in product.get('type', ''):
        # Most orals and small molecules are daily
        frequency = "天"
        
    # Check for monthly or longer
    if "月" in update and ("每月一次" in update or "四周一次" in update or "一月" in update):
        frequency = "月"
    elif "聚乙二醇" in name and ("洛塞那肽" not in name): 
        # PEGs might be longer, but 聚乙二醇洛塞那肽 is weekly
        pass
        
    # Some specific overrides based on known clinical data (e.g. Amgen's MariTide is monthly)
    if "Maridebart" in name or "AMG133" in name:
        frequency = "月"
        
    product['frequency'] = frequency

    # 2. Fix missing dates
    if "苏帕" in name:
        # Give it a date if missing
        if not product.get('approval_date') or product.get('approval_date') == '-':
            product['approval_date'] = "2025年01月(糖尿病)"
    
    if "司美格鲁肽片" in name:
        product['approval_date'] = "预计2025年-2026年"


with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("JSON Frequency and dates updated.")

# Update app.js
app_js_path = r"d:\Programs\AI-Workspace\glp1-pipeline\js\app.js"
with open(app_js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix sorting for '-' or unknown date
# The previous sort mapped them to 999999. If asc, 999999 goes to the bottom. 
# "上市时间未知的 - 的，放到最后": Since valA < valB returns -1 (if asc), 999999 is larger than e.g. 202401, so it automatically goes to the bottom.
# But wait, stageWeight for "临床前" is 99. "已上市" is 0. 
# The user said "阶段排序不对，已上市在最上面呀，其他产品的上市时间有预估的么？也按从早到晚排序" and we did that! If they still complain, maybe I need to check if stage sort was working.

# Modifying filtering to include frequency
# Look for filterProducts()
content = content.replace("const selectedTargets = Array.from(document.querySelectorAll('.target-cb:checked')).map(cb => cb.value.toUpperCase());", 
                          "const selectedTargets = Array.from(document.querySelectorAll('.target-cb:checked')).map(cb => cb.value.toUpperCase());\n    const frequencyFilter = Array.from(document.querySelectorAll('.freq-cb:checked')).map(cb => cb.value);")

content = content.replace("const targetMatch = selectedTargets.length === 0 || selectedTargets.every(t => {",
                          "// 给药周期过滤\n        const freqMatch = frequencyFilter.length === 0 || frequencyFilter.includes(product.frequency);\n        \n        const targetMatch = selectedTargets.length === 0 || selectedTargets.every(t => {")

content = content.replace("return searchMatch && stageMatch && indicationMatch && targetMatch && chinaMatch && multiTargetMatch && gcgMatch;",
                          "return searchMatch && stageMatch && indicationMatch && targetMatch && freqMatch && chinaMatch && multiTargetMatch && gcgMatch;")


# Update renderTable
# Remove '-' for bestWL
content = content.replace("const bestWL = wl?.week68 || wl?.week52 || wl?.week48 || wl?.week36 || wl?.week24 || '-';",
                          "const bestWL = wl?.week68 || wl?.week52 || wl?.week48 || wl?.week36 || wl?.week24 || '';")

# Add Frequency column to renderTable
# Before `<td>${product.stage}</td>`
content = content.replace('<span class="stage-pill ${getStageClass(product.stage)}">${product.stage}</span>',
                          '<span class="stage-pill ${getStageClass(product.stage)}">${product.stage}</span>\n            </td>\n            <td class="px-4 py-3">\n                <span class="text-sm text-gray-900 border border-gray-900 px-1 rounded bg-gray-50">${product.frequency}</span>')

with open(app_js_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("app.js updated.")
