document.addEventListener("DOMContentLoaded", () => {
  const market = document.getElementById("marketFilter");
  const rating = document.getElementById("ratingFilter");
  const sentiment = document.getElementById("sentimentFilter");
  const reset = document.getElementById("resetFilters");
  const status = document.getElementById("filterStatus");
  const cards = Array.from(document.querySelectorAll(".store-card"));

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
    if (status) status.textContent = `Mostrando ${visible} de ${cards.length} sucursales`;
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
