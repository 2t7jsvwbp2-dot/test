(() => {
  const cpInput = $("#cartCp");

  function render() {
    const cp = store.get("cp", "");
    const t = computeTotals({ cp });
    const empty = t.items.length === 0;
    $("#cartLayout").hidden = empty;
    $("#cartEmpty").hidden = !empty;
    if (empty) return;

    $("#cartList").innerHTML = t.items.map((i) => {
      const p = i.product;
      const max = p.max || 30;
      return `<article class="cart-row">
        <a href="produit.html?id=${p.id}" class="cart-row__img">${productArt(p, i.opts)}</a>
        <div class="cart-row__info">
          <h3><a href="produit.html?id=${p.id}">${escapeHtml(p.name)}</a></h3>
          <p class="small muted">${escapeHtml(optsLabel(p, i.opts))}</p>
          <p class="small muted">${euro(i.unit)} / ${p.unit}${p.type === "config" ? ` · ${num(apparentM3(i.qty, i.opts.len))} m³ apparent` : ""}</p>
        </div>
        <div class="qty qty--sm">
          <button type="button" data-set="${i.key}" data-qty="${i.qty - 1}" aria-label="Diminuer">−</button>
          <span aria-live="polite">${i.qty}</span>
          <button type="button" data-set="${i.key}" data-qty="${i.qty + 1}" aria-label="Augmenter" ${i.qty >= max ? "disabled" : ""}>+</button>
        </div>
        <div class="cart-row__price">
          <strong>${euro(i.line)}</strong>
          <button class="link small" data-set="${i.key}" data-qty="0">Retirer</button>
        </div>
      </article>`;
    }).join("");

    // Livraison sur palette : remplissage de la dernière palette
    const m = t.method;
    const cap = m.pallets * SHOP.delivery.pallet;
    const room = round2(cap - t.st);
    $("#volMeter").innerHTML = `<span style="width:${Math.min(100, (t.st / cap) * 100)}%"></span>`;
    $("#volMeter").hidden = !t.st;
    const D = SHOP.delivery;
    const toFree = round2(D.freeFromPallets * D.pallet - t.st);
    $("#freeHint").textContent = !t.st ? ""
      : m.free ? "Livraison offerte pour votre commande."
      : D.freeFromPallets && toFree <= 2 * D.pallet ? `Encore ${num(toFree)} stère${toFree >= 2 ? "s" : ""} et la livraison est offerte (dès ${plural(D.freeFromPallets, "palette")}).`
      : room >= 0.5 ? `Il reste de la place pour ${num(room)} stère${room >= 2 ? "s" : ""} sur ${m.pallets > 1 ? "vos palettes" : "votre palette"}, sans frais de livraison en plus.`
      : "";
    const loc = t.del.loc;
    $("#deliveryLine").innerHTML = deptOf(cp) && !loc.ok
      ? '<span class="error">Nous ne livrons pas ce département (Corse, outre-mer).</span>'
      : `<strong>${escapeHtml(m.name)}</strong> · ${plural(m.pallets, "palette")}<br><span class="muted">${escapeHtml(m.delay)}</span>`;

    $("#cartIssue").hidden = !t.issue;
    $("#cartIssue").innerHTML = t.issue ? `${escapeHtml(t.issue)} <a href="catalogue.html?categorie=buches">Choisir du bois</a>` : "";
    const go = $("#toCheckout");
    const blocked = Boolean(t.issue || (deptOf(cp) && !loc.ok));
    go.classList.toggle("is-disabled", blocked);
    go.setAttribute("aria-disabled", blocked);

    $("#totals").innerHTML = totalsHtml(t);
    $("#volTotal").textContent = t.st ? `Volume total : ${num(t.st)} stère${t.st >= 2 ? "s" : ""} (équivalent)` : "";
    if (t.promo) {
      $("#promoInput").value = t.promo.code;
      $("#promoMsg").textContent = t.promo.label;
      $("#promoMsg").className = "small ok";
    }
  }

  $("#toCheckout").addEventListener("click", (e) => {
    if (e.currentTarget.getAttribute("aria-disabled") === "true") { e.preventDefault(); $("#cartIssue").focus?.(); toast(computeTotals().issue || "Nous ne livrons pas ce code postal."); }
  });

  $("#cartList").addEventListener("click", (e) => {
    const b = e.target.closest("[data-set]");
    if (b) Cart.setQty(b.dataset.set, +b.dataset.qty);
  });

  cpInput.value = store.get("cp", "");
  cpInput.addEventListener("input", () => {
    cpInput.value = cpInput.value.replace(/\D/g, "").slice(0, 5);
    if (cpInput.value.length === 5 || cpInput.value === "") setCp(cpInput.value);
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
  document.addEventListener("cp:change", () => { cpInput.value = store.get("cp", ""); render(); });
  render();
})();
