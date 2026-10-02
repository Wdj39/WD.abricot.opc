import type { User } from '@/types';

/**
 * Initiales affichées dans l'avatar :
 * - "Alice Martin"      → "AM"
 * - "Alice"             → "AL"
 * - pas de nom (null)   → 2 premières lettres de l'email
 */
export function getInitials(user: Pick<User, 'name' | 'email'>): string {
  const source = user.name?.trim() || user.email;
  const words = source.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}
