# Bavaria Parts

Site e-commerce de démonstration pour la vente de pièces détachées compatibles BMW.

## Fonctionnalités

- Recherche de pièces par modèle (Série 1, 3, 5, X1, X3, X5…) et par catégorie
- Catalogue avec recherche texte, filtres et tri
- Fiche produit avec la liste des modèles compatibles, le stock et le choix de la quantité
- Panier sauvegardé dans le navigateur (localStorage), livraison offerte dès 99 €
- Tunnel de commande avec formulaire validé (démonstration : aucun paiement n'est encaissé)
- Formulaire de contact avec le numéro VIN
- Affichage adapté au mobile

## Lancer le site

C'est un site statique, sans dépendance à installer :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

On peut aussi ouvrir directement `index.html` dans un navigateur.

## Structure

```
index.html        Page principale
css/style.css     Styles
js/products.js    Catalogue (modèles, catégories, produits)
js/app.js         Logique : filtres, panier, commande
```

Pour ajouter des produits, modifiez le tableau `PRODUCTS` dans `js/products.js`.

---

BMW est une marque déposée de BMW AG. Bavaria Parts est un nom fictif de revendeur indépendant, non affilié à BMW AG.
