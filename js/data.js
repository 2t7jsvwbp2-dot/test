// =====================================================================
//  CATALOGUE — essences, longueurs, produits
// =====================================================================
// Prix TTC. Les bûches en vrac sont vendues au stère : leur prix est celui
// d'un stère de bûches de 1 m séchées à l'air, auquel s'ajoutent les
// suppléments de coupe et de séchage ci-dessous.

// kwh : énergie d'un stère à 20 % d'humidité · kg : masse d'un stère
// flame / embers / lighting : notes de 1 à 5
const ESSENCES = [
  { id: "chene", name: "Chêne", kwh: 2100, kg: 500, flame: 3, embers: 5, lighting: 2, color: "#8a5a2b", ring: "#c89a62", bark: "#3d2a1a",
    text: "La référence pour le chauffage principal : combustion lente, braises durables, idéal pour les nuits d'hiver. Doit être bien sec pour donner le meilleur." },
  { id: "hetre", name: "Hêtre", kwh: 1950, kg: 470, flame: 5, embers: 3, lighting: 4, color: "#b77c4a", ring: "#e2b685", bark: "#6f6a64",
    text: "Belle flamme vive et régulière, s'allume facilement. Parfait en cheminée ou en insert pour profiter du spectacle du feu." },
  { id: "charme", name: "Charme", kwh: 2050, kg: 520, flame: 4, embers: 5, lighting: 3, color: "#a07045", ring: "#dcb98c", bark: "#7b7a74",
    text: "Le plus calorifique des feuillus courants : très dense, chaleur intense et braises de longue durée. Le choix des connaisseurs." },
  { id: "frene", name: "Frêne", kwh: 1900, kg: 460, flame: 4, embers: 3, lighting: 4, color: "#c49564", ring: "#ecd0a6", bark: "#77705f",
    text: "Sèche vite et brûle proprement, avec peu de fumée. Un bon compromis entre facilité d'allumage et durée de combustion." },
  { id: "melange", name: "Mélange feuillus durs", kwh: 1950, kg: 480, flame: 4, embers: 4, lighting: 3, color: "#9c6b40", ring: "#d8ae7c", bark: "#5c4a3a",
    text: "Chêne, hêtre et charme en proportions variables selon les coupes. Le meilleur rapport qualité-prix pour un chauffage principal." },
  { id: "bouleau", name: "Bouleau", kwh: 1700, kg: 400, flame: 5, embers: 2, lighting: 5, color: "#d8b98c", ring: "#f3e3c6", bark: "#ece7dc",
    text: "S'enflamme en un instant avec une flamme claire et décorative. Idéal pour l'appoint, les flambées de soirée et la relance du feu." },
];

// Facteur de conversion : 1 stère (bûches de 1 m) recoupé donne ce volume apparent en m³
const LENGTHS = [
  { cm: 100, label: "1 m", factor: 1, surcharge: 0, use: "Grandes cheminées, chaudières à bûches" },
  { cm: 50, label: "50 cm", factor: 0.8, surcharge: 8, use: "Cheminées, inserts larges, chaudières" },
  { cm: 33, label: "33 cm", factor: 0.7, surcharge: 14, use: "Poêles et inserts : la taille la plus courante" },
  { cm: 25, label: "25 cm", factor: 0.6, surcharge: 20, use: "Petits poêles, cuisinières à bois" },
];

const DRYINGS = [
  { id: "air", name: "Séché à l'air", short: "Sec air", humidity: "< 20 %", surcharge: 0,
    text: "Fendu puis stocké 18 à 24 mois sous abri ventilé. Prêt à brûler." },
  { id: "four", name: "Séché au four", short: "Sec four", humidity: "< 15 %", surcharge: 22,
    text: "Passage en séchoir après le séchage naturel : allumage immédiat, rendement maximal, zéro insecte." },
];

const CATEGORIES = [
  { id: "buches", name: "Bûches au stère", text: "Livrées en vrac, la coupe et le séchage de votre choix" },
  { id: "palettes", name: "Palettes filmées", text: "Rangées, propres, faciles à stocker" },
  { id: "petits-formats", name: "Sacs et allumage", text: "Pour l'appartement ou la flambée du week-end" },
  { id: "densifie", name: "Bûches densifiées", text: "Sciure compressée sans additif, très peu d'humidité" },
  { id: "granules", name: "Granulés", text: "Pour poêles et chaudières à pellets" },
  { id: "accessoires", name: "Accessoires", text: "Allume-feu, humidimètre, rangement" },
];

