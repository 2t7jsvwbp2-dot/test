(() => {
  const p = productById(params.get("id"));
  const root = $("#product");

  if (!p) {
    root.innerHTML = `<div class="empty">
      <h1>Pièce introuvable</h1>
      <p>Cette pièce n'existe pas ou n'est plus au catalogue.</p>
      <a class="btn btn--primary" href="catalogue.html">Retour au catalogue</a>
    </div>`;
    return;
  }

  const cat = categoryById(p.category);
  document.title = `${p.name} · ${SHOP.name}`;
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;

  // Date d'expédition estimée : jour ouvré suivant
  const ship = new Date();
  do ship.setDate(ship.getDate() + 1); while (ship.getDay() === 0 || ship.getDay() === 6);
  const shipDate = ship.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  function compatHtml() {
    const v = Garage.get();
    if (!v) {
      return `<div class="compat compat--unknown">
        <strong>Est-ce compatible avec ma voiture ?</strong>
        <span>Indiquez votre modèle pour le vérifier.</span>
        <button class="btn btn--ghost btn--sm" type="button" data-open-garage>Choisir mon véhicule</button>
      </div>`;
    }
    return p.models.includes(v.code)
      ? `<div class="compat compat--yes"><strong>✓ Compatible avec votre ${escapeHtml(v.name)}</strong><span>Selon les données constructeur. En cas de doute, vérifiez avec votre VIN.</span></div>`
      : `<div class="compat compat--no"><strong>✕ Non compatible avec votre ${escapeHtml(v.name)}</strong><span><a href="catalogue.html?modele=${v.code}&categorie=${p.category}">Voir les pièces ${escapeHtml(cat.name.toLowerCase())} pour votre ${escapeHtml(v.code)}</a></span></div>`;
  }

  root.innerHTML = `
    <nav class="breadcrumb" aria-label="Fil d'Ariane">
      <a href="index.html">Accueil</a>
      <a href="catalogue.html?categorie=${cat.id}">${escapeHtml(cat.name)}</a>
      <span>${escapeHtml(p.name)}</span>
    </nav>
    <div class="pdp">
      <div class="pdp__media">
        <img src="${imgSrc(p.id)}" alt="${escapeHtml(p.name)}" width="600" height="600">
        ${discount ? `<span class="tag tag--promo tag--lg">-${discount} %</span>` : ""}
        <p class="small muted">Illustration non contractuelle.</p>
      </div>
      <div class="pdp__info">
        <p class="card-product__brand">${escapeHtml(p.brand)}</p>
        <h1>${escapeHtml(p.name)}</h1>
        <dl class="refs">
          <div><dt>Référence</dt><dd>${escapeHtml(p.ref)}</dd></div>
          <div><dt>Réf. constructeur</dt><dd>${escapeHtml(p.oem)}</dd></div>
        </dl>
        <div id="compat">${compatHtml()}</div>
        <div class="pdp__buy">
          ${priceHtml(p, "price--lg")}
          <p class="small muted">TTC · Livraison offerte dès ${SHOP.shipping.freeFrom} €</p>
          ${stockLabel(p.stock)}
          ${p.stock > 0 ? `<p class="small">Commandé et payé aujourd'hui, expédié <strong>${shipDate}</strong>.</p>` : ""}
          <div class="pdp__actions">
            <div class="qty">
              <button type="button" data-step="-1" aria-label="Diminuer la quantité">−</button>
              <input type="number" id="qty" value="1" min="1" max="${Math.max(1, p.stock)}" aria-label="Quantité">
              <button type="button" data-step="1" aria-label="Augmenter la quantité">+</button>
            </div>
            <button class="btn btn--primary btn--lg" id="addBtn" ${p.stock === 0 ? "disabled" : ""}>Ajouter au panier</button>
          </div>
          ${p.stock === 0 ? `<p class="small"><a href="contact.html?piece=${encodeURIComponent(p.ref)}">Être prévenu du réassort</a></p>` : ""}
        </div>
        <ul class="pdp__perks">
          <li>Paiement par Revolut ou virement bancaire</li>
          <li>Retour possible sous 14 jours</li>
          <li>Vérification de compatibilité gratuite avec votre VIN</li>
        </ul>
      </div>
    </div>

    <div class="tabs" role="tablist" aria-label="Informations produit">
      <button role="tab" aria-selected="true" aria-controls="tab-desc" id="t-desc">Description</button>
      <button role="tab" aria-selected="false" aria-controls="tab-specs" id="t-specs">Caractéristiques</button>
      <button role="tab" aria-selected="false" aria-controls="tab-compat" id="t-compat">Compatibilité (${p.models.length})</button>
      <button role="tab" aria-selected="false" aria-controls="tab-ship" id="t-ship">Livraison</button>
    </div>
    <div class="tab-panel" role="tabpanel" id="tab-desc" aria-labelledby="t-desc">
      <p class="prose">${escapeHtml(p.desc)}</p>
    </div>
    <div class="tab-panel" role="tabpanel" id="tab-specs" aria-labelledby="t-specs" hidden>
      <table class="table">
        <tbody>
          <tr><th scope="row">Marque</th><td>${escapeHtml(p.brand)}</td></tr>
          <tr><th scope="row">Catégorie</th><td>${escapeHtml(cat.name)}</td></tr>
          ${Object.entries(p.specs).map(([k, v]) => `<tr><th scope="row">${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
    <div class="tab-panel" role="tabpanel" id="tab-compat" aria-labelledby="t-compat" hidden>
      <table class="table">
        <thead><tr><th>Châssis</th><th>Modèle</th><th>Années</th></tr></thead>
        <tbody>
          ${p.models.map(modelByCode).map((m) => `<tr><td><strong>${m.code}</strong></td><td>${escapeHtml(m.name.replace(/ \(.*\)/, ""))}</td><td>${m.years}</td></tr>`).join("")}
        </tbody>
      </table>
      <p class="small muted">La compatibilité peut dépendre de la motorisation ou des options. Envoyez-nous votre VIN pour une vérification gratuite.</p>
    </div>
    <div class="tab-panel" role="tabpanel" id="tab-ship" aria-labelledby="t-ship" hidden>
      <table class="table">
        <thead><tr><th>Mode</th><th>Délai</th><th>Prix</th></tr></thead>
        <tbody>
          ${SHOP.shipping.methods.map((m) => `<tr><td>${escapeHtml(m.name)}</td><td>${escapeHtml(m.delay)}</td><td>${m.price === 0 ? "Gratuit" : euro(m.price) + (m.free ? ` (offert dès ${SHOP.shipping.freeFrom} €)` : "")}</td></tr>`).join("")}
        </tbody>
      </table>
      <p class="small muted">Les délais courent à partir de la réception de votre paiement. <a href="livraison-retours.html">Tout savoir sur la livraison et les retours</a>.</p>
    </div>`;

  // Quantité
  const qty = $("#qty");
  $$("[data-step]", root).forEach((b) =>
    b.addEventListener("click", () => {
      qty.value = Math.min(Math.max(1, p.stock), Math.max(1, (+qty.value || 1) + +b.dataset.step));
    })
  );
  $("#addBtn").addEventListener("click", () => {
    const n = Math.max(1, Math.min(+qty.value || 1, p.stock));
    Cart.add(p.id, n);
  });

  // Onglets
  const tabs = $$('[role="tab"]', root);
  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      tabs.forEach((x) => {
        const on = x === t;
        x.setAttribute("aria-selected", on);
        $("#" + x.getAttribute("aria-controls")).hidden = !on;
      });
    })
  );

  // Véhicule
  root.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-garage]")) $("#vehicleChip").click();
  });
  document.addEventListener("vehicle:change", () => ($("#compat").innerHTML = compatHtml()));

  // Produits associés : même catégorie et au moins un modèle en commun
  const related = PRODUCTS.filter((x) => x.id !== p.id && x.category === p.category)
    .concat(PRODUCTS.filter((x) => x.id !== p.id && x.category !== p.category && x.models.some((m) => p.models.includes(m))))
    .slice(0, 4);
  if (related.length) {
    $("#relatedSection").hidden = false;
    $("#related").innerHTML = related.map(productCard).join("");
  }
})();
