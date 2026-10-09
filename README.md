# Abricot 🍑

SaaS de gestion de projets et de tâches, avec **génération de tâches par IA** (RAG).

Projet réalisé dans le cadre de la formation **Développeur IA** d'OpenClassrooms : développement du frontend d'une application dont l'API REST est fournie.

---

## Sommaire

1. [Fonctionnalités](#fonctionnalités)
2. [Stack technique](#stack-technique)
3. [Installation](#installation)
4. [Comptes de test](#comptes-de-test)
5. [Droits selon le rôle](#droits-selon-le-rôle)
6. [Génération de tâches par IA](#génération-de-tâches-par-ia)
7. [Architecture et choix techniques](#architecture-et-choix-techniques)
8. [Intégration de la maquette](#intégration-de-la-maquette)
9. [Accessibilité](#accessibilité)
10. [Responsive](#responsive)
11. [Limites connues](#limites-connues)

---

## Fonctionnalités

| Domaine | Fonctionnalités |
|---|---|
| **Authentification** | Inscription, connexion, déconnexion, routes protégées, session expirée gérée |
| **Mon compte** | Modification du nom, prénom et email, changement de mot de passe |
| **Tableau de bord** | 3 vues : **Liste** des tâches assignées (les plus urgentes d'abord, avec recherche), **Kanban** des tâches du mois par statut (navigation mois par mois), **Projets** dans lesquels l'utilisateur a des tâches (les plus urgents d'abord) |
| **Projets** | Grille avec progression et équipe, création, modification, gestion des contributeurs (recherche avec autocomplétion), suppression par le propriétaire |
| **Tâches** | Création, modification, suppression avec confirmation, statut, échéance, personnes assignées, filtre par statut, recherche |
| **Commentaires** | Fil de commentaires dépliable dans chaque carte de tâche, lien direct depuis le tableau de bord |
| **IA** | Génération de tâches à partir d'une demande en langage naturel, avec relecture avant ajout |

## Stack technique

| | Technologies |
|---|---|
| **Frontend** | Next.js 16 (App Router, Server Components, Server Actions), React 19, TypeScript, Tailwind CSS 4 |
| **IA** | LlamaIndex.TS (RAG), Google Gemini (par défaut) ou Mistral AI |
| **Backend** (fourni) | Node.js, Express, Prisma, SQLite, JWT |
| **Qualité** | ESLint, Prettier |

Aucune bibliothèque de composants : modales, menus, listes à choix multiples, badges, avatars et barres de progression sont développés sur mesure. Le logo et les icônes sont les tracés vectoriels (SVG) extraits de la maquette Figma.

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

La documentation de l'API (Swagger) est disponible sur [http://localhost:8000/api-docs](http://localhost:8000/api-docs).

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
| `AI_MODEL` | Non | Nom du modèle de chat, si le modèle par défaut est retiré par le fournisseur ou surchargé |

> Les clés ne sont lues que côté serveur et ne sont jamais envoyées au navigateur. Les fichiers `.env` et `.env.local` sont ignorés par Git.

---

## Comptes de test

Créés par `npm run seed` dans le backend. Tous utilisent le mot de passe **`P@ssword123`**.

| Email | Particularité |
|---|---|
| `alice@example.com` | Propriétaire de « Application E-commerce », contributrice d'autres projets |
| `bob@example.com` | Contributeur de plusieurs projets |

Les 10 comptes disponibles sont listés dans `backend/README.md`.

> Les échéances des données de test datent de début 2024. La vue Kanban affichant **les tâches du mois**, elle est vide sur le mois en cours : utiliser la flèche « mois précédent » ou donner une échéance récente à une tâche.

---

## Droits selon le rôle

Tous les utilisateurs ont le même compte ; leurs droits dépendent de leur rôle **dans chaque projet**, comme le prévoient les spécifications.

| Action | Propriétaire | Administrateur | Contributeur |
|---|:---:|:---:|:---:|
| Voir le projet et commenter | ✅ | ✅ | ✅ |
| Créer une tâche (manuellement ou par IA) | ✅ | ✅ | ✅ |
| Supprimer une tâche | ✅ | ✅ | ✅ |
| Modifier une tâche | ✅ | ✅ | ❌ |
| Modifier le projet et ses contributeurs | ✅ | ✅ | ❌ |
| Supprimer le projet | ✅ | ❌ | ❌ |

Un utilisateur qui ne fait pas partie d'un projet ne peut pas y accéder. Les actions non autorisées ne sont pas affichées dans l'interface, et le backend refuse de toute façon les requêtes interdites.

---

## Génération de tâches par IA

Sur la page d'un projet, le bouton **« ✦ IA »** permet de décrire un besoin (par exemple *« Ajouter un système de codes promo »*). L'IA propose une liste de tâches que l'utilisateur peut **modifier ou supprimer** avant de les ajouter au projet : rien n'est créé sans validation humaine.

Les tâches proposées n'ont ni échéance ni personne assignée : ces décisions restent à l'utilisateur, qui les complète ensuite depuis le menu « … » de chaque tâche.

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

### Gestion des erreurs et du temps de réponse

| Situation | Comportement |
|---|---|
| Génération en cours (souvent plusieurs secondes) | Indicateur de chargement annoncé aux lecteurs d'écran, bouton d'envoi désactivé |
| Surcharge temporaire (503, 500…) | **Nouvel essai automatique** après 2 s puis 4 s (backoff exponentiel), puis message invitant à réessayer |
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
    ├── public/             Logo (SVG) et photos des pages de connexion (WebP)
    └── src/
        ├── app/
        │   ├── (auth)/         Connexion, inscription
        │   ├── (dashboard)/    Tableau de bord, projets, compte
        │   ├── actions/        Server Actions (auth, projets, tâches, commentaires, IA)
        │   └── logout/         Route de nettoyage d'une session expirée
        ├── components/
        │   ├── ui/             Composants génériques : Modal, ConfirmDialog, MultiSelect,
        │   │                   Avatar, StatusBadge, SearchBar, Logo, icônes
        │   ├── dashboard/      Vues Liste, Kanban et Projets du tableau de bord
        │   ├── tasks/          Cartes de tâche, menu « … », commentaires, modale de tâche
        │   ├── projects/       Carte de projet, liste des tâches, modale, contributeurs
        │   ├── ai/             Modale de génération par IA
        │   └── layout/         Header, Footer
        ├── lib/                Accès à l'API, IA, fonctions utilitaires (tri, dates, mois)
        ├── types/              Types TypeScript partagés
        └── proxy.ts            Protection des routes
```

### Sécurité

- **Token JWT dans un cookie `httpOnly`** : inaccessible au JavaScript de la page (protection XSS), avec `sameSite: lax` (protection CSRF) et `secure` en production.
- **Server Actions** : tous les appels à l'API passent par le serveur Next.js. L'URL du backend et les clés d'IA ne sont jamais exposées au navigateur, et le module `server-only` empêche toute fuite accidentelle vers le code client.
- **Double vérification de la session** : le `proxy` vérifie la présence du cookie avant chaque page, puis le layout vérifie sa validité auprès du backend.
- **Validation côté serveur** : les champs obligatoires sont revérifiés dans chaque Server Action, même si le formulaire les contrôle déjà dans le navigateur.
- **Réponses d'erreur prudentes** : un projet inexistant et un projet inaccessible affichent le même message, pour ne pas révéler quels projets existent.

### Performances

- Appels indépendants **en parallèle** (`Promise.all`), par exemple l'utilisateur, le projet et ses tâches.
- Chaque vue du tableau de bord ne charge que ses propres données (la vue Projets interroge `GET /dashboard/projects-with-tasks`, les vues Liste et Kanban `GET /dashboard/assigned-tasks`).
- Utilisateur connecté mis en cache par requête (`cache()` de React) : layout et page n'interrogent le backend qu'une fois.
- Après chaque modification, `revalidatePath` rafraîchit uniquement les pages concernées.
- Photos des pages de connexion converties en **WebP** (environ 150 Ko au lieu de 13 Mo) et chargées en priorité ; logo et icônes en SVG.

---

## Intégration de la maquette

L'interface reprend la maquette Figma : logo et icônes vectoriels, photos des pages de connexion, couleurs, cartes de tâches, commentaires dépliables, menu « … », statut en pastilles, liste déroulante « Choisir un ou plusieurs collaborateurs », boutons désactivés tant qu'un formulaire est incomplet, modale IA avec saisie en bas.

Écarts volontaires, chacun justifié :

| Écart | Raison |
|---|---|
| Vue **Projets** du tableau de bord et **Kanban limité au mois** | Exigés par les spécifications fonctionnelles, absents de la maquette |
| Onglet **Calendrier** de la page projet non intégré | Absent des spécifications, qui ne demandent qu'une vue liste des tâches d'un projet |
| Lien **« Déconnexion »** dans le header | Indispensable, absent de la maquette |
| Lien **« Mot de passe oublié »** non intégré | Aucune route correspondante dans l'API |
| Champ **priorité** masqué dans le formulaire de tâche | Absent de la maquette ; la priorité existante est conservée, « Moyenne » par défaut |
| Mention **« En retard »** en rouge sur les échéances dépassées | Information utile, absente de la maquette |
| **Recherche avec autocomplétion** pour les contributeurs | Piste « pour aller plus loin » de l'énoncé, plus pratique qu'une simple liste |
| Orange **plus foncé** pour les petits textes et le bouton IA | Contraste WCAG AA (voir ci-dessous) |
| Mon compte : mot de passe dans un bloc séparé, avec confirmation | Évite un changement de mot de passe accidentel |

---

## Accessibilité

Objectif des spécifications : **WCAG 2.1 niveau AA**.

### Contrastes

L'orange de la maquette (`#d3590b`) n'atteint que **4:1** sur fond blanc, sous le seuil de **4,5:1** exigé pour le texte courant. Deux nuances sont donc utilisées :

| Couleur | Contraste | Usage |
|---|---|---|
| `#d3590b` (maquette) | 4:1 | Logo, icônes, grands titres, barres de progression (seuil 3:1) |
| `#a84607` (plus foncé) | 6,3:1 | Liens, onglets, petits textes orange, fond du bouton IA |

Le texte des badges de statut a aussi été assombri (contraste initial de 1,9:1 à 3,1:1, désormais 4,5:1 minimum), les fonds de la maquette étant conservés. Les calculs sont notés en commentaire dans `globals.css`.

### Composants

- **Modales** sur l'élément natif `<dialog>` : focus piégé, fermeture par Échap, retour du focus au bouton d'origine, focus initial sur le premier champ.
- **Confirmation de suppression** : le focus arrive sur « Annuler », pour éviter une suppression par réflexe. Après la suppression d'une tâche, le focus revient sur le titre de la liste.
- **Menu « … »** : motif *disclosure* (bouton `aria-expanded` + vrais boutons), Échap le ferme et rend le focus.
- **Commentaires** : accordéon avec `aria-expanded` et `aria-controls`.
- **Statut** : pastilles construites sur de vrais boutons radio (flèches du clavier) ; la pastille choisie est signalée par une bordure, pas seulement par la couleur.
- **« Assigné à »** : liste déroulante contenant de vraies cases à cocher ; Échap la replie sans fermer la modale.
- **Focus visible** sur tous les éléments interactifs.
- Chaque champ a un `<label>` ; erreurs annoncées avec `role="alert"`, chargements avec `role="status"`, nombre de résultats de recherche annoncé (`aria-live`).
- Barres de progression avec `role="progressbar"` ; avatars avec le nom complet lu par les lecteurs d'écran.
- Images décoratives (photos des pages de connexion) avec `alt=""`, logo avec un texte alternatif décrivant sa destination.

---

## Responsive

Toutes les pages ont été vérifiées en **375 px** (téléphone) et **768 px** (tablette), sans aucun défilement horizontal.

- **Header** : sur téléphone, logo et compte sur une ligne, navigation en dessous sur toute la largeur ; une seule ligne à partir de la tablette.
- **Pages de connexion** : la photo est masquée sur petit écran, le formulaire occupe toute la largeur.
- **Grilles et Kanban** : les colonnes s'empilent sur petit écran.
- **Modale IA** : la zone de saisie reste visible en bas pendant que la liste des propositions défile.

---

## Limites connues

Points relevés dans l'API fournie, contournés côté frontend sans modifier le backend :

| Constat | Contournement |
|---|---|
| Le tri par priorité est alphabétique (`HIGH`, `LOW`, `MEDIUM`, `URGENT`) | Tri refait côté frontend avec le bon ordre d'urgence |
| `GET /projects` ne renvoie pas le nombre de tâches terminées | Tâches de chaque projet récupérées en parallèle pour calculer la progression |
| La création d'une tâche n'accepte pas de statut | Création puis mise à jour immédiate du statut si nécessaire |
| Le backend autorise tout membre à modifier une tâche | L'interface applique la règle des spécifications : seuls les administrateurs modifient |
| La modification et la suppression de commentaires existent dans le code mais ne sont exposées par aucune route | Fonctionnalités non proposées dans l'interface |
| Pas de route de réinitialisation du mot de passe | Lien « Mot de passe oublié » de la maquette non intégré |
| La documentation Swagger ne liste qu'une partie des routes | Routes vérifiées directement dans le code du backend (`src/routes`) |

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