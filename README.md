# Abricot 🍑

SaaS de gestion de projets et de tâches, avec **génération de tâches par IA** (RAG).

Projet réalisé dans le cadre de la formation **Développeur IA** d'OpenClassrooms : développement du frontend d'une application dont l'API REST est fournie.

---

## Sommaire

1. [Fonctionnalités](#fonctionnalités)
2. [Stack technique](#stack-technique)
3. [Installation](#installation)
4. [Comptes de test](#comptes-de-test)
5. [Génération de tâches par IA](#génération-de-tâches-par-ia)
6. [Architecture et choix techniques](#architecture-et-choix-techniques)
7. [Accessibilité](#accessibilité)
8. [Limites connues](#limites-connues)

---

## Fonctionnalités

| Domaine | Fonctionnalités |
|---|---|
| **Authentification** | Inscription, connexion, déconnexion, routes protégées, session expirée gérée |
| **Mon compte** | Modification du nom, prénom et email, changement de mot de passe |
| **Tableau de bord** | Tâches assignées en vue **Liste** (triée par urgence) ou **Kanban**, recherche |
| **Projets** | Grille avec progression et équipe, création, modification, gestion des contributeurs |
| **Tâches** | Création, modification, suppression, statut, priorité, échéance, personnes assignées, filtres |
| **Commentaires** | Détail d'une tâche avec fil de commentaires, lien direct depuis le tableau de bord |
| **IA** | Génération de tâches à partir d'une demande en langage naturel, avec relecture avant ajout |

## Stack technique

| | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript, Tailwind CSS 4 |
| **IA** | LlamaIndex.TS (RAG), Google Gemini (par défaut) ou Mistral AI |
| **Backend** (fourni) | Node.js, Express, Prisma, SQLite, JWT |
| **Qualité** | ESLint, Prettier |

Aucune bibliothèque de composants : modales, badges, avatars, barres de progression et icônes sont développés sur mesure.

---

## Installation

### Prérequis

- **Node.js 20.9** ou plus récent
- Une **clé API Gemini** (gratuite) : [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### 1. Backend (API sur le port 8000)

```bash
cd backend
npm install
```

Créer le fichier de configuration à partir du modèle, puis remplacer la valeur de `JWT_SECRET` :

```bash
cp .env.example .env        # macOS / Linux
copy .env.example .env      # Windows
```

Créer la base de données, la remplir avec les données de test, puis démarrer l'API :

```bash
npx prisma generate
npx prisma migrate deploy
npm run seed
npm run dev
```

La documentation de l'API (Swagger) est disponible sur [http://localhost:8000](http://localhost:8000).

### 2. Frontend (application sur le port 3000)

Dans un **second terminal** :

```bash
cd frontend
npm install
```

Créer le fichier de configuration à partir du modèle, puis renseigner `GEMINI_API_KEY` :

```bash
cp .env.example .env.local      # macOS / Linux
copy .env.example .env.local    # Windows
```

Démarrer l'application :

```bash
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

### Variables d'environnement du frontend

| Variable | Obligatoire | Description |
|---|---|---|
| `API_URL` | Oui | URL de l'API backend |
| `AI_PROVIDER` | Non | `gemini` (par défaut) ou `mistral` |
| `GEMINI_API_KEY` | Si Gemini | Clé de l'API Gemini |
| `MISTRAL_API_KEY` | Si Mistral | Clé de l'API Mistral |
| `AI_MODEL` | Non | Nom du modèle de chat, si le modèle par défaut est retiré par le fournisseur |

> Les clés ne sont lues que côté serveur et ne sont jamais envoyées au navigateur. Les fichiers `.env` et `.env.local` sont ignorés par Git.

---

## Comptes de test

Créés par `npm run seed` dans le backend. Tous utilisent le mot de passe **`P@ssword123`**.

| Email | Particularité |
|---|---|
| `alice@example.com` | Propriétaire de « Application E-commerce », contributrice d'autres projets |
| `bob@example.com` | Contributeur de plusieurs projets |

Les 10 comptes disponibles sont listés dans `backend/README.md`.

---

## Génération de tâches par IA

Sur la page d'un projet, le bouton **« ✦ IA »** permet de décrire un besoin (par exemple *« Ajouter un système de codes promo »*). L'IA propose une liste de tâches que l'utilisateur peut **modifier ou supprimer** avant de les ajouter au projet : rien n'est créé sans validation humaine.

### Fonctionnement (RAG)

```
Demande de l'utilisateur
        │
        ▼
1. Récupération (LlamaIndex)
   Les tâches existantes du projet sont converties en vecteurs (embeddings),
   indexées dans un VectorStoreIndex, et les 5 plus proches de la demande
   sont retrouvées.
        │
        ▼
2. Génération (LLM)
   Le modèle reçoit la description du projet, ces tâches similaires et la
   demande, et répond par un tableau JSON de tâches.
        │
        ▼
3. Validation
   Format, types et longueurs sont vérifiés avant affichage, puis à nouveau
   côté serveur avant l'ajout.
```

Grâce au contexte, les propositions sont **cohérentes avec le projet réel** : pour une demande de codes promo sur le projet e-commerce, l'IA propose d'adapter l'appel à Stripe, car une tâche existante mentionne Stripe.

### Choix du fournisseur : de Mistral à Gemini

Le cahier des charges prévoyait **Mistral AI**. En octobre 2026, l'offre gratuite de Mistral ne donnait plus accès à l'API (quota à 0 requête par minute). **Avec l'accord du mentor**, le fournisseur a été rendu **interchangeable** :

- **Gemini** est utilisé par défaut (offre gratuite disponible)
- **Mistral** reste pleinement supporté : `AI_PROVIDER=mistral` suffit pour l'utiliser

LlamaIndex offrant la même interface pour tous les fournisseurs, le RAG, le prompt et la validation sont communs : changer de fournisseur ne demande **aucune modification du code**. Pour la même raison, le nom du modèle est configurable (`AI_MODEL`), les fournisseurs retirant régulièrement d'anciens modèles.

### Gestion des erreurs

| Situation | Comportement |
|---|---|
| Surcharge temporaire (503, 500…) | **Nouvel essai automatique** après 2 s puis 4 s (backoff exponentiel) |
| Clé invalide, quota atteint, modèle retiré | Message explicite immédiat, sans nouvel essai inutile |
| Réponse de l'IA mal formée | Message invitant à reformuler, aucune donnée enregistrée |

Le détail technique de chaque erreur est affiché dans le terminal du serveur, jamais dans le navigateur.

---

## Architecture et choix techniques

### Structure

```
abricot/
├── backend/                API REST fournie (Express + Prisma + SQLite)
└── frontend/
    └── src/
        ├── app/
        │   ├── (auth)/         Connexion, inscription
        │   ├── (dashboard)/    Tableau de bord, projets, compte
        │   ├── actions/        Server Actions (auth, projets, tâches, commentaires, IA)
        │   └── logout/         Route de nettoyage d'une session expirée
        ├── components/
        │   ├── ui/             Composants génériques : Modal, Avatar, StatusBadge, SearchBar, icônes
        │   ├── tasks/          Carte de tâche, modales de tâche et de détail
        │   ├── projects/       Carte de projet, modales, sélection des contributeurs
        │   ├── ai/             Modale de génération par IA
        │   └── ...
        ├── lib/                Accès à l'API, IA, fonctions utilitaires
        ├── types/              Types TypeScript partagés
        └── proxy.ts            Protection des routes
```

### Sécurité

- **Token JWT dans un cookie `httpOnly`** : inaccessible au JavaScript de la page (protection XSS), avec `sameSite: lax` (protection CSRF) et `secure` en production.
- **Server Actions** : tous les appels à l'API passent par le serveur Next.js. L'URL du backend et les clés d'IA ne sont jamais exposées au navigateur, et le module `server-only` empêche toute fuite accidentelle vers le code client.
- **Double vérification de la session** : le `proxy` vérifie la présence du cookie avant chaque page, puis le layout vérifie sa validité auprès du backend.
- **Réponses d'erreur prudentes** : un projet inexistant et un projet inaccessible affichent le même message, pour ne pas révéler quels projets existent.

### Performances

- Appels indépendants **en parallèle** (`Promise.all`), par exemple l'utilisateur et ses tâches.
- Utilisateur connecté mis en cache par requête (`cache()` de React) : layout et page n'interrogent le backend qu'une fois.
- Après chaque modification, `revalidatePath` rafraîchit uniquement les pages concernées.

---

## Accessibilité

- Modales basées sur l'élément natif **`<dialog>`** : focus piégé, fermeture par Échap, retour du focus au bouton d'origine, focus initial sur le premier champ.
- **Focus visible** sur tous les éléments interactifs (contraste 4,3:1, au-delà du minimum WCAG de 3:1).
- Chaque champ a un `<label>` ; erreurs annoncées avec `role="alert"`, succès et chargements avec `role="status"`.
- Barres de progression avec `role="progressbar"`, nombre de résultats de recherche annoncé (`aria-live`).
- Avatars : nom complet lu par les lecteurs d'écran et affiché au survol.

---

## Limites connues

Points relevés dans l'API fournie, contournés côté frontend sans modifier le backend :

| Constat | Contournement |
|---|---|
| Le tri par priorité est alphabétique (`HIGH`, `LOW`, `MEDIUM`, `URGENT`) | Tri refait côté frontend avec le bon ordre d'urgence |
| `GET /projects` ne renvoie pas le nombre de tâches terminées | Tâches de chaque projet récupérées en parallèle pour calculer la progression |
| La création d'une tâche n'accepte pas de statut | Création puis mise à jour immédiate du statut si nécessaire |
| La modification et la suppression de commentaires existent dans le code mais ne sont exposées par aucune route | Fonctionnalités non proposées dans l'interface |
| Pas de route de réinitialisation du mot de passe | Lien « Mot de passe oublié » de la maquette non intégré |

---

## Scripts utiles

| Dossier | Commande | Rôle |
|---|---|---|
| `backend` | `npm run dev` | Démarre l'API |
| `backend` | `npm run seed` | Réinitialise les données de test |
| `backend` | `npx prisma studio` | Interface de consultation de la base |
| `frontend` | `npm run dev` | Démarre l'application en développement |
| `frontend` | `npm run build` | Compile pour la production |
| `frontend` | `npm run lint` | Vérifie le code avec ESLint |
