import json
import time
from duckduckgo_search import DDGS
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def fetch_news():
    with open('data/pipeline.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified = False
    
    with DDGS() as ddgs:
        for product in data['products']:
            if 'news' in product and len(product['news']) > 0:
                continue # Skip if already has news
                
            query = f"{product['name_cn']} {product['company']} GLP-1 新闻"
            logging.info(f"Fetching news for: {query}")
            
            try:
                # Get up to 3 news results
                results = list(ddgs.news(query, max_results=3, region='cn-zh'))
                
                news_items = []
                for r in results:
                    news_items.append({
                        'title': r.get('title', ''),
                        'url': r.get('url', ''),
                        'date': r.get('date', '')[:10] if r.get('date') else '',
                        'source': r.get('source', '')
                    })
                    
                product['news'] = news_items
                modified = True
                
                # Be nice to the API
                time.sleep(2)
                
            except Exception as e:
                logging.error(f"Error fetching {query}: {e}")
                product['news'] = [] # empty array on failure
                
    if modified:
        with open('data/pipeline.json', 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logging.info("Saved updated pipeline.json with news data.")
    else:
        logging.info("No updates needed.")

if __name__ == "__main__":
    fetch_news()
