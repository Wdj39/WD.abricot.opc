'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import TaskCard from '@/components/tasks/TaskCard';
import { CalendarIcon, FolderIcon, TasksIcon } from '@/components/ui/Icons';
import SearchBar from '@/components/ui/SearchBar';
import { filterTasks, isInMonth, shiftMonth, formatMonth, sortByUrgency } from '@/lib/tasks';
import type { Task, TaskStatus } from '@/types';

export type DashboardView = 'list' | 'kanban' | 'projects';

// Titres des colonnes Kanban (au pluriel, comme la maquette)
const KANBAN_COLUMNS: { status: TaskStatus; title: string }[] = [
  { status: 'TODO', title: 'À faire' },
  { status: 'IN_PROGRESS', title: 'En cours' },
  { status: 'DONE', title: 'Terminées' },
];

/** Onglets Liste / Kanban / Projets : de simples liens, l'URL reflète la vue */
export function DashboardTabs({ view }: { view: DashboardView }) {
  return (
    <nav aria-label="Affichage du tableau de bord" className="flex flex-wrap gap-2">
      <ViewLink href="/dashboard" active={view === 'list'} icon={<TasksIcon />} label="Liste" />
      <ViewLink
        href="/dashboard?view=kanban"
        active={view === 'kanban'}
        icon={<CalendarIcon />}
        label="Kanban"
      />
      <ViewLink
        href="/dashboard?view=projects"
        active={view === 'projects'}
        icon={<FolderIcon />}
        label="Projets"
      />
    </nav>
  );
}

/**
 * Vues Liste et Kanban des tâches assignées.
 * month (AAAA-MM) : mois affiché par le Kanban — les spécifications demandent
 * « les tâches du mois par statut ».
 */
export default function DashboardTasks({
  tasks,
  view,
  month,
}: {
  tasks: Task[];
  view: Exclude<DashboardView, 'projects'>;
  month: string;
}) {
  const [query, setQuery] = useState('');

  // Les tâches annulées n'ont pas de colonne dans la maquette : on les masque.
  // useMemo évite de refaire le tri à chaque rendu si rien n'a changé.
  const visibleTasks = useMemo(
    () => sortByUrgency(filterTasks(tasks, query).filter((t) => t.status !== 'CANCELLED')),
    [tasks, query]
  );

  if (view === 'kanban') {
    const monthTasks = visibleTasks.filter((t) => t.dueDate && isInMonth(t.dueDate, month));
    return (
      <div className="flex flex-col gap-6">
        <MonthNav month={month} count={monthTasks.length} />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {KANBAN_COLUMNS.map(({ status, title }) => {
            const columnTasks = monthTasks.filter((t) => t.status === status);
            return (
              <section
                key={status}
                aria-labelledby={`col-${status}`}
                className="min-w-0 bg-white rounded-xl border border-grey-200 p-5 flex flex-col gap-4"
              >
                <h2 id={`col-${status}`} className="flex items-center gap-2 font-medium">
                  {title}
                  <span className="px-2 py-0.5 rounded-full bg-grey-100 text-grey-600 text-xs">
                    {columnTasks.length}
                  </span>
                </h2>
                {columnTasks.length === 0 ? (
                  <p className="text-sm text-grey-600">Aucune tâche</p>
                ) : (
                  <ul className="flex flex-col gap-4">
                    {columnTasks.map((task) => (
                      <li key={task.id}>
                        <TaskCard task={task} layout="card" />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="list-title"
      className="bg-white rounded-xl border border-grey-200 p-6 sm:p-8 flex flex-col gap-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="list-title" className="text-lg font-semibold text-grey-950">
            Mes tâches assignées
          </h2>
          <p className="text-sm text-grey-600">Par ordre de priorité</p>
        </div>
        <SearchBar value={query} onChange={setQuery} />
      </div>

      {/* aria-live : le nombre de résultats est annoncé quand on tape une recherche */}
      <p aria-live="polite" className="sr-only">
        {visibleTasks.length} tâche{visibleTasks.length > 1 ? 's' : ''} affichée
        {visibleTasks.length > 1 ? 's' : ''}
      </p>

      {visibleTasks.length === 0 ? (
        <p className="py-10 text-center text-grey-600">
          {query.trim() !== ''
            ? 'Aucune tâche ne correspond à votre recherche.'
            : "Aucune tâche ne vous est assignée pour l'instant."}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {visibleTasks.map((task) => (
            <li key={task.id}>
              <TaskCard task={task} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Navigation mois précédent / mois suivant du Kanban (liens = URL partageable) */
function MonthNav({ month, count }: { month: string; count: number }) {
  const linkClass =
    'h-9 w-9 inline-flex items-center justify-center rounded-lg border border-grey-200 bg-white text-grey-950 hover:bg-grey-100 transition';
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Link
        href={`/dashboard?view=kanban&month=${shiftMonth(month, -1)}`}
        className={linkClass}
        aria-label="Mois précédent"
      >
        <span aria-hidden="true">‹</span>
      </Link>
      <h2 className="min-w-32 text-center font-medium text-grey-950 first-letter:uppercase">
        {formatMonth(month)}
      </h2>
      <Link
        href={`/dashboard?view=kanban&month=${shiftMonth(month, 1)}`}
        className={linkClass}
        aria-label="Mois suivant"
      >
        <span aria-hidden="true">›</span>
      </Link>
      <p aria-live="polite" className="text-sm text-grey-600">
        {count} tâche{count > 1 ? 's' : ''} ce mois-ci
      </p>
    </div>
  );
}

function ViewLink({
  href,
  active,
  icon,
  label,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium text-brand-dark transition ${
        active ? 'bg-brand-light' : 'hover:bg-brand-light'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}
