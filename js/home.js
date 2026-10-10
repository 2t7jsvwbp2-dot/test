(() => {
  // Photo de fond de l'accueil, assombrie pour garder le texte lisible
  if (SHOP.heroPhoto) $(".hero").style.backgroundImage = `linear-gradient(90deg, rgba(36,25,19,.92), rgba(36,25,19,.55)), url("${SHOP.heroPhoto}")`;

  // ---------- Commande express ----------
  const quick = $("#quick");
  const configs = PRODUCTS.filter((p) => p.type === "config");
  const state = { id: "chene", len: 33, dry: "air", qty: 4 };

  const segBtn = (group, value, label, sub = "") =>
    `<button type="button" class="seg__btn" data-group="${group}" data-value="${value}" aria-pressed="false">${label}${sub ? `<small>${sub}</small>` : ""}</button>`;
  $("#quickEssence").innerHTML = configs.map((p) => segBtn("id", p.id, essenceById(p.essence).name.replace(" feuillus durs", ""))).join("");
  $("#quickLength").innerHTML = LENGTHS.map((l) => segBtn("len", l.cm, l.label)).join("");
  $("#quickDry").innerHTML = DRYINGS.map((d) => segBtn("dry", d.id, d.short, d.humidity)).join("");

  function renderQuick() {
    const p = productById(state.id);
    const opts = { len: state.len, dry: state.dry };
    $$(".seg__btn", quick).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.value) === String(state[b.dataset.group])));
    $("#quickArt").innerHTML = productArt(p, opts);
    const unit = unitPrice(p, opts);
    $("#quickTotal").textContent = euro(unit * state.qty);
    $("#quickUnit").textContent = `${euro(unit)} le stère · ${euro(unit / lengthByCm(state.len).factor)} le m³ apparent`;
    $("#quickVol").textContent = `≈ ${num(apparentM3(state.qty, state.len))} m³ apparent en ${lengthByCm(state.len).label}`;
    $("#quickQty").value = state.qty;
  }

  quick.addEventListener("click", (e) => {
    const b = e.target.closest(".seg__btn");
    if (b) { state[b.dataset.group] = b.dataset.group === "len" ? +b.dataset.value : b.dataset.value; renderQuick(); }
    const s = e.target.closest("[data-step]");
    if (s) { state.qty = Math.min(30, Math.max(1, state.qty + +s.dataset.step)); renderQuick(); }
  });
  $("#quickQty").addEventListener("change", (e) => { state.qty = Math.min(30, Math.max(1, Math.round(+e.target.value) || 1)); renderQuick(); });
  quick.addEventListener("submit", (e) => {
    e.preventDefault();
    Cart.add(state.id, { len: state.len, dry: state.dry }, state.qty);
  });
  renderQuick();

  // ---------- Code postal ----------
  const cpInput = $("#heroCpInput");
  cpInput.value = store.get("cp", "");
  if (cpInput.value) $("#heroCpResult").innerHTML = deliverySummary(cpInput.value);
  cpInput.addEventListener("input", () => { cpInput.value = cpInput.value.replace(/\D/g, "").slice(0, 5); });
  $("#heroCp").addEventListener("submit", (e) => {
    e.preventDefault();
    $("#heroCpResult").innerHTML = deliverySummary(cpInput.value) || '<p class="error">Saisissez un code postal à 5 chiffres.</p>';
    if (deptOf(cpInput.value)) { setCp(cpInput.value); renderTeaser(); }
  });

  // ---------- Stock de la saison ----------
  const s = SHOP.season;
  const pct = Math.round((s.sold / s.total) * 100);
  $("#seasonLabel").textContent = s.label;
  $("#seasonText").textContent = `${pct} % du bois sec de la saison est déjà réservé. Il reste environ ${num(s.total - s.sold, 0)} stères prêts à livrer.`;
  $("#seasonBar").setAttribute("aria-valuenow", pct);
  requestAnimationFrame(() => setTimeout(() => ($("#seasonFill").style.width = pct + "%"), 200));

  // ---------- Catégories et produits ----------
  $("#categoryGrid").innerHTML = CATEGORIES.map((c) => {
    const first = PRODUCTS.find((p) => p.category === c.id);
    return `<a class="cat-card" href="catalogue.html?categorie=${c.id}">
      <span class="cat-card__art">${productArt(first, defaultOpts(first))}</span>
      <span class="cat-card__name">${escapeHtml(c.name)}</span>
      <span class="cat-card__text">${escapeHtml(c.text)}</span>
    </a>`;
  }).join("");
  $("#bestSellers").innerHTML = [...PRODUCTS].sort((a, b) => b.popular - a.popular).slice(0, 4).map(productCard).join("");

  // ---------- Calculateur express ----------
  const range = $("#teaserSurface");
  function renderTeaser() {
    const surface = +range.value;
    const climate = climateOf(store.get("cp", ""));
    const r = estimate({ surface, climate, insulation: "moyenne", appliance: "poele", usage: "principal", essence: "melange" });
    const st = roundSteres(r.steres);
    const price = unitPrice(productById("melange"), { len: 33, dry: "air" });
    $("#teaserSurfaceOut").textContent = `${surface} m²`;
    $("#teaserSteres").textContent = num(st, 1);
    $("#teaserCost").innerHTML = `Soit environ <strong>${euro(st * price)}</strong> par an en mélange de feuillus 33 cm, ${CLIMATE[climate].name.toLowerCase()}.`;
    $("#teaserCubes").innerHTML = Array.from({ length: Math.ceil(st) }, (_, i) =>
      `<span class="cube${i + 1 > st ? " cube--half" : ""}" style="animation-delay:${i * 40}ms"></span>`).join("");
    $("#teaserLink").href = `calculateur.html?surface=${surface}`;
  }
  range.addEventListener("input", renderTeaser);
  renderTeaser();

  // ---------- Essences ----------
  let current = "chene";
  function renderEss() {
    $("#essTabs").innerHTML = ESSENCES.map((e) => `<button type="button" role="tab" aria-selected="${e.id === current}" data-ess="${e.id}">
      <span class="swatch" style="background:${e.color};box-shadow:inset 0 0 0 3px ${e.bark}"></span>${escapeHtml(e.name)}</button>`).join("");
    const e = essenceById(current);
    const p = PRODUCTS.find((x) => x.type === "config" && x.essence === e.id);
    $("#essPanel").innerHTML = `
      <div class="essence-picker__art">${stackSvg(e, "tab" + e.id, { rows: 3, cols: 5 })}</div>
      <div>
        <h3>${escapeHtml(e.name)}</h3>
        <p>${escapeHtml(e.text)}</p>
        <dl class="ess-stats">
          <div><dt>Énergie</dt><dd>${num(e.kwh, 0)} kWh / stère</dd></div>
          <div><dt>Flamme</dt><dd>${meter(e.flame, "Flamme")}</dd></div>
          <div><dt>Braises</dt><dd>${meter(e.embers, "Braises")}</dd></div>
          <div><dt>Allumage</dt><dd>${meter(e.lighting, "Facilité d'allumage")}</dd></div>
        </dl>
        <a class="btn btn--primary" href="produit.html?id=${p.id}">Commander du ${escapeHtml(e.name.toLowerCase())} · dès ${euro(p.base)} le stère</a>
      </div>`;
  }
  $("#essTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-ess]");
    if (b) { current = b.dataset.ess; renderEss(); $(`[data-ess="${current}"]`).focus(); }
  });
  renderEss();

  // ---------- Braises animées ----------
  const canvas = $("#embers");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (canvas.getContext && !reduce) {
    const ctx = canvas.getContext("2d");
    let w, h, sparks;
    const resize = () => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
      sparks = Array.from({ length: Math.round(w / 18) }, () => spawn(true));
    };
    const spawn = (init) => ({
      x: Math.random() * w, y: init ? Math.random() * h : h + 10,
      r: 0.6 + Math.random() * 2.2, vy: 0.3 + Math.random() * 0.9, vx: (Math.random() - 0.5) * 0.4,
      life: 0.4 + Math.random() * 0.6, hue: 32 + Math.random() * 16,
    });
    let visible = true;
    new IntersectionObserver(([en]) => (visible = en.isIntersecting)).observe(canvas);
    const tick = () => {
      if (visible) {
        ctx.clearRect(0, 0, w, h);
        for (const s of sparks) {
          s.y -= s.vy; s.x += s.vx + Math.sin(s.y / 40) * 0.2;
          const a = Math.max(0, (s.y / h) * s.life);
          ctx.beginPath();
          ctx.fillStyle = `hsla(${s.hue}, 100%, 60%, ${a})`;
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
          if (s.y < -10) Object.assign(s, spawn(false));
        }
      }
      requestAnimationFrame(tick);
    };
    addEventListener("resize", resize);
    resize();
    tick();
  }
})();
