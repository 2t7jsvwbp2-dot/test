(() => {
  const root = $("#product");
  let p = productById(params.get("id"));
  if (!p) {
    root.innerHTML = `<div class="empty"><h1>Produit introuvable</h1><p>Ce produit n'existe pas ou n'est plus proposé.</p><a class="btn btn--primary" href="catalogue.html">Voir la boutique</a></div>`;
    return;
  }

  const state = { ...defaultOpts(p), qty: p.unit === "stère" ? 4 : 1, height: 1.5 };
  const configs = PRODUCTS.filter((x) => x.type === "config");

  // Panier hypothétique : le panier actuel + la sélection, pour estimer la livraison réelle
  function deliveryHint() {
    const cp = store.get("cp", "");
    if (!deptOf(cp)) return `<p class="small"><button type="button" class="link" data-open-cp>Indiquez votre code postal</button> pour voir le prix et les dates de livraison.</p>`;
    const opts = { len: state.len, dry: state.dry };
    const extra = { product: p, opts, unit: unitPrice(p, opts), qty: state.qty, line: unitPrice(p, opts) * state.qty, st: p.st * state.qty };
    const d = deliveryOptions(cp, [...Cart.items().filter((i) => i.key !== itemKey(p.id, opts)), extra]);
    const m = d.methods[0];
    if (!d.loc.ok) return `<p class="small">Pas de livraison au ${escapeHtml(cp)}. Retrait possible au dépôt. <button type="button" class="link" data-open-cp>Changer</button></p>`;
    return `<p class="small"><strong>Livraison au ${escapeHtml(cp)}</strong> <button type="button" class="link small" data-open-cp>changer</button><br>
      ${escapeHtml(m.name)} : <strong>${m.fee ? euro(m.fee) : "offerte"}</strong>${m.dates ? `, dès le ${fmtDate(m.dates[0])}` : ` · ${escapeHtml(m.delay)}`}.
      ${m.note ? `<span class="muted">${escapeHtml(m.note)}.</span>` : ""}</p>`;
  }

  function volumeViz() {
    const l = lengthByCm(state.len);
    const app = apparentM3(state.qty, state.len);
    const depth = state.len / 100;
    const pileLength = app / (depth * state.height);
    const cubes = Array.from({ length: Math.ceil(state.qty) }, (_, i) => {
      const frac = Math.min(1, state.qty - i);
      return `<span class="vcube" style="--f:${l.factor * frac}"><i></i></span>`;
    }).join("");
    return `<div class="volume">
      <h2 class="h4">Ce que représente votre commande</h2>
      <div class="vcubes" aria-hidden="true">${cubes}</div>
      <p class="small">Chaque cube correspond à <strong>1 stère</strong> (1 m³ de bûches de 1 m empilées). Recoupées en ${l.label}, les bûches se tassent : la partie foncée montre le <strong>volume apparent réel</strong>, soit ${num(app)} m³ au total. Même bois, même chaleur, moins de vide.</p>
      <div class="volume__pile">
        <label for="pileHeight" class="small">Hauteur de votre tas : <strong>${num(state.height, 1)} m</strong></label>
        <input type="range" id="pileHeight" min="0.8" max="2" step="0.1" value="${state.height}">
        <p class="small">Il vous faut un emplacement d'environ <strong>${num(pileLength, 1)} m de long</strong> sur ${l.label} de profondeur${state.len === 100 ? "" : " (une rangée de bûches)"}.</p>
      </div>
    </div>`;
  }

  function priceBlock() {
    const opts = { len: state.len, dry: state.dry };
    const unit = unitPrice(p, opts);
    const total = unit * state.qty;
    if (p.type !== "config") {
      return `<div class="price price--lg"><strong>${euro(total)}</strong></div>
        <p class="small muted">${euro(unit)} / ${p.unit} · TVA ${SHOP.vatRate} % incluse</p>`;
    }
    const ess = essenceById(p.essence);
    const kg = state.qty * ess.kg * (state.dry === "four" ? 0.92 : 1);
    return `<div class="price price--lg"><strong>${euro(total)}</strong></div>
      <dl class="price-facts">
        <div><dt>Prix au stère</dt><dd>${euro(unit)}</dd></div>
        <div><dt>Prix au m³ apparent</dt><dd>${euro(unit / lengthByCm(state.len).factor)}</dd></div>
        <div><dt>Volume livré</dt><dd>${num(apparentM3(state.qty, state.len))} m³</dd></div>
        <div><dt>Poids approximatif</dt><dd>${num(kg / 1000, 1)} t</dd></div>
        <div><dt>Énergie</dt><dd>≈ ${num((state.qty * ess.kwh) / 1000, 1)} MWh</dd></div>
      </dl>`;
  }

  function render() {
    const ess = essenceById(p.essence);
    const cat = categoryById(p.category);
    const isConfig = p.type === "config";
    document.title = `${p.name} · ${SHOP.name}`;

    root.innerHTML = `
      <nav class="breadcrumb" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a><a href="catalogue.html?categorie=${cat.id}">${escapeHtml(cat.name)}</a><span>${escapeHtml(p.name)}</span></nav>
      <div class="pdp">
        <div class="pdp__media">
          <div class="pdp__art" id="pdpArt">${productArt(p, state)}</div>
          ${isConfig ? `<div id="volume">${volumeViz()}</div>` : ""}
        </div>
        <form class="pdp__info" id="buyForm">
          <p class="card-product__brand">${escapeHtml(cat.name)}</p>
          <h1>${escapeHtml(p.name)}</h1>
          <p>${escapeHtml(isConfig ? ess.text : p.text)}</p>
          ${isConfig ? `
            <div class="card-product__meters card-product__meters--lg">
              <span>Chaleur</span>${meter(Math.round((ess.kwh - 1500) / 140), "Pouvoir calorifique")}
              <span>Flamme</span>${meter(ess.flame, "Flamme")}
              <span>Braises</span>${meter(ess.embers, "Braises")}
            </div>
            <fieldset class="opt-group">
              <legend>Essence</legend>
              <div class="seg seg--wrap">${configs.map((c) => `<button type="button" class="seg__btn" data-essence="${c.id}" aria-pressed="${c.id === p.id}">${escapeHtml(essenceById(c.essence).name.replace(" feuillus durs", ""))}</button>`).join("")}</div>
            </fieldset>
            <fieldset class="opt-group">
              <legend>Longueur des bûches</legend>
              <div class="seg">${p.lengths.map((cm) => `<button type="button" class="seg__btn" data-len="${cm}" aria-pressed="${cm === state.len}">${lengthByCm(cm).label}${lengthByCm(cm).surcharge ? `<small>+${lengthByCm(cm).surcharge} €</small>` : "<small>&nbsp;</small>"}</button>`).join("")}</div>
              <p class="small muted">${escapeHtml(lengthByCm(state.len).use)}. Mesurez votre foyer et retirez 5 à 10 cm.</p>
            </fieldset>
            <fieldset class="opt-group">
              <legend>Séchage</legend>
              <div class="options options--2">${p.dryings.map((id) => { const d = dryingById(id); return `
                <label class="option option--card">
                  <input type="radio" name="dry" value="${id}" ${id === state.dry ? "checked" : ""}>
                  <span class="option__body"><strong>${d.name} <span class="hum">${d.humidity}</span></strong><span class="small muted">${d.text}</span></span>
                  <span class="option__price">${d.surcharge ? `+${d.surcharge} €/st` : "Inclus"}</span>
                </label>`; }).join("")}</div>
            </fieldset>` : `
            <ul class="pdp__perks">
              ${p.len ? `<li>Longueur ${p.len} cm</li>` : ""}${p.dry ? `<li>${dryingById(p.dry).name} (${dryingById(p.dry).humidity} d'humidité)</li>` : ""}
              <li>${p.ship === "truck" ? "Livré avec votre bois, ou sur palette" : "Expédié en colis, ou livré avec votre bois"}</li>
            </ul>`}

          <div class="pdp__buy">
            <div class="pdp__qty">
              <label for="qty">${isConfig ? "Nombre de stères" : "Quantité"}</label>
              <div class="qty">
                <button type="button" data-step="-1" aria-label="Diminuer">−</button>
                <input id="qty" type="number" min="1" max="${p.max || 30}" value="${state.qty}" inputmode="numeric">
                <button type="button" data-step="1" aria-label="Augmenter">+</button>
              </div>
              ${isConfig ? `<input type="range" id="qtyRange" min="1" max="30" value="${state.qty}" aria-label="Nombre de stères">` : ""}
            </div>
            <div id="priceBlock">${priceBlock()}</div>
            <button class="btn btn--primary btn--lg btn--block" type="submit">Ajouter au panier</button>
            <div id="deliveryHint">${deliveryHint()}</div>
          </div>
        </form>
      </div>

      <div class="tabs" role="tablist">
        <button type="button" role="tab" aria-selected="true" aria-controls="tab-carac" id="t1">Caractéristiques</button>
        <button type="button" role="tab" aria-selected="false" aria-controls="tab-livraison" id="t2">Livraison</button>
        <button type="button" role="tab" aria-selected="false" aria-controls="tab-conseils" id="t3">Stockage et conseils</button>
      </div>
      <div class="tab-panel" role="tabpanel" id="tab-carac" aria-labelledby="t1">
        <div class="table-wrap"><table class="table"><tbody>
          ${isConfig ? `
            <tr><th>Essence</th><td>${escapeHtml(ess.name)}</td></tr>
            <tr><th>Origine</th><td>Forêts françaises, coupes d'éclaircie et bois d'exploitation durable</td></tr>
            <tr><th>Pouvoir calorifique</th><td>≈ ${num(ess.kwh, 0)} kWh par stère à 20 % d'humidité</td></tr>
            <tr><th>Masse</th><td>≈ ${ess.kg} kg par stère</td></tr>
            <tr><th>Humidité</th><td>${DRYINGS.map((d) => `${d.name} : ${d.humidity}`).join(" · ")}</td></tr>
            <tr><th>Conversion</th><td>${LENGTHS.map((l) => `${l.label} : ${num(l.factor)} m³`).join(" · ")} par stère</td></tr>
            <tr><th>Livraison</th><td>En vrac, déchargé par benne basculante</td></tr>`
          : `<tr><th>Description</th><td>${escapeHtml(p.text)}</td></tr><tr><th>Conditionnement</th><td>${escapeHtml(p.unit)}</td></tr>`}
          <tr><th>TVA</th><td>${SHOP.vatRate} % incluse</td></tr>
        </tbody></table></div>
      </div>
      <div class="tab-panel" role="tabpanel" id="tab-livraison" aria-labelledby="t2" hidden>
        <p>Dans nos zones de tournée, le bois est livré par nos camions à jour fixe, déchargé au plus près de votre abri si l'accès le permet (porte de 2,5 m minimum, sol stable). Ailleurs en France métropolitaine, il part sur palette par transporteur.</p>
        <p><a href="livraison.html">Voir les zones, les tarifs et les prochaines dates</a></p>
      </div>
      <div class="tab-panel" role="tabpanel" id="tab-conseils" aria-labelledby="t3" hidden>
        <ul class="prose">
          <li>Stockez le bois à l'abri de la pluie mais <strong>ventilé</strong> : couvrez le dessus, laissez les côtés à l'air.</li>
          <li>Surélevez le tas de 10 à 15 cm (palettes, chevrons) pour éviter les remontées d'humidité.</li>
          <li>Rentrez à l'intérieur la quantité de quelques jours : le bois finit de sécher près du poêle.</li>
          <li>Un bois à plus de 20 % d'humidité encrasse le conduit et chauffe moitié moins : vérifiez avec un humidimètre.</li>
        </ul>
      </div>`;
  }

  // Mise à jour partielle pour garder le focus pendant les réglages
  function refresh() {
    $("#pdpArt").innerHTML = productArt(p, state);
    $("#priceBlock").innerHTML = priceBlock();
    $("#deliveryHint").innerHTML = deliveryHint();
    if ($("#volume")) $("#volume").innerHTML = volumeViz();
    $("#qty").value = state.qty;
    if ($("#qtyRange")) $("#qtyRange").value = state.qty;
  }

  root.addEventListener("click", (e) => {
    const t = e.target;
    const essBtn = t.closest("[data-essence]");
    if (essBtn) {
      p = productById(essBtn.dataset.essence);
      history.replaceState(null, "", `?id=${p.id}`);
      render();
      renderRelated();
      $(`[data-essence="${p.id}"]`).focus();
      return;
    }
    const lenBtn = t.closest("[data-len]");
    if (lenBtn) {
      state.len = +lenBtn.dataset.len;
      render();
      $(`[data-len="${state.len}"]`).focus();
      return;
    }
    const step = t.closest("[data-step]");
    if (step) { state.qty = clampQty(state.qty + +step.dataset.step); refresh(); }
    if (t.closest("[data-open-cp]")) $("#cpChip").click();
    const tab = t.closest('[role="tab"]');
    if (tab && tab.closest(".tabs")) {
      $$(".tabs [role=tab]", root).forEach((b) => {
        const on = b === tab;
        b.setAttribute("aria-selected", on);
        $("#" + b.getAttribute("aria-controls")).hidden = !on;
      });
    }
  });

  const clampQty = (n) => Math.min(p.max || 30, Math.max(1, Math.round(n) || 1));
  root.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id === "qtyRange") { state.qty = +t.value; refresh(); }
    if (t.id === "pileHeight") {
      state.height = +t.value;
      $("#volume").innerHTML = volumeViz();
      $("#pileHeight").focus();
    }
  });
  root.addEventListener("change", (e) => {
    const t = e.target;
    if (t.id === "qty") { state.qty = clampQty(+t.value); refresh(); }
    if (t.name === "dry") { state.dry = t.value; refresh(); }
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    Cart.add(p.id, p.type === "config" ? { len: state.len, dry: state.dry } : {}, state.qty);
    $("#deliveryHint").innerHTML = deliveryHint();
  });
  document.addEventListener("cp:change", () => ($("#deliveryHint").innerHTML = deliveryHint()));

  function renderRelated() {
    const ids = p.type === "config" ? ["allumage", "allume-feu", "humidimetre", "bache"] : ["melange", "palette-33", "allumage", "allume-feu"].filter((id) => id !== p.id);
    $("#related").innerHTML = ids.slice(0, 4).map((id) => productCard(productById(id))).join("");
    $("#relatedSection").hidden = false;
  }

  render();
  renderRelated();
})();
