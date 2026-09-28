(() => {
  const models = $("#finderModel");
  models.insertAdjacentHTML("beforeend", MODELS.map((m) => `<option value="${m.code}">${escapeHtml(m.name)}</option>`).join(""));
  $("#finderCategory").insertAdjacentHTML("beforeend", CATEGORIES.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join(""));
  models.value = Garage.get()?.code || "";

  $("#finder").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (models.value) {
      Garage.set(models.value);
      q.set("modele", models.value);
    }
    if ($("#finderCategory").value) q.set("categorie", $("#finderCategory").value);
    location.href = "catalogue.html" + (q.toString() ? "?" + q : "");
  });

  $("#factCount").textContent = PRODUCTS.filter((p) => p.stock > 0).length;

  $("#categoryGrid").innerHTML = CATEGORIES.map((c) => {
    const n = PRODUCTS.filter((p) => p.category === c.id).length;
    return `<a class="cat-card" href="catalogue.html?categorie=${c.id}">
      <img src="${imgSrc(c.image)}" alt="" loading="lazy" width="600" height="600">
      <span class="cat-card__name">${escapeHtml(c.name)}</span>
      <span class="cat-card__text">${escapeHtml(c.text)}</span>
      <span class="cat-card__count">${n} pièces</span>
    </a>`;
  }).join("");

  function renderBest() {
    const best = [...PRODUCTS].sort((a, b) => b.popular - a.popular).slice(0, 8);
    $("#bestSellers").innerHTML = best.map(productCard).join("");
  }
  renderBest();
  document.addEventListener("vehicle:change", renderBest);

  $("#modelList").innerHTML = MODELS.map((m) => {
    const n = PRODUCTS.filter((p) => p.models.includes(m.code)).length;
    return `<a class="model" href="catalogue.html?modele=${m.code}" data-model="${m.code}">
      <span class="model__code">${m.code}</span>
      <span class="model__name">${escapeHtml(m.name.replace(/ \(.*\)/, ""))}</span>
      <span class="model__years">${m.years} · ${n} pièces</span>
    </a>`;
  }).join("");
  $("#modelList").addEventListener("click", (e) => {
    const a = e.target.closest("[data-model]");
    if (a) Garage.set(a.dataset.model);
  });
})();
