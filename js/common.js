// Code partagé par toutes les pages : stockage, panier, en-tête, pied de page.

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const euro = (n) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const round2 = (n) => Math.round(n * 100) / 100;
const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const params = new URLSearchParams(location.search);

const productById = (id) => PRODUCTS.find((p) => p.id === id);
const categoryById = (id) => CATEGORIES.find((c) => c.id === id);
const modelByCode = (code) => MODELS.find((m) => m.code === code);
const imgSrc = (name) => `images/products/${name}.svg`;

// Valeur de configuration, ou repère visible si elle n'est pas encore remplie.
function cfg(value) {
  return value ? escapeHtml(value) : '<span class="todo">[à compléter]</span>';
}

// ---------------------------------------------------------------------
// Stockage local (protégé : le navigateur peut le refuser)
// ---------------------------------------------------------------------
const store = {
  get(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem("bp-" + key));
      return v ?? fallback;
    } catch (_) {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem("bp-" + key, JSON.stringify(value)); } catch (_) {}
  },
};

// ---------------------------------------------------------------------
// Panier
// ---------------------------------------------------------------------
const Cart = {
  items() {
    const raw = store.get("cart", {});
    return Object.entries(raw)
      .map(([id, qty]) => ({ product: productById(id), qty }))
      .filter((i) => i.product && i.qty > 0);
  },
  count() {
    return this.items().reduce((n, i) => n + i.qty, 0);
  },
  qty(id) {
    return store.get("cart", {})[id] || 0;
  },
  set(id, qty) {
    const p = productById(id);
    const cart = store.get("cart", {});
    if (qty <= 0) delete cart[id];
    else cart[id] = Math.min(qty, p.stock);
    store.set("cart", cart);
    updateHeaderCart();
    document.dispatchEvent(new CustomEvent("cart:change"));
  },
  add(id, qty = 1) {
    const p = productById(id);
    const current = this.qty(id);
    if (p.stock === 0) { toast("Cette pièce est en rupture de stock."); return; }
    if (current >= p.stock) { toast(`Stock maximum atteint : ${p.stock} disponible(s).`); return; }
    this.set(id, current + qty);
    toast(`${p.name} ajouté au panier`, { href: "panier.html", label: "Voir le panier" });
  },
  clear() {
    store.set("cart", {});
    store.set("promo", "");
    updateHeaderCart();
  },
};

function getPromo() {
  const code = store.get("promo", "");
  return SHOP.promoCodes[code] ? { code, ...SHOP.promoCodes[code] } : null;
}

function shippingMethod(id) {
  return SHOP.shipping.methods.find((m) => m.id === id) || SHOP.shipping.methods[0];
}

function computeTotals(shippingId) {
  const items = Cart.items();
  const subtotal = round2(items.reduce((s, i) => s + i.product.price * i.qty, 0));
  const promo = getPromo();
  const discount = promo ? round2((subtotal * promo.percent) / 100) : 0;
  const afterDiscount = round2(subtotal - discount);
  const method = shippingMethod(shippingId);
  let shipping = 0;
  if (items.length && !(method.free && afterDiscount >= SHOP.shipping.freeFrom)) shipping = method.price;
  return { items, subtotal, promo, discount, shipping, method, total: round2(afterDiscount + shipping) };
}

// ---------------------------------------------------------------------
// Mon véhicule
// ---------------------------------------------------------------------
const Garage = {
  get() { return modelByCode(store.get("vehicle", "")) || null; },
  set(code) {
    store.set("vehicle", code || "");
    renderVehicleChip();
    document.dispatchEvent(new CustomEvent("vehicle:change"));
  },
};

function fitBadge(product) {
  const v = Garage.get();
  if (!v) return "";
  return product.models.includes(v.code)
    ? `<span class="fit fit--yes">✓ Compatible ${escapeHtml(v.code)}</span>`
    : `<span class="fit fit--no">Non compatible ${escapeHtml(v.code)}</span>`;
}

// ---------------------------------------------------------------------
// Composants
// ---------------------------------------------------------------------
function stockLabel(stock) {
  if (stock === 0) return '<span class="stock stock--out">Rupture, réassort sous 7 jours</span>';
  if (stock <= 5) return `<span class="stock stock--low">Plus que ${stock} en stock</span>`;
  return '<span class="stock">En stock, expédié sous 24h</span>';
}

function priceHtml(p, cls = "") {
  return `<div class="price ${cls}"><strong>${euro(p.price)}</strong>${p.oldPrice ? `<s>${euro(p.oldPrice)}</s>` : ""}</div>`;
}

