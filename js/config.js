// =====================================================================
//  CONFIGURATION DE LA BOUTIQUE — à compléter avant la mise en ligne
// =====================================================================
// Tout champ laissé vide ("") s'affiche sur le site comme « [à compléter] ».
// Les informations légales sont obligatoires pour vendre en ligne en France.

const SHOP = {
  name: "Bavaria Parts",
  tagline: "Pièces détachées pour BMW",

  // --- Identité légale (mentions légales, CGV, factures) ---
  legalName: "",        // Nom et prénom de l'entrepreneur ou raison sociale
  legalForm: "",        // ex. « Entrepreneur individuel (micro-entreprise) » ou « SAS au capital de 1 000 € »
  siret: "",            // 14 chiffres
  vatNumber: "",        // N° TVA intracommunautaire, ou « TVA non applicable, art. 293 B du CGI »
  director: "",         // Directeur de la publication
  address: "",          // Adresse du siège / de l'entrepôt
  email: "",            // Adresse e-mail de contact
  phone: "",            // Numéro de téléphone
  hours: "Du lundi au vendredi, 9h – 18h",

  // Hébergeur du site (obligatoire dans les mentions légales)
  host: "GitHub Inc. — 88 Colin P. Kelly Jr Street, San Francisco, CA 94107, États-Unis",

  // --- Paiement ---
  payment: {
    revolut: {
      enabled: true,
      link: "",          // ex. "https://revolut.me/votre-pseudo" ou un lien de paiement Revolut Business
      tag: "",           // ex. "@votre-pseudo" (affiché au client)
    },
    transfer: {
      enabled: true,
      holder: "",        // Titulaire du compte
      iban: "",          // ex. "FR76 1234 5678 9012 3456 7890 123"
      bic: "",
      bank: "",          // Nom de la banque
    },
    // Nombre de jours avant annulation d'une commande non payée
    deadlineDays: 7,
  },

  // --- Livraison ---
  shipping: {
    freeFrom: 99,
    methods: [
      { id: "colissimo", name: "Colissimo suivi", delay: "2 à 3 jours ouvrés", price: 6.9, free: true },
      { id: "chronopost", name: "Chronopost express", delay: "24h ouvrées", price: 14.9, free: false },
      { id: "retrait", name: "Retrait à l'entrepôt", delay: "Sous 24h après paiement", price: 0, free: true },
    ],
  },

  // --- Réception des commandes et messages ---
  // Un site statique ne peut pas envoyer d'e-mail tout seul. Créez un formulaire
  // gratuit sur https://formspree.io et collez son adresse ci-dessous
  // (ex. "https://formspree.io/f/abcdwxyz"). Chaque commande et chaque message
  // de contact vous sera alors envoyé par e-mail automatiquement.
  // Si ce champ est vide, le client envoie lui-même le récapitulatif par e-mail.
  formEndpoint: "",

  // --- Codes promo ---
  promoCodes: {
    BIENVENUE10: { percent: 10, label: "10 % de remise sur votre première commande" },
  },
};
