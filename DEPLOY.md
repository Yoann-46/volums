# Volums — Mise en ligne

3 étapes, ~15 minutes. Tu peux les faire dans l'ordre.

## 1. Supabase (DB + photos)

### a) Créer le projet
1. Aller sur https://supabase.com et créer un compte (gratuit).
2. Cliquer **"New project"** :
   - Name : `volums`
   - Database password : générer un mot de passe fort, **note-le** (tu n'en auras pas besoin tout de suite, mais c'est important).
   - Region : `Europe (Paris)` ou `Europe (Frankfurt)`.
3. Attendre ~2 minutes que le projet se crée.

### b) Créer le schéma
1. Dans Supabase, menu de gauche → **SQL Editor** → **New query**.
2. Ouvrir le fichier [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) du repo, copier tout le contenu, le coller dans l'éditeur Supabase, cliquer **Run**.
3. Faire pareil avec [`supabase/migrations/0002_seed.sql`](supabase/migrations/0002_seed.sql) (les 4 appartements existants).

### c) Créer ton compte admin
1. Menu de gauche → **Authentication** → **Users** → **Add user** → **Create new user**.
2. Email + mot de passe (au moins 6 caractères). Coche **"Auto confirm user"**.
3. Tu utiliseras ces identifiants pour te connecter à `/admin`.

### d) Récupérer les clés
1. Menu de gauche → **Project Settings** (icône engrenage en bas) → **API**.
2. Note ces deux valeurs :
   - **Project URL** (ex: `https://xxxxxxx.supabase.co`)
   - **anon / public** key (longue chaîne `eyJhbGciOi...`)

## 2. Vercel (déploiement)

1. Aller sur https://vercel.com, se connecter avec **GitHub**.
2. **Add New** → **Project** → choisir le repo `volums` → **Import**.
3. Dans **Environment Variables**, ajouter :
   - `VITE_SUPABASE_URL` = ton Project URL
   - `VITE_SUPABASE_ANON_KEY` = ta clé anon
4. Cliquer **Deploy**. ~1 minute.

Tu obtiens une URL `https://volums-xxx.vercel.app`.

## 3. Tester

- `https://volums-xxx.vercel.app` → site public avec les 4 appartements
- `https://volums-xxx.vercel.app/admin/login` → connexion avec ton compte admin
- Une fois connecté → tu peux créer/modifier/supprimer des appartements et uploader des photos

## Domaine perso (optionnel)

Vercel → ton projet → **Settings** → **Domains** → ajouter `volums.fr` (ou autre). Vercel te donne les enregistrements DNS à créer chez ton registrar (Gandi, OVH, etc.).

---

## En cas de souci

- Le site ne charge pas les appartements → vérifier les variables d'env dans Vercel (Settings → Environment Variables) puis **Redeploy**.
- Connexion admin refusée → vérifier que l'utilisateur est bien créé et **confirmé** dans Supabase Authentication.
- Photos qui ne s'affichent pas → dans Supabase Storage, vérifier que le bucket `property-photos` existe et est **public** (la migration le crée automatiquement).
