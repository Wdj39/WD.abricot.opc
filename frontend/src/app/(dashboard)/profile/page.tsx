import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/api';
import ProfileForm from '@/components/profile/ProfileForm';
import PasswordForm from '@/components/profile/PasswordForm';

export default async function ProfilePage() {
  // Grâce à cache(), cet appel réutilise le résultat déjà obtenu par le layout
  const user = await getCurrentUser();
  if (!user) redirect('/logout');

  return (
    <div className="max-w-3xl flex flex-col gap-8">
      <section
        aria-labelledby="account-title"
        className="bg-white rounded-xl border border-grey-200 p-8 flex flex-col gap-6"
      >
        <div>
          <h1 id="account-title" className="text-2xl font-semibold text-grey-950">
            Mon compte
          </h1>
          <p className="text-grey-600">{user.name ?? user.email}</p>
        </div>
        <ProfileForm user={user} />
      </section>

      <section
        aria-labelledby="password-title"
        className="bg-white rounded-xl border border-grey-200 p-8 flex flex-col gap-6"
      >
        <h2 id="password-title" className="text-xl font-semibold text-grey-950">
          Mot de passe
        </h2>
        <PasswordForm />
      </section>
    </div>
  );
}
