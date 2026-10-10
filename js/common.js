// Code partagé par toutes les pages : prix, panier, livraison, illustrations, en-tête, pied de page.

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const euro = (n) => n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
const num = (n, d = 2) => n.toLocaleString("fr-FR", { maximumFractionDigits: d });
const round2 = (n) => Math.round(n * 100) / 100;
const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const params = new URLSearchParams(location.search);
const plural = (n, word) => `${num(n)} ${word}${n >= 2 ? "s" : ""}`;

const productById = (id) => PRODUCTS.find((p) => p.id === id);
const essenceById = (id) => ESSENCES.find((e) => e.id === id);
const lengthByCm = (cm) => LENGTHS.find((l) => l.cm === +cm);
const dryingById = (id) => DRYINGS.find((d) => d.id === id);
const categoryById = (id) => CATEGORIES.find((c) => c.id === id);

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
      const v = JSON.parse(localStorage.getItem("bb-" + key));
      return v ?? fallback;
    } catch (_) {
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem("bb-" + key, JSON.stringify(value)); } catch (_) {}
  },
};

// ---------------------------------------------------------------------
// Prix et libellés
// ---------------------------------------------------------------------
// Options par défaut d'un produit configurable : 33 cm séché à l'air
function defaultOpts(p) {
  if (p.type !== "config") return {};
  return { len: p.lengths.includes(33) ? 33 : p.lengths[0], dry: p.dryings[0] };
}

function unitPrice(p, opts = {}) {
  if (p.type !== "config") return p.price;
  const l = lengthByCm(opts.len) || LENGTHS[0];
  const d = dryingById(opts.dry) || DRYINGS[0];
  return p.base + l.surcharge + d.surcharge;
}

// Prix « à partir de » affiché sur les cartes
const fromPrice = (p) => (p.type === "config" ? p.base : p.price);

function optsLabel(p, opts = {}) {
  if (p.type === "config") return `${lengthByCm(opts.len).label} · ${dryingById(opts.dry).name.toLowerCase()} (${dryingById(opts.dry).humidity})`;
  const bits = [];
  if (p.len) bits.push(`${p.len} cm`);
  if (p.dry) bits.push(dryingById(p.dry).name.toLowerCase());
  return bits.join(" · ");
}

// Volume apparent (m³) pour une quantité de stères recoupés
const apparentM3 = (steres, len) => steres * (lengthByCm(len)?.factor ?? 1);

function unitLabel(p, qty) {
  return p.unit === "stère" ? plural(qty, "stère") : `${qty} × ${p.unit}`;
}

// ---------------------------------------------------------------------
// Panier : lignes { key, id, len, dry, qty }
// ---------------------------------------------------------------------
const itemKey = (id, opts = {}) => [id, opts.len || "", opts.dry || ""].join("|");

const Cart = {
  raw() { return store.get("cart", []).filter((i) => productById(i.id) && i.qty > 0); },
  items() {
    return this.raw().map((i) => {
      const p = productById(i.id);
      const opts = { len: i.len, dry: i.dry };
      const unit = unitPrice(p, opts);
      return { ...i, product: p, opts, unit, line: round2(unit * i.qty), st: p.st * i.qty };
    });
  },
  count() { return this.raw().length; },
  save(lines) {
    store.set("cart", lines);
    updateHeaderCart();
    document.dispatchEvent(new CustomEvent("cart:change"));
  },
  add(id, opts = {}, qty = 1) {
    const p = productById(id);
    const key = itemKey(id, opts);
    const lines = this.raw();
    const line = lines.find((l) => l.key === key);
    const max = p.max || 30;
    const next = Math.min((line?.qty || 0) + qty, max);
    if (line) line.qty = next;
    else lines.push({ key, id, len: opts.len || null, dry: opts.dry || null, qty: next });
    this.save(lines);
    const what = p.unit === "stère" ? `${plural(qty, "stère")} de ${essenceById(p.essence).name.toLowerCase()}` : p.name;
    const needWood = p.addon && !lines.some((l) => !productById(l.id).addon);
    toast(needWood ? `${what} ajouté. Ajoutez du bois pour pouvoir commander.` : `${what} ajouté au panier`,
      needWood ? { href: "catalogue.html?categorie=buches", label: "Choisir du bois" } : { href: "panier.html", label: "Voir le panier" });
  },
  setQty(key, qty) {
    const lines = this.raw();
    const line = lines.find((l) => l.key === key);
    if (!line) return;
    const max = productById(line.id).max || 30;
    line.qty = Math.max(0, Math.min(qty, max));
    this.save(lines.filter((l) => l.qty > 0));
  },
  clear() {
    store.set("cart", []);
    store.set("promo", "");
    updateHeaderCart();
  },
};

