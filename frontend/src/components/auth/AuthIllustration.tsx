'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';

/**
 * Photo de la colonne de droite des pages d'authentification.
 * Le layout (auth) est commun à /login et /signup ; la maquette prévoit une
 * photo différente pour chacune, d'où la lecture de l'URL avec usePathname.
 *
 * alt="" : image purement décorative, ignorée par les lecteurs d'écran (WCAG 1.1.1).
 * priority : image visible dès l'arrivée sur la page → chargée en premier (LCP).
 */
export default function AuthIllustration() {
  const pathname = usePathname();
  const src = pathname.startsWith('/signup') ? '/images/signup.webp' : '/images/login.webp';

  return <Image src={src} alt="" fill priority sizes="60vw" className="object-cover" />;
}
