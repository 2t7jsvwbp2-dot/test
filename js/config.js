// =====================================================================
//  CONFIGURATION DE LA BOUTIQUE — à compléter avant la mise en ligne
// =====================================================================
// Tout champ laissé vide ("") s'affiche sur le site comme « [à compléter] ».
// Les informations légales sont obligatoires pour vendre en ligne en France.

const SHOP = {
  name: "Le Stère d’Or",
  tagline: "Bois de chauffage sec, livré chez vous",

  // --- Identité légale (mentions légales, CGV, factures) ---
  legalName: "",        // Nom et prénom de l'exploitant ou raison sociale
  email: "",            // Adresse e-mail de contact
  phone: "",            // Numéro de téléphone
  hours: "Du lundi au samedi, 8h – 18h",

  // Hébergeur du site (obligatoire dans les mentions légales)
  host: "GitHub Inc. — 88 Colin P. Kelly Jr Street, San Francisco, CA 94107, États-Unis",

  // Taux de TVA appliqué au bois de chauffage vendu aux particuliers (taux réduit)
  vatRate: 10,

  // Montant minimum de bois par commande (hors accessoires et livraison), en euros TTC.
  // 0 = pas de minimum : il suffit qu'il y ait du bois dans le panier.
  minOrderAmount: 0,

  // Photo de fond de l'accueil (facultatif), ex. "images/accueil.jpg" — 1920 × 1080 px conseillé
  heroPhoto: "images/accueil.webp",

  // Stock de la saison, affiché sur l'accueil (en stères)
  season: { label: "Saison 2026 – 2027", total: 1200, sold: 742 },

  // --- Paiement ---
  // 1. Carte bancaire : proposée en premier. Collez ici le lien de votre page de paiement
  //    (Stripe, SumUp, PayPal, Revolut Business, lien de votre banque…).
  //    Le client y saisit le montant et la référence de commande indiqués à l'écran.
  // 2. Virement instantané : proposé ensuite, comme alternative.
  payment: {
    card: {
      enabled: true,
      link: "",          // ex. "https://buy.stripe.com/xxxx" ou "https://pay.sumup.com/b2c/xxxx"
    },
    transfer: {
      enabled: true,
      holder: "",        // Titulaire du compte
      iban: "",          // ex. "FR76 1234 5678 9012 3456 7890 123"
      bic: "",
      bank: "",
    },
    // Délai avant annulation d'une commande non payée
    deadlineDays: 3,
  },

  // --- Livraison : uniquement sur palette, par transporteur ---
  delivery: {
    name: "Livraison sur palette",
    feePerPallet: 49,      // prix TTC par palette
    freeFromPallets: 3,    // livraison offerte à partir de ce nombre de palettes (0 = jamais)
    pallet: 2,             // nombre de stères (équivalent) maximum par palette
    minDays: 7,            // délai de livraison annoncé : de 7…
    maxDays: 12,           // … à 12 jours après le paiement
    // Départements non livrés (Corse, outre-mer)
    excluded: ["20", "97", "98"],
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
