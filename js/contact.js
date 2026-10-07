(() => {
  const form = $("#contactForm");
  const f = form.elements;
  if (!f.zip.value) f.zip.value = store.get("cp", "");
  const ref = params.get("commande");
  if (ref) { f.ref.value = ref; f.subject.value = "Question sur une commande"; }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!validateForm(form)) return;
    const text = [
      `Nom : ${f.name.value}`,
      `E-mail : ${f.email.value}`,
      f.phone.value ? `Téléphone : ${f.phone.value}` : null,
      f.zip.value ? `Code postal : ${f.zip.value}` : null,
      f.ref.value ? `Commande : ${f.ref.value}` : null,
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
      const href = SHOP.email ? `mailto:${SHOP.email}?subject=${encodeURIComponent(f.subject.value)}&body=${encodeURIComponent(text)}` : "";
      result.innerHTML = `<div class="alert alert--sm">
        <p>Pour envoyer votre message, ouvrez-le dans votre messagerie${SHOP.email ? ` ou écrivez directement à <strong class="selectable">${escapeHtml(SHOP.email)}</strong>` : ""}.</p>
        <p>${href ? `<a class="btn btn--primary btn--sm" href="${href}">Ouvrir dans ma messagerie</a> ` : ""}<button type="button" class="btn btn--ghost btn--sm" id="copyMsg">Copier le message</button></p>
      </div>`;
      $("#copyMsg").addEventListener("click", () => copyText(text));
    }
  });
})();
