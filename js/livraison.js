(() => {
  const D = SHOP.delivery;
  const input = $("#dCpInput");
  input.value = store.get("cp", "");

  function show() {
    $("#dResult").innerHTML = zoneSummary(input.value);
    const z = locate(input.value).zone;
    $$("[data-zone]").forEach((el) => el.classList.toggle("is-current", el.dataset.zone === z?.id));
  }
  input.addEventListener("input", () => { input.value = input.value.replace(/\D/g, "").slice(0, 5); });
  $("#dCp").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!deptOf(input.value)) { $("#dResult").innerHTML = '<p class="error">Saisissez un code postal à 5 chiffres.</p>'; return; }
    setCp(input.value);
    show();
  });

  // Cartes de zone
  const days = (list) => list.map((d) => DAY_NAMES[d]).join(", ");
  $("#zoneGrid").innerHTML = D.zones.map((z) => `
    <article class="zone-card" data-zone="${z.id}">
      <h3>${escapeHtml(z.name)}</h3>
      <p class="zone-card__price">${euro(z.fee)}<small> · offerte dès ${plural(z.freeFromSteres, "stère")}</small></p>
      <p class="small">Tournées : ${days(z.days)}</p>
      <p class="small muted">Départements ${z.depts.join(", ")}</p>
    </article>`).join("") + `
    <article class="zone-card zone-card--far">
      <h3>Reste de la France</h3>
      <p class="zone-card__price">${euro(D.carrier.feePerPallet)}<small> par palette de ${plural(D.carrier.pallet, "stère")}</small></p>
      <p class="small">Transporteur, ${D.carrier.leadDays} à ${D.carrier.leadDays + 5} jours ouvrés</p>
      <p class="small muted">Hors Corse et outre-mer</p>
    </article>
    <article class="zone-card zone-card--pickup">
      <h3>Retrait au dépôt</h3>
      <p class="zone-card__price">Gratuit<small> · −${D.pickup.discountPercent} % sur le bois</small></p>
      <p class="small">Du lundi au samedi, sur rendez-vous</p>
      <p class="small muted">Chargement de votre remorque inclus</p>
    </article>
    <article class="zone-card">
      <h3>Petits colis seuls</h3>
      <p class="zone-card__price">${euro(D.parcel.fee)}<small> · offert dès ${euro(D.parcel.freeFrom)}</small></p>
      <p class="small">${escapeHtml(D.parcel.name)}, ${D.parcel.leadDays} à ${D.parcel.leadDays + 2} jours</p>
      <p class="small muted">Allume-feu, bois d'allumage, accessoires</p>
    </article>`;

  // Calendrier des 14 prochains jours
  const start = new Date();
  start.setHours(12, 0, 0, 0);
  const dates = Array.from({ length: 14 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i + 1); return d; });
  $("#calendar").innerHTML = `<thead><tr><th>Zone</th>${dates.map((d) => `<th class="${d.getDay() === 0 ? "is-sunday" : ""}"><span>${d.toLocaleDateString("fr-FR", { weekday: "short" })}</span> ${d.getDate()}</th>`).join("")}</tr></thead>
    <tbody>${D.zones.map((z) => {
      const ok = new Set(nextDates(z.days, z.leadDays, 10));
      return `<tr data-zone="${z.id}"><th scope="row">${escapeHtml(z.name.split(" ·")[0])}</th>${dates.map((d) => {
        const iso = d.toISOString().slice(0, 10);
        const tour = z.days.includes(d.getDay());
        return `<td>${tour ? (ok.has(iso) ? '<span class="cal__dot" title="Tournée, réservable">●</span>' : '<span class="cal__dot cal__dot--full" title="Tournée complète ou trop proche">○</span>') : ""}</td>`;
      }).join("")}</tr>`;
    }).join("")}</tbody>`;
  $("#calendar").insertAdjacentHTML("afterend", '<p class="small muted">● tournée réservable · ○ tournée trop proche pour une nouvelle commande</p>');

  show();
})();
