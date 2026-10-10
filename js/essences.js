(() => {
  const configs = PRODUCTS.filter((p) => p.type === "config");
  const priceOf = (e) => configs.find((p) => p.essence === e.id).base;

  // ---------- Tableau comparatif triable ----------
  const cols = [
    { id: "name", label: "Essence", val: (e) => e.name, fmt: (e) => `<span class="swatch swatch--sm" style="background:${e.color};box-shadow:inset 0 0 0 2px ${e.bark}"></span> <a href="produit.html?id=${configs.find((p) => p.essence === e.id).id}">${escapeHtml(e.name)}</a>` },
    { id: "kwh", label: "Énergie / stère", val: (e) => e.kwh, fmt: (e) => `${num(e.kwh, 0)} kWh` },
    { id: "kg", label: "Masse / stère", val: (e) => e.kg, fmt: (e) => `${e.kg} kg` },
    { id: "flame", label: "Flamme", val: (e) => e.flame, fmt: (e) => meter(e.flame, "Flamme") },
    { id: "embers", label: "Braises", val: (e) => e.embers, fmt: (e) => meter(e.embers, "Braises") },
    { id: "lighting", label: "Allumage", val: (e) => e.lighting, fmt: (e) => meter(e.lighting, "Allumage") },
    { id: "price", label: "Prix / stère", val: priceOf, fmt: (e) => `dès ${euro(priceOf(e))}` },
    { id: "ratio", label: "kWh par euro", val: (e) => e.kwh / priceOf(e), fmt: (e) => num(e.kwh / priceOf(e), 1) },
  ];
  let sort = { id: "kwh", dir: -1 };
  function renderTable() {
    const col = cols.find((c) => c.id === sort.id);
    const rows = [...ESSENCES].sort((a, b) => {
      const x = col.val(a), y = col.val(b);
      return (typeof x === "string" ? x.localeCompare(y) : x - y) * sort.dir;
    });
    $("#compare").innerHTML = `<thead><tr>${cols.map((c) => `<th aria-sort="${c.id === sort.id ? (sort.dir > 0 ? "ascending" : "descending") : "none"}">
      <button type="button" class="th-sort" data-sort="${c.id}">${c.label}${c.id === sort.id ? (sort.dir > 0 ? " ↑" : " ↓") : ""}</button></th>`).join("")}</tr></thead>
      <tbody>${rows.map((e) => `<tr>${cols.map((c, i) => (i === 0 ? `<th scope="row">${c.fmt(e)}</th>` : `<td>${c.fmt(e)}</td>`)).join("")}</tr>`).join("")}</tbody>`;
  }
  $("#compare").addEventListener("click", (e) => {
    const b = e.target.closest("[data-sort]");
    if (!b) return;
    sort = sort.id === b.dataset.sort ? { id: sort.id, dir: -sort.dir } : { id: b.dataset.sort, dir: b.dataset.sort === "name" ? 1 : -1 };
    renderTable();
  });

  // ---------- Fiches ----------
  $("#essGrid").innerHTML = ESSENCES.map((e) => {
    const p = configs.find((x) => x.essence === e.id);
    return `<article class="ess-card reveal is-visible" id="${e.id}">
      <div class="ess-card__art">${essenceArt(e, "card" + e.id, { rows: 3, cols: 5 })}</div>
      <div class="ess-card__body">
        <h3>${escapeHtml(e.name)}</h3>
        <p>${escapeHtml(e.text)}</p>
        <a class="btn btn--ghost btn--sm" href="produit.html?id=${p.id}">Dès ${euro(p.base)} le stère</a>
      </div>
    </article>`;
  }).join("");

  // ---------- Questionnaire ----------
  const answers = {};
  function recommend() {
    const scores = ESSENCES.map((e) => {
      let s = e.kwh / 400;
      if (answers.priorite === "duree") s += e.embers * 2;
      if (answers.priorite === "flamme") s += e.flame * 2;
      if (answers.priorite === "allumage") s += e.lighting * 2;
      if (answers.priorite === "prix") s += (e.kwh / priceOf(e)) / 2.5;
      if (answers.usage === "principal") s += e.embers;
      if (answers.usage === "soirees") s += e.flame + e.lighting / 2;
      if (answers.appareil === "cheminee") s += e.flame;
      if (answers.appareil === "chaudiere") s += e.embers + (e.id === "melange" ? 2 : 0);
      return { e, s };
    }).sort((a, b) => b.s - a.s);
    return scores;
  }
  const reasons = {
    duree: "ses braises tiennent longtemps",
    flamme: "sa flamme est vive et décorative",
    prix: "il offre le plus de chaleur par euro",
    allumage: "il s'enflamme facilement",
  };
  function renderFinder() {
    $$("#finder [data-q]").forEach((g) => $$(".seg__btn", g).forEach((b) => b.setAttribute("aria-pressed", answers[g.dataset.q] === b.dataset.v)));
    const done = ["appareil", "usage", "priorite"].every((k) => answers[k]);
    if (!done) {
      const left = ["appareil", "usage", "priorite"].filter((k) => !answers[k]).length;
      $("#finderResult").innerHTML = `<p class="muted small">Encore ${left} réponse${left > 1 ? "s" : ""}.</p>`;
      return;
    }
    const [best, second] = recommend();
    const p = configs.find((x) => x.essence === best.e.id);
    const len = answers.appareil === "chaudiere" ? 50 : answers.appareil === "cheminee" ? 50 : 33;
    $("#finderResult").innerHTML = `
      <div class="finder__card">
        <div class="finder__art">${essenceArt(best.e, "best" + best.e.id, { rows: 3, cols: 4 })}</div>
        <div>
          <p class="eyebrow eyebrow--dark">Notre conseil</p>
          <h3>${escapeHtml(best.e.name)}, coupé en ${lengthByCm(len).label}</h3>
          <p>Pour vous, ${escapeHtml(reasons[answers.priorite])}${answers.appareil === "cheminee" ? ". Pensez qu'un insert diviserait votre consommation par quatre" : ""}. Alternative : ${escapeHtml(second.e.name.toLowerCase())}.</p>
          <a class="btn btn--primary" href="produit.html?id=${p.id}">Configurer ma commande</a>
        </div>
      </div>`;
  }
  $("#finder").addEventListener("click", (e) => {
    const b = e.target.closest(".seg__btn");
    if (!b) return;
    answers[b.closest("[data-q]").dataset.q] = b.dataset.v;
    renderFinder();
  });

  renderTable();
  renderFinder();
})();
