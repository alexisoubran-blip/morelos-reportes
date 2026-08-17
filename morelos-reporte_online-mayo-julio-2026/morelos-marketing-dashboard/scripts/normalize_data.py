#!/usr/bin/env python3
from __future__ import annotations
import argparse, csv, json, re
from pathlib import Path
from datetime import datetime, timedelta
import pandas as pd

REPORT_START = pd.Timestamp('2026-06-01')
EXPORT_START = pd.Timestamp('2026-05-01')
EXPORT_END = pd.Timestamp('2026-07-31')


def num(v):
    try:
        if pd.isna(v): return 0.0
        if isinstance(v, str):
            v = v.replace('$','').replace(',','').strip()
            if not v: return 0.0
        return float(v)
    except Exception:
        return 0.0


def text(v):
    return '' if pd.isna(v) else str(v).strip()


def load_taxonomy(path: Path):
    cfg = json.loads(path.read_text(encoding='utf-8'))
    return cfg


def classify(value: str, cfg):
    s = (value or '').lower()
    for rule in cfg['rules']:
        if any(k.lower() in s for k in rule['keywords']):
            return rule['group']
    return 'Otros'


def agency_from_name(name: str):
    n = (name or '').strip().upper()
    if n.startswith('WDM'): return 'WDM'
    if n.startswith('SENSIS'): return 'SENSIS'
    return 'UNKNOWN'


def parse_fb_ig_follows(path: Path, platform: str):
    df = pd.read_csv(path, encoding='utf-16', skiprows=2)
    df.columns = ['Date','Primary']
    out=[]
    for _,r in df.iterrows():
        d = pd.to_datetime(r['Date'], errors='coerce')
        if pd.isna(d): continue
        out.append({'date': d.date().isoformat(), 'platform': platform, 'follows': int(num(r['Primary']))})
    return out


def parse_meta(path: Path, cfg):
    df = pd.read_csv(path, encoding='utf-8-sig')
    numeric_cols=['Amount spent (USD)','Impressions','Link clicks','Clicks (all)','Reach','Results','Frequency']
    for c in numeric_cols:
        if c in df.columns: df[c]=pd.to_numeric(df[c],errors='coerce').fillna(0)
    rows=[]
    for campaign, g in df.groupby('Campaign name', dropna=False):
        campaign=text(campaign)
        indicators=sorted({text(x) for x in g.get('Result indicator',[]) if text(x)})
        rows.append({
            'platform':'Meta',
            'agency':agency_from_name(campaign),
            'campaign_group':classify(campaign, cfg),
            'campaign_name':campaign,
            'reporting_start': text(g['Reporting starts'].iloc[0]),
            'reporting_end': text(g['Reporting ends'].iloc[0]),
            'spend': round(float(g['Amount spent (USD)'].sum()),2),
            'impressions': int(g['Impressions'].sum()),
            'link_clicks': int(g['Link clicks'].sum()),
            'clicks_all': int(g['Clicks (all)'].sum()),
            'reach_sum_non_dedup': int(g['Reach'].sum()),
            'results_mixed': round(float(g['Results'].sum()),2),
            'result_indicators': indicators,
            'ads': int(len(g)),
            'date_grain':'aggregate_export_period'
        })
    return rows


def parse_google(path: Path):
    df=pd.read_csv(path,encoding='utf-8-sig')
    out=[]
    for _,r in df.iterrows():
        raw=text(r['Week']).replace('Week of ','')
        d=pd.to_datetime(raw,errors='coerce')
        if pd.isna(d): continue
        out.append({
            'week_start':d.date().isoformat(),
            'platform':'Google',
            'agency':'WDM' if d >= REPORT_START else 'SENSIS',
            'spend':round(num(r['Cost']),2),
            'date_grain':'week',
            'campaign_group':None
        })
    return out


def safe_excerpt(v, n=110):
    s=' '.join(text(v).split())
    return s[:n] + ('…' if len(s)>n else '')


