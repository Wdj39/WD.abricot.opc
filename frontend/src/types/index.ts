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
