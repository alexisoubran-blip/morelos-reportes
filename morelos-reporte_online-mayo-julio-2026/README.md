# Morelos Supermercados — Performance Marketing & Social Media

Dashboard estático e interactivo de mayo a julio de 2026, listo para GitHub y Vercel. No requiere framework ni build step.

## Título del reporte

**Performance Marketing & Social Media - Mayo a Julio 2026**

## Módulos

### Performance Marketing

- Filtros por mes, agencia, canal, objetivo y campaña.
- Separación WDM vs Sensis.
- Tendencia semanal de inversión, impresiones y clicks.
- Comparativo de Meta Ads y Google Ads.
- Mix por campaña, canal, objetivo y agencia.
- Ranking de anuncios pautados y tabla auditable.
- Exportación CSV del corte filtrado.

### Social Media

- Facebook, Instagram, publicaciones crossposted y TikTok.
- Número de posts, views, reach, engagement y engagement rate.
- Rendimiento por plataforma.
- Mejores publicaciones por views.
- Mejores publicaciones por engagement rate con mínimo 250 views.
- Mejor formato por ER ponderado.
- Timeline semanal de cantidad de posts, views y ER.
- Filtros por mes, plataforma, formato y búsqueda de caption.
- Exportación CSV del corte filtrado.

## Reglas de Social Media

- Facebook `Multi media` se normaliza como `Carousel`.
- Engagement = Likes + Comments + Saves + Shares.
- Engagement Rate = Engagement / Views.
- Las publicaciones exportadas conjuntamente para Facebook e Instagram permanecen como `Facebook + Instagram` para evitar duplicar resultados.
- Los valores `from ads` se conservan como campos paid, sin restarlos de los totales mostrados.

## Publicar en GitHub

1. Crea un repositorio vacío.
2. Sube todo el contenido de esta carpeta a la raíz.
3. Haz commit en la rama principal.

## Publicar en Vercel

1. Selecciona **Add New → Project**.
2. Importa el repositorio de GitHub.
3. Framework Preset: **Other**.
4. Root Directory: `.`
5. Deja vacíos **Build Command** y **Output Directory**.
6. Selecciona **Deploy**.

## Preview local

```bash
python -m http.server 8000
```

Abre `http://localhost:8000`.

## Actualizar Performance Marketing

1. Reemplaza `data/source/morelos_normalized.csv` conservando las columnas actuales.
2. Revisa `data/agency-overrides.json`.
3. Ejecuta:

```bash
python scripts/build_data.py
```

## Actualizar Social Media

1. Reemplaza `data/source/social_meta_export.txt` con el export de Facebook/Instagram.
2. Actualiza `data/source/tiktok_posts.csv`.
3. Ejecuta:

```bash
python scripts/build_social_data.py
```

El script regenera:

- `data/social-data.json`
- `data/social-data.js`
- `data/source/social_posts_normalized.csv`

## Estructura

```text
.
├── index.html
├── styles.css
├── app.js
├── vercel.json
├── assets/
│   ├── morelos-logo.png
│   ├── meta-ads.png
│   └── google-ads.png
├── data/
│   ├── report-data.js
│   ├── report-data.json
│   ├── social-data.js
│   ├── social-data.json
│   ├── agency-overrides.json
│   └── source/
│       ├── morelos_normalized.csv
│       ├── social_meta_export.txt
│       ├── social_posts_normalized.csv
│       └── tiktok_posts.csv
└── scripts/
    ├── build_data.py
    └── build_social_data.py
```

## Actualizar Google Reviews

Desde la raíz del repositorio:

```bash
python scripts/build_google_reviews.py /ruta/export-apify.json
```

Acepta varios exports y conserva la extracción más reciente para cada combinación de placeId y reviewId. Valida las 11 fichas conocidas y las estrellas individuales. Regenera summary.json, listening-mini.json y los 10 comentarios con texto más recientes por grupo de estrellas y sucursal (positivos, neutrales, negativos). El export original permanece fuera del repositorio y fuera de la web; summary.json guarda su nombre, SHA-256 y fecha de extracción.

La ruta pública `/google-reviews` puede resolver al archivo físico `google-reviews/index.html` antes del rewrite hacia `google-reviews-v5/index.html`. Ambas entradas cargan el mismo app.js de v5 y deben mantener el corte y la metodología sincronizados. Al cambiar la base, actualiza el corte y las versiones de caché en index.html y app.js. Los temas se calculan con reglas bilingües visibles en el script; su polaridad usa las estrellas de toda la reseña. No comparar esos temas con cortes procesados con reglas distintas como si fueran una serie homogénea.
