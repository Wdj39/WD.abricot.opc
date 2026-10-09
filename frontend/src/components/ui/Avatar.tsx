import { getInitials } from '@/lib/utils';
import type { UserSummary } from '@/types';

/**
 * Pastille ronde avec les initiales d'un utilisateur.
 * - highlight : fond orange clair (propriétaire du projet, utilisateur connecté)
 * - sinon       : fond gris (autres membres), comme la maquette
 * Le nom complet est donné aux lecteurs d'écran et en infobulle (title).
 */
export default function Avatar({
  user,
  highlight = false,
  size = 'md',
}: {
  user: UserSummary;
  highlight?: boolean;
  size?: 'sm' | 'md';
}) {
  const label = user.name ?? user.email;
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-[11px]' : 'w-10 h-10 text-sm';
  const colorClass = highlight ? 'bg-brand-light text-grey-950' : 'bg-grey-200 text-grey-950';

  return (
    <span
      title={label}
      className={`inline-flex items-center justify-center rounded-full font-semibold ring-2 ring-white ${sizeClass} ${colorClass}`}
    >
      <span aria-hidden="true">{getInitials(user)}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
