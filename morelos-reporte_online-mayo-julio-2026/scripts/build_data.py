from __future__ import annotations
import json, math
from pathlib import Path
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data' / 'source' / 'morelos_normalized.csv'
OVERRIDES = json.loads((ROOT / 'data' / 'agency-overrides.json').read_text(encoding='utf-8')).get('overrides', {})

def n(v):
    if pd.isna(v): return 0
    if isinstance(v,(int,float)) and math.isfinite(float(v)): return round(float(v),6)
    return v

def agency(campaign, platform):
    if campaign in OVERRIDES: return OVERRIDES[campaign], 'Manual override'
    c=str(campaign or '').lower()
    if 'wdm' in c:return 'WDM','Explicit'
    if 'sensis' in c:return 'Sensis','Explicit'
    if platform=='Google Ads':return 'Sensis','Inferred: legacy Google naming'
    return 'Unassigned','Needs review'

def objective(campaign, platform, src, category):
    c=str(campaign or '').lower();s=str(src or '').lower()
    for token,label in [('conversions','Conversions'),('conversion','Conversions'),('traffic','Traffic'),('engagement','Engagement'),('awareness','Awareness'),('demand gen','Demand Gen'),('performance max','Performance Max'),('pmax','Performance Max'),('search','Search'),('display','Display'),('gdn','Display'),('video','Video'),('youtube','Video'),('local','Local / Store Visits')]:
        if token in c:return label
    if s=='reach':return 'Awareness'
    if any(x in s for x in ['post_engagement','profile_visit','page_visit']):return 'Engagement'
    if 'link_click' in s:return 'Traffic'
    if 'offsite_conversion' in s:return 'Conversions'
    if s in ['search','display','video','demand gen','performance max']:return {'search':'Search','display':'Display','video':'Video','demand gen':'Demand Gen','performance max':'Performance Max'}[s]
    if s=='local' or category=='Store Visits / AON':return 'Local / Store Visits'
    return 'Other'

def result_group(v):
    r=str(v or '').lower()
    if r=='reach':return 'Reach'
    if 'link_click' in r:return 'Link clicks'
    if 'post_engagement' in r:return 'Post engagement'
    if 'profile_visit' in r:return 'Profile visits'
    if 'page_visit' in r:return 'Page visits'
    if 'custom' in r or 'conversion' in r:return 'Reported conversions'
    if 'google' in r:return 'Google conversions'
    return 'No comparable result'

def agg(df,groups):
    return df.groupby(groups,dropna=False).agg(Spend=('Spend','sum'),Impressions=('Impressions','sum'),Reach=('Reach','sum'),Clicks=('Clicks','sum'),Results=('Results','sum'),Conversions=('Conversions','sum'),VideoViews=('Video Views','sum')).reset_index()

def records(df):return [{k:n(v) for k,v in r.items()} for r in df.to_dict(orient='records')]

df=pd.read_csv(SOURCE)
df['Date']=pd.to_datetime(df['Date']).dt.strftime('%Y-%m-%d');df['Month']=df['Month'].astype(str)
a=[agency(c,p) for c,p in zip(df.Campaign,df.Platform)];df['Agency']=[x[0] for x in a];df['Agency Confidence']=[x[1] for x in a]
df['Campaign Objective']=[objective(c,p,o,cat) for c,p,o,cat in zip(df.Campaign,df.Platform,df.Objective,df.Category)]
df['Result Group']=df['Result Type'].map(result_group)
active=df[(df[['Spend','Impressions','Clicks','Results','Conversions','Video Views']].sum(axis=1)>0)].copy()
rows=agg(active,['Date','Month','Agency','Agency Confidence','Platform','Category','Campaign','Campaign Objective','Result Group']).sort_values(['Month','Date','Spend'],ascending=[True,True,False])
creative=active[(active.Platform=='Meta Ads')&active.Ad.notna()]
creatives=agg(creative,['Agency','Category','Campaign','Ad','Campaign Objective','Result Group']).sort_values('Spend',ascending=False)
total_spend=float(active.Spend.sum())
report={'meta':{'client':'Supermercados Morelos','title':'Performance Marketing & Paid Social','period':'Mayo–Julio 2026','months':sorted(active.Month.unique().tolist()),'generatedAt':pd.Timestamp.today().strftime('%Y-%m-%d'),'currency':'USD','sourceRows':len(df),'activeRows':len(active),'agencyRule':'WDM and Sensis are assigned from campaign naming. Google campaigns without an agency prefix are attributed to Sensis as legacy naming.','resultWarning':'Results are heterogeneous platform-reported actions.','reachWarning':'Reach is not deduplicated across the complete window.','conversionWarning':'Reported conversions require validation against POS and store-visit measurement.','headline':'Qué pasó en performance y social paid, qué agencia generó eficiencia y dónde concentrar el siguiente dólar.','initialTotals':{'spend':round(total_spend,2),'impressions':int(active.Impressions.sum()),'clicks':int(active.Clicks.sum()),'conversions':int(active.Conversions.sum())}},'rows':records(rows),'creatives':records(creatives),'summaries':{'agency':records(agg(active,['Agency']).sort_values('Spend',ascending=False)),'category':records(agg(active,['Category']).sort_values('Spend',ascending=False)),'platform':records(agg(active,['Platform']).sort_values('Spend',ascending=False)),'objective':records(agg(active,['Campaign Objective']).sort_values('Spend',ascending=False))}}
(ROOT/'data'/'report-data.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'data'/'report-data.js').write_text('window.REPORT_DATA='+json.dumps(report,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')
print('Updated',ROOT/'data'/'report-data.js')
