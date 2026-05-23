# Volums

Site vitrine + back-office pour la sous-location haut de gamme à Paris.

## Stack
- **Front** : Vite + React + TypeScript + Tailwind + React Router
- **Back-office** : route `/admin` (auth Supabase, CRUD appartements + réservations, upload photos)
- **Données** : Supabase Postgres + Storage (bucket `property-photos` public)
- **Déploiement** : Vercel (`vercel.json` = rewrite SPA)
- **i18n** : FR par défaut + EN, fallback FR si l'EN est vide

## Pages publiques
- **`/`** — Accueil : Hero, Pourquoi, sélection Appartements, Pour qui, Promesse, Contact
- **`/appartements`** — Liste filtrable :
  - barre de filtres compacte sur une ligne (défilement horizontal sur mobile)
  - recherche par référence (insensible casse/espaces), nom ou lieu
  - sélecteurs Quartier / Chambres / Surface
  - filtre Loyer dans une **mini-modale** avec histogramme et curseur à 2 poignées
- **`/appartements/:slug`** — Fiche d'un appartement :
  - mosaïque photo (desktop) ou **carrousel plein cadre swipeable** (mobile, avec compteur)
  - galerie plein écran **groupée par pièce** ([`RoomGallery`](src/components/volums/RoomGallery.tsx)) — nav strip de vignettes, sections par pièce, lightbox clavier
  - sidebar réservation
- **`/booking/:id`** — Page de confirmation, rendue depuis la table `bookings`

## Back-office (`/admin`)
- Login Supabase → CRUD appartements (toutes colonnes + i18n) et réservations
- **Upload photos** par appartement, géré par [`PhotoManager`](src/admin/components/PhotoManager.tsx) :
  - **Compression côté navigateur** AVANT envoi — max 2000 px, JPEG q=0.82, gain typique 70-80 % ([`compressImage.ts`](src/admin/lib/compressImage.ts))
  - **Menu « Pièce »** par photo : on tague chaque image (salon, salle_a_manger, cuisine, chambre [+ n°], sdb [+ n°], entree, bureau, exterieur, autre) — manuel
  - **Étoile « Couverture »** : désigne la photo de couverture **ET** la remonte automatiquement en 1ʳᵉ position
  - **Réordonnancement** : flèches ↑ ↓ par photo
  - Libellé + légende éditables en place

## Photos — comment ça marche

| Étape | Où | Détail |
|---|---|---|
| Compression | navigateur (admin) | max 2000 px, JPEG q=0.82 — voir `compressImage.ts` |
| Stockage | Supabase Storage | bucket public `property-photos`, chemin `<propertyId>/<uuid>.jpg` |
| Métadonnées | table `property_photos` | colonnes `room` (text) + `room_index` (smallint nullable) — voir migration `0008_photo_rooms.sql` |
| Affichage galerie | `RoomGallery.tsx` | photos groupées par `room` (avec `room_index` pour numéroter chambres/sdb), photos sans `room` → groupe « Autre » |
| Couverture | `cover_photo_id` sur `properties` | l'étoile la met à jour + déplace la photo en position 0 |

**Classement par pièce** : actuellement **manuel** depuis le menu déroulant. Une tentative de classement automatique via Gemini Vision a été retirée (rate-limits du palier gratuit trop fragiles).

## Mise en ligne
Voir [DEPLOY.md](DEPLOY.md) — Supabase + Vercel, ~15 minutes.

## Dev local
```bash
npm install
cp .env.example .env   # remplir avec tes clés Supabase
npm run dev            # http://localhost:8080
```

Sans `.env`, le site fonctionne avec un jeu de données statiques ([`src/data/appartements.ts`](src/data/appartements.ts)).

## Structure
- **`src/pages/`** — pages publiques
  - `Index.tsx` — accueil (gère le scroll vers une section quand on arrive avec une ancre `/#xxx`)
  - `AppartementsList.tsx` — liste filtrable + modale loyer
  - `ApptDetail.tsx` — fiche appartement
  - `BookingConfirmation.tsx` (+ `booking-confirmation.css`)
  - `appartements.css` — curseur de fourchette (poignées)
- **`src/components/volums/`** — sections du site public + composants partagés
  - `Nav.tsx` — menu (route `/appartements` + scroll vers les sections de l'accueil)
  - `RoomGallery.tsx` — galerie plein écran groupée par pièce
  - sections accueil : `Hero`, `Pourquoi`, `Appartements`, `PourQui`, `Promesse`, `Contact`, `Logo`
- **`src/admin/`** — back-office
  - `components/PhotoManager.tsx` — upload + compression + tag pièce + couverture
  - `pages/` — login, dashboard, listes/édition propriétés et réservations
  - `api.ts`, `AuthContext.tsx`, `AdminLayout.tsx`, `RequireAuth.tsx`
  - `lib/compressImage.ts` — compression image côté navigateur
- **`src/data/`** — types + fetch Supabase (`queries.ts`) + fallback statique (`appartements.ts`)
- **`src/i18n/`** — traductions FR/EN, `LangContext`, `LangToggle`
- **`src/lib/supabase.ts`** — client Supabase + helpers `photoUrl()`, constante `PHOTOS_BUCKET`
- **`supabase/migrations/`** — migrations SQL numérotées (`0001` → `0008`) à exécuter dans l'ordre dans Supabase SQL Editor
- **`vercel.json`** — rewrite SPA (toutes les routes → `index.html`)

## Conventions UI
- **Radius homogène 12 px** (`rounded-xl`) sur encadrés, boutons, filtres, cartes, photos
- Exceptions volontaires : photos « fixes » de la home (Hero, photo Contact) → angles droits
- **Couleurs** (variables CSS dans `src/index.css`) : `ink` (navy foncé), `cream` / `cream-soft` (papier chaud), `copper` (accent), `hairline` / `slate` (gris)
- **Polices** : `font-display` (serif éditorial) + `italic-display` + `font-mono-meta`

## Import en masse
Pour ajouter beaucoup d'appartements d'un coup, voir [`import/README.md`](import/README.md) — workflow Google Sheet → SQL.
