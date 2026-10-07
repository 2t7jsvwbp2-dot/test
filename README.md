# Bois & Braise

Boutique en ligne de bois de chauffage pour la France. Site statique (HTML, CSS, JavaScript), sans serveur ni base de données : il s'héberge gratuitement sur GitHub Pages, Netlify ou Cloudflare Pages.

## Ce que contient le site

| Page | Rôle |
|---|---|
| `index.html` | Accueil : commande express (essence, longueur, séchage, quantité, prix en direct), test de livraison par code postal, stock de la saison, mini-calculateur, sélecteur d'essence |
| `catalogue.html` | Boutique avec catégories, recherche, filtres (essence, longueur, séchage, prix) et tri, y compris « énergie par euro » |
| `produit.html?id=…` | Configurateur : essence, longueur, séchage, nombre de stères ; prix au stère et au m³ apparent, poids, énergie, visualisation du volume et de la place à prévoir, prix de livraison pour votre code postal |
| `calculateur.html` | Besoin annuel en stères (surface, isolation, climat déduit du code postal, appareil, usage), comparaison du coût avec l'électricité, le fioul, le gaz et les granulés, effet de l'humidité, convertisseur stère ↔ m³ apparent |
| `essences.html` | Questionnaire « quelle essence pour moi ? », tableau comparatif triable, fiches essences |
| `livraison.html` | Zones et tarifs, test par code postal, calendrier des prochaines tournées, conditions d'accès |
| `panier.html`, `commande.html` | Panier avec code promo et livraison calculée selon le code postal et le volume ; choix du mode, de la date et du créneau de livraison ; paiement |
| `confirmation.html`, `mes-commandes.html` | Instructions de paiement (Revolut, virement ou à la livraison) et historique |
| `faq.html` (avec recherche), `contact.html`, `a-propos.html` | Aide |
| `cgv.html`, `mentions-legales.html`, `confidentialite.html` | Pages légales, remplies depuis la configuration |

Les illustrations (tas de bûches, sacs, palettes) sont dessinées en SVG par `js/common.js` : leur couleur suit l'essence choisie.

## Avant la mise en ligne : `js/config.js`

Tout se règle dans **`js/config.js`**. Tant qu'un champ est vide, le site affiche « [à compléter] ».

1. **Identité légale** : `legalName`, `legalForm`, `siret`, `vatNumber`, `director`, `address`, `email`, `phone`, `depotLabel`.
2. **Zones de livraison** : `delivery.zones` liste, pour chaque zone, les départements desservis, le prix, le volume à partir duquel la livraison est offerte, les jours de tournée (1 = lundi … 6 = samedi) et le délai minimum. Adaptez-les à l'emplacement de votre dépôt. Hors zone, le site propose le transporteur sur palette (`delivery.carrier`) ; les petits colis seuls partent en Colissimo (`delivery.parcel`).
3. **Paiement** : lien et pseudo Revolut (`payment.revolut`), coordonnées bancaires (`payment.transfer`), paiement au chauffeur (`payment.onDelivery`).
4. **Réception des commandes** : créez un formulaire gratuit sur [formspree.io](https://formspree.io) et collez son adresse dans `formEndpoint`. Sans cela, le client doit vous envoyer lui-même le récapitulatif par e-mail.
5. **Stock de la saison** (`season`), **codes promo** (`promoCodes`), **TVA** (`vatRate`, 10 % pour le bois de chauffage vendu aux particuliers).

Complétez aussi le médiateur de la consommation dans `mentions-legales.html` et faites relire `cgv.html`.

## Prix et produits : `js/data.js`

- `ESSENCES` : pouvoir calorifique, masse, notes (flamme, braises, allumage) et couleurs des illustrations.
- `LENGTHS` : supplément de coupe par stère et facteur de conversion en m³ apparent.
- `DRYINGS` : supplément pour le séchage au four.
- `PRODUCTS` : les bûches au stère (prix de base pour du 1 m séché à l'air) et les produits à prix fixe (palettes, sacs, densifié, granulés, accessoires).
- `ENERGIES` : prix du kWh utile des autres énergies, pour le comparateur. À mettre à jour chaque saison.

## Comment se passe une commande

1. Le client compose son panier, saisit son code postal et choisit une date de tournée.
2. La commande vous est envoyée par e-mail (via Formspree), avec l'adresse, le lieu de déchargement et l'accès camion.
3. Le client paie par Revolut ou virement avec le numéro de commande en référence, ou au chauffeur.
4. Vous livrez à la date choisie.

## Tester en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Publier sur GitHub Pages

Dans le dépôt GitHub : **Settings → Pages → Deploy from a branch**, choisissez la branche et le dossier `/ (root)`.
