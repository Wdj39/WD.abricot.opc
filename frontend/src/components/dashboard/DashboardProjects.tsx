import Link from 'next/link';
import { CalendarIcon } from '@/components/ui/Icons';
import { formatDueDate, isOverdue } from '@/lib/tasks';
import type { DashboardProject } from '@/types';

/**
 * 3e vue du tableau de bord (exigée par les spécifications, absente de la
 * maquette) : les projets dans lesquels l'utilisateur a des tâches
 * assignées, les plus urgents d'abord.
 *
 * Urgence d'un projet = échéance la plus proche parmi SES tâches non
 * terminées (une tâche en retard a une date passée, elle remonte donc en tête).
 * Les projets dont toutes les tâches sont terminées passent en dernier.
 */

type ProjectSummary = {
  project: DashboardProject;
  doneCount: number;
  nextDueDate: string | null;
  overdue: boolean;
};

function summarize(project: DashboardProject): ProjectSummary {
  const openTasks = project.tasks.filter((t) => t.status !== 'DONE' && t.status !== 'CANCELLED');
  const dueDates = openTasks
    .map((t) => t.dueDate)
    .filter((d): d is string => d !== null)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  return {
    project,
    doneCount: project.tasks.filter((t) => t.status === 'DONE').length,
    nextDueDate: dueDates[0] ?? null,
    // isOverdue attend une tâche : on lui passe la tâche ouverte la plus urgente
    overdue: openTasks.some((t) => isOverdue({ ...t, project })),
  };
}

/** Tri par urgence : échéance la plus proche d'abord, sans échéance ensuite */
function byUrgency(a: ProjectSummary, b: ProjectSummary): number {
  const dateA = a.nextDueDate ? new Date(a.nextDueDate).getTime() : Infinity;
  const dateB = b.nextDueDate ? new Date(b.nextDueDate).getTime() : Infinity;
  return dateA - dateB;
}

export default function DashboardProjects({ projects }: { projects: DashboardProject[] }) {
  const summaries = projects.map(summarize).sort(byUrgency);

  return (
    <section
      aria-labelledby="projects-title"
      className="bg-white rounded-xl border border-grey-200 p-6 sm:p-8 flex flex-col gap-6"
    >
      <div>
        <h2 id="projects-title" className="text-lg font-semibold text-grey-950">
          Mes projets en cours
        </h2>
        <p className="text-sm text-grey-600">
          Projets où vous avez des tâches, les plus urgents d&apos;abord
        </p>
      </div>

      {summaries.length === 0 ? (
        <p className="py-10 text-center text-grey-600">
          Aucune tâche ne vous est assignée dans un projet pour l&apos;instant.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {summaries.map(({ project, doneCount, nextDueDate, overdue }) => {
            const total = project.tasks.length;
            const percent = total === 0 ? 0 : Math.round((doneCount / total) * 100);
            return (
              <li key={project.id}>
                <article className="rounded-xl border border-grey-200 p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-col gap-3 min-w-0 flex-1">
                    <div>
                      <h3 className="font-semibold text-grey-950">{project.name}</h3>
                      {project.description && (
                        <p className="text-sm text-grey-600 line-clamp-1">{project.description}</p>
                      )}
                    </div>

                    {/* Progression de MES tâches dans ce projet */}
                    <div className="flex flex-col gap-1 max-w-md">
                      <div className="flex justify-between text-xs text-grey-600">
                        <span>
                          {doneCount}/{total} de mes tâches terminées
                        </span>
                        <span>{percent}%</span>
                      </div>
                      <div
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Progression de mes tâches dans ${project.name}`}
                        className="h-2 rounded-full bg-grey-100 overflow-hidden"
                      >
                        <div
                          className="h-full rounded-full bg-brand-main"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <p
                      className={`flex items-center gap-1.5 text-xs ${overdue ? 'text-error-red' : 'text-grey-600'}`}
                    >
                      <CalendarIcon size={14} />
                      {nextDueDate ? (
                        <>
                          Prochaine échéance : {formatDueDate(nextDueDate)}
                          {overdue && <span className="font-medium">· En retard</span>}
                        </>
                      ) : (
                        'Aucune échéance à venir'
                      )}
                    </p>
                  </div>

                  <Link
                    href={`/projects/${project.id}`}
                    className="shrink-0 inline-flex items-center justify-center h-10 px-6 rounded-lg bg-grey-950 text-white text-sm font-medium hover:bg-grey-800 transition"
                  >
                    Voir<span className="sr-only"> le projet {project.name}</span>
                  </Link>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
