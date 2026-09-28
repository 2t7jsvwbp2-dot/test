(() => {
  const root = $("#confirmation");
  const orders = store.get("orders", []);
  const order = orders.find((o) => o.id === params.get("commande"));

  if (!order) {
    root.innerHTML = `<div class="empty">
      <h1>Commande introuvable</h1>
      <p>Cette commande n'est pas enregistrée dans ce navigateur. Si vous avez passé commande depuis un autre appareil, retrouvez le numéro dans votre e-mail ou contactez-nous.</p>
      <p><a class="btn btn--primary" href="mes-commandes.html">Mes commandes</a> <a class="btn btn--ghost" href="contact.html">Nous contacter</a></p>
    </div>`;
    return;
  }

  const pay = SHOP.payment;
  const deadline = new Date(order.date);
  deadline.setDate(deadline.getDate() + pay.deadlineDays);
  const deadlineText = deadline.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const amount = order.total.toFixed(2).replace(".", ",");

  const copyRow = (label, value, raw = value) => `
    <div class="copy-row">
      <dt>${label}</dt>
      <dd><span class="copy-row__value">${value ? escapeHtml(value) : cfg("")}</span>${value ? `<button type="button" class="copy-btn" data-copy="${escapeHtml(raw)}">Copier</button>` : ""}</dd>
    </div>`;

  function revolutBlock() {
    const r = pay.revolut;
    return `
      <div class="pay-box pay-box--revolut">
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
          ? `<a class="btn btn--revolut btn--lg btn--block" href="${escapeHtml(r.link)}" target="_blank" rel="noopener">Payer ${euro(order.total)} avec Revolut</a>
             <p class="small muted center">Lien sécurisé : ${escapeHtml(r.link.replace(/^https?:\/\//, ""))}</p>`
          : `<p class="notice">Le lien de paiement Revolut n'est pas encore configuré (${cfg("")}).</p>`}
        <p class="small muted">Pas d'application Revolut ? La page Revolut accepte aussi le paiement par carte bancaire.</p>
      </div>`;
  }

  function transferBlock() {
    const t = pay.transfer;
    return `
      <div class="pay-box pay-box--transfer">
        <h2><span class="pay-logo pay-logo--virement" aria-hidden="true">€</span> Payer par virement bancaire</h2>
        <p>Effectuez un virement depuis votre banque avec les informations suivantes. <strong>Indiquez impérativement la référence</strong> dans le libellé : c'est elle qui nous permet d'associer le paiement à votre commande.</p>
        <dl class="copy-list">
          ${copyRow("Titulaire", t.holder)}
          ${copyRow("IBAN", t.iban, t.iban.replace(/\s/g, ""))}
          ${copyRow("BIC", t.bic)}
          ${copyRow("Banque", t.bank)}
          ${copyRow("Montant", euro(order.total), amount)}
          ${copyRow("Référence / libellé", order.id)}
        </dl>
        <p class="small muted">Un virement instantané arrive en quelques secondes. Un virement classique prend 1 à 2 jours ouvrés.</p>
      </div>`;
  }

  function render() {
    const other = order.payment === "revolut" ? "virement" : "revolut";
    const otherEnabled = other === "revolut" ? pay.revolut.enabled : pay.transfer.enabled;
    const c = order.customer;
    const mailBody = encodeURIComponent(order.text);
    const mailSubject = encodeURIComponent(`Commande ${order.id}`);

    root.innerHTML = `
      <div class="confirm-head">
        <div class="confirm-head__icon" aria-hidden="true">✓</div>
        <div>
          <h1>Merci ${escapeHtml(c.firstname)}, votre commande est enregistrée</h1>
          <p>Commande <strong>${escapeHtml(order.id)}</strong> · ${new Date(order.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · <span class="status status--pending">En attente de paiement</span></p>
        </div>
      </div>

      ${order.sent ? "" : `
      <section class="alert">
        <h2>Dernière étape : envoyez-nous votre commande</h2>
        <p>Pour que nous la recevions, envoyez le récapitulatif par e-mail à <strong class="selectable">${cfg(SHOP.email)}</strong>. Le bouton ci-dessous prépare le message dans votre messagerie.</p>
        <p class="alert__actions">
          ${SHOP.email ? `<a class="btn btn--primary" href="mailto:${escapeHtml(SHOP.email)}?subject=${mailSubject}&body=${mailBody}">Envoyer le récapitulatif par e-mail</a>` : ""}
          <button type="button" class="btn btn--ghost" id="copyRecap">Copier le récapitulatif</button>
        </p>
        <p class="small muted">Si le bouton n'ouvre pas votre messagerie, copiez le récapitulatif et collez-le dans un e-mail.</p>
      </section>`}

      <div class="confirm-grid">
        <div class="confirm-pay">
          ${order.payment === "revolut" ? revolutBlock() : transferBlock()}
          <p class="deadline">Paiement à effectuer avant le <strong>${deadlineText}</strong>. Passé ce délai, la commande est annulée et les pièces remises en stock.</p>
          ${otherEnabled ? `<button type="button" class="link" id="switchPay">Je préfère payer ${other === "revolut" ? "avec Revolut" : "par virement bancaire"}</button>` : ""}

          <h2 class="h3">Et ensuite ?</h2>
          <ol class="timeline">
            <li class="is-current"><strong>Paiement</strong><span>Vous réglez ${euro(order.total)} avec la référence ${escapeHtml(order.id)}.</span></li>
            <li><strong>Vérification et préparation</strong><span>Dès réception, nous vérifions la compatibilité${order.vin ? " avec votre VIN" : ""} et préparons le colis.</span></li>
            <li><strong>${order.shippingId === "retrait" ? "Retrait" : "Expédition"}</strong><span>${order.shippingId === "retrait" ? "Nous vous prévenons par e-mail quand la commande est prête." : `Sous 24h ouvrées, avec le numéro de suivi envoyé à ${escapeHtml(c.email)}.`}</span></li>
          </ol>
        </div>

        <aside class="summary">
          <h2>Récapitulatif</h2>
          <ul class="mini-cart">
            ${order.items.map((i) => `<li>
              <img src="${imgSrc(i.id)}" alt="" width="600" height="600">
              <span><strong>${escapeHtml(i.name)}</strong><span class="small muted">Réf. ${escapeHtml(i.ref)} · Qté ${i.qty}</span></span>
              <span>${euro(i.price * i.qty)}</span>
            </li>`).join("")}
          </ul>
          <dl class="totals">
            <div><dt>Sous-total</dt><dd>${euro(order.subtotal)}</dd></div>
            ${order.discount ? `<div class="totals__discount"><dt>Remise ${escapeHtml(order.promo)}</dt><dd>−${euro(order.discount)}</dd></div>` : ""}
            <div><dt>${escapeHtml(order.shippingName)}</dt><dd>${order.shipping === 0 ? "Offerte" : euro(order.shipping)}</dd></div>
            <div class="totals__grand"><dt>Total TTC</dt><dd>${euro(order.total)}</dd></div>
          </dl>
          <h3 class="h4">${order.shippingId === "retrait" ? "Retrait" : "Livraison à"}</h3>
          <p class="small">${escapeHtml(c.firstname)} ${escapeHtml(c.lastname)}<br>
            ${order.shippingId === "retrait" ? cfg(SHOP.address) : `${escapeHtml(c.address)}${c.address2 ? "<br>" + escapeHtml(c.address2) : ""}<br>${escapeHtml(c.zip)} ${escapeHtml(c.city)}`}<br>
            ${escapeHtml(c.phone)}</p>
        </aside>
      </div>`;
  }

  root.addEventListener("click", (e) => {
    const copy = e.target.closest("[data-copy]");
    if (copy) copyText(copy.dataset.copy, copy);
    if (e.target.closest("#copyRecap")) copyText(order.text);
    if (e.target.closest("#switchPay")) {
      order.payment = order.payment === "revolut" ? "virement" : "revolut";
      order.text = order.text.replace(/Paiement : [^—]+—/, `Paiement : ${order.payment === "revolut" ? "Revolut" : "Virement bancaire"} —`);
      store.set("orders", orders);
      render();
      root.scrollIntoView({ behavior: "smooth" });
    }
  });

  render();
})();
