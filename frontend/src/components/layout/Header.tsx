'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import { getInitials } from '@/lib/utils';
import { DashboardIcon, FolderIcon } from '@/components/ui/Icons';
import Logo from '@/components/ui/Logo';
import type { User } from '@/types';

// Liens de navigation principaux, avec l'icône de la maquette
const navLinks = [
  { href: '/dashboard', label: 'Tableau de bord', Icon: DashboardIcon },
  { href: '/projects', label: 'Projets', Icon: FolderIcon },
];

export default function Header({ user }: { user: User }) {
  const pathname = usePathname();

  // Un lien est actif si l'URL actuelle commence par son href
  // (ex: /projects/abc123 active aussi "Projets")
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header className="bg-white border-b border-grey-200">
      {/* Responsive : sur téléphone, logo + compte sur une ligne, navigation en
          dessous sur toute la largeur ; à partir de md, tout tient sur une ligne */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        {/* Logo : le texte alternatif décrit la destination du lien */}
        <Link href="/dashboard" className="shrink-0">
          <Logo alt="Abricot – retour au tableau de bord" priority />
        </Link>

        {/* Navigation */}
        <nav
          aria-label="Navigation principale"
          className="order-last w-full grid grid-cols-2 gap-2 md:order-none md:w-auto md:flex md:items-center"
        >
          {navLinks.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center justify-center gap-2 md:gap-3 px-3 py-3 md:px-6 md:py-4 rounded-lg text-sm font-medium transition ${
                  active ? 'bg-grey-950 text-white' : 'text-brand-dark hover:bg-brand-light'
                }`}
              >
                {/* Icône en brand-main (contraste 4:1, suffisant pour une icône),
                    texte en brand-dark (6,3:1, requis pour du texte courant) */}
                <Icon size={22} className={active ? undefined : 'text-brand-main'} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Déconnexion : absente de la maquette mais indispensable.
              Le formulaire appelle directement l'action serveur. */}
          <form action={logout}>
            <button type="submit" className="text-sm text-grey-600 underline hover:text-brand-dark">
              Déconnexion
            </button>
          </form>

          {/* Avatar utilisateur avec ses vraies initiales */}
          <Link
            href="/profile"
            aria-label={`Mon compte (${user.name ?? user.email})`}
            aria-current={isActive('/profile') ? 'page' : undefined}
            className={`w-11 h-11 md:w-16 md:h-16 shrink-0 rounded-full flex items-center justify-center text-sm font-medium ${
              isActive('/profile') ? 'bg-brand-dark text-white' : 'bg-brand-light text-grey-950'
            }`}
          >
            {getInitials(user)}
          </Link>
        </div>
      </div>
    </header>
  );
}
