'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/actions/auth';
import { getInitials } from '@/lib/utils';
import type { User } from '@/types';

// Liens de navigation principaux
const navLinks = [
  { href: '/dashboard', label: 'Tableau de bord' },
  { href: '/projects', label: 'Projets' },
];

export default function Header({ user }: { user: User }) {
  const pathname = usePathname();

  // Un lien est actif si l'URL actuelle commence par son href
  // (ex: /projects/abc123 active aussi "Projets")
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header className="bg-white border-b border-grey-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="text-2xl font-bold text-brand-main">
          ABRICOT
        </Link>

        {/* Navigation */}
        <nav aria-label="Navigation principale" className="flex items-center gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                isActive(link.href)
                  ? 'bg-grey-950 text-white'
                  : 'text-brand-main hover:bg-brand-light'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {/* Déconnexion : le formulaire appelle directement l'action serveur */}
          <form action={logout}>
            <button type="submit" className="text-sm text-grey-600 underline hover:text-brand-dark">
              Déconnexion
            </button>
          </form>

          {/* Avatar utilisateur avec ses vraies initiales */}
          <Link
            href="/profile"
            aria-label={`Mon compte (${user.name ?? user.email})`}
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              isActive('/profile') ? 'bg-brand-dark text-white' : 'bg-brand-light text-brand-dark'
            }`}
          >
            {getInitials(user)}
          </Link>
        </div>
      </div>
    </header>
  );
}
