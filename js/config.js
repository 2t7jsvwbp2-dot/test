// =====================================================================
//  CONFIGURATION DE LA BOUTIQUE — à compléter avant la mise en ligne
// =====================================================================
// Tout champ laissé vide ("") s'affiche sur le site comme « [à compléter] ».
// Les informations légales sont obligatoires pour vendre en ligne en France.

const SHOP = {
  name: "Bois & Braise",
  tagline: "Bois de chauffage sec, livré chez vous",

  // --- Identité légale (mentions légales, CGV, factures) ---
  legalName: "",        // Nom et prénom de l'exploitant ou raison sociale
  legalForm: "",        // ex. « Entrepreneur individuel » ou « SARL au capital de 5 000 € »
  siret: "",            // 14 chiffres
  vatNumber: "",        // N° TVA intracommunautaire, ou « TVA non applicable, art. 293 B du CGI »
  director: "",         // Directeur de la publication
  address: "",          // Adresse du dépôt (sert aussi pour le retrait sur place)
  email: "",            // Adresse e-mail de contact
  phone: "",            // Numéro de téléphone
  hours: "Du lundi au samedi, 8h – 18h",
  depotLabel: "notre dépôt", // ex. « notre dépôt de Gien (45) »

  // Hébergeur du site (obligatoire dans les mentions légales)
  host: "GitHub Inc. — 88 Colin P. Kelly Jr Street, San Francisco, CA 94107, États-Unis",

  // Taux de TVA appliqué au bois de chauffage vendu aux particuliers (taux réduit)
  vatRate: 10,

  // Stock de la saison, affiché sur l'accueil (en stères)
  season: { label: "Saison 2026 – 2027", total: 1200, sold: 742 },

  // --- Paiement ---
  payment: {
    revolut: {
      enabled: true,
      link: "",          // ex. "https://revolut.me/votre-pseudo"
      tag: "",           // ex. "@votre-pseudo"
    },
    transfer: {
      enabled: true,
      holder: "",        // Titulaire du compte
      iban: "",          // ex. "FR76 1234 5678 9012 3456 7890 123"
      bic: "",
      bank: "",
    },
    // Paiement au chauffeur (chèque ou espèces) — uniquement en livraison par nos camions ou au retrait
    onDelivery: { enabled: true },
    // Délai avant annulation d'une commande payable à l'avance et non payée
    deadlineDays: 7,
  },

  // --- Livraison ---
  // Les zones sont définies par département (2 premiers chiffres du code postal).
  // Adaptez-les à la position de votre dépôt. Les jours de tournée vont de 1 (lundi) à 6 (samedi).
  delivery: {
    zones: [
      { id: "z1", name: "Zone 1 · moins de 30 km", depts: ["45"], fee: 25, freeFromSteres: 3, days: [2, 4, 6], leadDays: 2 },
      { id: "z2", name: "Zone 2 · 30 à 70 km", depts: ["41", "18", "28", "89", "77", "91"], fee: 45, freeFromSteres: 6, days: [3, 5], leadDays: 3 },
      { id: "z3", name: "Zone 3 · 70 à 130 km", depts: ["36", "37", "58", "10", "78", "92", "93", "94", "95", "75", "51", "72"], fee: 75, freeFromSteres: 10, days: [5], leadDays: 5 },
    ],
    // Hors zone (France métropolitaine) : palettes par transporteur, prix par palette (2 stères max chacune)
    carrier: { name: "Transporteur sur palette", feePerPallet: 89, pallet: 2, leadDays: 7 },
    // Petits colis seuls (allume-feu, accessoires)
    parcel: { name: "Colissimo", fee: 6.9, freeFrom: 49, leadDays: 3 },
    // Retrait au dépôt
    pickup: { name: "Retrait au dépôt", days: [1, 2, 3, 4, 5, 6], leadDays: 1, discountPercent: 5 },
    // Départements non livrés (Corse, outre-mer)
    excluded: ["20", "97", "98"],
    // Volume minimum pour une livraison en camion (en stères)
    minSteres: 1,
  },

  // --- Réception des commandes et messages ---
  // Créez un formulaire gratuit sur https://formspree.io et collez son adresse ci-dessous
  // (ex. "https://formspree.io/f/abcdwxyz"). Chaque commande vous sera envoyée par e-mail.
  // Si ce champ est vide, le client envoie lui-même le récapitulatif par e-mail.
  formEndpoint: "",

  // --- Codes promo ---
  promoCodes: {
    BIENVENUE: { percent: 5, label: "5 % de remise sur votre première commande" },
    PRINTEMPS: { percent: 10, label: "10 % de remise : stockez au printemps, brûlez cet hiver" },
  },
};
