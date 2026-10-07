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

    // Livraison estimée
    const m = t.method;
    const loc = t.del.loc;
    let hint = "";
    if (!deptOf(cp)) hint = "Saisissez votre code postal pour calculer la livraison.";
    else if (!loc.ok) hint = "Nous ne livrons pas ce département : retrait au dépôt uniquement.";
    else if (m.id === "camion") {
      const z = m.zone;
      const left = round2(z.freeFromSteres - t.st);
      hint = left > 0 ? `Encore ${num(left)} stère${left > 1 ? "s" : ""} pour la livraison offerte en ${z.name.split(" ·")[0]}.` : "Livraison offerte pour votre volume.";
      $("#volMeter").innerHTML = `<span style="width:${Math.min(100, (t.st / z.freeFromSteres) * 100)}%"></span>`;
    } else if (m.id === "colis") hint = m.note || "Livraison offerte.";
    else hint = m.note;
    $("#volMeter").hidden = m.id !== "camion";
    $("#freeHint").textContent = hint;
    $("#deliveryLine").innerHTML = deptOf(cp) && loc.ok ? `<strong>${escapeHtml(m.name)}</strong><br><span class="muted">${escapeHtml(m.delay)}</span>` : "";

    $("#totals").innerHTML = totalsHtml(t, { cpKnown: !!deptOf(cp) });
    $("#volTotal").textContent = t.st ? `Volume total : ${num(t.st)} stère${t.st >= 2 ? "s" : ""} (équivalent)` : "";
    if (t.promo) {
      $("#promoInput").value = t.promo.code;
      $("#promoMsg").textContent = t.promo.label;
      $("#promoMsg").className = "small ok";
    }
  }

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
