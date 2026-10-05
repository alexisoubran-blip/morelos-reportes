"""Build the Google Reviews snapshot from one or more Apify JSON exports.

Usage: python scripts/build_google_reviews.py /path/to/export.json [...]
Only Google-native reviews are included. The newest scrape wins duplicate IDs.
No source export or reviewer profile metadata is published.
"""
import argparse
import collections
import hashlib
import json
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'morelos-reporte_online-mayo-julio-2026/google-reviews/data'
STORES = [
    ('ChIJe_1gShAUsocRtNB3nvrpIqo', '59th', '59th', 'OKC Metro'),
    ('ChIJH2iK-ccasocRP2rTaIMsWk8', '50th', '50th', 'OKC Metro'),
    ('ChIJOWQDigQQsocRudNPO_jvbJw', 'NW 23rd', 'nw-23rd', 'OKC Metro'),
    ('ChIJFeYUwCoFsocRjLPnXjpEgGI', 'MacArthur', 'macarthur', 'OKC Metro'),
    ('ChIJPz-0fc8UsocRa3ge8RIYY-w', 'Moore', 'moore', 'OKC Metro'),
    ('ChIJ5QvqHQDztocR320g9jBkP_Y', 'Admiral', 'admiral', 'Tulsa Metro'),
    ('ChIJOZEP_SXztocRixJvuAlytR0', 'Garnett', 'garnett', 'Tulsa Metro'),
    ('ChIJhc2fwrTttocRGOiI0W9qvsQ', 'Harvard', 'harvard', 'Tulsa Metro'),
    ('ChIJl5XiJLuNtocRM7RHNe89_jk', '129th', '129th', 'Tulsa Metro'),
    ('ChIJEeLYjmaTtocRhVOIcxrZJQY', 'Peoria', 'peoria', 'Tulsa Metro'),
    ('ChIJZ0Wa2cqNtocRIXOmWnWfvTc', 'Broken Arrow', 'broken-arrow', 'Tulsa Metro'),
]
TOPICS = {
    'Food service / comida preparada': r'food|comida|restaurant\w*|restaurante\w*|taqueria|taco\w*|tamale\w*|tamal\w*|deli|cocina|prepared|cooked|cocinad\w*|chicharron\w*|flauta\w*|burrito\w*|menudo|pozole|torta\w*',
    'Servicio y trato': r'service|servicio|staff|employee\w*|emplead\w*|personal|atencion|trato|friendly|amable\w*|rude|helpful|groser\w*|customer\s+service',
    'Surtido / variedad': r'selection|variety|variedad|surtido|assortment|product\w*|producto\w*|find|encuentr\w*',
    'Carnicería / carne': r'meat\w*|carne\w*|butcher\w*|carnicer\w*|beef|pollo|chicken|pork|cerdo|steak\w*|carnitas',
    'Frescos / produce': r'produce|fresh|fresc\w*|fruit\w*|fruta\w*|vegetable\w*|verdura\w*|aguacate\w*|avocado\w*',
    'Precio y valor': r'price\w*|precio\w*|expensive|caro\w*|cheap|barat\w*|value|valor|cost\w*|overpriced|affordable|economico\w*|oferta\w*',
    'Limpieza / higiene': r'clean\w*|limpi\w*|dirty|suci\w*|hygiene|higiene|sanitary|insalubre|smell\w*|olor\w*',
    'Panadería / postres': r'bakery|baked|bread\w*|pan|panader\w*|pastel\w*|cake\w*|dessert\w*|postre\w*|tres\s+leches|sweet\s+bread',
    'Checkout / cajas': r'checkout|cashier\w*|cajer\w*|caja\w*|register\w*|fila\w*|queue\w*|check\s+out',
    'Idioma / atención bilingüe': r'spanish|espanol|english|ingles|bilingual|bilingue|language|idioma',
    'Baños / acceso': r'bathroom\w*|restroom\w*|bano\w*|toilet\w*|wheelchair|discapaci\w*|accessible|accesib\w*',
}
# Canonical terms use union matching: at most one mention per review/concept.
TERMS = {
    'friendly': r'friendly|helpful|amable\w*',
    'mexican': r'mexican|mexican\w*|authentic|autentic\w*',
    'fresh': r'fresh|fresc\w*', 'produce': r'produce|fruit\w*|fruta\w*|vegetable\w*|verdura\w*',
    'rude': r'rude|groser\w*', 'bathroom': r'bathroom\w*|restroom\w*|bano\w*|toilet\w*',
    'tamales': r'tamale\w*|tamal\w*', 'tacos': r'taco\w*', 'deli': r'deli',
    'delicious': r'delicious|delicios\w*|sabros\w*|tasty|sabor',
    'clean': r'clean\w*|limpi\w*', 'prices': r'price\w*|precio\w*',
    'pan': r'bakery|pan|panader\w*|bread\w*',
}


def normalize(text):
    return ''.join(c for c in unicodedata.normalize('NFKD', text.lower()) if not unicodedata.combining(c))


def sentiment(row):
    return 'positive' if row['stars'] >= 4 else 'neutral' if row['stars'] == 3 else 'negative'