def parse_fb_content(path: Path, cfg):
    df=pd.read_csv(path,encoding='utf-8-sig')
    out=[]
    for _,r in df.iterrows():
        d=pd.to_datetime(r.get('Publish time'), errors='coerce')
        if pd.isna(d): continue
        source = text(r.get('Title')) or text(r.get('Description'))
        interactions=num(r.get('Reactions, Comments and Shares'))
        if not interactions:
            interactions=num(r.get('Reactions'))+num(r.get('Comments'))+num(r.get('Shares'))
        out.append({
            'date':d.date().isoformat(),
            'platform':'Facebook',
            'campaign_group':classify(source,cfg),
            'format': text(r.get('Post type')) or ('Video' if num(r.get('Duration (sec)'))>0 else 'Post'),
            'label':safe_excerpt(source),
            'url':text(r.get('Permalink')),
            'views':int(num(r.get('Views'))),
            'reach':int(num(r.get('Reach'))),
            'interactions':int(interactions),
            'boosted_views':int(num(r.get('Views from Boosted posts'))),
            'organic_views':int(num(r.get('Views from Organic posts'))),
            'boosted_reach':int(num(r.get('Reach from Boosted posts'))),
            'organic_reach':int(num(r.get('Reach from Organic posts'))),
            'follows_from_content':0,
            'metric_basis':'lifetime_for_content_published_in_period'
        })
    return out


def parse_ig_content(path: Path, cfg):
    df=pd.read_csv(path,encoding='utf-8-sig')
    out=[]
    for _,r in df.iterrows():
        d=pd.to_datetime(r.get('Publish time'), errors='coerce')
        if pd.isna(d): continue
        source=text(r.get('Description'))
        interactions=num(r.get('Likes'))+num(r.get('Shares'))+num(r.get('Comments'))+num(r.get('Saves'))
        out.append({
            'date':d.date().isoformat(),
            'platform':'Instagram',
            'campaign_group':classify(source,cfg),
            'format':text(r.get('Post type')) or ('Video' if num(r.get('Duration (sec)'))>0 else 'Post'),
            'label':safe_excerpt(source),
            'url':text(r.get('Permalink')),
            'views':int(num(r.get('Views'))),
            'reach':int(num(r.get('Reach'))),
            'interactions':int(interactions),
            'boosted_views':None,
            'organic_views':None,
            'boosted_reach':None,
            'organic_reach':None,
            'follows_from_content':int(num(r.get('Follows'))),
            'metric_basis':'lifetime_for_content_published_in_period'
        })
    return out


def extract_ga4_tables(path: Path):
    lines=path.read_text(encoding='utf-8-sig').splitlines()
    tables=[]
    i=0
    while i < len(lines):
        line=lines[i].strip()
        if line and not line.startswith('#') and ',' in line:
            header=next(csv.reader([line]))
            data=[]
            j=i+1
            while j < len(lines):
                l=lines[j].strip()
                if not l or l.startswith('#'):
                    break
                row=next(csv.reader([l]))
                if len(row)!=len(header):
                    break
                data.append(row)
                j+=1
            tables.append((header,data))
            i=max(j,i+1)
        else:
            i+=1
    return tables


def nth_to_date(n):
    try: return (EXPORT_START + pd.Timedelta(days=int(n))).date().isoformat()
    except Exception: return None


