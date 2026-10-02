import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE } from '@/lib/constants';
import type { ApiResponse, User, ValidationError } from '@/types';

/**
 * Appel authentifié au backend : ajoute automatiquement le token JWT
 * (lu dans le cookie httpOnly) dans l'en-tête Authorization.
 * Renvoie soit les données, soit un message d'erreur lisible.
 * "server-only" garantit que ce fichier ne sera jamais envoyé au navigateur.
 */
export async function apiFetch<T>(
  endpoint: string,
  init: { method?: string; body?: unknown } = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return { error: 'Session expirée. Veuillez vous reconnecter.', status: 401 };

  try {
    const response = await fetch(`${process.env.API_URL}${endpoint}`, {
      method: init.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: 'no-store', // toujours les données à jour
    });

    // En cas d'erreur de validation, "data" contient { errors: [...] }
    const result: ApiResponse<T & { errors?: ValidationError[] }> = await response.json();

    if (!response.ok || !result.success) {
      const detail = result.data?.errors?.[0]?.message;
      return {
        error: detail ?? result.message ?? 'Une erreur est survenue.',
        status: response.status,
      };
    }

    return { data: result.data, status: response.status };
  } catch {
    return { error: 'Le serveur est indisponible. Réessayez plus tard.', status: 503 };
  }
}

/**
 * Récupère l'utilisateur connecté (GET /auth/profile).
 * - User → token valide
 * - null → pas de token, token expiré ou invalide
 * cache() : si le layout ET la page l'appellent pendant le même affichage,
 * le backend n'est interrogé qu'une seule fois.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const { data } = await apiFetch<{ user: User }>('/auth/profile');
  return data?.user ?? null;
});
