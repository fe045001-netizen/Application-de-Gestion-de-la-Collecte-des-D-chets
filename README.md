# CleanUp
## Application de Gestion de Collecte des Déchets

> **Projet de Fin d'Études (PFE)**  
> **Établissement :** École Normale Supérieure – Département Informatique, Marrakech  
> **Encadrant :** [Mohammed Lachgar]  
> **Étudiant :** [Sahmad Fatima-ezzahra]  
> **Année universitaire :** 2025–2026


## Table des matières

1. [Présentation du projet](#-présentation-du-projet)
2. [Acteurs et rôles](#-acteurs-et-rôles)
3. [Architecture globale](#-architecture-globale)
4. [Technologies utilisées](#-technologies-utilisées)
5. [Structure des projets](#-structure-des-projets)
   - [Backend PHP](#backend-php)
   - [Frontend Web React](#frontend-web-react)
   - [Application Mobile React Native (Expo)](#application-mobile-react-native-expo)
6. [Modèle Conceptuel de Données (MCD)](#-modèle-conceptuel-de-données-mcd)
7. [Modèle Logique de Données (MLD)](#-modèle-logique-de-données-mld)
8. [Description des tables](#-description-des-tables)
9. [API REST – Endpoints](#-api-rest--endpoints)
10. [Fonctionnalités détaillées](#-fonctionnalités-détaillées)
11. [Règles métier](#-règles-métier)
12. [Installation et démarrage](#-installation-et-démarrage)
13. [Variables d'environnement](#-variables-denvironnement)
14. [Démonstration vidéo](#-démonstration-vidéo)

## 🌍 Présentation du projet

Cette application permet la **gestion intelligente de la collecte des déchets** dans un environnement urbain ou un campus universitaire. Elle couvre l'ensemble du cycle opérationnel : de la planification des tournées à leur suivi en temps réel, en passant par la remontée d'incidents sur le terrain.

**Objectif principal :** Suivre les points de collecte, les tournées des camions et l'état de collecte en temps réel, afin d'améliorer l'efficacité des services de propreté.

## Logo

<img width="254" height="243" alt="logo" src="https://github.com/user-attachments/assets/b3e7e048-7337-4082-8490-c80cbca85bd2" />


##  Acteurs et rôles

| Acteur | Plateforme | Rôle |
|--------|-----------|------|
| **Agent / Chauffeur** | Mobile (React Native) | Consulte et met à jour les points de collecte lors des tournées |
| **Responsable propreté** | Web (React) | Gère les routes, camions, points et suit les opérations |
| **Administrateur** | Web (React) | Accès complet : gestion des utilisateurs, configuration système |

---

##  Architecture globale

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│  ┌──────────────────────┐    ┌───────────────────────────────┐  │
│  │   Web App (React)    │    │  Mobile App (React Native /   │  │
│  │   localhost:3000     │    │  Expo)                        │  │
│  │                      │    │                               │  │
│  │  - Dashboard         │    │  - Voir tournée               │  │
│  │  - CRUD Points       │    │  - Marquer collecte           │  │
│  │  - Gestion Routes    │    │  - Signaler incidents         │  │
│  │  - Gestion Camions   │    │  - Envoyer position GPS       │  │
│  │  - Suivi opérationnel│    │                               │  │
│  └──────────┬───────────┘    └──────────────┬────────────────┘  │
│             │                               │                   │
└─────────────┼───────────────────────────────┼───────────────────┘
              │         HTTP / REST API        │
              │         (JWT Auth)             │
              ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER (PHP)                        │
│                                                                 │
│  ┌────────────┐  ┌───────────┐  ┌──────────────┐               │
│  │   Routes   │  │Controllers│  │   Services   │               │
│  │  api.php   │→ │  Auth     │→ │  AuthService │               │
│  │            │  │  Point    │  │  LogService  │               │
│  │            │  │  Route    │  │  PointService│               │
│  │            │  │  Truck    │  │  RouteService│               │
│  │            │  │  Log      │  │  TruckService│               │
│  │            │  │  User     │  │              │               │
│  └────────────┘  └───────────┘  └──────────────┘               │
│                                                                 │
│  ┌──────────────┐  ┌──────────┐  ┌────────────────────────┐    │
│  │  Middleware  │  │  Models  │  │  Config                │    │
│  │  AuthMW      │  │  User    │  │  database.php          │    │
│  │  RoleMW      │  │  Truck   │  │  cors.php              │    │
│  └──────────────┘  │  Route   │  │  jwt.php               │    │
│                    │  Point   │  └────────────────────────┘    │
│                    │  Log     │                                 │
│                    └──────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER (MySQL)                      │
│                                                                 │
│   collection_points  ──┐                                        │
│   trucks              ─┼──► collection_routes                  │
│   collection_logs  ◄───┘        │                              │
│                                 ▼                               │
│                           [Historique]                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technologies utilisées

### Backend
| Technologie | Version | Rôle |
|-------------|---------|------|
| PHP | 8.x | Langage serveur |
| MySQL | 8.x | Base de données relationnelle |
| JWT | — | Authentification stateless |
| Apache / .htaccess | — | Routage URL |

### Frontend Web
| Technologie | Version | Rôle |
|-------------|---------|------|
| React | 18.x | Framework UI |
| React Router | 6.x | Navigation SPA |
| Axios | — | Appels API REST |
| Tailwind CSS / CSS | — | Stylisation |
| Port | **3000** | Serveur de développement |

### Application Mobile
| Technologie | Version | Rôle |
|-------------|---------|------|
| React Native | — | Framework mobile cross-platform |
| Expo | — | Toolchain et build |
| Expo Router | — | Navigation par fichiers (`/app`) |
| React Native Maps | — | Affichage GPS (optionnel) |

---

## Structure des projets

### Backend PHP

```
C:\PFE\Backeend\
│
├── .env                        ← Variables d'environnement (DB, JWT secret...)
├── .htaccess                   ← Réécriture d'URL Apache (routing)
├── index.php                   ← Point d'entrée unique (Front Controller)
├── positions_data.json         ← Cache JSON positions GPS (optionnel)
│
├── config/
│   ├── cors.php                ← Configuration CORS (autorise React et Mobile)
│   ├── database.php            ← Connexion PDO à MySQL
│   └── jwt.php                 ← Clé secrète et config JWT
│
├── controllers/
│   ├── AuthController.php      ← Login / Register / Logout
│   ├── LogController.php       ← Gestion des logs de collecte
│   ├── PointController.php     ← CRUD points de collecte
│   ├── PositionController.php  ← Réception/lecture positions GPS
│   ├── RouteController.php     ← CRUD tournées/routes
│   ├── TruckController.php     ← CRUD camions
│   └── UserController.php      ← Gestion des utilisateurs (admin)
│
├── middleware/
│   ├── AuthMiddleware.php      ← Vérification token JWT
│   └── RoleMiddleware.php      ← Vérification des rôles (admin, agent...)
│
├── models/
│   ├── CollectionLog.php       ← Modèle log de collecte
│   ├── CollectionPoint.php     ← Modèle point de collecte
│   ├── CollectionRoute.php     ← Modèle tournée/route
│   ├── register.php            ← Logique d'enregistrement utilisateur
│   ├── Truck.php               ← Modèle camion
│   └── User.php                ← Modèle utilisateur
│
├── routes/
│   └── api.php                 ← Définition de toutes les routes API REST
│
├── services/
│   ├── AuthService.php         ← Logique métier authentification
│   ├── LogService.php          ← Logique métier logs
│   ├── PointService.php        ← Logique métier points
│   ├── RouteService.php        ← Logique métier routes
│   └── TruckService.php        ← Logique métier camions
│
└── utils/
    ├── Response.php            ← Helper réponses JSON standardisées
    └── Validator.php           ← Validation des données entrantes
```

---

### Frontend Web React

```
C:\PFE\Web\
├── package.json
├── public/
└── src/
    │
    ├── App.jsx                 ← Composant racine + définition des routes React
    ├── index.js                ← Point d'entrée React DOM
    │
    ├── assets/
    │   └── Logo.png            ← Logo de l'application
    │
    ├── components/
    │   ├── layout/
    │   │   ├── Layout.jsx      ← Structure globale (sidebar + contenu)
    │   │   └── Sidebar.jsx     ← Menu de navigation latéral
    │   │
    │   └── ui/
    │       ├── Badge.jsx       ← Badge statut (collecté, incident, etc.)
    │       ├── Btn.jsx         ← Bouton réutilisable
    │       ├── Input.jsx       ← Champ de saisie
    │       ├── Modal.jsx       ← Fenêtre modale générique
    │       ├── PageHeader.jsx  ← En-tête de page avec titre et actions
    │       ├── Select.jsx      ← Sélecteur déroulant
    │       └── StatCard.jsx    ← Carte statistique pour le dashboard
    │
    ├── data/
    │   └── mockData.js         ← Données de test / maquettage
    │
    ├── pages/
    │   ├── Dashboard.jsx       ← Vue d'ensemble opérationnelle
    │   ├── DriverMapPage.jsx   ← Carte des chauffeurs en temps réel
    │   ├── LoginPage.jsx       ← Page de connexion
    │   ├── LogsPage.jsx        ← Historique des logs de collecte
    │   ├── MyRoutePage.jsx     ← Tournée de l'agent connecté
    │   ├── PointsPage.jsx      ← CRUD points de collecte
    │   ├── RoutesPage.jsx      ← CRUD tournées/routes
    │   ├── TrucksPage.jsx      ← CRUD camions
    │   └── UsersPage.jsx       ← Gestion des utilisateurs (admin)
    │
    └── utils/
        └── constants.js        ← URL API, constantes globales
```

**Port de développement :** `http://localhost:3000`

---

### Application Mobile React Native (Expo)

```
C:\PFE\Mobile\
└── app/
    │
    ├── _layout.tsx             ← Layout racine Expo Router (navigation globale)
    ├── modal.tsx               ← Écran modal global
    │
    └── (tabs)/
        ├── _layout.tsx         ← Configuration de la navigation par onglets
        ├── index.tsx           ← Écran d'accueil / splash
        ├── login.jsx           ← Écran de connexion agent
        ├── home.jsx            ← Tableau de bord agent (points du jour)
        ├── my-route.jsx        ← Vue de la tournée assignée à l'agent
        └── explore.tsx         ← Carte / exploration des points
```

> **Note :** L'application utilise **Expo Router** avec une navigation par onglets (tabs). Le dossier `(tabs)` est une convention Expo Router pour regrouper les écrans accessibles via la barre de navigation.

---

##  Modèle Conceptuel de Données (MCD)

```
┌───────────────────┐       ┌──────────────────────────┐
│       USERS       │       │     COLLECTION_POINTS     │
├───────────────────┤       ├──────────────────────────┤
│ id (PK)           │       │ id (PK)                  │
│ name              │       │ name                     │
│ email             │       │ latitude                 │
│ password          │       │ longitude                │
│ role              │       │ zone                     │
│ created_at        │       │ type                     │
└────────┬──────────┘       │ status                   │
         │                  │ route_id (FK)            │
         │ assigned_to      └──────────┬───────────────┘
         │                             │
         ▼                             │ belongs_to
┌──────────────────────────┐           │
│    COLLECTION_ROUTES     │◄──────────┘
├──────────────────────────┤
│ id (PK)                  │       ┌──────────────────┐
│ name                     │       │      TRUCKS      │
│ truck_id (FK) ───────────┼──────►├──────────────────┤
│ status                   │       │ id (PK)          │
│ scheduled_date           │       │ plate_number     │
│ created_at               │       │ model            │
└──────────┬───────────────┘       │ status           │
           │                       │ driver_id (FK)   │
           │ generates             └──────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│         COLLECTION_LOGS          │
├──────────────────────────────────┤
│ id (PK)                          │
│ route_id (FK)                    │
│ point_id (FK)                    │
│ agent_id (FK)                    │
│ status (collected/not/problem)   │
│ note                             │
│ collected_at                     │
└──────────────────────────────────┘
```

**Cardinalités :**

| Relation | Cardinalité |
|----------|-------------|
| Route → Points | 1,N (une route a plusieurs points) |
| Route → Truck | N,1 (plusieurs routes peuvent utiliser un camion) |
| Route → Logs | 1,N (une route génère plusieurs logs) |
| Point → Logs | 1,N (un point peut avoir plusieurs passages) |
| User → Truck | 1,1 (un chauffeur est assigné à un camion) |

---

##  Modèle Logique de Données (MLD)

```sql
users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'agent') DEFAULT 'agent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)

trucks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  model VARCHAR(100),
  status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
  driver_id INT,
  FOREIGN KEY (driver_id) REFERENCES users(id)
)

collection_routes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  truck_id INT,
  status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
  scheduled_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (truck_id) REFERENCES trucks(id)
)

collection_points (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  zone VARCHAR(100),
  type VARCHAR(50),
  status ENUM('active', 'inactive') DEFAULT 'active',
  route_id INT,
  FOREIGN KEY (route_id) REFERENCES collection_routes(id)
)

collection_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  route_id INT NOT NULL,
  point_id INT NOT NULL,
  agent_id INT NOT NULL,
  status ENUM('collected', 'not_collected', 'problem') NOT NULL,
  note TEXT,
  collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES collection_routes(id),
  FOREIGN KEY (point_id) REFERENCES collection_points(id),
  FOREIGN KEY (agent_id) REFERENCES users(id)
)
```

---

##  Description des tables

### `users`
Gère tous les utilisateurs du système (admins, responsables, agents/chauffeurs).

| Champ | Type | Description |
|-------|------|-------------|
| id | INT PK | Identifiant unique |
| name | VARCHAR(100) | Nom complet |
| email | VARCHAR(150) | Email de connexion (unique) |
| password | VARCHAR(255) | Mot de passe hashé (bcrypt) |
| role | ENUM | `admin` / `manager` / `agent` |

### `trucks`
Registre des camions de collecte.

| Champ | Type | Description |
|-------|------|-------------|
| id | INT PK | Identifiant unique |
| plate_number | VARCHAR(20) | Immatriculation (unique) |
| model | VARCHAR(100) | Modèle du véhicule |
| status | ENUM | `active` / `maintenance` / `inactive` |
| driver_id | INT FK | Référence vers `users` |

### `collection_routes`
Définit les tournées de collecte planifiées.

| Champ | Type | Description |
|-------|------|-------------|
| id | INT PK | Identifiant unique |
| name | VARCHAR(100) | Nom de la tournée |
| truck_id | INT FK | Référence vers `trucks` |
| status | ENUM | `pending` / `in_progress` / `completed` |
| scheduled_date | DATE | Date prévue de la tournée |

### `collection_points`
Points de collecte (bacs, conteneurs, etc.) géolocalisés.

| Champ | Type | Description |
|-------|------|-------------|
| id | INT PK | Identifiant unique |
| name | VARCHAR(100) | Nom / libellé du point |
| latitude | DECIMAL(10,8) | Coordonnée GPS latitude |
| longitude | DECIMAL(11,8) | Coordonnée GPS longitude |
| zone | VARCHAR(100) | Zone géographique |
| type | VARCHAR(50) | Type de déchets (ménagers, recyclage…) |
| route_id | INT FK | Référence vers `collection_routes` |

### `collection_logs`
Enregistre chaque passage d'un agent sur un point de collecte.

| Champ | Type | Description |
|-------|------|-------------|
| id | INT PK | Identifiant unique |
| route_id | INT FK | Tournée concernée |
| point_id | INT FK | Point concerné |
| agent_id | INT FK | Agent qui a effectué l'action |
| status | ENUM | `collected` / `not_collected` / `problem` |
| note | TEXT | Commentaire libre (bac plein, accès bloqué…) |
| collected_at | TIMESTAMP | Horodatage de l'action |

---

##  API REST – Endpoints

### Authentification
| Méthode | Endpoint | Description | 
|---------|----------|-------------|
| POST | `/api/auth/login` | Connexion (retourne JWT) |  
| POST | `/api/auth/register` | Inscription |  
| POST | `/api/auth/logout` | Déconnexion |  

### Points de collecte
| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| GET | `/api/points` | Liste tous les points | Agent+ |
| GET | `/api/points/{id}` | Détail d'un point | Agent+ |
| POST | `/api/points` | Créer un point | Manager+ |
| PUT | `/api/points/{id}` | Modifier un point | Manager+ |
| DELETE | `/api/points/{id}` | Supprimer un point | Admin |

### Tournées
| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| GET | `/api/routes` | Liste toutes les tournées | Agent+ |
| GET | `/api/routes/{id}` | Détail d'une tournée | Agent+ |
| POST | `/api/routes` | Créer une tournée | Manager+ |
| PUT | `/api/routes/{id}` | Modifier une tournée | Manager+ |
| DELETE | `/api/routes/{id}` | Supprimer une tournée | Admin |

### Camions
| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| GET | `/api/trucks` | Liste tous les camions | Manager+ |
| POST | `/api/trucks` | Ajouter un camion | Admin |
| PUT | `/api/trucks/{id}` | Modifier un camion | Manager+ |
| DELETE | `/api/trucks/{id}` | Supprimer un camion | Admin |

### Logs de collecte
| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| GET | `/api/logs` | Historique complet | Manager+ |
| GET | `/api/logs/route/{id}` | Logs par tournée | Agent+ |
| POST | `/api/logs` | Enregistrer une action | Agent+ |

### Position GPS (temps réel)
| Méthode | Endpoint | Description | Rôle |
|---------|----------|-------------|------|
| POST | `/api/positions` | Envoyer position | Agent |
| GET | `/api/positions` | Lire positions actives | Manager+ |

---

##  Fonctionnalités détaillées

###  Application Mobile (React Native / Expo)

**Écran de connexion** (`login.jsx`)
- Authentification par email / mot de passe
- Récupération et stockage du token JWT

**Tableau de bord agent** (`home.jsx`)
- Résumé du nombre de points collectés / restants sur la journée
- Accès rapide à la tournée du jour

**Ma tournée** (`my-route.jsx`)
- Liste ordonnée des points à collecter
- Pour chaque point : nom, adresse, type
- Actions :  Collecté |  Non collecté |  Problème
- Ajout d'une note libre (ex. : "bac plein", "accès bloqué")

**Exploration / Carte** (`explore.tsx`)
- Vue cartographique des points de collecte
- Suivi GPS en temps réel (envoi de position vers le backend)

---

### Application Web React (Port 3000)

**Dashboard** (`Dashboard.jsx`)
- Taux de collecte du jour (% points collectés)
- Nombre de points problématiques
- Nombre de camions actifs
- Graphiques / cartes statistiques (StatCard)

**Gestion des points** (`PointsPage.jsx`)
- Tableau avec pagination et filtres
- CRUD complet : ajout, modification, suppression
- Champs : nom, GPS, zone, type, statut, tournée associée

**Gestion des tournées** (`RoutesPage.jsx`)
- Création d'une route avec association camion + points
- Suivi de l'état : En attente / En cours / Terminée
- Consultation détaillée : points collectés vs restants

**Suivi en temps réel** (`DriverMapPage.jsx`)
- Carte avec position des camions en mouvement
- Vue des incidents en cours

**Historique** (`LogsPage.jsx`)
- Filtrage par zone, tournée, date, statut
- Export possible

**Gestion des utilisateurs** (`UsersPage.jsx`) — Admin uniquement
- Création et attribution des rôles
- Désactivation de comptes


##  Règles métier

1. **Un point = une route :** Chaque point de collecte appartient à une route ou une zone. Un point ne peut pas être dans deux routes actives simultanément.

2. **Traçabilité obligatoire :** Chaque passage d'un agent sur un point crée automatiquement une entrée dans `collection_logs` (même si non collecté).

3. **Protection contre la double collecte :** Un point marqué "collecté" ne peut pas être recollecté sur la même tournée sans justification explicite (note obligatoire).

4. **Authentification stateless :** Toutes les routes API (sauf login/register) nécessitent un token JWT valide dans le header `Authorization: Bearer <token>`.

5. **Contrôle des rôles :**
   - `agent` → lecture seule + mise à jour des logs
   - `manager` → gestion des points, routes, camions
   - `admin` → accès total + gestion des utilisateurs


##  Installation et démarrage

### Prérequis
- PHP >= 8.0 + Apache/XAMPP
- MySQL >= 8.0
- Node.js >= 18.x
- npm >= 9.x
- Expo CLI : `npm install -g expo-cli`

### 1. Backend PHP

```bash
# Cloner / déposer les fichiers dans le répertoire Apache
# Ex : C:\xampp\htdocs\PFE\Backeend\

# Configurer la base de données
cp .env.example .env
# Éditer .env avec vos paramètres DB et JWT_SECRET

# Importer la base de données
mysql -u root -p < database.sql
```

Accès API : `http://localhost/PFE/Backeend/api/`


### 2. Frontend Web React

```bash
cd C:\PFE\Web

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm start
# ou
npm run dev
```

Accès : `http://localhost:3000`

### 3. Application Mobile React Native

```bash
cd C:\PFE\Mobile

# Installer les dépendances
npm install

# Démarrer Expo
npx expo start

# Choisir :
# [a] Android emulator
# [i] iOS simulator
# Ou scanner le QR code avec Expo Go (téléphone physique)
```


##  Variables d'environnement

Fichier `.env` (Backend) :

```env
# Base de données
DB_HOST=localhost
DB_NAME=waste_collection
DB_USER=root
DB_PASS=

# JWT
JWT_SECRET=votre_cle_secrete_tres_longue
JWT_EXPIRY=86400

# Application
APP_ENV=development
APP_URL=http://localhost/PFE/Backeend
```

Fichier `utils/constants.js` (Frontend React) :

```javascript
export const API_BASE_URL = "http://localhost/PFE/Backeend/api";
```

---

##  Démonstration vidéo

>  **[Cliquez ici pour regarder la démo du projet](VOTRE_LIEN_VIDEO_ICI)**  

La démonstration couvre :
- Connexion en tant qu'agent (mobile) et responsable (web)
- Création d'une tournée et association d'un camion
- Suivi d'une collecte en temps réel (mobile)
- Consultation du dashboard et de l'historique (web)
- Gestion des incidents signalés

##  Contact

| | |
|---|---|
| **Étudiant** | [Sahmad Fatima-ezzahra] |
| **Email** | [votre.email@ens.ac.ma] |
| **Établissement** | ENS Marrakech – Département Informatique |
| **Encadrant** | [Mohamed Lachgar] |

---

*© 2026 – Projet de Fin d'Études – ENS Marrakech*
