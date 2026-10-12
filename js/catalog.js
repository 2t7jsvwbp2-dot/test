(() => {
  const form = $("#filters");
  const grid = $("#productGrid");
  const prices = PRODUCTS.map(fromPrice);
  const maxPrice = Math.ceil(Math.max(...prices) / 10) * 10;
  $("#fPrice").max = maxPrice;

  // Énergie fournie par une unité (kWh), pour le tri « énergie par euro »
  function energy(p) {
    if (p.kind === "densifie") return p.id.endsWith("palette") ? 4704 : 49;
    if (p.kind === "granules") return p.id.endsWith("palette") ? 4752 : 72;
    if (!p.st) return 0;
    return p.st * essenceById(p.essence).kwh;
  }

  const state = {
    categorie: params.get("categorie") || "",
    essence: params.get("essence") ? params.get("essence").split(",") : [],
    longueur: +params.get("longueur") || 0,
    four: params.get("four") === "1",
    prix: +params.get("prix") || maxPrice,
    q: params.get("q") || "",
    tri: params.get("tri") || "popularite",
  };

  $("#catTabs").innerHTML = [{ id: "", name: "Tout" }, ...CATEGORIES]
    .map((c) => `<button type="button" role="tab" data-cat="${c.id}">${escapeHtml(c.name)}</button>`).join("");
  $("#fEssences").innerHTML = ESSENCES.map((e) => `<label class="check"><input type="checkbox" name="essence" value="${e.id}">
    <span class="swatch swatch--sm" style="background:${e.color};box-shadow:inset 0 0 0 2px ${e.bark}"></span> ${escapeHtml(e.name)}</label>`).join("");
  $("#fLengths").innerHTML = LENGTHS.map((l) => `<button type="button" class="seg__btn" data-len="${l.cm}" aria-pressed="false">${l.label}</button>`).join("");

  function matches(p) {
    if (state.categorie && p.category !== state.categorie) return false;
    if (state.essence.length && !state.essence.includes(p.essence)) return false;
    if (state.longueur) {
      const lens = p.type === "config" ? p.lengths : p.len ? [p.len] : [];
      if (!lens.includes(state.longueur)) return false;
    }
    if (state.four && !(p.type === "config" ? p.dryings.includes("four") : p.dry === "four")) return false;
    if (fromPrice(p) > state.prix) return false;
    if (state.q) {
      const hay = [p.name, p.text, categoryById(p.category).name, essenceById(p.essence)?.name, p.len ? p.len + " cm" : "", p.type === "config" ? p.lengths.map((l) => l + " cm").join(" ") : ""]
        .join(" ").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      const words = state.q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/\s+/).filter(Boolean);
      if (!words.every((w) => hay.includes(w))) return false;
    }
    return true;
  }

  const sorters = {
    popularite: (a, b) => b.popular - a.popular,
    "prix-asc": (a, b) => fromPrice(a) - fromPrice(b),
    "prix-desc": (a, b) => fromPrice(b) - fromPrice(a),
    energie: (a, b) => energy(b) / fromPrice(b) - energy(a) / fromPrice(a),
  };

  function syncUrl() {
    const u = new URLSearchParams();
    if (state.categorie) u.set("categorie", state.categorie);
    if (state.essence.length) u.set("essence", state.essence.join(","));
    if (state.longueur) u.set("longueur", state.longueur);
    if (state.four) u.set("four", "1");
    if (state.prix < maxPrice) u.set("prix", state.prix);
    if (state.q) u.set("q", state.q);
    if (state.tri !== "popularite") u.set("tri", state.tri);
    history.replaceState(null, "", "?" + u.toString());
  }

  function chip(label, key, value = "") {
    return `<button type="button" class="chip" data-clear="${key}" data-value="${value}" aria-label="Retirer le filtre ${escapeHtml(label)}">${escapeHtml(label)} <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>`;
  }

  function render() {
    const list = PRODUCTS.filter(matches).sort(sorters[state.tri]);
    grid.innerHTML = list.map(productCard).join("");
    $("#emptyState").hidden = list.length > 0;
    grid.hidden = list.length === 0;
    $("#resultCount").textContent = `${list.length} produit${list.length > 1 ? "s" : ""}`;

    const cat = categoryById(state.categorie);
    $("#catalogTitle").textContent = cat ? cat.name : "Boutique";
    $("#crumb").textContent = cat ? cat.name : "Boutique";
    document.title = `${cat ? cat.name : "Boutique"} · ${SHOP.name}`;

    $$("#catTabs [data-cat]").forEach((b) => b.setAttribute("aria-selected", b.dataset.cat === state.categorie));
    $$('input[name="essence"]', form).forEach((c) => (c.checked = state.essence.includes(c.value)));
    $$("#fLengths .seg__btn").forEach((b) => b.setAttribute("aria-pressed", +b.dataset.len === state.longueur));
    $("#fFour").checked = state.four;
    $("#fPrice").value = state.prix;
    $("#fPriceValue").textContent = state.prix >= maxPrice ? "sans limite" : euro(state.prix);
    $("#fSearch").value = state.q;
    $("#sort").value = state.tri;

    $("#activeFilters").innerHTML = [
      state.q && chip(`« ${state.q} »`, "q"),
      ...state.essence.map((e) => chip(essenceById(e).name, "essence", e)),
      state.longueur && chip(lengthByCm(state.longueur).label, "longueur"),
      state.four && chip("Séché au four", "four"),
      state.prix < maxPrice && chip(`≤ ${euro(state.prix)}`, "prix"),
    ].filter(Boolean).join("");
    syncUrl();
  }

  $("#catTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (b) { state.categorie = b.dataset.cat; render(); }
  });
  $("#fLengths").addEventListener("click", (e) => {
    const b = e.target.closest("[data-len]");
    if (b) { state.longueur = state.longueur === +b.dataset.len ? 0 : +b.dataset.len; render(); }
  });
  form.addEventListener("input", (e) => {
    const t = e.target;
    if (t.name === "essence") state.essence = $$('input[name="essence"]:checked', form).map((c) => c.value);
    if (t.id === "fFour") state.four = t.checked;
    if (t.id === "fPrice") state.prix = +t.value;
    if (t.id === "fSearch") state.q = t.value.trim();
    render();
  });
  form.addEventListener("submit", (e) => e.preventDefault());
  $("#sort").addEventListener("change", (e) => { state.tri = e.target.value; render(); });
  $("#activeFilters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-clear]");
    if (!b) return;
    const k = b.dataset.clear;
    if (k === "essence") state.essence = state.essence.filter((x) => x !== b.dataset.value);
    else if (k === "prix") state.prix = maxPrice;
    else state[k] = k === "longueur" ? 0 : k === "four" ? false : "";
    render();
  });
  const reset = () => {
    Object.assign(state, { essence: [], longueur: 0, four: false, prix: maxPrice, q: "" });
    render();
  };
  $("#resetFilters").addEventListener("click", reset);
  $("#emptyReset").addEventListener("click", reset);
  if (matchMedia("(max-width: 860px)").matches) $("#filtersPanel").open = false;

  render();
})();
