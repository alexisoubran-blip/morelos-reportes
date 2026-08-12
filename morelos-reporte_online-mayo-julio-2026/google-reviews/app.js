document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  const fmt = new Intl.NumberFormat("es-MX");
  const pct = (value) => `${Math.round(value * 100)}%`;
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  }[c]));

  const stores = [
    {
      name: "Supermercados Morelos 59th", short: "59th", city: "Oklahoma City", market: "OKC Metro",
      rating: 4.3, reviews: 1145, pos: 3, mix: 1, neg: 1,
      positives: [
        "Se reconoce el surtido, el precio y la oferta de comida preparada como razones para preferir esta tienda.",
        "Frutas, verduras, pan dulce y carniceria aparecen como atributos destacados en primeras visitas."
      ],
      negatives: [
        "Una experiencia en food service reporta trato poco amable y una diferencia entre la foto del menu y el producto recibido."
      ],
      observed: "La muestra combina una percepcion favorable de surtido, precio y frescos con una friccion localizada en atencion y consistencia de food service."
    },
    {
      name: "Supermercados Morelos 50th", short: "50th", city: "Oklahoma City", market: "OKC Metro",
      rating: 4.3, reviews: 880, pos: 5, mix: 0, neg: 0,
      positives: [
        "Las cinco resenas codificadas son positivas; se repiten amabilidad, carnes marinadas, panaderia y comida preparada.",
        "Tambien aparecen limpieza, rapidez en caja y buena distribucion de la tienda."
      ],
      negatives: [],
      observed: "En la muestra codificada no aparecen resenas negativas. La conversacion se concentra en producto, servicio y experiencia de compra."
    },
    {
      name: "Supermercados Morelos (NW 23rd)", short: "NW 23rd", city: "Oklahoma City", market: "OKC Metro",
      rating: 4.2, reviews: 611, pos: 1, mix: 2, neg: 2,
      positives: ["El surtido de botanas y abarrotes mexicanos recibe una valoracion favorable."],
      negatives: [
        "Se reportan fricciones de trato en carniceria y food service.",
        "Tambien aparece una mencion de mal olor y una percepcion negativa sobre limpieza de equipo en la barra de comida."
      ],
      observed: "Es una de las muestras mas divididas: conviven reconocimiento de surtido con observaciones sobre espacio, olor, servicio y food service."
    },
    {
      name: "Supermercados Morelos MacArthur", short: "MacArthur", city: "Oklahoma City", market: "OKC Metro",
      rating: 4.3, reviews: 219, pos: 3, mix: 0, neg: 2,
      positives: [
        "La limpieza aparece como atributo distintivo, acompanada de frescos, tacos y buenos precios.",
        "Una resena la describe como tienda de cabecera por limpieza y amabilidad."
      ],
      negatives: ["Dos resenas describen experiencias negativas de trato: una vinculada con seguridad y otra con atencion en la barra de comida."],
      observed: "La muestra presenta un contraste entre una percepcion favorable de limpieza y episodios puntuales de atencion que generan evaluaciones negativas."
    },
    {
      name: "Supermercados Morelos Moore", short: "Moore", city: "Moore", market: "OKC Metro",
      rating: 4.4, reviews: 1282, pos: 3, mix: 2, neg: 0,
      positives: [
        "Food service genera visitas de destino y aparece asociado con recomendaciones externas y regreso a tienda.",
        "Pan dulce, nostalgia, limpieza y percepcion de valor tambien aparecen de forma positiva."
      ],
      negatives: [],
      observed: "No hay negativas dentro de las cinco resenas codificadas; las observaciones mixtas se relacionan con consistencia de guarniciones y variedad esperada en frescos."
    },
    {
      name: "Supermercado Morelos (Admiral)", short: "Admiral", city: "Tulsa", market: "Tulsa Metro",
      rating: 4.0, reviews: 23, pos: 4, mix: 0, neg: 1,
      positives: [
        "Carniceria, limpieza, surtido y frescos reciben comentarios favorables.",
        "Una resena destaca atencion paciente pese a una barrera de idioma."
      ],
      negatives: ["Una resena describe espera sin atencion en carniceria mientras otra persona fue atendida primero."],
      observed: "La ficha tiene un volumen de calificaciones considerablemente menor que el resto de la cadena; dentro de la muestra textual predomina el tono positivo."
    },
    {
      name: "Supermercados Morelos Garnett", short: "Garnett", city: "Tulsa", market: "Tulsa Metro",
      rating: 4.3, reviews: 921, pos: 5, mix: 0, neg: 0,
      positives: [
        "Las cinco resenas codificadas son positivas y combinan frescos, carnes, limpieza, precio y servicio.",
        "Frutas y verduras se comparan favorablemente con otras tiendas de la ciudad."
      ],
      negatives: [],
      observed: "La muestra es consistentemente positiva y distribuye el reconocimiento entre frescos, carniceria, limpieza, valor y food service."
    },
    {
      name: "Supermercados Morelos Harvard", short: "Harvard", city: "Tulsa", market: "Tulsa Metro",
      rating: 4.2, reviews: 996, pos: 1, mix: 1, neg: 3,
      positives: ["Una resena considera la tienda favorable por servicio, ambiente, carnes y verduras."],
      negatives: [
        "Tres resenas negativas se concentran en cajas, promociones, manejo de quejas y frescura de un producto lacteo.",
        "Tambien aparece una friccion de idioma y falta de ofrecimiento de ayuda en piso."
      ],
      observed: "Es la muestra con mayor proporcion negativa entre las 11 sucursales codificadas. Los comentarios se concentran principalmente en front-end, politicas de tienda y servicio."
    },
    {
      name: "Supermercados Morelos 129th", short: "129th", city: "Tulsa", market: "Tulsa Metro",
      rating: 4.4, reviews: 673, pos: 4, mix: 0, neg: 1,
      positives: [
        "Food service, frescos, surtido especializado y panaderia aparecen como motivos de preferencia.",
        "Una resena describe la tienda como destino para productos que no encuentra en otros comercios."
      ],
      negatives: ["Una resena reporta problemas de frescura en guacamole, pico de gallo y carne comprados para una celebracion."],
      observed: "La muestra es mayoritariamente positiva, con una observacion negativa concentrada en frescura de alimentos preparados y carne."
    },
    {
      name: "Supermercados Morelos Peoria", short: "Peoria", city: "Tulsa", market: "Tulsa Metro",
      rating: 4.4, reviews: 657, pos: 4, mix: 0, neg: 1,
      positives: [
        "Se repiten limpieza, personal bilingue, asesoria en producto, frescos y carniceria.",
        "Una resena describe la sucursal como un hallazgo poco conocido pese a una experiencia favorable."
      ],
      negatives: ["Una resena cuestiona la relacion valor-precio de food service y menciona una comision por pago con tarjeta."],
      observed: "La muestra combina satisfaccion alta con atencion y producto, mientras la unica negativa se concentra en food service y percepcion de valor del ticket."
    },
    {
      name: "Supermercados Morelos Broken Arrow", short: "Broken Arrow", city: "Broken Arrow", market: "Tulsa Metro",
      rating: 4.6, reviews: 611, pos: 4, mix: 0, neg: 1,
      positives: [
        "Surtido, carnes marinadas, limpieza, variedad multicultural y precio razonable aparecen de forma reiterada.",
        "Tambien se valora la disponibilidad de productos dificiles de encontrar en otros supermercados."
      ],
      negatives: ["Una resena describe una respuesta poco empatica ante una solicitud de acceso a wifi de invitados."],
      observed: "Es la sucursal con mayor rating Google del conjunto observado; la muestra textual es mayoritariamente positiva y se concentra en surtido, limpieza y producto."
    }
  ];

  const topics = [
    ["Personal y trato", 22, 12, 1, 9],
    ["Food service", 19, 12, 2, 5],
    ["Carniceria", 15, 12, 0, 3],
    ["Surtido y variedad", 14, 11, 3, 0],
    ["Precio y valor", 13, 11, 1, 1],
    ["Frutas y verduras", 12, 11, 1, 0],
    ["Limpieza y orden", 12, 10, 1, 1],
    ["Panaderia", 8, 7, 1, 0],
    ["Idioma y senalizacion", 8, 5, 2, 1],
    ["Politicas de tienda", 7, 0, 0, 7],
    ["Autenticidad y nostalgia", 6, 5, 1, 0],
    ["Checkout y filas", 4, 2, 0, 2]
  ];

  const benchmark = [
    ["Feria Latina Supermarket - NW 23rd", "Oklahoma City", 4.3, 2385],
    ["Feria Latina Supermarket - SW 47th", "Oklahoma City", 4.2, 602],
    ["Feria Latina Supermarket - Garnett", "Tulsa", 4.5, 172],
    ["Las Americas", "Tulsa", 4.0, 1224],
    ["Supermercados Las Americas International", "Tulsa", 4.1, 323],
    ["Supermercado La Cosecha & Restaurant Wholesale", "Tulsa", 4.5, 30],
    ["Feria Latina Supermarket - SW 25th", "Oklahoma City", 4.7, 14],
    ["Plaza del Caribe", "Oklahoma City", 4.9, 23],
    ["Tienda Latina", "Tulsa", 3.5, 15]
  ];

  const insights = [
    ["El rating de cadena se mantiene en un rango alto", "La media ponderada observada es 4.33 sobre 8,018 calificaciones. Broken Arrow registra el rating mas alto del conjunto y Admiral el menor, aunque Admiral tambien tiene un volumen de calificaciones mucho menor."],
    ["La muestra textual cambia de forma visible entre sucursales", "50th y Garnett no presentan negativas dentro de sus cinco resenas codificadas. Harvard y NW 23rd concentran una mayor proporcion negativa dentro de la misma muestra de cinco."],
    ["Producto y servicio aparecen como los temas con mayor presencia", "Personal y trato, food service y carniceria son los temas mas mencionados dentro de la codificacion. En los tres conviven observaciones favorables y desfavorables."],
    ["Surtido y frescos aparecen con una lectura predominantemente favorable", "Surtido y variedad, frutas y verduras y panaderia se asocian principalmente con menciones positivas dentro de la muestra tematica."],
    ["OKC y Tulsa muestran ratings de mercado cercanos", "El rating ponderado observado es 4.32 en OKC Metro y 4.35 en Tulsa Metro. La diferencia entre mercados es menor que varios de los contrastes visibles entre sucursales individuales."]
  ];

  const totalReviews = stores.reduce((sum, store) => sum + store.reviews, 0);
  const weighted = stores.reduce((sum, store) => sum + (store.rating * store.reviews), 0) / totalReviews;
  const totalPos = stores.reduce((sum, store) => sum + store.pos, 0);
  const totalMix = stores.reduce((sum, store) => sum + store.mix, 0);
  const totalNeg = stores.reduce((sum, store) => sum + store.neg, 0);

  const heroKpis = document.getElementById("heroKpis");
  if (heroKpis) {
    heroKpis.innerHTML = [
      ["Rating ponderado", weighted.toFixed(2), "Cadena"],
      ["Calificaciones", fmt.format(totalReviews), "Google"],
      ["Muestra textual", "55", "5 por tienda"],
      ["Mix muestra", `${totalPos}/${totalMix}/${totalNeg}`, "Pos. / Mixtas / Neg."]
    ].map(([label, value, note]) => `
      <div class="hero-kpi">
        <span>${esc(label)}</span>
        <b>${esc(value)}</b>
        <small>${esc(note)}</small>
      </div>
    `).join("");
  }

  const marketFilter = document.getElementById("marketFilter");
  const ratingFilter = document.getElementById("ratingFilter");
  const sampleFilter = document.getElementById("sampleFilter");
  const resetFilters = document.getElementById("resetFilters");
  const storeTabs = document.getElementById("storeTabs");
  const storeStage = document.getElementById("storeStage");
  const storeCounter = document.getElementById("storeCounter");
  const carouselDots = document.getElementById("carouselDots");
  const prevStore = document.getElementById("prevStore");
  const nextStore = document.getElementById("nextStore");

  let filtered = stores.slice();
  let current = 0;

  function samplePercent(store, key) {
    return store[key] / 5;
  }

  function donutStyle(store) {
    const positive = samplePercent(store, "pos") * 100;
    const mixed = samplePercent(store, "mix") * 100;
    return `conic-gradient(var(--green-700) 0 ${positive}%, var(--mustard) ${positive}% ${positive + mixed}%, var(--red) ${positive + mixed}% 100%)`;
  }

  function exampleList(items, type) {
    if (!items.length) {
      return `<div class="empty-example">Sin ejemplos ${type === "negative" ? "negativos" : "positivos"} dentro de las 5 resenas codificadas.</div>`;
    }
    return items.map((text) => `
      <div class="example-item ${type}">
        <span>${type === "positive" ? "+" : "-"}</span>
        <p>${esc(text)}</p>
      </div>
    `).join("");
  }

  function renderTabs() {
    if (!storeTabs) return;
    if (!filtered.length) {
      storeTabs.innerHTML = "";
      return;
    }

    storeTabs.innerHTML = filtered.map((store, index) => `
      <button type="button" class="store-tab ${index === current ? "active" : ""}" data-index="${index}">
        <span>${esc(store.short)}</span>
        <b>${store.rating.toFixed(1)} ★</b>
      </button>
    `).join("");

    storeTabs.querySelectorAll(".store-tab").forEach((button) => {
      button.addEventListener("click", () => {
        current = Number(button.dataset.index);
        renderTabs();
        renderStore();
      });
    });
  }

  function renderStore() {
    if (!storeStage || !storeCounter || !carouselDots || !prevStore || !nextStore) return;

    if (!filtered.length) {
      storeStage.innerHTML = `
        <div class="no-results">
          <b>No hay sucursales con esta combinacion de filtros.</b>
          <span>Restablece los filtros para volver a ver las 11 tiendas.</span>
        </div>
      `;
      storeCounter.textContent = "0 sucursales";
      carouselDots.innerHTML = "";
      prevStore.disabled = true;
      nextStore.disabled = true;
      return;
    }

    if (current >= filtered.length) current = 0;
    const store = filtered[current];

    const positivePct = pct(samplePercent(store, "pos"));
    const mixedPct = pct(samplePercent(store, "mix"));
    const negativePct = pct(samplePercent(store, "neg"));

    storeStage.innerHTML = `
      <article class="store-profile">
        <div class="store-profile-head">
          <div>
            <span class="store-market">${esc(store.market)} · ${esc(store.city)}</span>
            <h3>${esc(store.name)}</h3>
            <div class="store-google-line">
              <b>${store.rating.toFixed(1)} ★</b>
              <span>${fmt.format(store.reviews)} calificaciones Google</span>
            </div>
          </div>
          <div class="store-position">${current + 1}<span>/ ${filtered.length}</span></div>
        </div>

        <div class="store-main-grid">
          <div class="sentiment-panel">
            <div class="donut-wrap">
              <div class="donut" style="background:${donutStyle(store)}">
                <div class="donut-hole">
                  <b>5</b>
                  <span>reviews<br>codificadas</span>
                </div>
              </div>
            </div>
            <div class="sentiment-legend">
              <div><i class="positive-dot"></i><span>Positivo</span><b>${positivePct}</b><small>${store.pos} de 5</small></div>
              <div><i class="mixed-dot"></i><span>Mixto</span><b>${mixedPct}</b><small>${store.mix} de 5</small></div>
              <div><i class="negative-dot"></i><span>Negativo</span><b>${negativePct}</b><small>${store.neg} de 5</small></div>
            </div>
          </div>

          <div class="store-insight">
            <span class="mini-label">Lectura observada</span>
            <p>${esc(store.observed)}</p>
            <div class="sample-disclaimer">
              Los porcentajes corresponden a la muestra codificada de 5 resenas, no a las ${fmt.format(store.reviews)} calificaciones totales.
            </div>
          </div>
        </div>

        <div class="examples-grid">
          <div class="examples-block positive-block">
            <div class="examples-title"><span>Ejemplos positivos</span><b>${store.pos} en la muestra</b></div>
            ${exampleList(store.positives, "positive")}
          </div>
          <div class="examples-block negative-block">
            <div class="examples-title"><span>Ejemplos negativos</span><b>${store.neg} en la muestra</b></div>
            ${exampleList(store.negatives, "negative")}
          </div>
        </div>
      </article>
    `;

    storeCounter.textContent = `${current + 1} de ${filtered.length} sucursales`;
    carouselDots.innerHTML = filtered.map((_, index) => `
      <button type="button" class="${index === current ? "active" : ""}" data-index="${index}" aria-label="Ver sucursal ${index + 1}"></button>
    `).join("");

    carouselDots.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        current = Number(button.dataset.index);
        renderTabs();
        renderStore();
      });
    });

    prevStore.disabled = filtered.length <= 1;
    nextStore.disabled = filtered.length <= 1;
  }

  function applyFilters() {
    const marketValue = marketFilter ? marketFilter.value : "all";
    const ratingValue = ratingFilter ? ratingFilter.value : "all";
    const sampleValue = sampleFilter ? sampleFilter.value : "all";

    filtered = stores.filter((store) => {
      const marketOk = marketValue === "all" || store.market === marketValue;
      const ratingOk =
        ratingValue === "all" ||
        (ratingValue === "high" && store.rating >= 4.4) ||
        (ratingValue === "mid" && store.rating === 4.3) ||
        (ratingValue === "low" && store.rating <= 4.2);
      const sampleOk =
        sampleValue === "all" ||
        (sampleValue === "negative" && store.neg > 0) ||
        (sampleValue === "nonegative" && store.neg === 0);

      return marketOk && ratingOk && sampleOk;
    });

    current = 0;
    renderTabs();
    renderStore();
  }

  [marketFilter, ratingFilter, sampleFilter].forEach((control) => {
    if (control) control.addEventListener("change", applyFilters);
  });

  if (resetFilters) {
    resetFilters.addEventListener("click", () => {
      if (marketFilter) marketFilter.value = "all";
      if (ratingFilter) ratingFilter.value = "all";
      if (sampleFilter) sampleFilter.value = "all";
      applyFilters();
    });
  }

  if (prevStore) {
    prevStore.addEventListener("click", () => {
      if (!filtered.length) return;
      current = (current - 1 + filtered.length) % filtered.length;
      renderTabs();
      renderStore();
    });
  }

  if (nextStore) {
    nextStore.addEventListener("click", () => {
      if (!filtered.length) return;
      current = (current + 1) % filtered.length;
      renderTabs();
      renderStore();
    });
  }

  if (storeStage) {
    let touchStartX = null;
    storeStage.addEventListener("touchstart", (event) => {
      if (event.changedTouches && event.changedTouches[0]) {
        touchStartX = event.changedTouches[0].clientX;
      }
    }, { passive: true });

    storeStage.addEventListener("touchend", (event) => {
      if (touchStartX === null || !filtered.length || !event.changedTouches || !event.changedTouches[0]) return;
      const delta = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(delta) > 50) {
        current = delta < 0
          ? (current + 1) % filtered.length
          : (current - 1 + filtered.length) % filtered.length;
        renderTabs();
        renderStore();
      }
      touchStartX = null;
    }, { passive: true });
  }

  const topicGrid = document.getElementById("topicGrid");
  if (topicGrid) {
    topicGrid.innerHTML = topics.map(([name, total, pos, mix, neg]) => {
      const negativeShare = total ? neg / total : 0;
      const cls = negativeShare >= 0.6 ? "critical" : negativeShare >= 0.3 ? "watch" : "";
      return `
        <article class="topic-card ${cls}">
          <div class="topic-head">
            <b>${esc(name)}</b>
            <span>${total} menciones</span>
          </div>
          <div class="topic-bar">
            <i style="width:${(pos / total) * 100}%"></i>
            <i class="mix" style="width:${(mix / total) * 100}%"></i>
            <i class="neg" style="width:${(neg / total) * 100}%"></i>
          </div>
          <div class="topic-numbers">
            <span>${pos} positivas</span>
            <span>${mix} mixtas</span>
            <span>${neg} negativas</span>
          </div>
        </article>
      `;
    }).join("");
  }

  const insightGrid = document.getElementById("insightGrid");
  if (insightGrid) {
    insightGrid.innerHTML = insights.map((item, index) => `
      <article class="insight-card">
        <span>0${index + 1}</span>
        <h3>${esc(item[0])}</h3>
        <p>${esc(item[1])}</p>
      </article>
    `).join("");
  }

  const benchmarkTable = document.getElementById("benchmarkTable");
  if (benchmarkTable) {
    benchmarkTable.innerHTML = `
      <thead>
        <tr>
          <th>Competidor</th>
          <th>Ciudad</th>
          <th class="num">Rating</th>
          <th class="num">Calificaciones</th>
        </tr>
      </thead>
      <tbody>
        ${benchmark.map((row) => `
          <tr>
            <td><b>${esc(row[0])}</b></td>
            <td>${esc(row[1])}</td>
            <td class="num"><b>${row[2].toFixed(1)}</b></td>
            <td class="num">${fmt.format(row[3])}</td>
          </tr>
        `).join("")}
      </tbody>
    `;
  }

  applyFilters();
});