function getPromo() {
  const code = store.get("promo", "");
  return SHOP.promoCodes[code] ? { code, ...SHOP.promoCodes[code] } : null;
}

// ---------------------------------------------------------------------
// Livraison
// ---------------------------------------------------------------------
function deptOf(cp) {
  return /^\d{5}$/.test(cp || "") ? cp.slice(0, 2) : null;
}

// Renvoie { ok, dept, reason }
function locate(cp) {
  const dept = deptOf(cp);
  if (!dept) return { ok: false, reason: "invalid" };
  if (SHOP.delivery.excluded.includes(dept)) return { ok: false, dept, reason: "excluded" };
  return { ok: true, dept };
}

const fmtDate = (iso, opts = { weekday: "long", day: "numeric", month: "long" }) =>
  new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", opts);

// Fenêtre de livraison estimée à partir d'aujourd'hui (ou d'une date de commande)
function deliveryWindow(from = new Date()) {
  const d = (n) => { const x = new Date(from); x.setHours(12, 0, 0, 0); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
  return { from: d(SHOP.delivery.minDays), to: d(SHOP.delivery.maxDays) };
}
const delayText = () => `${SHOP.delivery.minDays} à ${SHOP.delivery.maxDays} jours`;

// Nombre de palettes : les accessoires voyagent avec le bois
function palletCount(st) {
  return Math.max(1, Math.ceil(round2(st) / SHOP.delivery.pallet - 1e-9));
}

// Une commande doit contenir du bois : les accessoires ne sont vendus qu'en complément.
function cartIssue(items = Cart.items()) {
  if (!items.length) return "";
  const wood = items.filter((i) => !i.product.addon);
  if (!wood.length) return "Les accessoires sont vendus uniquement en complément d'une commande de bois. Ajoutez du bois à votre panier pour commander.";
  const woodTotal = wood.reduce((s, i) => s + i.line, 0);
  if (SHOP.minOrderAmount && woodTotal < SHOP.minOrderAmount)
    return `Commande minimum : ${euro(SHOP.minOrderAmount)} de bois (actuellement ${euro(woodTotal)}).`;
  return "";
}

// Livraison unique : sur palette par transporteur
function deliveryOptions(cp, items = Cart.items()) {
  const D = SHOP.delivery;
  const st = round2(items.reduce((s, i) => s + i.st, 0));
  const pallets = palletCount(st);
  const loc = locate(cp);
  const method = {
    id: "palette", name: D.name, fee: pallets * D.feePerPallet, pallets,
    delay: `Livraison sous ${delayText()}, sur rendez-vous`,
    note: `${plural(pallets, "palette")} · ${euro(D.feePerPallet)} par palette`,
  };
  return { loc, methods: [method], st, pallets };
}

function computeTotals({ cp = store.get("cp", "") } = {}) {
  const items = Cart.items();
  const subtotal = round2(items.reduce((s, i) => s + i.line, 0));
  const promo = getPromo();
  const discount = promo ? round2((subtotal * promo.percent) / 100) : 0;
  const del = deliveryOptions(cp, items);
  const method = del.methods[0];
  const shipping = items.length ? method.fee : 0;
  const total = round2(subtotal - discount + shipping);
  const vat = round2(total - total / (1 + SHOP.vatRate / 100));
  return { items, subtotal, promo, discount, shipping, method, del, total, vat, st: del.st, issue: cartIssue(items) };
}

function totalsHtml(t) {
  return `
    <div><dt>Sous-total</dt><dd>${euro(t.subtotal)}</dd></div>
    ${t.promo ? `<div class="totals__discount"><dt>Remise ${escapeHtml(t.promo.code)}</dt><dd>−${euro(t.discount)}</dd></div>` : ""}
    <div><dt>Livraison <span class="muted small">(${plural(t.method.pallets, "palette")})</span></dt><dd>${t.items.length ? euro(t.shipping) : "—"}</dd></div>
    <div class="totals__grand"><dt>Total TTC</dt><dd>${euro(t.total)}</dd></div>
    <div class="totals__vat"><dt>dont TVA ${SHOP.vatRate} %</dt><dd>${euro(t.vat)}</dd></div>`;
}

// ---------------------------------------------------------------------
// Illustrations générées (SVG) : tas de bûches fendues, sacs, palettes
// ---------------------------------------------------------------------
function rng(seed) {
  let s = [...String(seed)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// Une bûche fendue vue de face : un secteur de cercle avec écorce et cernes
function logEnd(cx, cy, R, ess, rand) {
  // une bûche sur trois reste ronde (petit diamètre non fendu)
  if (rand() < 0.33) {
    const r = R * 0.82;
    return `<g>
      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${r.toFixed(1)}" fill="${ess.bark}"/>
      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r - 4).toFixed(1)}" fill="${ess.color}"/>
      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 0.6).toFixed(1)}" fill="none" stroke="${ess.ring}" stroke-width="1.8" opacity=".85"/>
      <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(r * 0.3).toFixed(1)}" fill="none" stroke="${ess.ring}" stroke-width="1.4" opacity=".7"/>
    </g>`;
  }
  const span = [Math.PI / 2, (2 * Math.PI) / 3, Math.PI, Math.PI * 1.5][Math.floor(rand() * 4)];
  const rot = rand() * Math.PI * 2;
  // recentrer le secteur sur son centre de gravité
  const g = (4 * R * Math.sin(span / 2)) / (3 * span);
  const ox = cx - g * Math.cos(rot), oy = cy - g * Math.sin(rot);
  const a1 = rot - span / 2, a2 = rot + span / 2;
  const pt = (r, a) => `${(ox + r * Math.cos(a)).toFixed(1)} ${(oy + r * Math.sin(a)).toFixed(1)}`;
  const large = span > Math.PI ? 1 : 0;
  const arc = (r) => `M${pt(r, a1)} A${r} ${r} 0 ${large} 1 ${pt(r, a2)}`;
  return `<g>
    <path d="M${ox.toFixed(1)} ${oy.toFixed(1)} L${pt(R, a1)} A${R} ${R} 0 ${large} 1 ${pt(R, a2)} Z" fill="${ess.color}"/>
    <path d="${arc(R * 0.72)}" fill="none" stroke="${ess.ring}" stroke-width="2" opacity=".85"/>
    <path d="${arc(R * 0.46)}" fill="none" stroke="${ess.ring}" stroke-width="1.6" opacity=".7"/>
    <path d="${arc(R * 0.22)}" fill="none" stroke="${ess.ring}" stroke-width="1.2" opacity=".6"/>
    <path d="${arc(R - 2.5)}" fill="none" stroke="${ess.bark}" stroke-width="5" stroke-linecap="round"/>
  </g>`;
}

function stackSvg(ess, seed, { rows = 4, cols = 6, pallet = false, film = false } = {}) {
  const rand = rng(seed);
  const W = 400, H = 300, cell = 52;
  const x0 = (W - cols * cell) / 2 + cell / 2;
  const yBase = pallet ? 232 : 252;
  let logs = "";
  for (let r = 0; r < rows; r++) {
    const n = cols - (r % 2);
    const shift = (r % 2) * (cell / 2);
    for (let c = 0; c < n; c++) {
      const cx = x0 + shift + c * cell + (rand() - 0.5) * 6;
      const cy = yBase - cell / 2 - r * (cell * 0.86) + (rand() - 0.5) * 4;
      logs += logEnd(cx, cy, 28 + rand() * 5, ess, rand);
    }
  }
  const left = x0 - cell / 2 - 10, right = x0 + cols * cell - cell / 2 + 10;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bûches de ${escapeHtml(ess.name.toLowerCase())}">
    <rect width="${W}" height="${H}" fill="var(--art-bg, #f4ecdf)"/>
    <ellipse cx="200" cy="${yBase + 18}" rx="${(right - left) / 2 + 20}" ry="12" fill="#000" opacity=".08"/>
    ${pallet ? `<g fill="#c9a26b" stroke="#a37d48" stroke-width="1.5">
      <rect x="${left}" y="${yBase}" width="${right - left}" height="9" rx="1"/>
      <rect x="${left + 4}" y="${yBase + 9}" width="26" height="12"/><rect x="${(left + right) / 2 - 13}" y="${yBase + 9}" width="26" height="12"/><rect x="${right - 30}" y="${yBase + 9}" width="26" height="12"/>
      <rect x="${left}" y="${yBase + 21}" width="${right - left}" height="7" rx="1"/></g>` : ""}
    ${logs}
    ${film ? `<rect x="${left}" y="${yBase - rows * cell * 0.86 - 12}" width="${right - left}" height="${rows * cell * 0.86 + 12}" rx="6" fill="#fff" opacity=".16"/>
      <path d="M${left + 30} ${yBase - rows * 44} l60 ${rows * 40}" stroke="#fff" stroke-width="10" opacity=".25" stroke-linecap="round"/>` : ""}
  </svg>`;
}

function bagSvg(kind, ess, seed) {
  const rand = rng(seed);
  let inside = "";
  if (kind === "pellets") {
    for (let i = 0; i < 90; i++) {
      const x = 150 + rand() * 100, y = 140 + rand() * 80, a = rand() * 180;
      inside += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="12" height="5" rx="2.5" fill="${["#c69b5c", "#b48748", "#d6ad72"][i % 3]}" transform="rotate(${a.toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`;
    }
  } else if (kind === "kindling") {
    for (let i = 0; i < 16; i++) {
      const x = 152 + i * 6 + rand() * 3;
      inside += `<rect x="${x.toFixed(0)}" y="${(128 + rand() * 12).toFixed(0)}" width="5" height="${(80 + rand() * 12).toFixed(0)}" rx="1" fill="${i % 2 ? "#e9cf9d" : "#d9b77d"}"/>`;
    }
  } else {
    [[175, 160], [225, 160], [200, 200], [160, 205], [240, 205]].forEach(([x, y]) => (inside += logEnd(x, y, 22, ess, rand)));
  }
  return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sac">
    <rect width="400" height="300" fill="var(--art-bg, #f4ecdf)"/>
    <ellipse cx="200" cy="262" rx="105" ry="12" fill="#000" opacity=".08"/>
    <path d="M118 92 q82 -22 164 0 l14 156 q-96 22 -192 0z" fill="${kind === "pellets" ? "#2f5d3a" : "#d9cdb4"}" stroke="${kind === "pellets" ? "#244a2e" : "#bfae8c"}" stroke-width="3"/>
    ${kind === "pellets" ? "" : `<g stroke="#bfae8c" stroke-width="1.2" opacity=".7">${Array.from({ length: 9 }, (_, i) => `<path d="M${126 + i * 18} 92 l${-3 + i * 0.6} 158"/>`).join("")}</g>`}
    <rect x="140" y="120" width="120" height="${kind === "pellets" ? 110 : 112}" rx="10" fill="${kind === "pellets" ? "#f4ecdf" : "none"}" opacity="${kind === "pellets" ? ".95" : "1"}"/>
    <clipPath id="w${seed}"><rect x="140" y="120" width="120" height="112" rx="10"/></clipPath>
    <g clip-path="url(#w${seed})">${inside}</g>
    <path d="M118 92 q82 -22 164 0" fill="none" stroke="${kind === "pellets" ? "#1d3d25" : "#a8957a"}" stroke-width="6" stroke-linecap="round"/>
  </svg>`;
}

function bricksSvg(seed, pallet) {
  const rand = rng(seed);
  let b = "";
  const rows = pallet ? 5 : 3, cols = pallet ? 6 : 3;
  const w = 44, h = 36, x0 = 200 - (cols * w) / 2, yb = pallet ? 228 : 246;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const x = x0 + c * w, y = yb - (r + 1) * h;
      b += `<g><polygon points="${x + 22},${y + 2} ${x + 40},${y + 11} ${x + 40},${y + 29} ${x + 22},${y + 38 - 4} ${x + 4},${y + 29} ${x + 4},${y + 11}" fill="${["#a87b4f", "#9a6e44", "#b5875a"][Math.floor(rand() * 3)]}" stroke="#7a5432" stroke-width="1.5"/>
        <circle cx="${x + 22}" cy="${y + 20}" r="5" fill="#5b3c22"/></g>`;
    }
  return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bûches densifiées">
    <rect width="400" height="300" fill="var(--art-bg, #f4ecdf)"/>
    <ellipse cx="200" cy="${yb + 18}" rx="${(cols * w) / 2 + 24}" ry="11" fill="#000" opacity=".08"/>
    ${pallet ? `<g fill="#c9a26b" stroke="#a37d48" stroke-width="1.5"><rect x="${x0 - 8}" y="${yb}" width="${cols * w + 16}" height="9"/><rect x="${x0 - 4}" y="${yb + 9}" width="24" height="12"/><rect x="${188}" y="${yb + 9}" width="24" height="12"/><rect x="${x0 + cols * w - 20}" y="${yb + 9}" width="24" height="12"/><rect x="${x0 - 8}" y="${yb + 21}" width="${cols * w + 16}" height="7"/></g>` : ""}
    ${b}
  </svg>`;
}

const ACCESSORY_ART = {
  "allume-feu": `<g><rect x="130" y="120" width="140" height="110" rx="8" fill="#c0392b"/><rect x="130" y="120" width="140" height="28" rx="8" fill="#a93226"/>
    ${Array.from({ length: 5 }, (_, i) => `<circle cx="${150 + i * 25}" cy="110" r="11" fill="#e8c27a" stroke="#c69b4d" stroke-width="2"/>`).join("")}
    <path d="M200 160 c-18 22 -8 40 0 44 c8 -4 18 -22 0 -44z" fill="#ffb648"/><path d="M200 178 c-7 10 -3 20 0 22 c3 -2 7 -12 0 -22z" fill="#fff1c9"/></g>`,
  humidimetre: `<g><rect x="150" y="70" width="100" height="170" rx="18" fill="#2f5d3a"/><rect x="164" y="88" width="72" height="50" rx="6" fill="#d8f0c8"/>
    <text x="200" y="122" text-anchor="middle" font-family="monospace" font-size="24" font-weight="700" fill="#1d3d25">14%</text>
    <circle cx="200" cy="175" r="15" fill="#e2b04a"/><rect x="186" y="240" width="5" height="22" fill="#9aa0a6"/><rect x="209" y="240" width="5" height="22" fill="#9aa0a6"/></g>`,
  bache: `<g><path d="M95 200 L170 105 L305 120 L320 215 Z" fill="#2f5d3a"/><path d="M95 200 L320 215 L300 240 L110 228Z" fill="#244a2e"/>
    ${[[110, 194], [165, 115], [300, 128], [312, 208]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#d9d4c7"/>`).join("")}
    <path d="M150 150 L250 162" stroke="#3f7a4d" stroke-width="3"/></g>`,
  "range-buches": `<g fill="none" stroke="#4a4f55" stroke-width="7" stroke-linejoin="round"><path d="M120 250 V95 M280 250 V95 M120 250 H280 M120 95 H280"/></g>
    <g>${Array.from({ length: 9 }, (_, i) => `<rect x="${128 + (i % 3) * 49}" y="${200 - Math.floor(i / 3) * 46}" width="44" height="42" rx="20" fill="#9c6b40" stroke="#3d2a1a" stroke-width="3"/>`).join("")}</g>`,
};

// Photo de l'essence si elle existe, sinon tas de bûches dessiné
function essenceArt(e, seed, opts) {
  if (typeof PHOTOS !== "undefined" && PHOTOS[e.id])
    return `<img class="art-photo" src="${escapeHtml(PHOTOS[e.id])}" alt="Bûches de ${escapeHtml(e.name.toLowerCase())}" loading="lazy" width="1200" height="900">`;
  return stackSvg(e, seed, opts);
}

function productArt(p, opts = {}) {
  if (typeof PHOTOS !== "undefined" && PHOTOS[p.id])
    return `<img class="art-photo" src="${escapeHtml(PHOTOS[p.id])}" alt="${escapeHtml(p.name)}" loading="lazy" width="1200" height="900">`;
  const ess = essenceById(p.essence) || ESSENCES[4];
  if (p.type === "config") {
    const len = opts.len || 33;
    return stackSvg(ess, p.id + len, { rows: 4, cols: len >= 50 ? 5 : 6 });
  }
  if (p.id.startsWith("palette")) return stackSvg(ess, p.id, { rows: 4, cols: 6, pallet: true, film: true });
  if (p.id === "sac-buchettes") return bagSvg("logs", ess, p.id);
  if (p.id === "allumage") return bagSvg("kindling", ess, p.id);
  if (p.id === "granules-sac") return bagSvg("pellets", ess, p.id);
  if (p.id === "granules-palette")
    return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Palette de granulés">
      <rect width="400" height="300" fill="var(--art-bg, #f4ecdf)"/><ellipse cx="200" cy="250" rx="140" ry="11" fill="#000" opacity=".08"/>
      <g fill="#c9a26b" stroke="#a37d48" stroke-width="1.5"><rect x="80" y="226" width="240" height="9"/><rect x="84" y="235" width="26" height="12"/><rect x="187" y="235" width="26" height="12"/><rect x="290" y="235" width="26" height="12"/><rect x="80" y="247" width="240" height="7"/></g>
      ${Array.from({ length: 12 }, (_, i) => `<rect x="${84 + (i % 3) * 78}" y="${190 - Math.floor(i / 3) * 40}" width="74" height="36" rx="8" fill="#2f5d3a" stroke="#1d3d25" stroke-width="2"/><rect x="${104 + (i % 3) * 78}" y="${200 - Math.floor(i / 3) * 40}" width="34" height="12" rx="3" fill="#f4ecdf" opacity=".85"/>`).join("")}
      <rect x="78" y="50" width="244" height="176" rx="6" fill="#fff" opacity=".14"/></svg>`;
  if (p.kind === "densifie") return bricksSvg(p.id, p.id.endsWith("palette"));
  return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(p.name)}">
    <rect width="400" height="300" fill="var(--art-bg, #f4ecdf)"/><ellipse cx="200" cy="258" rx="110" ry="11" fill="#000" opacity=".08"/>${ACCESSORY_ART[p.id] || ""}</svg>`;
}

// ---------------------------------------------------------------------
// Composants
// ---------------------------------------------------------------------
function meter(value, label) {
  return `<span class="meter" title="${label} : ${value}/5" aria-label="${label} : ${value} sur 5">${Array.from({ length: 5 }, (_, i) => `<i${i < value ? ' class="on"' : ""}></i>`).join("")}</span>`;
}

function productCard(p) {
  const url = `produit.html?id=${encodeURIComponent(p.id)}`;
  const ess = essenceById(p.essence);
  const isConfig = p.type === "config";
  return `<article class="card-product">
    <a class="card-product__media" href="${url}" tabindex="-1" aria-hidden="true">${productArt(p, defaultOpts(p))}
      ${isConfig ? `<span class="tag">Au stère</span>` : ""}
    </a>
    <div class="card-product__body">
      <p class="card-product__brand">${escapeHtml(categoryById(p.category).name)}</p>
      <h3 class="card-product__name"><a href="${url}">${escapeHtml(p.name)}</a></h3>
      ${isConfig
        ? `<p class="card-product__meta">${p.lengths.map((l) => lengthByCm(l).label).join(" · ")} · sec air ou four</p>
           <div class="card-product__meters"><span>Chaleur</span>${meter(Math.round((ess.kwh - 1500) / 140), "Pouvoir calorifique")}<span>Braises</span>${meter(ess.embers, "Braises")}</div>`
        : `<p class="card-product__meta">${escapeHtml(optsLabel(p) || p.text.split(".")[0])}</p>`}
      ${p.addon ? '<p class="addon-note">En complément d\'une commande de bois</p>' : ""}
      <div class="card-product__foot">
        <div class="price">${isConfig ? '<span class="price__from">dès</span>' : ""}<strong>${euro(fromPrice(p))}</strong><span class="price__unit">/ ${p.unit}</span></div>
        ${isConfig
          ? `<a class="btn btn--primary btn--sm" href="${url}">Configurer</a>`
          : `<button class="btn btn--primary btn--sm" data-add="${p.id}" aria-label="Ajouter ${escapeHtml(p.name)} au panier">Ajouter</button>`}
      </div>
    </div>
  </article>`;
}

// ---------------------------------------------------------------------
// En-tête, pied de page, dialogue code postal
// ---------------------------------------------------------------------
const ICON = {
  cart: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>',
  truck: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 4h14v12H1zM15 9h4l4 4v3h-8z"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
  box: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"/></svg>',
  menu: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  flame: '<svg viewBox="0 0 64 64" width="26" height="26" aria-hidden="true"><circle cx="32" cy="19" r="12.5" fill="#d9a640"/><circle cx="32" cy="19" r="10.8" fill="#ebc48d"/><circle cx="32" cy="19" r="7" fill="none" stroke="#b98a52" stroke-width="1.3"/><circle cx="32" cy="19" r="3.5" fill="none" stroke="#b98a52" stroke-width="1.3"/><circle cx="19" cy="41" r="12.5" fill="#d9a640"/><circle cx="19" cy="41" r="10.8" fill="#ebc48d"/><circle cx="19" cy="41" r="7" fill="none" stroke="#b98a52" stroke-width="1.3"/><circle cx="19" cy="41" r="3.5" fill="none" stroke="#b98a52" stroke-width="1.3"/><circle cx="45" cy="41" r="12.5" fill="#d9a640"/><circle cx="45" cy="41" r="10.8" fill="#ebc48d"/><circle cx="45" cy="41" r="7" fill="none" stroke="#b98a52" stroke-width="1.3"/><circle cx="45" cy="41" r="3.5" fill="none" stroke="#b98a52" stroke-width="1.3"/></svg>',
};

function logoHtml(light = false) {
  return `<a href="index.html" class="logo${light ? " logo--light" : ""}" aria-label="${escapeHtml(SHOP.name)}, accueil">
    <span class="logo__mark" aria-hidden="true">${ICON.flame}</span>
    <span class="logo__text">Le Stère <em>d’Or</em></span>
  </a>`;
}

function renderLayout() {
  const page = document.body.dataset.page;
  const navLink = (href, label, key) => `<a href="${href}"${page === key ? ' aria-current="page"' : ""}>${label}</a>`;

  document.body.insertAdjacentHTML("afterbegin", `
    <a class="skip" href="#main">Aller au contenu</a>
    <div class="topbar">Bois sec garanti &lt; 20 % d'humidité · Livraison sur palette partout en France sous ${delayText()} · TVA ${SHOP.vatRate} %</div>
    <header class="header">
      <div class="container header__row">
        ${logoHtml()}
        <nav class="nav" id="nav" aria-label="Navigation principale">
          ${navLink("catalogue.html", "Boutique", "catalogue")}
          ${navLink("calculateur.html", "Calculateur", "calculateur")}
          ${navLink("essences.html", "Guide des essences", "essences")}
          ${navLink("livraison.html", "Livraison", "livraison")}
          ${navLink("faq.html", "Aide", "faq")}
          ${navLink("contact.html", "Contact", "contact")}
        </nav>
        <div class="header__actions">
          <button class="cp-chip" id="cpChip" type="button"></button>
          <a class="icon-link" href="mes-commandes.html" aria-label="Mes commandes">${ICON.box}<span class="icon-link__label">Commandes</span></a>
          <a class="icon-link" href="panier.html" aria-label="Panier">${ICON.cart}<span class="icon-link__label">Panier</span><span class="badge" id="cartCount">0</span></a>
          <button class="icon-link menu-btn" id="menuBtn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="nav">${ICON.menu}</button>
        </div>
      </div>
    </header>`);

  document.body.insertAdjacentHTML("beforeend", `
    <section class="reassurance">
      <div class="container reassurance__grid">
        <div><strong>Volume honnête</strong><span>Prix au stère et au m³ apparent, sans surprise</span></div>
        <div><strong>Bois sec mesuré</strong><span>Humidité contrôlée à l'humidimètre avant chaque livraison</span></div>
        <div><strong>Livré sur palette</strong><span>Partout en France métropolitaine, sous ${delayText()}</span></div>
        <div><strong>Paiement sécurisé</strong><span>Carte bancaire ou virement instantané</span></div>
      </div>
    </section>
    <footer class="footer">
      <div class="container footer__grid">
        <div class="footer__brand">
          ${logoHtml(true)}
          <p>Bois de chauffage de feuillus durs, fendu, séché et livré chez vous. Granulés, bûches densifiées et accessoires.</p>
          <p class="footer__pay"><span>Carte bancaire</span><span>Virement instantané</span><span>Livraison sur palette</span></p>
        </div>
        <div>
          <h2>Boutique</h2>
          ${CATEGORIES.map((c) => `<a href="catalogue.html?categorie=${c.id}">${escapeHtml(c.name)}</a>`).join("")}
        </div>
        <div>
          <h2>Outils et conseils</h2>
          <a href="calculateur.html">Calculer mes besoins</a>
          <a href="calculateur.html#convertisseur">Stère, m³ apparent : convertir</a>
          <a href="essences.html">Guide des essences</a>
          <a href="livraison.html">Livraison sur palette</a>
          <a href="faq.html">Questions fréquentes</a>
        </div>
        <div>
          <h2>Informations</h2>
          <a href="a-propos.html">Qui sommes-nous</a>
          <a href="contact.html">Nous contacter</a>
          <a href="cgv.html">Conditions générales de vente</a>
          <a href="mentions-legales.html">Mentions légales</a>
          <a href="confidentialite.html">Confidentialité</a>
        </div>
      </div>
      <div class="container footer__legal">
        © ${new Date().getFullYear()} ${escapeHtml(SHOP.name)}. Prix TTC, TVA à ${SHOP.vatRate} % pour le bois de chauffage. Illustrations non contractuelles. Volumes indiqués en stères (bûches empilées de 1 m) et en m³ apparent après coupe.
      </div>
    </footer>
    <dialog class="modal modal--sm" id="cpDialog" aria-labelledby="cpTitle">
      <form method="dialog" class="cp-form" id="cpForm">
        <h2 id="cpTitle">Où livrer votre bois ?</h2>
        <p class="muted">Indiquez votre code postal : nous vérifions que nous livrons chez vous et indiquons le délai.</p>
        <label for="cpInput">Code postal</label>
        <input id="cpInput" inputmode="numeric" maxlength="5" autocomplete="postal-code" placeholder="ex. 45000">
        <div id="cpResult" class="cp-result" role="status"></div>
        <div class="cp-form__actions">
          <button class="btn btn--ghost" value="cancel">Fermer</button>
          <button class="btn btn--primary" value="save" id="cpSave">Enregistrer</button>
        </div>
      </form>
    </dialog>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`);

  $("#menuBtn").addEventListener("click", (e) => {
    const open = $("#nav").classList.toggle("nav--open");
    e.currentTarget.setAttribute("aria-expanded", open);
  });

  const dlg = $("#cpDialog");
  $("#cpChip").addEventListener("click", () => {
    $("#cpInput").value = store.get("cp", "");
    $("#cpResult").innerHTML = deliverySummary($("#cpInput").value);
    dlg.showModal();
  });
  $("#cpInput").addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 5);
    $("#cpResult").innerHTML = e.target.value.length === 5 ? deliverySummary(e.target.value) : "";
  });
  $("#cpSave").addEventListener("click", (e) => {
    const v = $("#cpInput").value;
    if (v && !deptOf(v)) { e.preventDefault(); $("#cpResult").innerHTML = '<p class="error">Le code postal doit contenir 5 chiffres.</p>'; return; }
    setCp(v);
  });

  // Remplissage des champs de configuration (pages légales, contact…)
  $$("[data-shop]").forEach((el) => {
    const value = el.dataset.shop.split(".").reduce((o, k) => (o ? o[k] : undefined), SHOP);
    el.innerHTML = cfg(value);
  });

  renderCpChip();
  updateHeaderCart();
}

function setCp(cp) {
  store.set("cp", cp || "");
  renderCpChip();
  document.dispatchEvent(new CustomEvent("cp:change"));
}

// Résumé de livraison pour un code postal (dialogue, accueil, page livraison)
function deliverySummary(cp) {
  if (!cp) return "";
  const loc = locate(cp);
  if (loc.reason === "invalid") return '<p class="error">Le code postal doit contenir 5 chiffres.</p>';
  if (!loc.ok) return `<p class="cp-result__bad"><strong>Nous ne livrons pas ce département.</strong> La Corse et l'outre-mer ne sont pas desservis.</p>`;
  const D = SHOP.delivery;
  const w = deliveryWindow();
  return `<div class="cp-result__ok">
    <p><strong>Nous livrons au ${escapeHtml(cp)}</strong> : sur palette par transporteur, ${euro(D.feePerPallet)} par palette de ${plural(D.pallet, "stère")} maximum.</p>
    <p class="small">Livraison sous ${delayText()} : pour une commande payée aujourd'hui, entre le ${fmtDate(w.from, { day: "numeric", month: "long" })} et le ${fmtDate(w.to, { day: "numeric", month: "long" })}.</p>
  </div>`;
}

