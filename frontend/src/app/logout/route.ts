import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TOKEN_COOKIE } from '@/lib/constants';

/**
 * Route de secours appelée quand le token n'est plus valide (expiré, utilisateur
 * supprimé…). Une page ne peut pas supprimer un cookie pendant son affichage :
 * on passe donc par cette route, qui supprime le cookie puis renvoie vers /login.
 * Sans elle, le proxy verrait toujours le cookie → boucle de redirections.
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
  return NextResponse.redirect(new URL('/login', request.url));
}
