import AuthIllustration from '@/components/auth/AuthIllustration';
import Logo from '@/components/ui/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Colonne gauche : logo + formulaire (≈ 40 % de la largeur, comme la maquette) */}
      <div className="w-full lg:w-2/5 bg-grey-50 flex flex-col items-center px-6 py-12 lg:py-20">
        <Logo width={252} priority />
        <main className="flex-1 w-full max-w-sm flex flex-col">{children}</main>
      </div>

      {/* Colonne droite : photo décorative (masquée sur mobile/tablette) */}
      <div className="hidden lg:block lg:w-3/5 relative">
        <AuthIllustration />
      </div>
    </div>
  );
}
