# Import en masse depuis un Google Sheet

## Étape 1 — Créer la feuille
1. Va sur Google Sheets → **Fichier** → **Importer** → onglet **Importer** → choisis [`template.csv`](template.csv) (téléchargé depuis ce repo).
2. Sépare le contenu par **virgule**.
3. Tu obtiens un Sheet avec les bonnes colonnes + 1 ligne d'exemple.

## Étape 2 — Remplir
- Une **ligne par appartement**.
- Colonnes spéciales :
  - `long_description` : sépare les paragraphes par ` | ` (espace + pipe + espace)
  - `inclus` : sépare les éléments par ` | ` aussi
  - `is_published` : `TRUE` ou `FALSE`
  - `sort_order` : nombre entier (ordre d'affichage, ex: 1, 2, 3, …)
  - `loyer` : avec espaces et symbole, ex: `7 500 €`
  - `loyer_num` : juste le chiffre, ex: `7500`

## Étape 3 — Partager
1. **Fichier** → **Partager** → **Toute personne disposant du lien** → **Lecteur**.
2. Copie l'URL.

## Étape 4 — Me la donner
Tu colles l'URL dans le chat. Je récupère les données, je génère un script SQL d'import,
je le pousse dans le repo. Tu n'as plus qu'à le coller dans Supabase SQL Editor → Run.

Les photos restent à uploader via `/admin` (le storage Supabase demande une vraie auth).
