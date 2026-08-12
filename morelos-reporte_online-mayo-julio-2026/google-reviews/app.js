document.addEventListener("DOMContentLoaded", () => {
  const market = document.getElementById("marketFilter");
  const rating = document.getElementById("ratingFilter");
  const sentiment = document.getElementById("sentimentFilter");
  const reset = document.getElementById("resetFilters");
  const status = document.getElementById("filterStatus");
  const cards = Array.from(document.querySelectorAll(".store-card"));
  const kpiGrid = document.querySelector(".kpi-grid");

  const marketData = {
    OKC: {
      label: "OKC Metro",
      stores: 5,
      ratings: 4137,
      rating: 4.32,
      coded: 25,
      pos: 60.0,
      mix: 20.0,
      neg: 20.0
    },
    Tulsa: {
      label: "Tulsa Metro",
      stores: 6,
      ratings: 3881,
      rating: 4.35,
      coded: 30,
      pos: 73.3,
      mix: 3.3,
      neg: 23.3
    }
  };

  cards.forEach((card) => {
    card.classList.add(card.dataset.market === "OKC" ? "market-okc" : "market-tulsa");
  });

  if (kpiGrid && !document.querySelector(".market-compare")) {
    const section = document.createElement("section");
    section.className = "market-compare";
    section.setAttribute("aria-label", "Comparativa OKC Metro y Tulsa Metro");
    section.innerHTML = `
      <div class="market-compare-head">
        <div>
          <span>Comparativa por mercado</span>
          <h2>OKC Metro vs Tulsa Metro</h2>
        </div>
        <div class="market-delta">Los ratings ponderados son muy cercanos: 4.32 en OKC y 4.35 en Tulsa. El sentiment corresponde a la muestra codificada, no al universo total de calificaciones.</div>
      </div>
      <div class="market-grid">
        ${marketCard(marketData.OKC)}
        ${marketCard(marketData.Tulsa)}
      </div>
    `;
    kpiGrid.insertAdjacentElement("afterend", section);
  }

  function marketCard(data) {
    return `
      <article class="market-card" data-market-summary="${data.label.startsWith("OKC") ? "OKC" : "Tulsa"}">
        <div class="market-card-top">
          <div class="market-name">${data.label}<small>${data.stores} sucursales</small></div>
          <div class="market-rating">${data.rating.toFixed(2)} ★<small>rating ponderado</small></div>
        </div>
        <div class="market-stats">
          <div class="market-stat"><span>Calificaciones</span><b>${data.ratings.toLocaleString("en-US")}</b></div>
          <div class="market-stat"><span>Muestra textual</span><b>${data.coded}</b></div>
          <div class="market-stat"><span>Positivo muestra</span><b>${data.pos.toFixed(1)}%</b></div>
        </div>
        <div class="market-sentiment" aria-label="${data.pos}% positivo, ${data.mix}% mixto, ${data.neg}% negativo">
          <i class="p" style="width:${data.pos}%"></i>
          <i class="m" style="width:${data.mix}%"></i>
          <i class="n" style="width:${data.neg}%"></i>
        </div>
        <div class="market-legend">
          <span><b>${data.pos.toFixed(1)}%</b> positivo</span>
          <span><b>${data.mix.toFixed(1)}%</b> mixto</span>
          <span><b>${data.neg.toFixed(1)}%</b> negativo</span>
        </div>
      </article>
    `;
  }

  function matches(card) {
    const marketOk = !market || market.value === "all" || card.dataset.market === market.value;
    const r = Number(card.dataset.rating || 0);
    const ratingOk = !rating || rating.value === "all" ||
      (rating.value === "high" && r >= 4.4) ||
      (rating.value === "mid" && r === 4.3) ||
      (rating.value === "low" && r <= 4.2);
    const pos = Number(card.dataset.pos || 0);
    const neg = Number(card.dataset.neg || 0);
    const sentimentOk = !sentiment || sentiment.value === "all" ||
      (sentiment.value === "positive" && pos >= 60) ||
      (sentiment.value === "negative" && neg >= 40) ||
      (sentiment.value === "nonegative" && neg === 0);
    return marketOk && ratingOk && sentimentOk;
  }

  function apply() {
    let visible = 0;
    cards.forEach((card) => {
      const show = matches(card);
      card.hidden = !show;
      if (show) visible += 1;
    });

    const active = [market, rating, sentiment].filter((control) => control && control.value !== "all").length;
    if (status) {
      status.textContent = active
        ? `Mostrando ${visible} de ${cards.length} sucursales · ${active} filtro${active === 1 ? "" : "s"} activo${active === 1 ? "" : "s"}`
        : `Mostrando ${visible} de ${cards.length} sucursales`;
    }
    if (reset) {
      reset.textContent = active ? `Restablecer (${active})` : "Restablecer";
    }

    document.querySelectorAll("[data-market-summary]").forEach((summary) => {
      const selected = !market || market.value === "all" || summary.dataset.marketSummary === market.value;
      summary.style.opacity = selected ? "1" : ".45";
    });
  }

  [market, rating, sentiment].forEach((control) => {
    if (control) control.addEventListener("change", apply);
  });

  if (reset) {
    reset.addEventListener("click", () => {
      if (market) market.value = "all";
      if (rating) rating.value = "all";
      if (sentiment) sentiment.value = "all";
      apply();
    });
  }

  apply();
});
