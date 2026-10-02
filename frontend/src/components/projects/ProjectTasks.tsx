'use client';

import { useMemo, useState } from 'react';
import TaskCard from '@/components/tasks/TaskCard';
import SearchBar from '@/components/ui/SearchBar';
import { STATUS_LABELS, filterTasks, sortByUrgency } from '@/lib/tasks';
import type { Task, TaskStatus } from '@/types';

type StatusFilter = 'ALL' | TaskStatus;
const FILTERS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

export default function ProjectTasks({ tasks }: { tasks: Task[] }) {
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
      className="bg-white rounded-xl border border-grey-200 p-6 sm:p-8 flex flex-col gap-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="tasks-title" className="text-lg font-semibold text-grey-950">
            Tâches
          </h2>
          <p className="text-sm text-grey-600">Par ordre de priorité</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* <select> natif : accessible au clavier et aux lecteurs d'écran sans effort */}
          <label htmlFor="status-filter" className="sr-only">
            Filtrer par statut
          </label>
          <select
            id="status-filter"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
            className="h-11 px-3 rounded-lg border border-grey-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-main"
          >
            <option value="ALL">Tous les statuts</option>
            {FILTERS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
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
              <TaskCard task={task} showAssignees showViewLink={false} showProject={false} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
