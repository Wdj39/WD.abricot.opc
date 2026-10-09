import Logo from '@/components/ui/Logo';

/**
 * Pied de page pleine largeur (maquette) : logo noir collé à gauche,
 * mention « Abricot 2025 » collée à droite.
 */
export default function Footer() {
  return (
    <footer className="bg-white mt-auto">
      <div className="w-full px-6 lg:px-8 py-5 flex items-center justify-between">
        <Logo variant="black" width={101} />
        <span className="text-sm text-grey-950">Abricot 2025</span>
      </div>
    </footer>
  );
}
