import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TOKEN_COOKIE } from '@/lib/constants';

// Pages réservées aux utilisateurs connectés
const PROTECTED_ROUTES = ['/dashboard', '/projects', '/profile'];
// Pages réservées aux visiteurs non connectés
const AUTH_ROUTES = ['/login', '/signup'];

/**
 * Le proxy (ex-"middleware" avant Next.js 16) s'exécute AVANT l'affichage
 * de chaque page. Il ne fait qu'un contrôle rapide : le cookie est-il présent ?
 * La validité réelle du token est vérifiée ensuite par le backend
 * (voir getCurrentUser dans lib/api.ts).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = request.cookies.has(TOKEN_COOKIE);

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthPage = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Visiteur non connecté sur une page protégée → page de connexion
  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Utilisateur déjà connecté sur /login ou /signup → tableau de bord
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// Le proxy ignore les fichiers techniques (JS, CSS, images, favicon)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
