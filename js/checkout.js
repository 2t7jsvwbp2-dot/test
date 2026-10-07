(() => {
  const form = $("#checkoutForm");
  if (Cart.items().length === 0) {
    form.hidden = true;
    $("#checkoutEmpty").hidden = false;
    return;
  }
  const f = form.elements;
  let slot = "matin";
  let date = store.get("date", "");

  // Pré-remplissage avec les coordonnées de la dernière commande
  const last = store.get("customer", null);
  if (last) Object.entries(last).forEach(([k, v]) => { const el = f[k]; if (el && !el.value && typeof v === "string") el.value = v; });
  if (!f.zip.value) f.zip.value = store.get("cp", "");

  const pay = SHOP.payment;
  const PAYMENTS = [
    pay.revolut.enabled && { id: "revolut", name: "Revolut", logo: "R", text: "Paiement instantané depuis l'application Revolut, ou par carte bancaire sur la page Revolut." },
    pay.transfer.enabled && { id: "virement", name: "Virement bancaire", logo: "€", text: "Virement SEPA depuis n'importe quelle banque, instantané ou sous 1 à 2 jours." },
    pay.onDelivery.enabled && { id: "livraison", name: "À la livraison", logo: "✓", text: "Par chèque ou en espèces, remis au chauffeur ou au dépôt. Espèces limitées à 1 000 €.", onDelivery: true },
  ].filter(Boolean);

  function render() {
    const cp = /^\d{5}$/.test(f.zip.value) ? f.zip.value : "";
    if (cp) store.set("cp", cp);
    const items = Cart.items();
    const del = deliveryOptions(cp, items);

    // Modes de livraison
    const current = f.shipping?.value || store.get("method", "");
    const methodId = del.methods.some((m) => m.id === current) ? current : del.methods[0].id;
    $("#shippingOptions").innerHTML = (cp ? "" : '<p class="notice">Saisissez votre code postal pour voir la livraison à domicile.</p>') +
      (cp && !del.loc.ok ? '<p class="notice">Nous ne livrons pas ce département. Vous pouvez retirer la commande au dépôt.</p>' : "") +
      del.methods.map((m) => `
      <label class="option">
        <input type="radio" name="shipping" value="${m.id}" ${m.id === methodId ? "checked" : ""}>
        <span class="option__body">
          <strong>${escapeHtml(m.name)}</strong>
          <span class="muted small">${escapeHtml(m.delay)}${m.note ? ` · ${escapeHtml(m.note)}` : ""}</span>
        </span>
        <span class="option__price">${m.fee ? euro(m.fee) : "Gratuit"}</span>
      </label>`).join("");
    store.set("method", methodId);
    const method = del.methods.find((m) => m.id === methodId);

    // Dates
    $("#dateBlock").hidden = !method.dates;
    if (method.dates) {
      if (!method.dates.includes(date)) date = method.dates[0];
      $("#dateTitle").textContent = method.id === "retrait" ? "Quand passez-vous au dépôt ?" : "Choisissez votre date de livraison";
      $("#dateGrid").innerHTML = method.dates.map((d) => {
        const dt = new Date(d + "T12:00:00");
        return `<button type="button" class="date-card" role="radio" data-date="${d}" aria-checked="${d === date}">
          <span>${dt.toLocaleDateString("fr-FR", { weekday: "short" })}</span><strong>${dt.getDate()}</strong><span>${dt.toLocaleDateString("fr-FR", { month: "short" })}</span>
        </button>`;
      }).join("");
      store.set("date", date);
    }
    $$("#slotSeg .seg__btn").forEach((b) => b.setAttribute("aria-pressed", b.dataset.slot === slot));

    const pickup = method.id === "retrait";
    $("#accessFields").hidden = !(method.id === "camion");
    $("#pickupInfo").hidden = !pickup;
    $("#accessHint").hidden = f.access.checked;

    // Paiement : le paiement à la livraison n'existe qu'avec nos camions ou au dépôt
    const prevPay = f.payment?.value;
    const payments = PAYMENTS.filter((p) => !p.onDelivery || method.payOnDelivery);
    const payId = payments.some((p) => p.id === prevPay) ? prevPay : payments[0].id;
    $("#paymentOptions").innerHTML = payments.map((p) => `
      <label class="option">
        <input type="radio" name="payment" value="${p.id}" ${p.id === payId ? "checked" : ""}>
        <span class="option__body"><strong>${p.name}</strong><span class="muted small">${p.text}</span></span>
        <span class="pay-logo pay-logo--${p.id}" aria-hidden="true">${p.logo}</span>
      </label>`).join("");

    // Récapitulatif
    const t = computeTotals({ cp, methodId });
    $("#miniCart").innerHTML = t.items.map((i) => `
      <li>
        <span class="mini-cart__art">${productArt(i.product, i.opts)}</span>
        <span><strong>${escapeHtml(i.product.name)}</strong><span class="small muted">${escapeHtml(unitLabel(i.product, i.qty))}${optsLabel(i.product, i.opts) ? " · " + escapeHtml(optsLabel(i.product, i.opts)) : ""}</span></span>
        <span>${euro(i.line)}</span>
      </li>`).join("");
    $("#totals").innerHTML = totalsHtml(t, { cpKnown: !!cp });
    $("#summaryDelivery").innerHTML = method.dates ? `${pickup ? "Retrait" : "Livraison"} le <strong>${fmtDate(date)}</strong>, ${slot === "matin" ? "le matin" : "l'après-midi"}.` : "";
    $("#submitBtn").textContent = `Valider la commande · ${euro(t.total)}`;
    return t;
  }

  form.addEventListener("change", (e) => { if (e.target.name !== "note") render(); });
  f.zip.addEventListener("input", () => {
    f.zip.value = f.zip.value.replace(/\D/g, "").slice(0, 5);
    if (f.zip.value.length === 5) render();
  });
  form.addEventListener("click", (e) => {
    const d = e.target.closest("[data-date]");
    if (d) { date = d.dataset.date; render(); $(`[data-date="${date}"]`).focus(); }
    const s = e.target.closest("[data-slot]");
    if (s) { slot = s.dataset.slot; render(); }
  });

  // ---------- Création de la commande ----------
  function newOrderId() {
    const d = new Date();
    const stamp = [d.getFullYear() % 100, d.getMonth() + 1, d.getDate()].map((n) => String(n).padStart(2, "0")).join("");
    return `BB${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  const PAY_NAMES = { revolut: "Revolut", virement: "Virement bancaire", livraison: "À la livraison (chèque ou espèces)" };

  function orderText(o) {
    const c = o.customer;
    return [
      `Commande ${o.id} du ${new Date(o.date).toLocaleString("fr-FR")}`,
      "",
      ...o.items.map((i) => `- ${i.qtyLabel} · ${i.name}${i.opts ? ` (${i.opts})` : ""} : ${euro(i.line)}`),
      o.st ? `Volume : ${num(o.st)} stère(s) équivalent` : null,
      "",
      `Sous-total : ${euro(o.subtotal)}`,
      o.discount ? `Remise ${o.promo} : -${euro(o.discount)}` : null,
      o.pickupDiscount ? `Remise retrait : -${euro(o.pickupDiscount)}` : null,
      `Livraison (${o.shippingName}) : ${euro(o.shipping)}`,
      `TOTAL TTC : ${euro(o.total)} (dont TVA ${euro(o.vat)})`,
      `Paiement : ${PAY_NAMES[o.payment]} — référence ${o.id}`,
      o.deliveryDate ? `${o.shippingId === "retrait" ? "Retrait" : "Livraison"} : ${fmtDate(o.deliveryDate)}, ${o.slot}` : null,
      "",
      `Client : ${c.firstname} ${c.lastname}`,
      `E-mail : ${c.email} · Tél. : ${c.phone}`,
      `Adresse : ${c.address}${c.address2 ? ", " + c.address2 : ""}, ${c.zip} ${c.city}`,
      o.shippingId === "camion" ? `Déchargement : ${o.unload} · Accès camion : ${o.access ? "oui" : "NON, à vérifier"}` : null,
      o.note ? `Message : ${o.note}` : null,
    ].filter((l) => l !== null).join("\n");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    const btn = $("#submitBtn");
    btn.disabled = true;
    btn.textContent = "Enregistrement…";

    const t = render();
    const customer = {
      firstname: f.firstname.value.trim(), lastname: f.lastname.value.trim(),
      email: f.email.value.trim(), phone: f.phone.value.trim(),
      address: f.address.value.trim(), address2: f.address2.value.trim(),
      zip: f.zip.value.trim(), city: f.city.value.trim(),
    };
    const order = {
      id: newOrderId(),
      date: new Date().toISOString(),
      items: t.items.map((i) => ({
        id: i.id, name: i.product.name, opts: optsLabel(i.product, i.opts), len: i.opts.len, dry: i.opts.dry,
        qty: i.qty, qtyLabel: unitLabel(i.product, i.qty), unit: i.unit, line: i.line,
      })),
      st: t.st, subtotal: t.subtotal, discount: t.discount, promo: t.promo?.code || "", pickupDiscount: t.pickupDiscount,
      shipping: t.shipping, shippingId: t.method.id, shippingName: t.method.name,
      deliveryDate: t.method.dates ? date : "", slot: slot === "matin" ? "matin (8h – 12h)" : "après-midi (13h – 18h)",
      total: t.total, vat: t.vat,
      payment: f.payment.value,
      customer, unload: f.unload.value, access: f.access.checked, note: f.note.value.trim(),
    };
    order.text = orderText(order);

    order.sent = await sendToEndpoint({
      _subject: `Nouvelle commande ${order.id} — ${euro(order.total)}`,
      _replyto: customer.email,
      commande: order.id,
      total: euro(order.total),
      paiement: PAY_NAMES[order.payment],
      email: customer.email,
      message: order.text,
    });

    const orders = store.get("orders", []);
    orders.unshift(order);
    store.set("orders", orders.slice(0, 30));
    store.set("customer", customer);
    Cart.clear();
    location.href = `confirmation.html?commande=${encodeURIComponent(order.id)}`;
  });

  render();
})();