function renderCpChip() {
  const chip = $("#cpChip");
  if (!chip) return;
  const cp = store.get("cp", "");
  chip.innerHTML = `${ICON.truck}<span>${cp ? escapeHtml(cp) : "Code postal"}</span>`;
  chip.classList.toggle("cp-chip--set", !!cp);
  chip.setAttribute("aria-label", cp ? `Livraison au ${cp}, modifier` : "Indiquer mon code postal de livraison");
}

function updateHeaderCart() {
  const el = $("#cartCount");
  if (!el) return;
  const n = Cart.count();
  el.textContent = n;
  el.hidden = n === 0;
}

// ---------------------------------------------------------------------
// Notifications, formulaires et utilitaires
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
    toast("Copié : " + (text.length > 40 ? text.slice(0, 40) + "…" : text));
  } catch (_) {
    const target = btn?.previousElementSibling;
    if (target) {
      const range = document.createRange();
      range.selectNodeContents(target);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      toast("Texte sélectionné, copiez-le avec Ctrl+C.");
    }
  }
}

function checkField(el) {
  const ok = el.disabled || el.checkValidity();
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
    if (el.type === "radio") return;
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

// Apparition douce des sections au défilement
function revealOnScroll() {
  const els = $$(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach((el) => el.classList.add("is-visible")); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
  }), { rootMargin: "0px 0px -60px" });
  els.forEach((el) => io.observe(el));
}

// Ajout au panier depuis n'importe quelle carte produit (produits sans option)
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (btn) Cart.add(btn.dataset.add, {}, 1);
});

renderLayout();
revealOnScroll();
