(() => {
  const root = $("#confirmation");
  const orders = store.get("orders", []);
  const order = orders.find((o) => o.id === params.get("commande"));

  if (!order) {
    root.innerHTML = `<div class="empty">
      <h1>Commande introuvable</h1>
      <p>Cette commande n'est pas enregistrée dans ce navigateur. Si vous avez commandé depuis un autre appareil, retrouvez le numéro dans votre e-mail ou contactez-nous.</p>
      <p><a class="btn btn--primary" href="mes-commandes.html">Mes commandes</a> <a class="btn btn--ghost" href="contact.html">Nous contacter</a></p>
    </div>`;
    return;
  }

  const pay = SHOP.payment;
  const deadline = new Date(order.date);
  deadline.setDate(deadline.getDate() + pay.deadlineDays);
  const amount = order.total.toFixed(2).replace(".", ",");
  const PAY_NAMES = { revolut: "Revolut", virement: "Virement bancaire", livraison: "À la livraison (chèque ou espèces)" };

  const copyRow = (label, value, raw = value) => `
    <div class="copy-row">
      <dt>${label}</dt>
      <dd><span class="copy-row__value">${value ? escapeHtml(value) : cfg("")}</span>${value ? `<button type="button" class="copy-btn" data-copy="${escapeHtml(raw)}">Copier</button>` : ""}</dd>
    </div>`;

  function revolutBlock() {
    const r = pay.revolut;
    return `
      <div class="pay-box">
        <h2><span class="pay-logo pay-logo--revolut" aria-hidden="true">R</span> Payer avec Revolut</h2>
        <ol class="pay-steps">
          <li>Ouvrez notre page de paiement Revolut avec le bouton ci-dessous.</li>
          <li>Saisissez le montant exact : <strong>${euro(order.total)}</strong>.</li>
          <li>Indiquez la référence <strong>${escapeHtml(order.id)}</strong> dans la note du paiement.</li>
        </ol>
        <dl class="copy-list">
          ${copyRow("Montant", euro(order.total), amount)}
          ${copyRow("Référence", order.id)}
          ${copyRow("Bénéficiaire", r.tag)}
        </dl>
        ${r.link
          ? `<a class="btn btn--revolut btn--lg btn--block" href="${escapeHtml(r.link)}" target="_blank" rel="noopener">Payer ${euro(order.total)} avec Revolut</a>`
          : `<p class="notice">Le lien de paiement Revolut n'est pas encore configuré (${cfg("")}).</p>`}
        <p class="small muted">Pas d'application Revolut ? La page Revolut accepte aussi la carte bancaire.</p>
      </div>`;
  }

  function transferBlock() {
    const t = pay.transfer;
    return `
      <div class="pay-box">
        <h2><span class="pay-logo pay-logo--virement" aria-hidden="true">€</span> Payer par virement</h2>
        <p>Indiquez <strong>impérativement la référence</strong> dans le libellé : c'est elle qui nous permet d'associer le paiement à votre commande.</p>
        <dl class="copy-list">
          ${copyRow("Titulaire", t.holder)}
          ${copyRow("IBAN", t.iban, t.iban.replace(/\s/g, ""))}
          ${copyRow("BIC", t.bic)}
          ${copyRow("Banque", t.bank)}
          ${copyRow("Montant", euro(order.total), amount)}
          ${copyRow("Référence / libellé", order.id)}
        </dl>
        <p class="small muted">Un virement instantané arrive en quelques secondes ; un virement classique en 1 à 2 jours ouvrés.</p>
      </div>`;
  }

  function onDeliveryBlock() {
    return `
      <div class="pay-box">
        <h2><span class="pay-logo pay-logo--livraison" aria-hidden="true">✓</span> Paiement ${order.shippingId === "retrait" ? "au dépôt" : "à la livraison"}</h2>
        <p>Préparez <strong>${euro(order.total)}</strong> par chèque à l'ordre de ${cfg(SHOP.legalName)}, ou en espèces (1 000 € maximum). Rien à payer d'ici là.</p>
        <dl class="copy-list">${copyRow("Montant", euro(order.total), amount)}${copyRow("Référence", order.id)}</dl>
      </div>`;
  }

  function render() {
    const c = order.customer;
    const mailBody = encodeURIComponent(order.text);
    const mailSubject = encodeURIComponent(`Commande ${order.id}`);
    const pickup = order.shippingId === "retrait";
    const prepaid = order.payment !== "livraison";
    const others = ["revolut", "virement"].filter((id) => id !== order.payment && (id === "revolut" ? pay.revolut.enabled : pay.transfer.enabled));

    root.innerHTML = `
      <div class="confirm-head">
        <div class="confirm-head__icon" aria-hidden="true">✓</div>
        <div>
          <h1>Merci ${escapeHtml(c.firstname)}, votre commande est enregistrée</h1>
          <p>Commande <strong>${escapeHtml(order.id)}</strong> · ${new Date(order.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} ·
            <span class="status status--pending">${prepaid ? "En attente de paiement" : "Paiement à la livraison"}</span></p>
        </div>
      </div>

      ${order.sent ? "" : `
      <section class="alert">
        <h2>Dernière étape : envoyez-nous votre commande</h2>
        <p>Pour que nous la recevions, envoyez le récapitulatif par e-mail à <strong class="selectable">${cfg(SHOP.email)}</strong>. Le bouton prépare le message dans votre messagerie.</p>
        <p class="alert__actions">
          ${SHOP.email ? `<a class="btn btn--primary" href="mailto:${escapeHtml(SHOP.email)}?subject=${mailSubject}&body=${mailBody}">Envoyer le récapitulatif par e-mail</a>` : ""}
          <button type="button" class="btn btn--ghost" id="copyRecap">Copier le récapitulatif</button>
        </p>
      </section>`}

      <div class="confirm-grid">
        <div class="confirm-pay">
          ${order.payment === "revolut" ? revolutBlock() : order.payment === "virement" ? transferBlock() : onDeliveryBlock()}
          ${prepaid ? `<p class="deadline">Paiement à effectuer avant le <strong>${deadline.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</strong>${order.deliveryDate ? ` et au plus tard la veille de la ${pickup ? "date de retrait" : "livraison"}` : ""}. Passé ce délai, la commande est annulée.</p>` : ""}
          ${others.map((id) => `<button type="button" class="link" data-switch="${id}">Je préfère payer ${id === "revolut" ? "avec Revolut" : "par virement bancaire"}</button>`).join(" · ")}

          <h2 class="h3">Et ensuite ?</h2>
          <ol class="timeline">
            ${prepaid ? `<li class="is-current"><strong>Paiement</strong><span>Vous réglez ${euro(order.total)} avec la référence ${escapeHtml(order.id)}.</span></li>` : ""}
            <li${prepaid ? "" : ' class="is-current"'}><strong>Confirmation</strong><span>Nous vous confirmons ${order.deliveryDate ? "la date" : "l'expédition"} par e-mail ou SMS.</span></li>
            <li><strong>${pickup ? "Retrait au dépôt" : order.shippingId === "camion" ? "Livraison par notre camion" : "Livraison"}</strong>
              <span>${order.deliveryDate ? `${fmtDate(order.deliveryDate)}, ${escapeHtml(order.slot)}. ${pickup ? "" : "Le chauffeur vous appelle la veille."}` : escapeHtml(order.shippingName)}</span></li>
          </ol>
        </div>

        <aside class="summary">
          <h2>Récapitulatif</h2>
          <ul class="mini-cart">
            ${order.items.map((i) => {
              const p = productById(i.id);
              return `<li>
                <span class="mini-cart__art">${p ? productArt(p, { len: i.len, dry: i.dry }) : ""}</span>
                <span><strong>${escapeHtml(i.name)}</strong><span class="small muted">${escapeHtml(i.qtyLabel)}${i.opts ? " · " + escapeHtml(i.opts) : ""}</span></span>
                <span>${euro(i.line)}</span>
              </li>`;
            }).join("")}
          </ul>
          <dl class="totals">
            <div><dt>Sous-total</dt><dd>${euro(order.subtotal)}</dd></div>
            ${order.discount ? `<div class="totals__discount"><dt>Remise ${escapeHtml(order.promo)}</dt><dd>−${euro(order.discount)}</dd></div>` : ""}
            ${order.pickupDiscount ? `<div class="totals__discount"><dt>Remise retrait</dt><dd>−${euro(order.pickupDiscount)}</dd></div>` : ""}
            <div><dt>${escapeHtml(order.shippingName)}</dt><dd>${order.shipping === 0 ? "Offerte" : euro(order.shipping)}</dd></div>
            <div class="totals__grand"><dt>Total TTC</dt><dd>${euro(order.total)}</dd></div>
            <div class="totals__vat"><dt>dont TVA</dt><dd>${euro(order.vat)}</dd></div>
          </dl>
          <h3 class="h4">${pickup ? "Retrait" : "Livraison à"}</h3>
          <p class="small">${escapeHtml(c.firstname)} ${escapeHtml(c.lastname)}<br>
            ${pickup ? cfg(SHOP.address) : `${escapeHtml(c.address)}${c.address2 ? "<br>" + escapeHtml(c.address2) : ""}<br>${escapeHtml(c.zip)} ${escapeHtml(c.city)}`}<br>
            ${escapeHtml(c.phone)}</p>
          <p class="small muted">Paiement : ${PAY_NAMES[order.payment]}</p>
        </aside>
      </div>`;
  }

  root.addEventListener("click", (e) => {
    const copy = e.target.closest("[data-copy]");
    if (copy) copyText(copy.dataset.copy, copy);
    if (e.target.closest("#copyRecap")) copyText(order.text);
    const sw = e.target.closest("[data-switch]");
    if (sw) {
      order.payment = sw.dataset.switch;
      order.text = order.text.replace(/Paiement : [^—]+—/, `Paiement : ${PAY_NAMES[order.payment]} —`);
      store.set("orders", orders);
      render();
      root.scrollIntoView({ behavior: "smooth" });
    }
  });

  render();
})();
