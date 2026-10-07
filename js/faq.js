// Recherche instantanée dans les questions fréquentes
(() => {
  const input = $("#faqSearch");
  const norm = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  input.addEventListener("input", () => {
    const q = norm(input.value.trim());
    let count = 0;
    $$(".faq details").forEach((d) => {
      const ok = !q || norm(d.textContent).includes(q);
      d.hidden = !ok;
      if (ok) count++;
      if (q && ok) d.open = true;
    });
    $$(".faq").forEach((sec) => (sec.hidden = !$$("details:not([hidden])", sec).length));
    $("#faqCount").textContent = q ? `${count} réponse${count > 1 ? "s" : ""}` : "";
  });
})();