function productCard(p) {
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const url = `produit.html?id=${encodeURIComponent(p.id)}`;
  return `<article class="card-product">
    <a class="card-product__media" href="${url}" tabindex="-1" aria-hidden="true">
      <img src="${imgSrc(p.id)}" alt="" loading="lazy" width="600" height="600">
      ${discount ? `<span class="tag tag--promo">-${discount} %</span>` : ""}
    </a>
    <div class="card-product__body">
      <p class="card-product__brand">${escapeHtml(p.brand)}</p>
      <h3 class="card-product__name"><a href="${url}">${escapeHtml(p.name)}</a></h3>
      <p class="card-product__ref">Réf. ${escapeHtml(p.ref)}</p>
      ${fitBadge(p)}
      ${stockLabel(p.stock)}
      <div class="card-product__foot">
        ${priceHtml(p)}
        <button class="btn btn--primary btn--sm" data-add="${p.id}" ${p.stock === 0 ? "disabled" : ""} aria-label="Ajouter ${escapeHtml(p.name)} au panier">Ajouter</button>
      </div>
    </div>
  </article>`;
}

// ---------------------------------------------------------------------
// En-tête, pied de page, dialogue véhicule
// ---------------------------------------------------------------------
const ICON = {
  cart: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>',
  search: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  car: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 17h14M3 13l2-6h14l2 6v4H3z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>',
  box: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/></svg>',
  menu: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
};

function renderLayout() {
  const page = document.body.dataset.page;
  const navLink = (href, label, key) => `<a href="${href}"${page === key ? ' aria-current="page"' : ""}>${label}</a>`;

  document.body.insertAdjacentHTML("afterbegin", `
    <a class="skip" href="#main">Aller au contenu</a>
    <div class="topbar">Livraison offerte dès ${SHOP.shipping.freeFrom} € · Expédition sous 24h après paiement · Retours sous 14 jours</div>
    <header class="header">
      <div class="container header__row">
        <a href="index.html" class="logo" aria-label="${escapeHtml(SHOP.name)}, accueil">
          <span class="logo__mark" aria-hidden="true">BP</span>
          <span class="logo__text">Bavaria<strong>Parts</strong></span>
        </a>
        <form class="search" action="catalogue.html" role="search">
          <input type="search" name="q" id="headerSearch" placeholder="Pièce, référence, marque…" aria-label="Rechercher une pièce" value="${escapeHtml(params.get("q") || "")}">
          <button type="submit" aria-label="Rechercher">${ICON.search}</button>
        </form>
        <div class="header__actions">
          <button class="vehicle-chip" id="vehicleChip" type="button"></button>
          <a class="icon-link" href="mes-commandes.html" aria-label="Mes commandes">${ICON.box}<span class="icon-link__label">Commandes</span></a>
          <a class="icon-link" href="panier.html" aria-label="Panier">${ICON.cart}<span class="icon-link__label">Panier</span><span class="badge" id="cartCount">0</span></a>
          <button class="icon-link menu-btn" id="menuBtn" type="button" aria-label="Menu" aria-expanded="false">${ICON.menu}</button>
        </div>
      </div>
      <nav class="nav" id="nav" aria-label="Navigation principale">
        <div class="container nav__row">
          ${navLink("catalogue.html", "Tout le catalogue", "catalogue")}
          ${CATEGORIES.map((c) => `<a href="catalogue.html?categorie=${c.id}">${escapeHtml(c.name)}</a>`).join("")}
          <a href="catalogue.html?promo=1" class="nav__promo">Promotions</a>
          ${navLink("faq.html", "Aide", "faq")}
          ${navLink("contact.html", "Contact", "contact")}
        </div>
      </nav>
    </header>`);

  document.body.insertAdjacentHTML("beforeend", `
    <section class="reassurance">
      <div class="container reassurance__grid">
        <div><strong>Compatibilité vérifiée</strong><span>Référence contrôlée sur demande avec votre VIN</span></div>
        <div><strong>Expédition sous 24h</strong><span>Dès réception de votre paiement</span></div>
        <div><strong>Paiement Revolut ou virement</strong><span>Sans frais, sans carte bancaire</span></div>
        <div><strong>Retours sous 14 jours</strong><span>Droit de rétractation légal</span></div>
      </div>
    </section>
    <footer class="footer">
      <div class="container footer__grid">
        <div class="footer__brand">
          <a href="index.html" class="logo logo--light"><span class="logo__mark" aria-hidden="true">BP</span><span class="logo__text">Bavaria<strong>Parts</strong></span></a>
          <p>Pièces détachées d'origine et de qualité équivalente pour BMW. Revendeur indépendant.</p>
          <p class="footer__pay"><span>Revolut</span><span>Virement SEPA</span><span>Virement instantané</span></p>
        </div>
        <div>
          <h2>Boutique</h2>
          ${CATEGORIES.map((c) => `<a href="catalogue.html?categorie=${c.id}">${escapeHtml(c.name)}</a>`).join("")}
        </div>
        <div>
          <h2>Aide</h2>
          <a href="faq.html">Questions fréquentes</a>
          <a href="livraison-retours.html">Livraison et retours</a>
          <a href="faq.html#paiement">Paiement</a>
          <a href="mes-commandes.html">Mes commandes</a>
          <a href="contact.html">Nous contacter</a>
        </div>
        <div>
          <h2>Informations</h2>
          <a href="a-propos.html">Qui sommes-nous</a>
          <a href="cgv.html">Conditions générales de vente</a>
          <a href="mentions-legales.html">Mentions légales</a>
          <a href="confidentialite.html">Confidentialité</a>
        </div>
      </div>
      <div class="container footer__legal">
        © ${new Date().getFullYear()} ${escapeHtml(SHOP.name)}. BMW est une marque déposée de BMW AG. ${escapeHtml(SHOP.name)} est un revendeur indépendant, non affilié à BMW AG. Les noms de modèles et les références constructeur servent uniquement à indiquer la compatibilité des pièces. Les illustrations des produits ne sont pas contractuelles.
      </div>
    </footer>
    <dialog class="modal modal--sm" id="garageDialog" aria-labelledby="garageTitle">
      <form method="dialog" class="garage">
        <h2 id="garageTitle">Mon véhicule</h2>
        <p class="muted">Choisissez votre modèle : les pièces compatibles seront signalées partout sur le site.</p>
        <label for="garageSelect">Modèle et génération</label>
        <select id="garageSelect">
          <option value="">Aucun véhicule</option>
          ${MODELS.map((m) => `<option value="${m.code}">${escapeHtml(m.name)} · ${m.years}</option>`).join("")}
        </select>
        <p class="small muted">Vous ne connaissez pas le code de votre modèle ? Il figure sur la carte grise (rubrique D.2) ou nous pouvons le trouver avec votre numéro VIN.</p>
        <div class="garage__actions">
          <button class="btn btn--ghost" value="cancel">Annuler</button>
          <button class="btn btn--primary" value="save" id="garageSave">Enregistrer</button>
        </div>
      </form>
    </dialog>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`);

  $("#menuBtn").addEventListener("click", (e) => {
    const open = $("#nav").classList.toggle("nav--open");
    e.currentTarget.setAttribute("aria-expanded", open);
  });

  const dlg = $("#garageDialog");
  $("#vehicleChip").addEventListener("click", () => {
    $("#garageSelect").value = Garage.get()?.code || "";
    dlg.showModal();
  });
  $("#garageSave").addEventListener("click", () => Garage.set($("#garageSelect").value));

  // Remplissage des champs de configuration (pages légales, contact…)
  $$("[data-shop]").forEach((el) => {
    const value = el.dataset.shop.split(".").reduce((o, k) => (o ? o[k] : undefined), SHOP);
    el.innerHTML = cfg(value);
  });

  renderVehicleChip();
  updateHeaderCart();
}

