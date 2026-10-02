import { redirect } from 'next/navigation';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { splitName } from '@/lib/utils';
import DashboardTasks, { type DashboardView } from '@/components/dashboard/DashboardTasks';
import type { Task } from '@/types';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const currentView: DashboardView = view === 'kanban' ? 'kanban' : 'list';

  // Les deux appels partent en parallèle (Promise.all) au lieu de l'un après l'autre
  const [user, { data, error }] = await Promise.all([
    getCurrentUser(),
    apiFetch<{ tasks: Task[] }>('/dashboard/assigned-tasks'),
  ]);
  if (!user) redirect('/logout');

  const firstName = splitName(user.name).firstName;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-grey-950">Tableau de bord</h1>
        <p className="text-grey-600">
          Bonjour {firstName || user.email}, voici un aperçu de vos tâches.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-error-red">
          Impossible de charger vos tâches : {error}
        </p>
      ) : (
        <DashboardTasks tasks={data?.tasks ?? []} view={currentView} />
      )}
    </div>
  );
}
