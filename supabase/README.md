# Supabase Setup for Äerdschëff formations

Ce répertoire contient les fichiers nécessaires pour configurer la base de données
et les fonctions Supabase de l’application de formations gamifiées.

## Installation

1. Créez un projet sur [Supabase](https://supabase.com/).
2. Copiez le contenu de `sql/schema.sql` dans la section `SQL Editor` et exécutez‑le pour créer les tables et politiques RLS.
3. Copiez le contenu de `sql/rpc.sql` dans le `SQL Editor` et exécutez‑le pour créer les procédures stockées de leaderboard.
4. Déployez la fonction edge `commit_run` en créant une nouvelle fonction dans `Functions` et en collant le contenu de `functions/commit_run/index.ts`. Assurez‑vous d’ajouter les variables d’environnement `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans l’onglet `Environment Variables`.
5. Dans `Authentication` > `Settings` > `Email`, activez les liens magiques pour permettre l’authentification sans mot de passe.
6. Copiez `config/supabase.env.sample` en `config/supabase.env` dans votre front et remplissez `SUPABASE_URL` et `SUPABASE_ANON_KEY` avec les valeurs de votre projet.

## RPC & Leaderboards

Les procédures `leaderboard_all`, `leaderboard_30` et `leaderboard_7` retournent les utilisateurs publics triés par XP total.
Elles sont utilisées par le module `js/leaderboard.js` du front.

## Edge Function `commit_run`

Cette fonction reçoit un JSON contenant :

```
{
  "user_id": "uuid",
  "pack": "nom_du_pack",
  "difficulty": "debutant|initie|multiplicateur|maitre|godlike",
  "correct": 0,
  "wrong": 0,
  "streak_max": 0
}
```

Elle calcule l’XP, met à jour la table `progress` et enregistre l’historique dans `runs`.
