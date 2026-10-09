'use client';

import { useMemo, useState } from 'react';
import ProjectTaskCard from '@/components/tasks/ProjectTaskCard';
import SearchBar from '@/components/ui/SearchBar';
import { ChevronDownIcon } from '@/components/ui/Icons';
import { STATUS_LABELS, filterTasks, sortByUrgency } from '@/lib/tasks';
import type { Task, TaskStatus, UserSummary } from '@/types';

type StatusFilter = 'ALL' | TaskStatus;
const FILTERS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

export default function ProjectTasks({
  tasks,
  projectId,
  members,
  currentUser,
  canEditTasks,
  initialOpenTaskId,
}: {
  tasks: Task[];
  projectId: string;
  members: UserSummary[];
  currentUser: UserSummary;
  canEditTasks: boolean;
  initialOpenTaskId?: string; // ?task=... dans l'URL (lien "Voir" du dashboard)
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');

  const visibleTasks = useMemo(() => {
    // Par défaut on masque les tâches annulées ; elles restent accessibles via le filtre
    const byStatus =
      status === 'ALL'
        ? tasks.filter((t) => t.status !== 'CANCELLED')
        : tasks.filter((t) => t.status === status);
    return sortByUrgency(filterTasks(byStatus, query));
  }, [tasks, query, status]);

  const isFiltered = query.trim() !== '' || status !== 'ALL';

  return (
    <section
      aria-labelledby="tasks-title"
      className="bg-white rounded-xl border border-grey-200 p-6 sm:p-10 flex flex-col gap-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {/* tabIndex=-1 : peut recevoir le focus après la suppression d'une tâche */}
          <h2 id="tasks-title" tabIndex={-1} className="text-lg font-semibold text-grey-950">
            Tâches
          </h2>
          <p className="text-sm text-grey-600">Par ordre de priorité</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* <select> natif (accessible au clavier et aux lecteurs d'écran),
              restylé avec le chevron de la maquette */}
          <label htmlFor="status-filter" className="sr-only">
            Filtrer par statut
          </label>
          <div className="relative">
            <select
              id="status-filter"
              value={status}
              onChange={(e) => setStatus(e.target.value as StatusFilter)}
              className="appearance-none h-11 w-full sm:w-44 pl-4 pr-10 rounded-lg border border-grey-200 bg-white text-sm text-grey-950 focus:outline-none focus:ring-2 focus:ring-brand-main"
            >
              <option value="ALL">Statut : tous</option>
              {FILTERS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
            <ChevronDownIcon
              size={14}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-grey-600"
            />
          </div>
          <SearchBar value={query} onChange={setQuery} />
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {visibleTasks.length} tâche{visibleTasks.length > 1 ? 's' : ''} affichée
        {visibleTasks.length > 1 ? 's' : ''}
      </p>

      {visibleTasks.length === 0 ? (
        <p className="py-10 text-center text-grey-600">
          {isFiltered
            ? 'Aucune tâche ne correspond à vos critères.'
            : "Ce projet n'a pas encore de tâche."}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {visibleTasks.map((task) => (
            <li key={task.id}>
              <ProjectTaskCard
                task={task}
                projectId={projectId}
                members={members}
                currentUser={currentUser}
                canEdit={canEditTasks}
                initiallyOpen={task.id === initialOpenTaskId}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
