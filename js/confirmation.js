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
  const PAY_NAMES = { carte: "Carte bancaire", virement: "Virement instantané" };

  const copyRow = (label, value, raw = value) => `
    <div class="copy-row">
      <dt>${label}</dt>
      <dd><span class="copy-row__value">${value ? escapeHtml(value) : cfg("")}</span>${value ? `<button type="button" class="copy-btn" data-copy="${escapeHtml(raw)}">Copier</button>` : ""}</dd>
    </div>`;

  function cardBlock() {
    const c = pay.card;
    return `
      <div class="pay-box">
        <h2><span class="pay-logo pay-logo--card" aria-hidden="true">${ICON.card}</span> Payer par carte bancaire</h2>
        <ol class="pay-steps">
          <li>Ouvrez notre page de paiement sécurisée avec le bouton ci-dessous.</li>
          <li>Saisissez le montant exact : <strong>${euro(order.total)}</strong>.</li>
          <li>Indiquez la référence <strong>${escapeHtml(order.id)}</strong> si la page vous la demande.</li>
        </ol>
        <dl class="copy-list">
          ${copyRow("Montant", euro(order.total), amount)}
          ${copyRow("Référence", order.id)}
        </dl>
        ${c.link
          ? `<a class="btn btn--primary btn--lg btn--block" href="${escapeHtml(c.link)}" target="_blank" rel="noopener">Payer ${euro(order.total)} par carte</a>
             <p class="small muted center">Page sécurisée : ${escapeHtml(c.link.replace(/^https?:\/\//, "").split("/")[0])}</p>`
          : `<p class="notice">Le lien de paiement par carte n'est pas encore configuré (${cfg("")}).</p>`}
      </div>`;
  }

  function transferBlock() {
    const t = pay.transfer;
    return `
      <div class="pay-box">
        <h2><span class="pay-logo pay-logo--virement" aria-hidden="true">${ICON.bank}</span> Payer par virement instantané</h2>
        <p>Indiquez <strong>impérativement la référence</strong> dans le libellé : c'est elle qui nous permet d'associer le paiement à votre commande.</p>
        <dl class="copy-list">
          ${copyRow("Titulaire", t.holder)}
          ${copyRow("IBAN", t.iban, t.iban.replace(/\s/g, ""))}
          ${copyRow("BIC", t.bic)}
          ${copyRow("Banque", t.bank)}
          ${copyRow("Montant", euro(order.total), amount)}
          ${copyRow("Référence / libellé", order.id)}
        </dl>
        <p class="small muted">Choisissez « virement instantané » dans l'application de votre banque : il arrive en quelques secondes et votre commande part plus vite.</p>
      </div>`;
  }

  function render() {
    const c = order.customer;
    const mailBody = encodeURIComponent(order.text);
    const mailSubject = encodeURIComponent(`Commande ${order.id}`);
    const w = deliveryWindow(new Date(order.date));
    const card = order.payment === "carte";

    root.innerHTML = `
      <div class="confirm-head">
        <div class="confirm-head__icon" aria-hidden="true">✓</div>
        <div>
          <h1>Merci ${escapeHtml(c.firstname)}, votre commande est enregistrée</h1>
          <p>Commande <strong>${escapeHtml(order.id)}</strong> · ${new Date(order.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} ·
            <span class="status status--pending">En attente de paiement</span></p>
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
          ${card ? cardBlock() : transferBlock()}
          ${card && pay.transfer.enabled ? `<details class="pay-alt"><summary>Vous préférez payer par virement instantané ?</summary>${transferBlock()}<button type="button" class="link" data-switch="virement">Je choisis le virement instantané</button></details>` : ""}
          ${!card && pay.card.enabled ? `<button type="button" class="link" data-switch="carte">Je préfère payer par carte bancaire</button>` : ""}
          <p class="deadline">Paiement à effectuer avant le <strong>${deadline.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</strong>. Passé ce délai, la commande est annulée.</p>

          <h2 class="h3">Et ensuite ?</h2>
          <ol class="timeline">
            <li class="is-current"><strong>Paiement</strong><span>Vous réglez ${euro(order.total)} avec la référence ${escapeHtml(order.id)}.</span></li>
            <li><strong>Préparation de ${plural(order.pallets || 1, "palette")}</strong><span>Dès réception du paiement, votre bois est rangé et filmé sur palette.</span></li>
            <li><strong>Livraison sous ${delayText()}</strong><span>Le transporteur vous appelle au ${escapeHtml(c.phone)} pour fixer le rendez-vous, en principe entre le ${fmtDate(w.from, { day: "numeric", month: "long" })} et le ${fmtDate(w.to, { day: "numeric", month: "long" })}.</span></li>
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
            <div><dt>${escapeHtml(order.shippingName)}</dt><dd>${order.shipping === 0 ? "Offerte" : euro(order.shipping)}</dd></div>
            <div class="totals__grand"><dt>Total TTC</dt><dd>${euro(order.total)}</dd></div>
            <div class="totals__vat"><dt>dont TVA</dt><dd>${euro(order.vat)}</dd></div>
          </dl>
          <h3 class="h4">Livraison à</h3>
          <p class="small">${escapeHtml(c.firstname)} ${escapeHtml(c.lastname)}<br>
            ${escapeHtml(c.address)}${c.address2 ? "<br>" + escapeHtml(c.address2) : ""}<br>${escapeHtml(c.zip)} ${escapeHtml(c.city)}<br>
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
