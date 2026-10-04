// Utilisateur tel que renvoyé par le backend
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

// Erreur de validation renvoyée par le backend
export interface ValidationError {
  field: string;
  message: string;
}

// Format standard de toutes les réponses de l'API
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Données renvoyées par /auth/login et /auth/register
export interface AuthData {
  user: User;
  token: string;
}

// État renvoyé aux formulaires de connexion / inscription :
// - error : message à afficher
// - email : valeur saisie, réaffichée après une erreur (React 19 vide
//   le formulaire après chaque envoi). Le mot de passe n'est jamais renvoyé.
export type AuthFormState = { error?: string; email?: string } | undefined;

// État renvoyé aux formulaires de la page "Mon compte"
// - success : message de confirmation
// - values  : valeurs saisies, réaffichées après une erreur
export type ProfileFormState =
  | {
      error?: string;
      success?: string;
      values?: { firstName: string; lastName: string; email: string };
    }
  | undefined;

// État du formulaire de changement de mot de passe
export type PasswordFormState = { error?: string; success?: string } | undefined;

// ===== Tâches =====

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Version allégée d'un utilisateur, incluse dans les tâches et commentaires
export interface UserSummary {
  id: string;
  name: string | null;
  email: string;
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: UserSummary;
}

// Tâche telle que renvoyée par GET /dashboard/assigned-tasks
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  projectId: string;
  // description absente quand la tâche vient de GET /projects/:id/tasks
  project: { id: string; name: string; description?: string | null };
  assignees: { id: string; user: UserSummary }[];
  comments: Comment[];
}

// ===== Projets =====

// ADMIN = propriétaire ou administrateur, CONTRIBUTOR = simple membre
export type ProjectRole = 'ADMIN' | 'CONTRIBUTOR';

// Projet tel que renvoyé par GET /projects
export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner: UserSummary;
  members: { id: string; role: ProjectRole; user: UserSummary }[];
  _count: { tasks: number };
  userRole: ProjectRole | null;
}

// Projet enrichi avec sa progression, calculée côté frontend
export interface ProjectWithProgress extends Project {
  doneCount: number;
  totalCount: number;
}

// État des formulaires de création / modification de projet
// values : titre et description réaffichés après une erreur
export type ProjectFormState =
  { error?: string; success?: boolean; values?: { name: string; description: string } } | undefined;

// Valeurs du formulaire de tâche (réaffichées après une erreur)
export interface TaskFormValues {
  title: string;
  description: string;
  dueDate: string; // format AAAA-MM-JJ attendu par <input type="date">
  status: TaskStatus;
  priority: TaskPriority;
  assigneeIds: string[];
}

export type TaskFormState =
  { error?: string; success?: boolean; values?: TaskFormValues } | undefined;
