(() => {
  const D = SHOP.delivery;
  const input = $("#dCpInput");
  input.value = store.get("cp", "");
  $("#lDelay").textContent = `sous ${delayText()}`;

  const show = () => ($("#dResult").innerHTML = deliverySummary(input.value));
  input.addEventListener("input", () => { input.value = input.value.replace(/\D/g, "").slice(0, 5); });
  $("#dCp").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!deptOf(input.value)) { $("#dResult").innerHTML = '<p class="error">Saisissez un code postal à 5 chiffres.</p>'; return; }
    setCp(input.value);
    show();
  });

  $("#zoneGrid").innerHTML = `
    <article class="zone-card is-current">
      <h3>France métropolitaine</h3>
      <p class="zone-card__price">${euro(D.feePerPallet)}<small> par palette</small></p>
      <p class="small">Jusqu'à ${plural(D.pallet, "stère")} par palette${D.freeFromPallets ? ` · <strong>offerte dès ${plural(D.freeFromPallets, "palette")}</strong>` : ""}</p>
      <p class="small muted">Hors Corse et outre-mer</p>
    </article>
    <article class="zone-card">
      <h3>Délai</h3>
      <p class="zone-card__price">${D.minDays} à ${D.maxDays}<small> jours</small></p>
      <p class="small">Après réception du paiement</p>
      <p class="small muted">Rendez-vous fixé par le transporteur</p>
    </article>
    <article class="zone-card zone-card--far">
      <h3>Accessoires</h3>
      <p class="zone-card__price">Inclus<small> sur la palette</small></p>
      <p class="small">Livrés avec votre bois</p>
      <p class="small muted">Non vendus seuls</p>
    </article>`;

  // Simulateur de palettes
  function sim() {
    const st = +$("#palRange").value;
    const n = palletCount(st);
    $("#palOut").textContent = plural(st, "stère");
    $("#palRow").innerHTML = Array.from({ length: n }, (_, i) => {
      const fill = Math.min(1, (st - i * D.pallet) / D.pallet);
      return `<span class="pal"><i style="height:${fill * 100}%"></i></span>`;
    }).join("");
    const free = isFreeDelivery(n);
    const left = D.freeFromPallets * D.pallet - st;
    $("#palText").innerHTML = free
      ? `<strong>${plural(n, "palette")}</strong> · <strong>livraison offerte</strong>.`
      : `<strong>${plural(n, "palette")}</strong> · livraison ${euro(n * D.feePerPallet)}, soit ${euro((n * D.feePerPallet) / st)} par stère.${D.freeFromPallets && left > 0 ? ` Encore ${plural(left, "stère")} et elle est offerte.` : ""}`;
  }
  $("#palRange").addEventListener("input", sim);
  sim();
  show();
})();
