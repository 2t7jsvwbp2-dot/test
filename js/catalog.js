(() => {
  const form = $("#filters");
  const maxPrice = Math.ceil(Math.max(...PRODUCTS.map((p) => p.price)) / 10) * 10;
  const brands = [...new Set(PRODUCTS.map((p) => p.brand))].sort((a, b) => a.localeCompare(b, "fr"));

  const state = {
    q: params.get("q") || "",
    modele: params.get("modele") || "",
    categorie: params.get("categorie") || "",
    marques: (params.get("marque") || "").split(",").filter(Boolean),
    prix: +params.get("prix") || maxPrice,
    stock: params.get("stock") === "1",
    promo: params.get("promo") === "1",
    tri: params.get("tri") || "popularite",
  };

  // ---------- Construction des filtres ----------
  $("#fModel").insertAdjacentHTML("beforeend", MODELS.map((m) => `<option value="${m.code}">${escapeHtml(m.name)}</option>`).join(""));
  $("#fCategories").innerHTML = CATEGORIES.map((c) => {
    const n = PRODUCTS.filter((p) => p.category === c.id).length;
    return `<label class="check"><input type="radio" name="categorie" value="${c.id}"> ${escapeHtml(c.name)} <span class="muted">(${n})</span></label>`;
  }).join("");
  $("#fBrands").innerHTML = brands.map((b) => `<label class="check"><input type="checkbox" name="marque" value="${escapeHtml(b)}"> ${escapeHtml(b)}</label>`).join("");
  $("#fPrice").max = maxPrice;

  function syncForm() {
    $("#fModel").value = state.modele;
    $$('input[name="categorie"]', form).forEach((r) => (r.checked = r.value === state.categorie));
    $$('input[name="marque"]', form).forEach((c) => (c.checked = state.marques.includes(c.value)));
    $("#fPrice").value = state.prix;
    $("#fPriceValue").textContent = euro(state.prix);
    $("#fStock").checked = state.stock;
    $("#fPromo").checked = state.promo;
    $("#sort").value = state.tri;
    const hs = $("#headerSearch");
    if (hs) hs.value = state.q;
  }

  form.addEventListener("input", () => {
    state.modele = $("#fModel").value;
    state.categorie = $('input[name="categorie"]:checked', form)?.value || "";
    state.marques = $$('input[name="marque"]:checked', form).map((c) => c.value);
    state.prix = +$("#fPrice").value;
    state.stock = $("#fStock").checked;
    state.promo = $("#fPromo").checked;
    $("#fPriceValue").textContent = euro(state.prix);
    render();
  });
  $("#sort").addEventListener("change", (e) => { state.tri = e.target.value; render(); });

  function reset() {
    Object.assign(state, { q: "", modele: "", categorie: "", marques: [], prix: maxPrice, stock: false, promo: false });
    syncForm();
    render();
  }
  $("#resetFilters").addEventListener("click", reset);
  $("#emptyReset").addEventListener("click", reset);

  // ---------- Filtrage ----------
  const normalize = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "");

  function results() {
    const q = normalize(state.q);
    const list = PRODUCTS.filter((p) => {
      if (state.modele && !p.models.includes(state.modele)) return false;
      if (state.categorie && p.category !== state.categorie) return false;
      if (state.marques.length && !state.marques.includes(p.brand)) return false;
      if (p.price > state.prix) return false;
      if (state.stock && p.stock === 0) return false;
      if (state.promo && !p.oldPrice) return false;
      if (q) {
        const hay = normalize([p.name, p.brand, p.ref, p.oem, categoryById(p.category).name, p.models.join(" ")].join(" "));
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const sorters = {
      popularite: (a, b) => b.popular - a.popular,
      "prix-asc": (a, b) => a.price - b.price,
      "prix-desc": (a, b) => b.price - a.price,
      nom: (a, b) => a.name.localeCompare(b.name, "fr"),
    };
    return list.sort(sorters[state.tri] || sorters.popularite);
  }

  function updateUrl() {
    const q = new URLSearchParams();
    if (state.q) q.set("q", state.q);
    if (state.modele) q.set("modele", state.modele);
    if (state.categorie) q.set("categorie", state.categorie);
    if (state.marques.length) q.set("marque", state.marques.join(","));
    if (state.prix < maxPrice) q.set("prix", state.prix);
    if (state.stock) q.set("stock", "1");
    if (state.promo) q.set("promo", "1");
    if (state.tri !== "popularite") q.set("tri", state.tri);
    try { history.replaceState(null, "", location.pathname + (q.toString() ? "?" + q : "")); } catch (_) {}
  }

  function chips() {
    const c = [];
    if (state.q) c.push(["q", `« ${state.q} »`]);
    if (state.modele) c.push(["modele", modelByCode(state.modele)?.name || state.modele]);
    if (state.categorie) c.push(["categorie", categoryById(state.categorie)?.name]);
    state.marques.forEach((m) => c.push(["marque:" + m, m]));
    if (state.prix < maxPrice) c.push(["prix", `Jusqu'à ${euro(state.prix)}`]);
    if (state.stock) c.push(["stock", "En stock"]);
    if (state.promo) c.push(["promo", "En promotion"]);
    $("#activeFilters").innerHTML = c
      .map(([k, label]) => `<button class="chip" data-remove="${escapeHtml(k)}" aria-label="Retirer le filtre ${escapeHtml(label)}">${escapeHtml(label)} <span aria-hidden="true">×</span></button>`)
      .join("");
  }

  $("#activeFilters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-remove]");
    if (!b) return;
    const k = b.dataset.remove;
    if (k.startsWith("marque:")) state.marques = state.marques.filter((m) => m !== k.slice(7));
    else if (k === "prix") state.prix = maxPrice;
    else if (k === "stock" || k === "promo") state[k] = false;
    else state[k] = "";
    syncForm();
    render();
  });

  function render() {
    const list = results();
    $("#productGrid").innerHTML = list.map(productCard).join("");
    $("#emptyState").hidden = list.length > 0;
    $("#resultCount").textContent = `${list.length} pièce${list.length > 1 ? "s" : ""}`;
    const cat = categoryById(state.categorie);
    const title = state.promo && !cat ? "Promotions" : cat ? cat.name : state.q ? `Résultats pour « ${state.q} »` : "Catalogue";
    $("#catalogTitle").textContent = title;
    $("#crumb").textContent = title;
    document.title = `${title} · ${SHOP.name}`;
    chips();
    updateUrl();
  }

  // Filtres repliés par défaut sur petit écran
  if (matchMedia("(max-width: 860px)").matches) $("#filtersPanel").open = false;

  document.addEventListener("vehicle:change", render);
  syncForm();
  render();
})();
