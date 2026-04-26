export const STATUS_COLORS = {
  collecté:     { bg: "#D4F5E2", text: "#0F6E56", dot: "#1D9E75" },
  non_collecté: { bg: "#FAEEDA", text: "#854F0B", dot: "#EF9F27" },
  problème:     { bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A" },
  actif:        { bg: "#E6F1FB", text: "#185FA5", dot: "#378ADD" },
  maintenance:  { bg: "#FAEEDA", text: "#854F0B", dot: "#EF9F27" },
  en_cours:     { bg: "#E1F5EE", text: "#0F6E56", dot: "#1D9E75" },
  planifiée:    { bg: "#E6F1FB", text: "#185FA5", dot: "#378ADD" },
  terminée:     { bg: "#F1EFE8", text: "#5F5E5A", dot: "#888780" },
  inactif:      { bg: "#F1EFE8", text: "#5F5E5A", dot: "#888780" },
  hors_service: { bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A" },
};

// ─── Menus par rôle (cahier des charges) ─────────────────────────────────────
export const NAV_ITEMS = {

  // Admin : accès total
  admin: [
    { id: "dashboard",  label: "Dashboard" },
    { id: "points",   label: "Points de collecte" },
    { id: "trucks",  label: "Camions" },
    { id: "routes",   label: "Tournées" },
    { id: "logs",       label: "Suivi opérationnel" },
    { id: "users",    label: "Utilisateurs" },
  ],

  // Responsable propreté : gestion points + tournées + suivi, pas camions CRUD ni users
  responsable: [
    { id: "dashboard", label: "Dashboard" },
    { id: "points",    label: "Points de collecte" },
    { id: "trucks",    label: "Camions" },       // lecture seule
    { id: "routes",     label: "Tournées" },      // créer + associer camion
    { id: "logs",       label: "Suivi opérationnel" },
  ],

  // Chauffeur : uniquement sa tournée et ses collectes
  chauffeur: [
    { id: "dashboard",  label: "Dashboard" },
    { id: "my-route",  label: "Ma tournée" },
    { id: "logs",       label: "Mes collectes" },
  ],
};

export const ROLE_COLORS = {
  admin:       "#7F77DD",
  responsable: "#1D9E75",
  chauffeur:   "#378ADD",
};

// ─── Permissions par rôle ─────────────────────────────────────────────────────
export const PERMISSIONS = {
  admin: {
    points:  { create: true,  edit: true,  delete: true  },
    trucks:  { create: true,  edit: true,  delete: true  },
    routes:  { create: true,  edit: true,  delete: true  },
    logs:    { create: true,  edit: true,  delete: true  },
    users:   { view: true },
  },
  responsable: {
    points:  { create: true,  edit: true,  delete: false },
    trucks:  { create: false, edit: false, delete: false }, // lecture seule
    routes:  { create: true,  edit: true,  delete: false },
    logs:    { create: true,  edit: true,  delete: false },
    users:   { view: false },
  },
  chauffeur: {
    points:  { create: false, edit: false, delete: false },
    trucks:  { create: false, edit: false, delete: false },
    routes:  { create: false, edit: false, delete: false },
    logs:    { create: true,  edit: true,  delete: false }, // ses collectes seulement
    users:   { view: false },
  },
};

// Helper : vérifier une permission
export const can = (user, resource, action) => {
  const role = user?.role || "chauffeur";
  return PERMISSIONS[role]?.[resource]?.[action] === true;
};