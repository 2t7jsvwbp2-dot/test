(() => {
  const form = $("#contactForm");
  const piece = params.get("piece");
  if (piece) {
    form.elements.ref.value = piece;
    form.elements.subject.value = "Autre demande";
    form.elements.message.value = `Bonjour, pouvez-vous me prévenir quand la pièce ${piece} sera de nouveau en stock ?`;
  }
  const v = Garage.get();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    const f = form.elements;
    const text = [
      `Nom : ${f.name.value}`,
      `E-mail : ${f.email.value}`,
      v ? `Véhicule : ${v.name}` : null,
      f.vin.value ? `VIN : ${f.vin.value.toUpperCase()}` : null,
      f.ref.value ? `Référence : ${f.ref.value}` : null,
      "",
      f.message.value,
    ].filter((l) => l !== null).join("\n");

    const btn = $('button[type="submit"]', form);
    btn.disabled = true;
    const sent = await sendToEndpoint({ _subject: `[Contact] ${f.subject.value}`, _replyto: f.email.value, email: f.email.value, message: text });
    btn.disabled = false;

    const result = $("#contactResult");
    if (sent) {
      result.innerHTML = '<p class="ok">Message envoyé. Nous vous répondons par e-mail, en général dans la journée.</p>';
      form.reset();
    } else {
      const href = SHOP.email
        ? `mailto:${SHOP.email}?subject=${encodeURIComponent(f.subject.value)}&body=${encodeURIComponent(text)}`
        : "";
      result.innerHTML = `<div class="alert alert--sm">
        <p>Pour envoyer votre message, ouvrez-le dans votre messagerie${SHOP.email ? ` ou écrivez directement à <strong class="selectable">${escapeHtml(SHOP.email)}</strong>` : ""}.</p>
        <p>${href ? `<a class="btn btn--primary btn--sm" href="${href}">Ouvrir dans ma messagerie</a> ` : ""}<button type="button" class="btn btn--ghost btn--sm" id="copyMsg">Copier le message</button></p>
      </div>`;
      $("#copyMsg").addEventListener("click", () => copyText(text));
    }
  });
})();
