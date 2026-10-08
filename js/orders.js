(() => {
  const orders = store.get("orders", []);
  const PAY = { carte: "Carte bancaire", virement: "Virement instantané" };
  $("#orders").innerHTML = orders.length
    ? `<ul class="order-list">${orders.map((o) => `
        <li>
          <a href="confirmation.html?commande=${encodeURIComponent(o.id)}">
            <span><strong>${escapeHtml(o.id)}</strong>
              <span class="small muted">${new Date(o.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · ${o.items.length} article(s) · ${PAY[o.payment] || ""}</span>
              ${o.pallets ? `<span class="small">Livraison sur palette sous ${delayText()}</span>` : ""}</span>
            <strong>${euro(o.total)}</strong>
          </a>
        </li>`).join("")}</ul>`
    : `<div class="empty"><h2>Aucune commande pour l'instant</h2><a class="btn btn--primary" href="catalogue.html">Voir la boutique</a></div>`;
})();
