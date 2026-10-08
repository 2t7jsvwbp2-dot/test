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
| `livraison.html` | Livraison sur palette : tarif, délai, test par code postal, simulateur du nombre de palettes |
| `panier.html`, `commande.html` | Panier avec code promo et livraison calculée au nombre de palettes ; coordonnées et paiement. Une commande doit contenir du bois : les accessoires seuls sont refusés |
| `confirmation.html`, `mes-commandes.html` | Paiement par carte (lien de paiement) proposé en premier, virement instantané en alternative ; historique des commandes |
| `faq.html` (avec recherche), `contact.html`, `a-propos.html` | Aide |
| `cgv.html`, `mentions-legales.html`, `confidentialite.html` | Pages légales, remplies depuis la configuration |

Les illustrations (tas de bûches, sacs, palettes) sont dessinées en SVG par `js/common.js` : leur couleur suit l'essence choisie.

## Avant la mise en ligne : `js/config.js`

Tout se règle dans **`js/config.js`**. Tant qu'un champ est vide, le site affiche « [à compléter] ».

1. **Identité légale** : `legalName`, `legalForm`, `siret`, `vatNumber`, `director`, `address`, `email`, `phone`.
2. **Paiement par carte** : collez dans `payment.card.link` le lien de votre page de paiement (Stripe, SumUp, PayPal, Revolut Business, votre banque…). C'est le moyen proposé en premier.
3. **Virement instantané** : `payment.transfer.holder`, `iban`, `bic`, `bank`. Proposé en alternative.
4. **Livraison** (`delivery`) : uniquement sur palette, par transporteur. Réglez le prix par palette (`feePerPallet`), le volume maximum par palette (`pallet`, en stères), le délai annoncé (`minDays`, `maxDays`) et les départements non livrés (`excluded`).
5. **Montant minimum** (`minOrderAmount`) : facultatif. Les accessoires (marqués `addon: true` dans `js/data.js`) ne sont jamais vendus seuls ; vous pouvez en plus exiger un montant minimum de bois.
6. **Réception des commandes** : créez un formulaire gratuit sur [formspree.io](https://formspree.io) et collez son adresse dans `formEndpoint`. Sans cela, le client doit vous envoyer lui-même le récapitulatif par e-mail.
7. **Stock de la saison** (`season`), **codes promo** (`promoCodes`), **TVA** (`vatRate`, 10 % pour le bois de chauffage vendu aux particuliers).

Complétez aussi le médiateur de la consommation dans `mentions-legales.html` et faites relire `cgv.html`.

## Prix et produits : `js/data.js`

- `ESSENCES` : pouvoir calorifique, masse, notes (flamme, braises, allumage) et couleurs des illustrations.
- `LENGTHS` : supplément de coupe par stère et facteur de conversion en m³ apparent.
- `DRYINGS` : supplément pour le séchage au four.
- `PRODUCTS` : les bûches au stère (prix de base pour du 1 m séché à l'air) et les produits à prix fixe (palettes, sacs, densifié, granulés, accessoires).
- `ENERGIES` : prix du kWh utile des autres énergies, pour le comparateur. À mettre à jour chaque saison.
- `PHOTOS` : vos photos de produits. Déposez-les dans `images/produits/` (JPEG ou WebP, 1200 × 900 px) et indiquez-les ici par identifiant de produit ; elles remplacent alors les illustrations dessinées.

## Comment se passe une commande

1. Le client compose son panier (du bois obligatoirement, accessoires en complément) et saisit son adresse.
2. La commande vous est envoyée par e-mail (via Formspree).
3. Le client paie par carte via votre lien de paiement, ou par virement instantané, avec le numéro de commande en référence.
4. Dès réception du paiement, vous préparez la ou les palettes ; le transporteur livre sous 7 à 12 jours.

## Tester en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Publier sur GitHub Pages

Dans le dépôt GitHub : **Settings → Pages → Deploy from a branch**, choisissez la branche et le dossier `/ (root)`.
