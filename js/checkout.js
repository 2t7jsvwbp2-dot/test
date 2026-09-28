(() => {
  const form = $("#checkoutForm");
  if (Cart.items().length === 0) {
    form.hidden = true;
    $("#checkoutEmpty").hidden = false;
    return;
  }

  // ---------- Options de livraison et de paiement ----------
  $("#shippingOptions").innerHTML = SHOP.shipping.methods.map((m, i) => `
    <label class="option">
      <input type="radio" name="shipping" value="${m.id}" ${i === 0 ? "checked" : ""}>
      <span class="option__body">
        <strong>${escapeHtml(m.name)}</strong>
        <span class="muted small">${escapeHtml(m.delay)}</span>
      </span>
      <span class="option__price" data-ship-price="${m.id}"></span>
    </label>`).join("");

  const pay = SHOP.payment;
  const methods = [
    pay.revolut.enabled && { id: "revolut", name: "Revolut", text: "Paiement instantané via votre application Revolut ou par carte sur la page Revolut." },
    pay.transfer.enabled && { id: "virement", name: "Virement bancaire", text: "Virement SEPA depuis n'importe quelle banque. Instantané ou sous 1 à 2 jours ouvrés." },
  ].filter(Boolean);
  $("#paymentOptions").innerHTML = methods.map((m, i) => `
    <label class="option">
      <input type="radio" name="payment" value="${m.id}" ${i === 0 ? "checked" : ""}>
      <span class="option__body">
        <strong>${m.name}</strong>
        <span class="muted small">${m.text}</span>
      </span>
      <span class="pay-logo pay-logo--${m.id}" aria-hidden="true">${m.id === "revolut" ? "R" : "€"}</span>
    </label>`).join("");

  const saved = store.get("shipping", "colissimo");
  const savedRadio = $(`input[name="shipping"][value="${saved}"]`, form);
  if (savedRadio) savedRadio.checked = true;

  // Pré-remplissage avec les coordonnées de la dernière commande
  const last = store.get("customer", null);
  if (last) Object.entries(last).forEach(([k, v]) => { const el = form.elements[k]; if (el && !el.value) el.value = v; });
  const v = Garage.get();

  function render() {
    const shippingId = form.elements.shipping.value;
    store.set("shipping", shippingId);
    const t = computeTotals(shippingId);

    SHOP.shipping.methods.forEach((m) => {
      const free = m.price === 0 || (m.free && t.subtotal - t.discount >= SHOP.shipping.freeFrom);
      $(`[data-ship-price="${m.id}"]`).textContent = free ? "Gratuit" : euro(m.price);
    });

    const pickup = shippingId === "retrait";
    $("#addressFields").hidden = pickup;
    $$("#addressFields input").forEach((el) => (el.disabled = pickup));
    $("#pickupInfo").hidden = !pickup;

    $("#miniCart").innerHTML = t.items.map(({ product: p, qty }) => `
      <li>
        <img src="${imgSrc(p.id)}" alt="" width="600" height="600">
        <span><strong>${escapeHtml(p.name)}</strong><span class="small muted">Qté ${qty}${v && !p.models.includes(v.code) ? ` · <span class="error">non compatible ${v.code}</span>` : ""}</span></span>
        <span>${euro(p.price * qty)}</span>
      </li>`).join("");
    $("#totals").innerHTML = totalsHtml(t);
    $("#submitBtn").textContent = `Valider la commande · ${euro(t.total)}`;
  }
  form.addEventListener("change", render);

  // ---------- Validation et création de la commande ----------
  function newOrderId() {
    const d = new Date();
    const date = [d.getFullYear() % 100, d.getMonth() + 1, d.getDate()].map((n) => String(n).padStart(2, "0")).join("");
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `BP${date}-${rand}`;
  }

  function orderText(o) {
    const lines = [
      `Commande ${o.id} du ${new Date(o.date).toLocaleString("fr-FR")}`,
      "",
      ...o.items.map((i) => `- ${i.qty} × ${i.name} (réf. ${i.ref}) : ${euro(i.price * i.qty)}`),
      "",
      `Sous-total : ${euro(o.subtotal)}`,
      o.discount ? `Remise ${o.promo} : -${euro(o.discount)}` : null,
      `Livraison (${o.shippingName}) : ${euro(o.shipping)}`,
      `TOTAL : ${euro(o.total)}`,
      `Paiement : ${o.payment === "revolut" ? "Revolut" : "Virement bancaire"} — référence ${o.id}`,
      "",
      `Client : ${o.customer.firstname} ${o.customer.lastname}`,
      `E-mail : ${o.customer.email} · Tél. : ${o.customer.phone}`,
      o.shippingId === "retrait" ? "Retrait à l'entrepôt" : `Adresse : ${o.customer.address}${o.customer.address2 ? ", " + o.customer.address2 : ""}, ${o.customer.zip} ${o.customer.city}`,
      o.vin ? `VIN : ${o.vin}` : null,
      o.vehicle ? `Véhicule indiqué : ${o.vehicle}` : null,
      o.note ? `Message : ${o.note}` : null,
    ];
    return lines.filter((l) => l !== null).join("\n");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;

    const btn = $("#submitBtn");
    btn.disabled = true;
    btn.textContent = "Enregistrement…";

    const f = form.elements;
    const t = computeTotals(f.shipping.value);
    const customer = {
      firstname: f.firstname.value.trim(), lastname: f.lastname.value.trim(),
      email: f.email.value.trim(), phone: f.phone.value.trim(),
      address: f.address.value.trim(), address2: f.address2.value.trim(),
      zip: f.zip.value.trim(), city: f.city.value.trim(),
    };
    const order = {
      id: newOrderId(),
      date: new Date().toISOString(),
      items: t.items.map(({ product: p, qty }) => ({ id: p.id, name: p.name, ref: p.ref, price: p.price, qty })),
      subtotal: t.subtotal, discount: t.discount, promo: t.promo?.code || "",
      shipping: t.shipping, shippingId: t.method.id, shippingName: t.method.name,
      total: t.total,
      payment: f.payment.value,
      customer, vin: f.vin.value.trim().toUpperCase(), note: f.note.value.trim(),
      vehicle: v ? v.name : "",
    };
    order.text = orderText(order);

    order.sent = await sendToEndpoint({
      _subject: `Nouvelle commande ${order.id} — ${euro(order.total)}`,
      _replyto: customer.email,
      commande: order.id,
      total: euro(order.total),
      paiement: order.payment,
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
