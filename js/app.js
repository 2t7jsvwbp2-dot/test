(() => {
  const FREE_SHIPPING = 99;
  const STANDARD_SHIPPING = 6.9;
  const EXPRESS_SHIPPING = 14.9;
  const CART_KEY = "bavaria-parts-cart";

  const $ = (sel) => document.querySelector(sel);
  const euro = (n) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
  const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const modelName = (code) => MODELS.find((m) => m.code === code)?.name ?? code;
  const categoryName = (id) => CATEGORIES.find((c) => c.id === id)?.name ?? id;

  const ICONS = {
    brake: '<circle cx="32" cy="32" r="22"/><circle cx="32" cy="32" r="8"/><path d="M14 20a24 24 0 0 1 12-9"/><circle cx="32" cy="18" r="2"/><circle cx="46" cy="32" r="2"/><circle cx="32" cy="46" r="2"/><circle cx="18" cy="32" r="2"/>',
    engine: '<path d="M10 26h6v-6h14v-4h8v4h8l6 6h4v14h-4l-6 6H24l-8-6h-6z"/><path d="M26 16h14"/>',
    spring: '<path d="M22 10h20M22 54h20"/><path d="M24 14l16 6-16 6 16 6-16 6 16 6-16 6"/>',
    light: '<path d="M12 22c10-8 22-8 22 10s-12 18-22 10z"/><path d="M40 20l14-4M40 32h14M40 44l14 4"/>',
    body: '<path d="M6 40l6-12 12-6h18l10 8 6 2v8z"/><circle cx="18" cy="42" r="5"/><circle cx="46" cy="42" r="5"/>',
    oil: '<path d="M16 24h24l8-6 6 4-12 18H16z"/><path d="M28 24v-6h6"/><path d="M54 36c0 3-2 5-3 5s-3-2-3-5 3-6 3-6 3 3 3 6z"/>',
  };
  const icon = (name, size = 64) =>
    `<svg viewBox="0 0 64 64" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;

  // ---------- État ----------
  const state = { search: "", model: "", category: "", sort: "popular" };
  let cart = loadCart();

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(CART_KEY));
      if (saved && typeof saved === "object") {
        // Ne garder que les produits encore au catalogue.
        return Object.fromEntries(Object.entries(saved).filter(([id, q]) => PRODUCTS.some((p) => p.id === +id) && q > 0));
      }
    } catch (_) {}
    return {};
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (_) {}
  }

  // ---------- Initialisation des filtres ----------
  function fillSelect(select, items, valueKey, labelKey) {
    select.insertAdjacentHTML("beforeend", items.map((i) => `<option value="${i[valueKey]}">${escapeHtml(i[labelKey])}</option>`).join(""));
  }
  [$("#finderModel"), $("#filterModel")].forEach((s) => fillSelect(s, MODELS, "code", "name"));
  [$("#finderCategory"), $("#filterCategory")].forEach((s) => fillSelect(s, CATEGORIES, "id", "name"));

  // ---------- Catégories ----------
  $("#categoryGrid").innerHTML = CATEGORIES.map((c) => {
    const count = PRODUCTS.filter((p) => p.category === c.id).length;
    return `<button class="category" data-category="${c.id}">
      ${icon(c.icon, 48)}
      <span class="category__name">${escapeHtml(c.name)}</span>
      <span class="category__count">${count} pièce${count > 1 ? "s" : ""}</span>
    </button>`;
  }).join("");

  $("#categoryGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-category]");
    if (!btn) return;
    setFilters({ category: btn.dataset.category });
    scrollToCatalog();
  });

  // ---------- Catalogue ----------
  function filteredProducts() {
    const q = state.search.trim().toLowerCase();
    const list = PRODUCTS.filter((p) =>
      (!state.model || p.models.includes(state.model)) &&
      (!state.category || p.category === state.category) &&
      (!q || [p.name, p.ref, p.brand, categoryName(p.category)].some((f) => f.toLowerCase().includes(q)))
    );
    const sorters = {
      popular: (a, b) => b.popular - a.popular,
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      name: (a, b) => a.name.localeCompare(b.name, "fr"),
    };
    return list.sort(sorters[state.sort]);
  }

  function stockLabel(stock) {
    if (stock === 0) return '<span class="stock stock--out">Rupture</span>';
    if (stock <= 5) return `<span class="stock stock--low">Plus que ${stock} en stock</span>`;
    return '<span class="stock">En stock</span>';
  }

  function productCard(p) {
    const cat = CATEGORIES.find((c) => c.id === p.category);
    const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    return `<article class="product">
      <button class="product__media" data-view="${p.id}" aria-label="Voir ${escapeHtml(p.name)}">
        ${icon(cat.icon, 72)}
        ${discount ? `<span class="tag">-${discount}%</span>` : ""}
      </button>
      <div class="product__body">
        <p class="product__brand">${escapeHtml(p.brand)} · <span class="muted">${p.ref}</span></p>
        <h3 class="product__name"><button class="link-plain" data-view="${p.id}">${escapeHtml(p.name)}</button></h3>
        <p class="product__fit">Compatible : ${p.models.slice(0, 4).join(", ")}${p.models.length > 4 ? "…" : ""}</p>
        ${stockLabel(p.stock)}
        <div class="product__foot">
          <div class="price">
            <strong>${euro(p.price)}</strong>
            ${p.oldPrice ? `<s>${euro(p.oldPrice)}</s>` : ""}
          </div>
          <button class="btn btn--primary btn--sm" data-add="${p.id}" ${p.stock === 0 ? "disabled" : ""}>Ajouter</button>
        </div>
      </div>
    </article>`;
  }

  function renderProducts() {
    const list = filteredProducts();
    $("#productGrid").innerHTML = list.map(productCard).join("");
    $("#emptyState").hidden = list.length > 0;
    const ctx = [state.model && modelName(state.model), state.category && categoryName(state.category)].filter(Boolean).join(" · ");
    $("#resultCount").textContent = `${list.length} pièce${list.length > 1 ? "s" : ""}${ctx ? " — " + ctx : ""}`;
  }

  function setFilters(patch) {
    Object.assign(state, patch);
    $("#search").value = state.search;
    $("#filterModel").value = state.model;
    $("#filterCategory").value = state.category;
    $("#sort").value = state.sort;
    renderProducts();
  }

  function scrollToCatalog() {
    $("#catalogue").scrollIntoView({ behavior: "smooth" });
  }

  $("#search").addEventListener("input", (e) => setFilters({ search: e.target.value }));
  $("#filterModel").addEventListener("change", (e) => setFilters({ model: e.target.value }));
  $("#filterCategory").addEventListener("change", (e) => setFilters({ category: e.target.value }));
  $("#sort").addEventListener("change", (e) => setFilters({ sort: e.target.value }));
  $("#resetFilters").addEventListener("click", () => setFilters({ search: "", model: "", category: "" }));

  $("#finder").addEventListener("submit", (e) => {
    e.preventDefault();
    setFilters({ model: $("#finderModel").value, category: $("#finderCategory").value, search: "" });
    scrollToCatalog();
  });

  // Délégation : ajout au panier et ouverture de fiche
  document.addEventListener("click", (e) => {
    const add = e.target.closest("[data-add]");
    if (add) { addToCart(+add.dataset.add, 1); return; }
    const view = e.target.closest("[data-view]");
    if (view) openProduct(+view.dataset.view);
  });

  // ---------- Fiche produit ----------
  function openProduct(id) {
    const p = PRODUCTS.find((x) => x.id === id);
    const cat = CATEGORIES.find((c) => c.id === p.category);
    $("#productDetail").innerHTML = `
      <div class="detail">
        <div class="detail__media">${icon(cat.icon, 140)}</div>
        <div>
          <p class="product__brand">${escapeHtml(p.brand)} · ${escapeHtml(cat.name)}</p>
          <h2>${escapeHtml(p.name)}</h2>
          <p class="muted">Référence : ${p.ref}</p>
          <p>${escapeHtml(p.desc)}</p>
          <h4>Modèles compatibles</h4>
          <ul class="chips">${p.models.map((m) => `<li>${escapeHtml(modelName(m))}</li>`).join("")}</ul>
          ${stockLabel(p.stock)}
          <div class="detail__buy">
            <div class="price price--lg"><strong>${euro(p.price)}</strong>${p.oldPrice ? `<s>${euro(p.oldPrice)}</s>` : ""}</div>
            <div class="qty">
              <button type="button" data-qty="-1" aria-label="Diminuer">−</button>
              <input type="number" id="detailQty" value="1" min="1" max="${p.stock}" aria-label="Quantité">
              <button type="button" data-qty="1" aria-label="Augmenter">+</button>
            </div>
            <button class="btn btn--primary" id="detailAdd" ${p.stock === 0 ? "disabled" : ""}>Ajouter au panier</button>
          </div>
        </div>
      </div>`;
    const qtyInput = $("#detailQty");
    $("#productDetail").querySelectorAll("[data-qty]").forEach((b) =>
      b.addEventListener("click", () => {
        qtyInput.value = Math.min(p.stock, Math.max(1, (+qtyInput.value || 1) + +b.dataset.qty));
      })
    );
    $("#detailAdd").addEventListener("click", () => {
      addToCart(p.id, Math.max(1, +qtyInput.value || 1));
      $("#productModal").close();
    });
    $("#productModal").showModal();
  }

  // ---------- Panier ----------
  function addToCart(id, qty) {
    const p = PRODUCTS.find((x) => x.id === id);
    const current = cart[id] || 0;
    const next = Math.min(p.stock, current + qty);
    if (next === current) { toast(`Stock maximum atteint pour « ${p.name} »`); return; }
    cart[id] = next;
    saveCart();
    renderCart();
    toast(`« ${p.name} » ajouté au panier`);
  }

  function setQty(id, qty) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (qty <= 0) delete cart[id];
    else cart[id] = Math.min(p.stock, qty);
    saveCart();
    renderCart();
  }

  function totals(delivery = "standard") {
    const subtotal = Object.entries(cart).reduce((sum, [id, q]) => sum + PRODUCTS.find((p) => p.id === +id).price * q, 0);
    let shipping = 0;
    if (subtotal > 0) shipping = delivery === "express" ? EXPRESS_SHIPPING : subtotal >= FREE_SHIPPING ? 0 : STANDARD_SHIPPING;
    return { subtotal, shipping, total: subtotal + shipping };
  }

  function renderCart() {
    const entries = Object.entries(cart);
    const count = entries.reduce((n, [, q]) => n + q, 0);
    $("#cartCount").textContent = count;
    $("#cartCount").classList.toggle("badge--show", count > 0);

    $("#cartItems").innerHTML = entries.length
      ? entries.map(([id, q]) => {
          const p = PRODUCTS.find((x) => x.id === +id);
          const cat = CATEGORIES.find((c) => c.id === p.category);
          return `<div class="cart-item">
            <div class="cart-item__icon">${icon(cat.icon, 36)}</div>
            <div class="cart-item__info">
              <p class="cart-item__name">${escapeHtml(p.name)}</p>
              <p class="muted small">${p.ref}</p>
              <div class="qty qty--sm">
                <button type="button" data-cart="${p.id}" data-delta="-1" aria-label="Diminuer">−</button>
                <span>${q}</span>
                <button type="button" data-cart="${p.id}" data-delta="1" aria-label="Augmenter">+</button>
              </div>
            </div>
            <div class="cart-item__right">
              <strong>${euro(p.price * q)}</strong>
              <button class="link small" data-remove="${p.id}">Retirer</button>
            </div>
          </div>`;
        }).join("")
      : '<p class="empty">Votre panier est vide.</p>';

    const t = totals();
    $("#subtotal").textContent = euro(t.subtotal);
    $("#shipping").textContent = t.subtotal === 0 ? "—" : t.shipping === 0 ? "Offerte" : euro(t.shipping);
    $("#total").textContent = euro(t.total);
    $("#freeShipHint").textContent =
      t.subtotal > 0 && t.subtotal < FREE_SHIPPING ? `Plus que ${euro(FREE_SHIPPING - t.subtotal)} pour la livraison offerte.` : "";
    $("#checkoutBtn").disabled = entries.length === 0;
  }

  $("#cartItems").addEventListener("click", (e) => {
    const d = e.target.closest("[data-delta]");
    if (d) { const id = +d.dataset.cart; setQty(id, (cart[id] || 0) + +d.dataset.delta); return; }
    const r = e.target.closest("[data-remove]");
    if (r) setQty(+r.dataset.remove, 0);
  });

  function openCart() {
    $("#cartDrawer").classList.add("drawer--open");
    $("#cartDrawer").setAttribute("aria-hidden", "false");
    $("#overlay").hidden = false;
  }
  function closeCart() {
    $("#cartDrawer").classList.remove("drawer--open");
    $("#cartDrawer").setAttribute("aria-hidden", "true");
    $("#overlay").hidden = true;
  }
  $("#cartBtn").addEventListener("click", openCart);
  $("#closeCart").addEventListener("click", closeCart);
  $("#overlay").addEventListener("click", closeCart);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeCart(); });

  // ---------- Commande ----------
  const checkoutForm = $("#checkoutForm");

  function updateCheckoutTotal() {
    const delivery = checkoutForm.elements.delivery.value;
    const t = totals(delivery);
    $("#checkoutTotal").textContent = euro(t.total);
    const std = totals("standard").shipping;
    checkoutForm.querySelector('[data-ship="standard"]').textContent = std === 0 ? "offerte" : euro(std);
  }

  $("#checkoutBtn").addEventListener("click", () => {
    closeCart();
    updateCheckoutTotal();
    $("#checkoutModal").showModal();
  });
  checkoutForm.addEventListener("change", updateCheckoutTotal);

  checkoutForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validate(checkoutForm)) return;
    const data = Object.fromEntries(new FormData(checkoutForm));
    const t = totals(data.delivery);
    const orderNo = "BP-" + Date.now().toString(36).toUpperCase();
    $("#checkoutContent").hidden = true;
    $("#checkoutSuccess").hidden = false;
    $("#checkoutSuccess").innerHTML = `
      <div class="success">
        <div class="success__icon">✓</div>
        <h2>Merci ${escapeHtml(data.firstname)} !</h2>
        <p>Votre commande <strong>${orderNo}</strong> d'un montant de <strong>${euro(t.total)}</strong> a bien été enregistrée.</p>
        <p class="muted">Un e-mail de confirmation serait envoyé à ${escapeHtml(data.email)} (site de démonstration).</p>
        <button class="btn btn--primary" data-close>Continuer mes achats</button>
      </div>`;
    cart = {};
    saveCart();
    renderCart();
    checkoutForm.reset();
  });

  $("#checkoutModal").addEventListener("close", () => {
    // Réafficher le formulaire pour la prochaine commande.
    $("#checkoutContent").hidden = false;
    $("#checkoutSuccess").hidden = true;
  });

  // Boutons de fermeture des modales
  document.querySelectorAll("dialog").forEach((dlg) => {
    dlg.addEventListener("click", (e) => {
      if (e.target === dlg || e.target.closest("[data-close]")) dlg.close();
    });
  });

  // ---------- Contact ----------
  $("#contactForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    if (!validate(form)) return;
    $("#contactMsg").textContent = "Merci ! Votre demande a bien été envoyée, nous vous répondons sous 2h ouvrées.";
    form.reset();
  });

  function validate(form) {
    let ok = true;
    form.querySelectorAll("input, textarea").forEach((el) => {
      const valid = el.checkValidity();
      el.classList.toggle("invalid", !valid);
      if (!valid && ok) { el.focus(); ok = false; }
    });
    return ok;
  }

  // ---------- Divers ----------
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("toast--show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("toast--show"), 2200);
  }

  $("#menuBtn").addEventListener("click", () => $("#nav").classList.toggle("nav--open"));
  $("#nav").addEventListener("click", (e) => { if (e.target.tagName === "A") $("#nav").classList.remove("nav--open"); });
  $("#year").textContent = new Date().getFullYear();

  renderProducts();
  renderCart();
})();
