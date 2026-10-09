import Link from 'next/link';
import Logo from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-grey-50 px-6 text-center">
      <Logo width={200} />
      <h1 className="text-6xl font-bold text-grey-950">404</h1>
      <p className="text-grey-600">Oups, cette page n&apos;existe pas ou a été déplacée.</p>
      <Link
        href="/dashboard"
        className="bg-grey-950 text-white px-6 py-3 rounded-lg font-medium hover:bg-grey-800 transition"
      >
        Retour au tableau de bord
      </Link>
    </div>
  );
}
