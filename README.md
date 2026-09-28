# Bavaria Parts

Boutique en ligne de pièces détachées pour BMW. Site statique (HTML, CSS, JavaScript), sans serveur ni base de données : il s'héberge gratuitement sur GitHub Pages, Netlify ou Cloudflare Pages.

## Ce que contient le site

| Page | Rôle |
|---|---|
| `index.html` | Accueil : recherche par véhicule, catégories, meilleures ventes, étapes de commande |
| `catalogue.html` | Catalogue avec recherche, filtres (modèle, catégorie, marque, prix, stock, promo) et tri |
| `produit.html?id=…` | Fiche produit : caractéristiques, compatibilité, livraison, produits associés |
| `panier.html` | Panier avec code promo et calcul de la livraison |
| `commande.html` | Coordonnées, mode de livraison, choix du paiement (Revolut ou virement) |
| `confirmation.html` | Numéro de commande et instructions de paiement avec boutons « Copier » |
| `mes-commandes.html` | Historique des commandes passées depuis le navigateur |
| `contact.html`, `faq.html`, `livraison-retours.html`, `a-propos.html` | Pages d'aide |
| `cgv.html`, `mentions-legales.html`, `confidentialite.html` | Pages légales (remplies depuis la configuration) |

Autres fonctions : « Mon véhicule » (les pièces compatibles sont signalées partout), panier enregistré dans le navigateur, livraison offerte dès 99 €, illustrations de toutes les pièces.

## Avant la mise en ligne : `js/config.js`

Tout se règle dans **`js/config.js`**. Tant qu'un champ est vide, le site affiche « [à compléter] » à sa place.

1. **Identité légale** : `legalName`, `legalForm`, `siret`, `vatNumber`, `director`, `address`, `email`, `phone`. Ces informations sont obligatoires pour vendre en ligne en France.
2. **Revolut** : dans l'application Revolut, ouvrez votre profil puis « Revolut.me » pour obtenir votre lien. Indiquez-le dans `payment.revolut.link` (ex. `https://revolut.me/votre-pseudo`) et votre pseudo dans `payment.revolut.tag`. Avec un compte Revolut Business, vous pouvez aussi mettre un lien de paiement.
3. **Virement** : `payment.transfer.holder`, `iban`, `bic`, `bank`.
4. **Réception des commandes** : créez un formulaire gratuit sur [formspree.io](https://formspree.io), puis collez son adresse dans `formEndpoint` (ex. `https://formspree.io/f/abcdwxyz`). Chaque commande et chaque message de contact vous sera envoyé par e-mail. Sans cela, c'est le client qui doit vous envoyer lui-même le récapitulatif par e-mail.
5. **Codes promo, frais de livraison, délai de paiement** : section `promoCodes`, `shipping`, `payment.deadlineDays`.

Pensez aussi à compléter le médiateur de la consommation dans `mentions-legales.html` et à faire relire `cgv.html`.

## Comment se passe une commande

1. Le client valide son panier : un numéro de commande est créé (ex. `BP260928-X7K2`).
2. La commande vous est envoyée par e-mail (via Formspree).
3. Le client voit le montant, votre lien Revolut ou votre IBAN, et la référence à indiquer.
4. Vous vérifiez la réception du paiement sur votre compte, puis vous expédiez.

Le site n'a pas de base de données : le stock ne se met pas à jour tout seul. Modifiez `stock` dans `js/data.js` quand une pièce est épuisée.

## Ajouter ou modifier des pièces

Le catalogue est dans **`js/data.js`**. Chaque pièce a un identifiant (`id`), qui est aussi le nom de son image dans `images/products/`.

Les illustrations sont générées par `tools/generate_images.py`. Pour une nouvelle pièce, ajoutez un dessin dans ce script ou déposez votre propre image (SVG, ou modifiez `imgSrc` dans `js/common.js` pour utiliser des photos `.jpg`).

```bash
python3 tools/generate_images.py
```

## Tester en local

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Publier sur GitHub Pages

Dans le dépôt GitHub : **Settings → Pages → Deploy from a branch**, choisissez la branche et le dossier `/ (root)`. Le site est en ligne après une minute environ.

---

BMW est une marque déposée de BMW AG. Bavaria Parts est un revendeur indépendant, non affilié à BMW AG.
