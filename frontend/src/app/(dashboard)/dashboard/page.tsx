import { redirect } from 'next/navigation';
import { apiFetch, getCurrentUser } from '@/lib/api';
import { currentMonth } from '@/lib/tasks';
import DashboardTasks, {
  DashboardTabs,
  type DashboardView,
} from '@/components/dashboard/DashboardTasks';
import DashboardProjects from '@/components/dashboard/DashboardProjects';
import ProjectModalButton from '@/components/projects/ProjectModalButton';
import type { DashboardProject, Task } from '@/types';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; month?: string }>;
}) {
  const { view, month } = await searchParams;
  const currentView: DashboardView =
    view === 'kanban' ? 'kanban' : view === 'projects' ? 'projects' : 'list';
  // Mois du Kanban : celui de l'URL s'il est valide (AAAA-MM), sinon le mois courant
  const kanbanMonth = month && /^\d{4}-(0[1-9]|1[0-2])$/.test(month) ? month : currentMonth();

  const user = await getCurrentUser();
  if (!user) redirect('/logout');

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-grey-950">Tableau de bord</h1>
          <p className="text-grey-950">
            Bonjour {user.name || user.email}, voici un aperçu de vos projets et tâches
          </p>
        </div>
        <ProjectModalButton />
      </div>

      <DashboardTabs view={currentView} />

      {/* Chaque vue ne charge que les données dont elle a besoin */}
      {currentView === 'projects' ? (
        <ProjectsView />
      ) : (
        <TasksView view={currentView} month={kanbanMonth} />
      )}
    </div>
  );
}

async function TasksView({ view, month }: { view: 'list' | 'kanban'; month: string }) {
  const { data, error } = await apiFetch<{ tasks: Task[] }>('/dashboard/assigned-tasks');
  if (error) return <LoadError what="vos tâches" error={error} />;
  return <DashboardTasks tasks={data?.tasks ?? []} view={view} month={month} />;
}

async function ProjectsView() {
  const { data, error } = await apiFetch<{ projects: DashboardProject[] }>(
    '/dashboard/projects-with-tasks'
  );
  if (error) return <LoadError what="vos projets" error={error} />;
  return <DashboardProjects projects={data?.projects ?? []} />;
}

function LoadError({ what, error }: { what: string; error: string }) {
  return (
    <p role="alert" className="text-error-red">
      Impossible de charger {what} : {error}
    </p>
  );
}
