// Catalogue de démonstration de Bavaria Parts.
// Chaque produit liste les châssis compatibles (codes de modèles).

const MODELS = [
  { code: "E87", name: "Série 1 (E87)" },
  { code: "F20", name: "Série 1 (F20)" },
  { code: "E90", name: "Série 3 (E90)" },
  { code: "F30", name: "Série 3 (F30)" },
  { code: "G20", name: "Série 3 (G20)" },
  { code: "F10", name: "Série 5 (F10)" },
  { code: "G30", name: "Série 5 (G30)" },
  { code: "F48", name: "X1 (F48)" },
  { code: "F25", name: "X3 (F25)" },
  { code: "G01", name: "X3 (G01)" },
  { code: "F15", name: "X5 (F15)" },
  { code: "G05", name: "X5 (G05)" },
];

const CATEGORIES = [
  { id: "freinage", name: "Freinage", icon: "brake" },
  { id: "moteur", name: "Moteur & filtration", icon: "engine" },
  { id: "suspension", name: "Suspension & direction", icon: "spring" },
  { id: "eclairage", name: "Éclairage", icon: "light" },
  { id: "carrosserie", name: "Carrosserie", icon: "body" },
  { id: "entretien", name: "Entretien & fluides", icon: "oil" },
];

const PRODUCTS = [
  { id: 1, ref: "BP-34116860912", name: "Kit disques + plaquettes avant", brand: "Brembo", category: "freinage", price: 189.9, oldPrice: 229.9, stock: 14, popular: 98, models: ["F30", "F20", "G20"], desc: "Kit complet comprenant 2 disques ventilés percés 312 mm et un jeu de plaquettes à faible émission de poussière. Livré avec capteur d'usure." },
  { id: 2, ref: "BP-34216792227", name: "Plaquettes de frein arrière", brand: "Textar", category: "freinage", price: 49.9, stock: 32, popular: 90, models: ["E90", "E87", "F30", "F20"], desc: "Jeu de 4 plaquettes arrière, qualité première monte, homologuées ECE R90." },
  { id: 3, ref: "BP-34356792289", name: "Capteur d'usure de plaquettes", brand: "Bosch", category: "freinage", price: 14.5, stock: 60, popular: 72, models: ["E90", "F30", "F10", "F25", "G20", "G30"], desc: "Capteur électronique d'usure, avant ou arrière. Indispensable lors du remplacement des plaquettes." },
  { id: 4, ref: "BP-34116797602", name: "Étrier de frein avant gauche", brand: "ATE", category: "freinage", price: 164.0, stock: 4, popular: 40, models: ["F10", "F15"], desc: "Étrier reconditionné à neuf, pistons et joints neufs. Consigne incluse." },

  { id: 5, ref: "BP-11427953129", name: "Filtre à huile", brand: "Mahle", category: "moteur", price: 12.9, stock: 120, popular: 99, models: ["E90", "F30", "F10", "F20", "E87", "F25"], desc: "Cartouche filtrante avec joints, pour moteurs N47 / B47 diesel." },
  { id: 6, ref: "BP-13717532754", name: "Filtre à air moteur", brand: "Mann-Filter", category: "moteur", price: 24.9, stock: 45, popular: 85, models: ["F30", "F20", "F10", "F48"], desc: "Filtre à air haute capacité, efficacité de filtration 99,5 %." },
  { id: 7, ref: "BP-12120037244", name: "Jeu de 4 bougies d'allumage", brand: "NGK", category: "moteur", price: 59.9, stock: 28, popular: 76, models: ["F30", "F20", "G20", "F48", "G01"], desc: "Bougies iridium longue durée pour moteurs essence B48 / N20." },
  { id: 8, ref: "BP-11517586925", name: "Pompe à eau électrique", brand: "Pierburg", category: "moteur", price: 319.0, oldPrice: 369.0, stock: 6, popular: 64, models: ["E90", "F10", "F25", "F30"], desc: "Pompe à eau électrique avec thermostat, pour moteurs N52 / N55. Pièce d'usure fréquente." },
  { id: 9, ref: "BP-11288653233", name: "Courroie d'accessoires", brand: "Contitech", category: "moteur", price: 34.9, stock: 22, popular: 58, models: ["E90", "E87", "F10"], desc: "Courroie trapézoïdale à nervures 6PK, longueur adaptée au moteur N47." },

  { id: 10, ref: "BP-31316786995", name: "Amortisseur avant (x2)", brand: "Bilstein", category: "suspension", price: 279.0, stock: 8, popular: 70, models: ["F30", "F20"], desc: "Paire d'amortisseurs B4 à gaz, confort d'origine, montage sans modification." },
  { id: 11, ref: "BP-31126855741", name: "Bras de suspension avant", brand: "Lemförder", category: "suspension", price: 89.9, stock: 18, popular: 66, models: ["E90", "E87", "F30"], desc: "Bras triangulaire inférieur avec rotule et silentbloc montés." },
  { id: 12, ref: "BP-32106793299", name: "Rotule de direction", brand: "Lemförder", category: "suspension", price: 39.9, stock: 25, popular: 52, models: ["F30", "F20", "F10", "G20"], desc: "Embout de biellette de direction, gauche ou droite." },
  { id: 13, ref: "BP-33526785968", name: "Ressorts de suspension arrière", brand: "Eibach", category: "suspension", price: 149.0, stock: 10, popular: 44, models: ["G01", "F25", "F15", "G05"], desc: "Paire de ressorts hélicoïdaux, hauteur d'origine, traitement anticorrosion." },

  { id: 14, ref: "BP-63117338709", name: "Phare LED avant droit", brand: "Hella", category: "eclairage", price: 649.0, oldPrice: 749.0, stock: 3, popular: 48, models: ["F30"], desc: "Projecteur full LED adaptatif avec feux de jour intégrés. Module de commande inclus." },
  { id: 15, ref: "BP-63217367481", name: "Feu arrière gauche", brand: "Valeo", category: "eclairage", price: 179.0, stock: 7, popular: 41, models: ["F20", "F30"], desc: "Bloc optique arrière LED, partie aile, homologué E." },
  { id: 16, ref: "BP-63217160907", name: "Ampoule D1S xénon", brand: "Osram", category: "eclairage", price: 69.9, stock: 30, popular: 62, models: ["E90", "E87", "F10", "F25", "F15"], desc: "Ampoule xénon D1S 4300 K, durée de vie 3 000 h." },

  { id: 17, ref: "BP-51137294517", name: "Calandre noir brillant (paire)", brand: "Bavaria Parts", category: "carrosserie", price: 59.0, stock: 40, popular: 88, models: ["F30", "F20"], desc: "Paire de calandres double barre noir brillant, clipsage direct sans perçage." },
  { id: 18, ref: "BP-51167345413", name: "Coque de rétroviseur carbone", brand: "Bavaria Parts", category: "carrosserie", price: 119.0, stock: 12, popular: 55, models: ["F30", "F20", "F10"], desc: "Paire de coques en fibre de carbone véritable, finition vernis UV." },
  { id: 19, ref: "BP-51117293026", name: "Bouclier avant (à peindre)", brand: "Van Wezel", category: "carrosserie", price: 289.0, stock: 2, popular: 30, models: ["G20"], desc: "Pare-chocs avant apprêté, avec emplacements capteurs de stationnement." },

  { id: 20, ref: "BP-83212365946", name: "Huile moteur 5W30 LL-04 (5 L)", brand: "Castrol", category: "entretien", price: 54.9, stock: 80, popular: 97, models: ["E90", "F30", "F10", "F20", "E87", "F25", "G20", "G30", "F48", "G01", "F15", "G05"], desc: "Huile synthétique homologuée Longlife-04, compatible filtres à particules." },
  { id: 21, ref: "BP-83192211191", name: "Liquide de refroidissement (1,5 L)", brand: "Bavaria Parts", category: "entretien", price: 19.9, stock: 55, popular: 60, models: ["E90", "F30", "F10", "F20", "E87", "F25", "G20", "G30", "F48", "G01", "F15", "G05"], desc: "Antigel concentré bleu, protection jusqu'à -37 °C une fois dilué." },
  { id: 22, ref: "BP-64119237555", name: "Filtre d'habitacle à charbon", brand: "Mann-Filter", category: "entretien", price: 29.9, stock: 38, popular: 80, models: ["F30", "F20", "F10", "G20", "G30"], desc: "Filtre à charbon actif, retient pollens, odeurs et particules fines." },
  { id: 23, ref: "BP-61610042657", name: "Balais d'essuie-glace (paire)", brand: "Bosch", category: "entretien", price: 34.9, stock: 50, popular: 74, models: ["F30", "F20", "F48", "G01", "G20"], desc: "Balais plats Aerotwin, silencieux et sans traces." },
  { id: 24, ref: "BP-61217555719", name: "Batterie AGM 90 Ah", brand: "Varta", category: "entretien", price: 229.0, stock: 9, popular: 68, models: ["F10", "F25", "F15", "G30", "G01", "G05"], desc: "Batterie AGM Start-Stop 90 Ah / 900 A. Codage de la batterie recommandé après montage." },
];
