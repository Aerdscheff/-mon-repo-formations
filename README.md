blabla


## Supabase – Intégration (Edge + RLS)

Cette PR ajoute l’auth Magic Link côté client (via @supabase/supabase-js ESM), l’appel à la fonction Edge `commit_run`, et une migration SQL minimale (progress, runs, run_traces) avec RLS.

### 1) Pré-requis projet Supabase
- Créez (ou ouvrez) un projet Supabase
- Relevez vos clés:
  - SUPABASE_URL (ex: https://xxxx.supabase.co)
  - SUPABASE_ANON_KEY (clé publique)
  - SUPABASE_SERVICE_ROLE_KEY (clé service – côté serveur uniquement)

### 2) Configurer l’Auth Magic Link
- Supabase > Authentication > URL Configuration:
  - Site URL: https://aerdscheff.github.io/-mon-repo-formations/
  - Redirect URLs: https://aerdscheff.github.io/-mon-repo-formations/
- Dans index.html, les constantes sont injectées via `window.ENV` (ANON + URL)

### 3) Déployer la fonction Edge commit_run
- Via l’interface (Functions) ou CLI
- Secrets requis pour la fonction (Project/Function secrets):
  - SUPABASE_URL: votre URL projet
  - SUPABASE_SERVICE_ROLE_KEY: clé service (nécessaire pour écrire en base côté fonction)
- Déploiement CLI (exemple):
```bash
supabase functions deploy commit_run
supabase secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...
```

### 4) Base de données & RLS
- Appliquez le SQL fourni: `supabase/sql/001_minimal_tables_rls.sql`
  - Tables: progress, runs, run_traces
  - RLS: self (lecture/insert/update selon table)
  - Index idempotence: unique (user_id, activity_id) sur `runs` pour `activity_id` commençant par `summary:`
- Vous pouvez exécuter ce SQL dans Supabase Studio (SQL Editor)

### 5) Comportement commit_run et idempotence
- Appels per-question (événement `question_correct`):
  - PAS de crédit XP (option: trace dans `run_traces` si table présente)
- Appel summary (événement `quiz_summary`):
  - Crédit d’XP unique (idempotence forte via `activity_id = summary:<idempotency_key>`)
  - L’idempotency key est générée côté client et inclut un “bucket” (5 min) pour éviter les doubles crédits lors de rechargements

### 6) Tests recommandés
- E2E (Pages):
  1. Ouvrir https://aerdscheff.github.io/-mon-repo-formations/
  2. Se connecter via Magic Link
  3. Lancer un pack, répondre à quelques questions (per‑question → pas de crédit XP)
  4. Fin de quiz → vérifiez `runs` (1 enregistrement summary) et `progress` (xp_total/level/tier mis à jour)
  5. Recharger et re-soumettre le résumé en < 5 min → pas de second crédit
- Sanity API (facultatif):
  - POST sur `.../functions/v1/commit_run` sans Authorization → 401 attendu

### 7) Personnalisation XP
- Ajustez les multiplicateurs dans `supabase/functions/commit_run/index.ts`
- Si vous souhaitez créditer aussi per‑question, décommentez la logique correspondante (ou changez l’heuristique `isPerQuestion`)

### 8) Sécurité
- La clé ANON est publique et injectée côté client via `window.ENV`
- La clé SERVICE ne doit JAMAIS se retrouver côté client; elle n’est utilisée que dans l’Edge Function (secrets)
- RLS applique la sécurité au niveau base

### 9) Déploiement GitHub Pages
- Pages sert la racine du dépôt
- Les nouvelles ressources (packs + placeholders .webp) sont incluses dans la PR

