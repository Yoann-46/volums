# Volums

Site vitrine + back-office pour la sous-location haut de gamme à Paris.

## Stack
- **Front** : Vite + React + TypeScript + Tailwind
- **Back-office** : route `/admin` (auth Supabase, CRUD appartements, upload photos)
- **Données** : Supabase Postgres + Storage
- **Déploiement** : Vercel

## Mise en ligne
Voir [DEPLOY.md](DEPLOY.md) — 3 étapes, ~15 minutes.

## Dev local
```bash
npm install
cp .env.example .env  # remplir avec tes clés Supabase
npm run dev
```

Sans variables d'env, le site fonctionne avec des données statiques (fallback).

## Structure
- `src/components/volums/` — sections du site public
- `src/pages/` — pages publiques (Index, ApptDetail)
- `src/admin/` — back-office (auth, CRUD, upload photos)
- `src/data/` — types + fetch Supabase + fallback statique
- `src/lib/supabase.ts` — client Supabase
- `supabase/migrations/` — schéma SQL à exécuter dans le SQL Editor Supabase
