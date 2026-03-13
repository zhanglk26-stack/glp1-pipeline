import json
import re

def standardize_names():
    with open('data/pipeline.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified = 0
    
    for product in data['products']:
        name_cn = product.get('name_cn', '')
        commercial_name = product.get('commercial_name', '')
        company = product.get('company', '')
        
        # specific company fixes as requested:
        if company == '仁会生物':
            # 贝那鲁肽 -> 贝那鲁肽（谊生泰）
            if '贝那鲁肽' in name_cn and '谊生泰' not in name_cn:
                product['name_cn'] = '贝那鲁肽（谊生泰）'
                modified += 1
        elif '阿斯利康' in company:
            # 艾塞那肽 -> 艾塞那肽（百泌达）
            # 艾塞那肽微球 -> 艾塞那肽微球（百达扬）
             if name_cn == '艾塞那肽' and commercial_name and '百泌达' in commercial_name:
                 product['name_cn'] = '艾塞那肽（百泌达）'
                 modified += 1
             elif name_cn == '艾塞那肽微球' and commercial_name and '百达扬' in commercial_name:
                 product['name_cn'] = '艾塞那肽微球（百达扬）'
                 modified += 1
        elif company == '翰森制药' or company == '瀚森制药':
            # 聚乙二醇洛塞那肽 -> 聚乙二醇洛塞那肽（孚来美）
            if name_cn == '聚乙二醇洛塞那肽' and commercial_name and '孚来美' in commercial_name:
                 product['name_cn'] = '聚乙二醇洛塞那肽（孚来美）'
                 modified += 1
        
        # General pattern: if commercial_name is present and name_cn doesn't have parens
        # We try to append the first part of commercial name if it looks like a brand
        elif commercial_name and commercial_name != '待定' and '（' not in name_cn and '(' not in name_cn:
            # Extract first chinese brand name before slash or english name
            brand = commercial_name.split('/')[0].split(';')[0].strip()
            if brand and brand != commercial_name and not brand.isascii(): # ensure it looks like a brand name
                product['name_cn'] = f"{name_cn}（{brand}）"
                modified += 1
            elif brand and brand == commercial_name and not brand.isascii():
                product['name_cn'] = f"{name_cn}（{brand}）"
                modified += 1
                
    if modified > 0:
        with open('data/pipeline.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Standardized {modified} product names.")
    else:
        print("No products needed standardization.")

if __name__ == "__main__":
    standardize_names()
