import { redirect } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getCurrentUser } from '@/lib/api';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Le proxy a vérifié que le cookie existe ; ici on vérifie qu'il est VALIDE
  const user = await getCurrentUser();

  // Token expiré ou invalide → on nettoie le cookie et on renvoie vers /login
  if (!user) redirect('/logout');

  return (
    <div className="min-h-screen flex flex-col bg-grey-50">
      <Header user={user} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">{children}</main>
      <Footer />
    </div>
  );
}
