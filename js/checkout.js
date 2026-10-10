(() => {
  const form = $("#checkoutForm");
  if (Cart.items().length === 0) {
    form.hidden = true;
    $("#checkoutEmpty").hidden = false;
    return;
  }
  const f = form.elements;

  // Pré-remplissage avec les coordonnées de la dernière commande
  const last = store.get("customer", null);
  if (last) Object.entries(last).forEach(([k, v]) => { const el = f[k]; if (el && !el.value && typeof v === "string") el.value = v; });
  if (!f.zip.value) f.zip.value = store.get("cp", "");

  // Carte bancaire d'abord, virement instantané en alternative
  const pay = SHOP.payment;
  const PAYMENTS = [
    pay.card.enabled && { id: "carte", name: "Carte bancaire", tag: "Recommandé", logo: "▭", text: "Paiement sécurisé par carte (CB, Visa, Mastercard) sur notre page de paiement." },
    pay.transfer.enabled && { id: "virement", name: "Virement instantané", logo: "€", text: "Depuis l'application de votre banque, reçu en quelques secondes." },
  ].filter(Boolean);
  $("#paymentOptions").innerHTML = PAYMENTS.map((p, i) => `
    <label class="option">
      <input type="radio" name="payment" value="${p.id}" ${i === 0 ? "checked" : ""}>
      <span class="option__body"><strong>${p.name}${p.tag ? ` <span class="hum">${p.tag}</span>` : ""}</strong><span class="muted small">${p.text}</span></span>
      <span class="pay-logo pay-logo--${p.id === "carte" ? "card" : "virement"}" aria-hidden="true">${p.logo}</span>
    </label>`).join("");

  function render() {
    const cp = /^\d{5}$/.test(f.zip.value) ? f.zip.value : "";
    if (cp) store.set("cp", cp);
    const t = computeTotals({ cp });
    const m = t.method;
    const w = deliveryWindow();

    $("#shippingOptions").innerHTML = cp && !t.del.loc.ok
      ? '<p class="notice">Nous ne livrons pas ce département (Corse, outre-mer).</p>'
      : `<div class="option option--static">
          <span class="option__body"><strong>${escapeHtml(m.name)} · ${plural(m.pallets, "palette")}</strong>
            <span class="muted small">${escapeHtml(m.delay)} · ${euro(SHOP.delivery.feePerPallet)} par palette de ${plural(SHOP.delivery.pallet, "stère")} maximum</span></span>
          <span class="option__price">${euro(m.fee)}</span>
        </div>`;

    $("#miniCart").innerHTML = t.items.map((i) => `
      <li>
        <span class="mini-cart__art">${productArt(i.product, i.opts)}</span>
        <span><strong>${escapeHtml(i.product.name)}</strong><span class="small muted">${escapeHtml(unitLabel(i.product, i.qty))}${optsLabel(i.product, i.opts) ? " · " + escapeHtml(optsLabel(i.product, i.opts)) : ""}</span></span>
        <span>${euro(i.line)}</span>
      </li>`).join("");
    $("#totals").innerHTML = totalsHtml(t);
    $("#summaryDelivery").innerHTML = `Livraison estimée entre le <strong>${fmtDate(w.from, { day: "numeric", month: "long" })}</strong> et le <strong>${fmtDate(w.to, { day: "numeric", month: "long" })}</strong> pour un paiement aujourd'hui.`;
    const issue = t.issue || (cp && !t.del.loc.ok ? "Nous ne livrons pas ce code postal." : "");
    $("#checkoutIssue").hidden = !issue;
    $("#checkoutIssue").innerHTML = issue ? `${escapeHtml(issue)} <a href="panier.html">Modifier le panier</a>` : "";
    $("#submitBtn").disabled = !!issue;
    $("#submitBtn").textContent = `Valider la commande · ${euro(t.total)}`;
    return t;
  }

  f.zip.addEventListener("input", () => {
    f.zip.value = f.zip.value.replace(/\D/g, "").slice(0, 5);
    if (f.zip.value.length === 5) render();
  });

  // ---------- Création de la commande ----------
  function newOrderId() {
    const d = new Date();
    const stamp = [d.getFullYear() % 100, d.getMonth() + 1, d.getDate()].map((n) => String(n).padStart(2, "0")).join("");
    return `SO${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  const PAY_NAMES = { carte: "Carte bancaire", virement: "Virement instantané" };

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
      `Livraison (${o.shippingName}, ${o.pallets} palette(s)) : ${euro(o.shipping)}`,
      `TOTAL TTC : ${euro(o.total)} (dont TVA ${euro(o.vat)})`,
      `Paiement : ${PAY_NAMES[o.payment]} — référence ${o.id}`,
      "",
      `Client : ${c.firstname} ${c.lastname}`,
      `E-mail : ${c.email} · Tél. : ${c.phone}`,
      `Adresse : ${c.address}${c.address2 ? ", " + c.address2 : ""}, ${c.zip} ${c.city}`,
      o.access ? `Accès : ${o.access}` : null,
      o.note ? `Message : ${o.note}` : null,
    ].filter((l) => l !== null).join("\n");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    if (render().issue) return;
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
      st: t.st, subtotal: t.subtotal, discount: t.discount, promo: t.promo?.code || "",
      shipping: t.shipping, shippingId: t.method.id, shippingName: t.method.name, pallets: t.method.pallets,
      total: t.total, vat: t.vat,
      payment: f.payment.value,
      customer, access: f.access.value.trim(), note: f.note.value.trim(),
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
