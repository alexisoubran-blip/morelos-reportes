# Supermercados Morelos — Marketing Dashboard

Static HTML/CSS/JS dashboard prepared for GitHub → Vercel.

## What is wired now

- **Overview:** SOI Digital business reconciliation for June and July 2026 (budget, actual, business blocks, and available channel close).
- **Paid Media:** Meta Ads + Google Ads.
- **Social:** Facebook + Instagram follows/content, Facebook boosted detail, and organic/boosted/combined labels.
- **Analytics:** site traffic only; GA4 daily Active Users, Views, Events and engagement series.
- **Placeholders preserved:** Sales, Offline, conversions, and boost spend where the source is not reliable yet.
- **Agency rule:** WDM starts **2026-06-01**; Sensis remains a separate owner.

## Important data constraints

1. The current Meta Ads export is aggregated from **May 1–July 31, 2026**. It cannot support exact week/month filtering. The dashboard only uses the Meta total when the selected range can be defended from source/ownership:
   - Full export May–Jul, or
   - WDM full available tenure Jun–Jul.
2. Google Ads has weekly cost only; it has no campaign, impressions or clicks in the received export.
3. Facebook/Instagram content metrics are **Lifetime metrics for content published during the selected period**, not activity generated exclusively during the period.
4. Facebook Reels is not added on top of Facebook Posts to avoid double counting.
5. Reach is not exposed as a global additive KPI.
6. Overview campaign counts use five SOI business blocks. Technical Meta campaigns and individual boosts do not increase the executive campaign count.
7. Sessions, traffic sources, and top pages are only shown for the full May–Jul range because those files were received as aggregate totals.
8. Total Marketing remains blank until offline investment is integrated; Digital investment is not relabeled as total Marketing.

## Run locally

From the parent `morelos-reporte_online-mayo-julio-2026` folder:

```bash
python -m http.server 8080
```

Open `http://localhost:8080/morelos-marketing-dashboard/`.

## Deploy to Vercel

1. Create a GitHub repository and copy this folder into it.
2. Push to GitHub.
3. Import the repository in Vercel.
4. Framework preset: **Other**.
5. Build command: leave empty.
6. Output directory: leave empty / repository root.

`vercel.json` is already included.

## Update the data

The deployable repo does **not** include raw client CSVs by default.

Place the source exports in a local source folder using these exact filenames:

- `Meta Ads(1).csv`
- `Google Ads(4).csv`
- `FB Follows.csv`
- `IG Follows.csv`
- `FB Social Media Posts .csv`
- `IG Social Media Organic n Boosts.csv`
- `Acquisition_overview.csv`
- `GA4 Engagement.csv`

Then run:

```bash
python scripts/normalize_data.py \
  --source-dir /path/to/raw-csvs \
  --out data/dashboard-data.json \
  --taxonomy config/taxonomy.json
```

Commit the updated `data/dashboard-data.json` and redeploy.

## Campaign taxonomy

Edit `config/taxonomy.json` to change the macro campaign rules. Current groups include:

- Mundial / Fútbol
- Marinados
- Helados
- Comunidad
- Taco Tuesday
- Ofertón
- AON / Store
- Pollo / Carnitas / Chicharrón
- Temporadas
- Boosted / Amplificación
- Otros

The technical taxonomy remains separate from the frontend so campaign naming can evolve without redesigning the dashboard. Overview and the global campaign filter use the five business groups in `config/soi-reference.json`.
