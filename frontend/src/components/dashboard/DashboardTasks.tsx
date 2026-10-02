'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import TaskCard from '@/components/tasks/TaskCard';
import { KanbanIcon, ListIcon, SearchIcon } from '@/components/ui/Icons';
import { STATUS_LABELS, filterTasks, sortByUrgency } from '@/lib/tasks';
import type { Task, TaskStatus } from '@/types';

export type DashboardView = 'list' | 'kanban';

const KANBAN_COLUMNS: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];

export default function DashboardTasks({ tasks, view }: { tasks: Task[]; view: DashboardView }) {
  const [query, setQuery] = useState('');

  // Les tâches annulées n'ont pas de colonne dans la maquette : on les masque.
  // useMemo évite de refaire le tri à chaque rendu si rien n'a changé.
  const visibleTasks = useMemo(
    () => sortByUrgency(filterTasks(tasks, query).filter((t) => t.status !== 'CANCELLED')),
    [tasks, query]
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Choix de la vue : de simples liens, donc l'URL reflète la vue (partageable) */}
      <nav aria-label="Affichage des tâches" className="flex gap-2">
        <ViewLink href="/dashboard" active={view === 'list'} icon={<ListIcon />} label="Liste" />
        <ViewLink
          href="/dashboard?view=kanban"
          active={view === 'kanban'}
          icon={<KanbanIcon />}
          label="Kanban"
        />
      </nav>

      {view === 'list' ? (
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
            <EmptyState hasQuery={query.trim() !== ''} />
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
      ) : (
        <div className="flex flex-col gap-6">
          <div className="self-end">
            <SearchBar value={query} onChange={setQuery} />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {KANBAN_COLUMNS.map((status) => {
              const columnTasks = visibleTasks.filter((t) => t.status === status);
              return (
                <section
                  key={status}
                  aria-labelledby={`col-${status}`}
                  className="bg-white rounded-xl border border-grey-200 p-5 flex flex-col gap-4"
                >
                  <h2 id={`col-${status}`} className="flex items-center gap-2 font-semibold">
                    {STATUS_LABELS[status]}
                    <span className="px-2 py-0.5 rounded-full bg-grey-100 text-grey-600 text-xs">
                      {columnTasks.length}
                    </span>
                  </h2>
                  {columnTasks.length === 0 ? (
                    <p className="text-sm text-grey-400">Aucune tâche</p>
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
      )}
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
      className={`flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium transition ${
        active ? 'bg-brand-light text-brand-dark' : 'text-brand-main hover:bg-brand-light'
      }`}
    >
      {icon}
      {label}
    </Link>
  );
}

function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative w-full sm:w-72">
      <label htmlFor="task-search" className="sr-only">
        Rechercher une tâche
      </label>
      <input
        id="task-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Rechercher une tâche"
        className="w-full h-11 pl-4 pr-10 rounded-lg border border-grey-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-main"
      />
      <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-400" />
    </div>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <p className="py-10 text-center text-grey-600">
      {hasQuery
        ? 'Aucune tâche ne correspond à votre recherche.'
        : "Aucune tâche ne vous est assignée pour l'instant."}
    </p>
  );
}