// type "config" : bûches configurables vendues au stère
// ship "truck" : livré par camion / palette · "parcel" : envoyé en colis
// st : volume en stère-équivalent d'une unité (sert au calcul de la livraison)
const PRODUCTS = [
  ...ESSENCES.map((e, i) => ({
    id: e.id,
    type: "config",
    category: "buches",
    essence: e.id,
    name: e.id === "melange" ? "Bûches mélange chêne, hêtre, charme" : `Bûches de ${e.name.toLowerCase()}`,
    base: [89, 92, 95, 85, 79, 84][i],
    unit: "stère",
    ship: "truck",
    st: 1,
    popular: [96, 88, 74, 61, 99, 52][i],
    lengths: [100, 50, 33, 25],
    dryings: ["air", "four"],
  })),
  { id: "palette-33", type: "fixed", category: "palettes", essence: "melange", name: "Palette 1,8 stère · 33 cm séché four",
    price: 249, unit: "palette", ship: "truck", st: 1.8, len: 33, dry: "four", popular: 90,
    text: "Chêne, hêtre et charme rangés sur palette filmée, soit environ 1,26 m³ apparent. Propre, stable, se stocke dans un garage." },
  { id: "palette-25", type: "fixed", category: "palettes", essence: "hetre", name: "Palette 1,8 stère · 25 cm hêtre séché four",
    price: 265, unit: "palette", ship: "truck", st: 1.8, len: 25, dry: "four", popular: 70,
    text: "Hêtre pur coupé en 25 cm, environ 1,08 m³ apparent. Le format idéal pour les petits poêles et les cuisinières." },
  { id: "sac-buchettes", type: "fixed", category: "petits-formats", essence: "hetre", name: "Sac de bûches 40 L · 25 cm séché four",
    price: 9.9, unit: "sac", ship: "truck", st: 0.07, len: 25, dry: "four", popular: 66, max: 60,
    text: "Environ 15 kg de hêtre séché au four, prêt à brûler. Pratique pour l'appartement ou une flambée occasionnelle." },
  { id: "allumage", type: "fixed", category: "petits-formats", essence: "bouleau", name: "Bois d'allumage · sac 25 L",
    price: 7.5, unit: "sac", ship: "parcel", st: 0, popular: 80, max: 40,
    text: "Petit bois de résineux séché au four, fendu fin. Un sac suffit pour une vingtaine d'allumages." },
  { id: "densifie-pack", type: "fixed", category: "densifie", kind: "densifie", name: "Bûches densifiées · pack de 10 kg",
    price: 6.9, unit: "pack", ship: "truck", st: 0.025, popular: 58, max: 96,
    text: "6 bûches de sciure de feuillus compressée, sans colle ni additif. Moins de 10 % d'humidité, 4,9 kWh/kg." },
  { id: "densifie-palette", type: "fixed", category: "densifie", kind: "densifie", name: "Bûches densifiées · palette de 960 kg",
    price: 549, unit: "palette", ship: "truck", st: 2, popular: 47, max: 10,
    text: "96 packs de 10 kg. Une tonne de densifié remplace environ 2,5 stères de bûches classiques et occupe trois fois moins de place." },
  { id: "granules-sac", type: "fixed", category: "granules", kind: "granules", name: "Granulés de bois · sac de 15 kg",
    price: 6.5, unit: "sac", ship: "truck", st: 0.03, popular: 55, max: 66,
    text: "Granulés de résineux certifiés DIN plus / ENplus A1, diamètre 6 mm. Taux de cendres inférieur à 0,7 %." },
  { id: "granules-palette", type: "fixed", category: "granules", kind: "granules", name: "Granulés de bois · palette de 66 sacs",
    price: 399, unit: "palette", ship: "truck", st: 2, popular: 63, max: 10,
    text: "990 kg de granulés DIN plus / ENplus A1 sur palette houssée, soit environ 4 800 kWh." },
  { id: "allume-feu", type: "fixed", category: "accessoires", kind: "accessoire", name: "Allume-feu naturels · boîte de 100",
    price: 9.9, unit: "boîte", ship: "parcel", st: 0, popular: 77, max: 20,
    text: "Laine de bois enrobée de cire végétale. Sans odeur, sans pétrole, brûle 8 à 10 minutes." },
  { id: "humidimetre", type: "fixed", category: "accessoires", kind: "accessoire", name: "Humidimètre pour bois de chauffage",
    price: 24.9, unit: "pièce", ship: "parcel", st: 0, popular: 50, max: 10,
    text: "Mesure l'humidité du bois en 2 secondes, de 5 à 50 %. Fendez une bûche et mesurez au cœur : en dessous de 20 %, elle est prête." },
  { id: "bache", type: "fixed", category: "accessoires", kind: "accessoire", name: "Bâche de protection 3 × 4 m",
    price: 29.9, unit: "pièce", ship: "parcel", st: 0, popular: 41, max: 10,
    text: "Bâche armée 180 g/m² avec œillets. Couvrez le dessus du tas, laissez les côtés respirer." },
  { id: "range-buches", type: "fixed", category: "accessoires", kind: "accessoire", name: "Range-bûches acier · 1 stère",
    price: 89, unit: "pièce", ship: "parcel", st: 0, popular: 38, max: 5,
    text: "Structure acier galvanisé de 120 × 100 × 40 cm. Garde le bois hors sol et bien ventilé." },
];

// Énergies de comparaison pour le calculateur : prix par kWh utile (rendement inclus)
// Ordres de grandeur pour un particulier en France, à mettre à jour chaque saison.
const ENERGIES = [
  { id: "electricite", name: "Électricité (radiateurs)", eurPerKwh: 0.25 },
  { id: "fioul", name: "Fioul domestique", eurPerKwh: 0.14 },
  { id: "gaz", name: "Gaz naturel", eurPerKwh: 0.13 },
  { id: "granules", name: "Granulés de bois", eurPerKwh: 0.095 },
];
