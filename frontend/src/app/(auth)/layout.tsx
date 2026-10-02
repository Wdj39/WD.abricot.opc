export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Colonne gauche : logo + formulaire */}
      <div className="w-full lg:w-2/5 bg-grey-50 flex flex-col items-center px-6 py-12">
        <span className="text-3xl font-bold text-brand-main">ABRICOT</span>
        <main className="flex-1 w-full max-w-sm flex flex-col justify-center">
          {children}
        </main>
      </div>

      {/* Colonne droite : visuel (masqué sur mobile/tablette) */}
      <div
        className="hidden lg:block lg:w-3/5 bg-grey-200"
        aria-hidden="true"
      />
    </div>
  );
}