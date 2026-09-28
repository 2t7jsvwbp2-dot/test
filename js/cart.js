// Rendu des totaux, partagé par la page panier et la page commande.
function totalsHtml(t) {
  return `
    <div><dt>Sous-total</dt><dd>${euro(t.subtotal)}</dd></div>
    ${t.promo ? `<div class="totals__discount"><dt>Remise ${escapeHtml(t.promo.code)}</dt><dd>−${euro(t.discount)}</dd></div>` : ""}
    <div><dt>Livraison <span class="muted small">(${escapeHtml(t.method.name)})</span></dt><dd>${t.items.length === 0 ? "—" : t.shipping === 0 ? "Offerte" : euro(t.shipping)}</dd></div>
    <div class="totals__grand"><dt>Total TTC</dt><dd>${euro(t.total)}</dd></div>`;
}

if (document.body.dataset.page === "panier") (() => {
  function render() {
    const t = computeTotals(store.get("shipping", "colissimo"));
    const empty = t.items.length === 0;
    $("#cartLayout").hidden = empty;
    $("#cartEmpty").hidden = !empty;
    if (empty) return;

    $("#cartList").innerHTML = t.items.map(({ product: p, qty }) => `
      <article class="cart-row">
        <a href="produit.html?id=${p.id}" class="cart-row__img"><img src="${imgSrc(p.id)}" alt="" width="600" height="600"></a>
        <div class="cart-row__info">
          <p class="card-product__brand">${escapeHtml(p.brand)}</p>
          <h3><a href="produit.html?id=${p.id}">${escapeHtml(p.name)}</a></h3>
          <p class="small muted">Réf. ${escapeHtml(p.ref)} · ${euro(p.price)} l'unité</p>
          ${fitBadge(p)}
          ${qty >= p.stock ? `<p class="small stock--low">Stock maximum atteint (${p.stock})</p>` : ""}
        </div>
        <div class="qty qty--sm">
          <button type="button" data-set="${p.id}" data-qty="${qty - 1}" aria-label="Diminuer">−</button>
          <span aria-live="polite">${qty}</span>
          <button type="button" data-set="${p.id}" data-qty="${qty + 1}" aria-label="Augmenter" ${qty >= p.stock ? "disabled" : ""}>+</button>
        </div>
        <div class="cart-row__price">
          <strong>${euro(p.price * qty)}</strong>
          <button class="link small" data-set="${p.id}" data-qty="0">Retirer</button>
        </div>
      </article>`).join("");

    $("#totals").innerHTML = totalsHtml(t);
    const left = SHOP.shipping.freeFrom - (t.subtotal - t.discount);
    $("#freeHint").textContent = left > 0 ? `Plus que ${euro(left)} d'achats pour la livraison offerte.` : "Livraison Colissimo offerte.";
    if (t.promo) {
      $("#promoInput").value = t.promo.code;
      $("#promoMsg").textContent = t.promo.label;
      $("#promoMsg").className = "small ok";
    }
  }

  $("#cartList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-set]");
    if (b) Cart.set(b.dataset.set, +b.dataset.qty);
  });

  $("#promoForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const code = $("#promoInput").value.trim().toUpperCase();
    const msg = $("#promoMsg");
    if (!code) {
      store.set("promo", "");
      msg.textContent = "";
    } else if (SHOP.promoCodes[code]) {
      store.set("promo", code);
      msg.textContent = SHOP.promoCodes[code].label;
      msg.className = "small ok";
    } else {
      store.set("promo", "");
      msg.textContent = `Le code « ${code} » n'existe pas. Vérifiez l'orthographe.`;
      msg.className = "small error";
    }
    render();
  });

  document.addEventListener("cart:change", render);
  render();
})();
