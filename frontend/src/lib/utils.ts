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

/**
 * Le backend stocke un seul champ "name" ; la maquette affiche Prénom + Nom.
 * - "Alice Martin"        → { firstName: "Alice", lastName: "Martin" }
 * - "Jean Paul Dupont"    → { firstName: "Jean", lastName: "Paul Dupont" }
 * - null                  → champs vides
 */
export function splitName(name: string | null): { firstName: string; lastName: string } {
  const [firstName = '', ...rest] = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return { firstName, lastName: rest.join(' ') };
}
