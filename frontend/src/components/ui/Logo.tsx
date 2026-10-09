import Image from 'next/image';

/**
 * Logo Abricot (SVG vectoriel extrait de la maquette Figma).
 * - variant "orange" : header et pages de connexion / inscription
 * - variant "black"  : footer
 * - width : la hauteur est calculée pour garder les proportions (252 × 32)
 *
 * `unoptimized` : un SVG est déjà vectoriel, inutile de le faire passer par
 * l'optimiseur d'images de Next (qui sert aux photos PNG/JPEG/WebP).
 */
const RATIO = 32 / 252;

export default function Logo({
  variant = 'orange',
  width = 147,
  alt = 'Abricot',
  priority = false,
}: {
  variant?: 'orange' | 'black';
  width?: number;
  alt?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={`/logo/logo-${variant}.svg`}
      alt={alt}
      width={width}
      height={Math.round(width * RATIO)}
      priority={priority}
      unoptimized
    />
  );
}