def tallies(rows):
    counts = collections.Counter(sentiment(r) for r in rows)
    result = {'scraped_reviews': len(rows), 'text_reviews': sum(bool((r.get('text') or '').strip()) for r in rows)}
    for name in ('positive', 'neutral', 'negative'):
        result[name + '_n'] = counts[name]
        result[name + '_pct'] = counts[name] / len(rows) if rows else 0
    dates = [r['publishedAtDate'][:10] for r in rows]
    result.update(first_date=min(dates), last_date=max(dates))
    return result


def mentions(rows, rules):
    result = {}
    for label, pattern in rules.items():
        regex = re.compile(r'\b(?:' + pattern + r')\b')
        matching = [r for r in rows if regex.search(normalize(r.get('text') or ''))]
        if matching:
            counts = collections.Counter(sentiment(r) for r in matching)
            result[label] = {'mentions': len(matching), **{s: counts[s] for s in ('positive', 'neutral', 'negative')}}
    return result


def write(name, data):
    (OUT / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('exports', nargs='+', type=Path)
    args = parser.parse_args()
    unique, sources, input_rows = {}, [], 0
    for path in args.exports:
        raw = path.read_bytes()
        records = json.loads(raw)
        sources.append({'filename': path.name, 'sha256': hashlib.sha256(raw).hexdigest(), 'rows': len(records)})
        for r in records:
            input_rows += 1
            if r.get('reviewOrigin') != 'Google':
                raise ValueError('Only Google reviews are accepted')
            if not r.get('reviewId') or r.get('stars') not in (1, 2, 3, 4, 5):
                raise ValueError('Review ID and valid individual stars are required')
            key = (r['placeId'], r['reviewId'])
            if key not in unique or r['scrapedAt'] >= unique[key]['scrapedAt']:
                unique[key] = r
    rows = list(unique.values())
    groups = collections.defaultdict(list)
    for row in rows:
        groups[row['placeId']].append(row)
    if set(groups) != {s[0] for s in STORES}:
        raise ValueError('Expected exactly the 11 known Morelos place IDs')
    stores, listening = [], {}
    for pid, branch, slug, market in STORES:
        rs = sorted(groups[pid], key=lambda r: (r['publishedAtDate'], r['reviewId']), reverse=True)
        public = max(rs, key=lambda r: r['scrapedAt'])
        n = public['reviewsCount']
        counts = tallies(rs)
        stores.append(dict(branch=branch, slug=slug, place_id=pid, title=public['title'], city=public['city'],
                           address=public['address'], market=market, rating=public['totalScore'], google_total=n,
                           coverage=len(rs) / n, snapshot_at=public['scrapedAt'],
                           positive_text_count=sum(sentiment(r) == 'positive' and bool(r.get('text')) for r in rs),
                           negative_text_count=sum(sentiment(r) == 'negative' and bool(r.get('text')) for r in rs), **counts))
        topics, terms = mentions(rs, TOPICS), mentions(rs, TERMS)
        listening[branch] = {'text_reviews': counts['text_reviews'], 'topics': topics,
                             'terms': [{'term': k, **v} for k, v in terms.items()]}
        comments = {'branch': branch}
        for label, key in [('positive', 'positive'), ('neutral', 'mixed'), ('negative', 'negative')]:
            selected = [r for r in rs if sentiment(r) == label and (r.get('text') or '').strip()][:10]
            comments[key] = [dict(date=r['publishedAtDate'][:10], stars=r['stars'], reviewer=r['name'],
                                  text=r['text'], url=r['reviewUrl']) for r in selected]
        write('comments/' + slug + '.json', comments)
    overall = tallies(rows)
    overall.update(unique_reviews=len(rows), google_total_dataset_stores=sum(s['google_total'] for s in stores),
                   stores_in_csv=len(stores), official_stores=11)
    overall['coverage'] = len(rows) / overall['google_total_dataset_stores']
    markets = []
    for market in ('OKC Metro', 'Tulsa Metro'):
        ss = [s for s in stores if s['market'] == market]
        mr = [r for s in ss for r in groups[s['place_id']]]
        n = sum(s['google_total'] for s in ss)
        markets.append(dict(market=market, stores=len(ss), google_total=n,
                            rating_weighted=sum(s['rating'] * s['google_total'] for s in ss) / n, **tallies(mr)))
    topics = [{'topic': k, 'mentions': v['mentions'], **{s + '_n': v[s] for s in ('positive', 'neutral', 'negative')},
               'negative_pct': v['negative'] / v['mentions']} for k, v in mentions(rows, TOPICS).items()]
    topics.sort(key=lambda v: (-v['mentions'], v['topic']))
    snapshot = max(r['scrapedAt'] for r in rows)
    metadata = dict(snapshot_at=snapshot, source_files=sources, input_rows=input_rows,
                    duplicates_removed=input_rows - len(rows), sentiment_method='4–5 stars positive; 3 neutral; 1–2 negative',
                    topics_method='Bilingual keyword rules, at most one mention per review/topic. Topic polarity uses the review stars, not aspect sentiment.',
                    date_basis='Review dates displayed in UTC as exported by Apify')
    write('summary.json', dict(metadata=metadata, overall=overall, markets=markets, topics=topics, stores=stores))
    write('listening-mini.json', dict(metadata=metadata, stores=listening))
    print(json.dumps(overall, ensure_ascii=False))


if __name__ == '__main__':
    main()