def parse_ga4(acq_path: Path, eng_path: Path):
    daily={}
    channels={}
    google_campaigns=[]
    events=[]
    pages=[]
    for header,data in extract_ga4_tables(acq_path):
        key='|'.join(header)
        if header[0]=='Nth day' and len(header)==2 and header[1] in ('Active users','New users'):
            field='active_users' if header[1]=='Active users' else 'new_users'
            for r in data:
                d=nth_to_date(r[0]);
                if not d: continue
                daily.setdefault(d,{'date':d})[field]=num(r[1])
        elif header[0]=='First user primary channel group (Default Channel Group)':
            channels['new_users_by_first_channel']=[{'channel':r[0],'value':num(r[1])} for r in data]
        elif header[0]=='Session primary channel group (Default Channel Group)':
            channels['sessions_by_channel']=[{'channel':r[0],'value':num(r[1])} for r in data]
        elif header[0]=='Session Google Ads campaign':
            google_campaigns=[{'campaign':r[0],'sessions':num(r[1])} for r in data]
        elif header[0]=='Session manual source':
            channels['sessions_by_source']=[{'source':r[0],'value':num(r[1])} for r in data]
    metric_map={
        'Average engagement time per active user':'avg_engagement_time_per_active_user',
        'Engaged sessions per active user':'engaged_sessions_per_active_user',
        'Average engagement time per session':'avg_engagement_time_per_session',
        'Views':'views',
        'Event count':'event_count'
    }
    for header,data in extract_ga4_tables(eng_path):
        if header[0]=='Nth day' and len(header)==2 and header[1] in metric_map:
            field=metric_map[header[1]]
            for r in data:
                d=nth_to_date(r[0]);
                if not d: continue
                daily.setdefault(d,{'date':d})[field]=num(r[1])
        elif header[0]=='Event name':
            events=[{'event':r[0],'count':num(r[1])} for r in data]
        elif header[0]=='Page title and screen class':
            pages=[{'page':r[0],'views':num(r[1])} for r in data]
    for d in daily.values():
        for f in ['active_users','new_users','avg_engagement_time_per_active_user','engaged_sessions_per_active_user','avg_engagement_time_per_session','views','event_count']:
            d.setdefault(f,0)
    return {
        'daily':sorted(daily.values(),key=lambda x:x['date']),
        'channels':channels,
        'google_campaigns':google_campaigns,
        'events':events,
        'pages':pages
    }


def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--source-dir',required=True)
    ap.add_argument('--out',required=True)
    ap.add_argument('--taxonomy',required=True)
    args=ap.parse_args()
    src=Path(args.source_dir); out=Path(args.out); cfg=load_taxonomy(Path(args.taxonomy))
    payload={
        'metadata':{
            'brand':'Supermercados Morelos',
            'report':'Marketing Overview',
            'agency':'WDM',
            'agency_start':'2026-06-01',
            'export_start':'2026-05-01',
            'export_end':'2026-07-31',
            'generated_at':datetime.now().isoformat(timespec='seconds'),
            'currency':'USD',
            'notes':[
                'WDM entra en junio de 2026; Sensis se conserva como owner distinto.',
                'Meta Ads recibido está agregado del 1 mayo al 31 julio: no permite semana/mes exactos.',
                'Los posts de Facebook e Instagram usan métricas Lifetime del contenido publicado en el periodo.',
                'FB Reels no se suma a FB Posts para evitar duplicidad.',
                'Google Ads tiene inversión semanal, sin campaña ni métricas de eficiencia en este export.'
            ]
        },
        'taxonomy':cfg['campaign_groups'],
        'availability':{
            'sales':False,'offline':False,'listening':False,
            'meta_date_grain':'aggregate_export_period',
            'google_date_grain':'week',
            'social_metric_basis':'lifetime_for_content_published_in_period',
            'ga4_daily':True
        },
        'paid':{
            'meta_campaigns':parse_meta(src/'Meta Ads(1).csv',cfg),
            'google_weekly':parse_google(src/'Google Ads(4).csv')
        },
        'social':{
            'follows_daily':parse_fb_ig_follows(src/'FB Follows.csv','Facebook') + parse_fb_ig_follows(src/'IG Follows.csv','Instagram'),
            'content':parse_fb_content(src/'FB Social Media Posts .csv',cfg) + parse_ig_content(src/'IG Social Media Organic n Boosts.csv',cfg)
        },
        'analytics':parse_ga4(src/'Acquisition_overview.csv',src/'GA4 Engagement.csv')
    }
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(f'Wrote {out} ({out.stat().st_size/1024:.1f} KB)')

if __name__=='__main__': main()
