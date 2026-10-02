import 'server-only';
import { cookies } from 'next/headers';
import { TOKEN_COOKIE } from '@/lib/constants';
import type { ApiResponse, User } from '@/types';

/**
 * Récupère l'utilisateur connecté auprès du backend (GET /auth/profile).
 * - User      → token valide
 * - null      → pas de token, token expiré ou invalide
 * Le token voyage dans l'en-tête Authorization, comme l'attend le backend.
 * "server-only" garantit que ce fichier ne sera jamais envoyé au navigateur.
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const response = await fetch(`${process.env.API_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store', // toujours la version à jour du profil
    });

    if (!response.ok) return null;

    const result: ApiResponse<{ user: User }> = await response.json();
    return result.data?.user ?? null;
  } catch {
    return null;
  }
}