function renderVehicleChip() {
  const v = Garage.get();
  const chip = $("#vehicleChip");
  if (!chip) return;
  chip.innerHTML = `${ICON.car}<span>${v ? escapeHtml(v.name) : "Mon véhicule"}</span>`;
  chip.classList.toggle("vehicle-chip--set", !!v);
}

function updateHeaderCart() {
  const el = $("#cartCount");
  if (!el) return;
  const n = Cart.count();
  el.textContent = n;
  el.hidden = n === 0;
}

// ---------------------------------------------------------------------
// Notifications et utilitaires
// ---------------------------------------------------------------------
let toastTimer;
function toast(msg, action) {
  const t = $("#toast");
  t.innerHTML = escapeHtml(msg) + (action ? ` <a href="${action.href}">${escapeHtml(action.label)}</a>` : "");
  t.classList.add("toast--show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("toast--show"), 3200);
}

async function copyText(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    toast("Copié : " + text);
  } catch (_) {
    const range = document.createRange();
    const target = btn?.previousElementSibling;
    if (target) {
      range.selectNodeContents(target);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      toast("Texte sélectionné, copiez-le avec Ctrl+C.");
    }
  }
}

function checkField(el) {
  const ok = el.checkValidity();
  el.classList.toggle("invalid", !ok);
  const field = el.closest(".field");
  if (field) {
    let msg = $(".field__error", field);
    if (!ok) {
      if (!msg) { msg = document.createElement("p"); msg.className = "field__error"; field.append(msg); }
      msg.textContent = el.dataset.error || el.validationMessage;
    } else if (msg) msg.remove();
  }
  return ok;
}

// Une fois signalé, un champ est revérifié à chaque modification.
document.addEventListener("input", (e) => { if (e.target.classList?.contains("invalid")) checkField(e.target); });
document.addEventListener("change", (e) => { if (e.target.classList?.contains("invalid")) checkField(e.target); });

function validateForm(form) {
  let first = null;
  $$("input, textarea, select", form).forEach((el) => {
    const ok = checkField(el);
    if (!ok && !first) first = el;
  });
  first?.focus();
  return !first;
}

// Envoi vers le formulaire en ligne configuré (Formspree ou équivalent).
async function sendToEndpoint(payload) {
  if (!SHOP.formEndpoint) return false;
  try {
    const res = await fetch(SHOP.formEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (_) {
    return false;
  }
}

// Ajout au panier depuis n'importe quelle carte produit
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (btn) Cart.add(btn.dataset.add, 1);
});

renderLayout();
