(() => {
  const form = $("#calcForm");
  const configs = PRODUCTS.filter((p) => p.type === "config");
  const state = {
    cp: store.get("cp", ""),
    climate: climateOf(store.get("cp", "")),
    surface: Math.min(300, Math.max(15, +params.get("surface") || 100)),
    insulation: "moyenne",
    usage: "principal",
    appliance: "poele",
    essence: "chene",
    len: 33,
    dry: "air",
  };

  const seg = (group, list) => list.map((x) => `<button type="button" class="seg__btn" data-group="${group}" data-value="${x.id}" aria-pressed="false">${escapeHtml(x.name)}</button>`).join("");
  $("#cInsulation").innerHTML = seg("insulation", INSULATION);
  $("#cUsage").innerHTML = seg("usage", USAGES);
  $("#cAppliance").innerHTML = APPLIANCES.map((a) => `<option value="${a.id}">${escapeHtml(a.name)} (rendement ${Math.round(a.efficiency * 100)} %)</option>`).join("");
  $("#cEssence").innerHTML = configs.map((p) => `<option value="${p.essence}">${escapeHtml(essenceById(p.essence).name)}</option>`).join("");
  $("#cLength").innerHTML = LENGTHS.map((l) => `<option value="${l.cm}">${l.label}</option>`).join("");
  $("#cDry").innerHTML = DRYINGS.map((d) => `<option value="${d.id}">${d.name} (${d.humidity})</option>`).join("");
  $("#cCp").value = state.cp;

  function render() {
    const r = estimate(state);
    const st = roundSteres(r.steres);
    const product = configs.find((p) => p.essence === state.essence);
    const unit = unitPrice(product, { len: state.len, dry: state.dry });
    const budget = st * unit;

    $$(".seg__btn", form).forEach((b) => b.setAttribute("aria-pressed", b.dataset.value === state[b.dataset.group]));
    $("#cSurfaceOut").textContent = `${state.surface} m²`;
    $("#cInsulationText").textContent = INSULATION.find((i) => i.id === state.insulation).text;
    $("#cClimate").textContent = CLIMATE[state.climate].name;
    $("#cAppliance").value = state.appliance;
    $("#cEssence").value = state.essence;
    $("#cLength").value = state.len;
    $("#cDry").value = state.dry;

    $("#rSteres").textContent = num(st, 1);
    $("#rApparent").textContent = `${num(apparentM3(st, state.len))} m³ en ${lengthByCm(state.len).label}`;
    $("#rBudget").textContent = `${euro(budget)} / an`;
    $("#rWeight").textContent = `≈ ${num((st * r.ess.kg) / 1000, 1)} t`;
    $("#rKwh").textContent = `${num(r.kwh / 1000, 1)} MWh`;
    $("#rKwh2").textContent = `${num(r.kwh / 1000, 1)} MWh`;
    const warn = $("#rWarning");
    warn.hidden = state.appliance !== "cheminee";
    warn.innerHTML = `<strong>Une cheminée ouverte perd 85 % de la chaleur par le conduit.</strong> Un insert ou un poêle diviserait votre consommation par 4 à 5 et ouvre droit à des aides (MaPrimeRénov').`;
    const btn = $("#rAdd");
    const qty = Math.min(30, Math.ceil(st));
    btn.textContent = `Ajouter ${plural(qty, "stère")} de ${r.ess.name.toLowerCase()} au panier · ${euro(qty * unit)}`;
    btn.dataset.qty = qty;
    btn.dataset.id = product.id;

    // Comparaison des énergies (une seule série : le bois est mis en évidence)
    const rows = [
      { name: `Bois : ${r.ess.name.toLowerCase()} ${lengthByCm(state.len).label}`, cost: budget, wood: true },
      ...ENERGIES.map((e) => ({ name: e.name, cost: r.kwh * e.eurPerKwh })),
    ].sort((a, b) => a.cost - b.cost);
    const max = Math.max(...rows.map((x) => x.cost));
    $("#bars").innerHTML = rows.map((x) => `
      <div class="bar${x.wood ? " bar--wood" : ""}" role="listitem" tabindex="0" aria-label="${escapeHtml(x.name)} : ${euro(Math.round(x.cost))} par an">
        <span class="bar__label">${escapeHtml(x.name)}</span>
        <span class="bar__track"><span class="bar__fill" style="width:${(x.cost / max) * 100}%"></span></span>
        <span class="bar__value">${euro(Math.round(x.cost))}</span>
        <span class="bar__tip" role="tooltip">${escapeHtml(x.name)}<br><strong>${euro(Math.round(x.cost))} / an</strong> · ${euro(Math.round(x.cost / 12))} / mois${x.wood ? "" : `<br>${x.cost > budget ? "+" : ""}${euro(Math.round(x.cost - budget))} par rapport au bois`}</span>
      </div>`).join("");
    $("#barsTable").innerHTML = `<thead><tr><th>Énergie</th><th>Coût annuel</th><th>Coût mensuel</th></tr></thead><tbody>${rows.map((x) =>
      `<tr><td>${escapeHtml(x.name)}</td><td>${euro(Math.round(x.cost))}</td><td>${euro(Math.round(x.cost / 12))}</td></tr>`).join("")}</tbody>`;

    renderHumidity(st);
  }

  // ---------- Humidité ----------
  // Pouvoir calorifique inférieur approximatif (kWh/kg) selon l'humidité sur masse brute
  const pci = (h) => 5.2 * (1 - h / 100) - 0.68 * (h / 100);
  // Chaleur utile par stère relative à un bois à 20 % : la masse de bois sec par stère est constante,
  // mais l'eau consomme de l'énergie et dégrade la combustion (rendement de l'appareil en baisse).
  const relEnergy = (h) => ((pci(h) / (1 - h / 100)) / (pci(20) / 0.8)) * (1 - 0.012 * Math.max(0, h - 20));
  function renderHumidity(st) {
    const h = +$("#hRange").value;
    const rel = relEnergy(h);
    const need = st / rel;
    const cls = h <= 15 ? "excellent" : h <= 20 ? "bon" : h <= 30 ? "moyen" : "mauvais";
    $("#hOut").textContent = `${h} %`;
    $("#hGauge").className = `gauge gauge--${cls}`;
    $("#hGauge span").style.width = `${Math.min(100, rel * 100 * 0.9)}%`;
    $("#hText").innerHTML = h <= 20
      ? `<strong>Bois sec : rendement optimal.</strong> ${num(st, 1)} stères suffisent pour votre hiver.${h <= 15 ? " Le séchage au four apporte même un léger bonus." : ""}`
      : `<strong>À ${h} %, chaque stère chauffe ${Math.round((1 - rel) * 100)} % de moins.</strong> Il vous faudrait environ <strong>${num(need, 1)} stères</strong> au lieu de ${num(st, 1)}, avec un conduit qui s'encrasse et des vitres noircies.`;
  }

  // ---------- Convertisseur ----------
  function renderConvert() {
    const v = Math.max(0, +$("#vValue").value || 0);
    const u = $("#vUnit").value;
    const steres = u === "st" ? v : v / lengthByCm(+u).factor;
    const kwh = steres * essenceById(state.essence).kwh;
    $("#vOut").innerHTML = `
      <p class="convert__st"><strong>${num(steres)}</strong> stère${steres >= 2 ? "s" : ""}</p>
      <table class="table"><thead><tr><th>Coupé en</th><th>Volume apparent</th><th>Tas de 1 m de haut</th></tr></thead><tbody>
      ${LENGTHS.map((l) => `<tr${u === String(l.cm) ? ' class="is-current"' : ""}><td>${l.label}</td><td>${num(steres * l.factor)} m³</td><td>${num((steres * l.factor) / (l.cm / 100), 1)} m de long</td></tr>`).join("")}
      </tbody></table>
      <p class="small muted">Soit environ ${num(kwh / 1000, 1)} MWh en ${essenceById(state.essence).name.toLowerCase()} sec.</p>`;
  }

  // ---------- Événements ----------
  form.addEventListener("click", (e) => {
    const b = e.target.closest(".seg__btn");
    if (b) { state[b.dataset.group] = b.dataset.value; render(); }
  });
  form.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id === "cSurface") state.surface = +t.value;
    if (t.id === "cCp") {
      t.value = t.value.replace(/\D/g, "").slice(0, 5);
      if (t.value.length === 5) { state.climate = climateOf(t.value); setCp(t.value); }
    }
    render();
  });
  form.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "cAppliance") state.appliance = t.value;
    if (t.id === "cEssence") { state.essence = t.value; renderConvert(); }
    if (t.id === "cLength") state.len = +t.value;
    if (t.id === "cDry") state.dry = t.value;
    render();
  });
  form.addEventListener("submit", (e) => e.preventDefault());
  $("#cSurface").value = state.surface;
  $("#rAdd").addEventListener("click", (e) => Cart.add(e.currentTarget.dataset.id, { len: state.len, dry: state.dry }, +e.currentTarget.dataset.qty));
  $("#hRange").addEventListener("input", () => renderHumidity(roundSteres(estimate(state).steres)));
  $("#vValue").addEventListener("input", renderConvert);
  $("#vUnit").addEventListener("change", renderConvert);

  render();
  renderConvert();
})();
