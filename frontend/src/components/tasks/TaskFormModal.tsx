'use client';

import { useActionState, useEffect, useState } from 'react';
import { createTask, updateTask } from '@/app/actions/tasks';
import Modal from '@/components/ui/Modal';
import MultiSelect from '@/components/ui/MultiSelect';
import { STATUS_LABELS } from '@/lib/tasks';
import type { Task, TaskFormState, TaskFormValues, TaskStatus, UserSummary } from '@/types';

const inputClass =
  'h-12 px-4 rounded-md border border-grey-200 bg-white text-sm text-grey-950 focus:outline-none focus:ring-2 focus:ring-brand-main';

// Pastilles de statut de la maquette (couleurs identiques aux badges)
const STATUS_PILLS: { status: TaskStatus; className: string }[] = [
  { status: 'TODO', className: 'bg-error-red-light text-error-red-dark' },
  { status: 'IN_PROGRESS', className: 'bg-warning-orange-light text-warning-orange-dark' },
  { status: 'DONE', className: 'bg-success-green-light text-success-green-dark' },
];

/** Modale de création (task absente) ou de modification (task fournie) */
export default function TaskFormModal({
  open,
  onClose,
  projectId,
  members,
  task,
}: {
  open: boolean;
  onClose: () => void;
  projectId: string;
  members: UserSummary[]; // personnes assignables : les membres du projet
  task?: Task;
}) {
  return (
    <Modal open={open} onClose={onClose} title={task ? 'Modifier la tâche' : 'Créer une tâche'}>
      <TaskForm projectId={projectId} members={members} task={task} onDone={onClose} />
    </Modal>
  );
}

/** Valeurs initiales : celles de la tâche, ou des valeurs par défaut */
function initialValues(task?: Task): TaskFormValues {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    // "2024-02-15T00:00:00.000Z" → "2024-02-15" pour <input type="date">
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    status: task?.status ?? 'TODO',
    // La maquette n'affiche pas la priorité : on conserve celle de la tâche
    // (ou « Moyenne » à la création), envoyée dans un champ caché
    priority: task?.priority ?? 'MEDIUM',
    assigneeIds: task?.assignees.map((a) => a.user.id) ?? [],
  };
}

function TaskForm({
  projectId,
  members,
  task,
  onDone,
}: {
  projectId: string;
  members: UserSummary[];
  task?: Task;
  onDone: () => void;
}) {
  const action = task
    ? updateTask.bind(null, projectId, task.id)
    : createTask.bind(null, projectId);
  const [state, formAction, isPending] = useActionState<TaskFormState, FormData>(action, undefined);

  // Champs contrôlés : le bouton reste grisé tant qu'un champ obligatoire est vide
  // (maquette). Le serveur revérifie de toute façon (on ne fait jamais confiance
  // au navigateur seul).
  const [values, setValues] = useState<TaskFormValues>(() => initialValues(task));
  const set = <K extends keyof TaskFormValues>(key: K, value: TaskFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const isValid =
    values.title.trim() !== '' && values.description.trim() !== '' && values.dueDate !== '';

  // Enregistrement réussi → fermeture de la modale
  useEffect(() => {
    if (state?.success) onDone();
  }, [state, onDone]);

  // Une tâche « Annulée » (statut hors maquette) garde sa pastille en modification
  const pills =
    values.status === 'CANCELLED' || task?.status === 'CANCELLED'
      ? [...STATUS_PILLS, { status: 'CANCELLED' as const, className: 'bg-grey-100 text-grey-600' }]
      : STATUS_PILLS;

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <p className="text-xs text-grey-600">Les champs marqués d&apos;un * sont obligatoires.</p>

      <div className="flex flex-col gap-2">
        <label htmlFor="task-title" className="text-sm text-grey-950">
          Titre<span aria-hidden="true">*</span>
        </label>
        <input
          id="task-title"
          name="title"
          type="text"
          required
          aria-required="true"
          maxLength={200}
          value={values.title}
          onChange={(e) => set('title', e.target.value)}
          data-autofocus
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="task-description" className="text-sm text-grey-950">
          Description<span aria-hidden="true">*</span>
        </label>
        <textarea
          id="task-description"
          name="description"
          rows={2}
          required
          aria-required="true"
          maxLength={1000}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          className="px-4 py-3 rounded-md border border-grey-200 bg-white text-sm text-grey-950 focus:outline-none focus:ring-2 focus:ring-brand-main"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="task-due-date" className="text-sm text-grey-950">
          Échéance<span aria-hidden="true">*</span>
        </label>
        <input
          id="task-due-date"
          name="dueDate"
          type="date"
          required
          aria-required="true"
          value={values.dueDate}
          onChange={(e) => set('dueDate', e.target.value)}
          className={inputClass}
        />
      </div>

      <MultiSelect
        label="Assigné à :"
        name="assigneeIds"
        options={members}
        selectedIds={values.assigneeIds}
        onChange={(ids) => set('assigneeIds', ids)}
      />

      {/* Pastilles de statut = boutons radio natifs habillés :
          flèches du clavier pour changer, statut lu par les lecteurs d'écran */}
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm text-grey-950 mb-3">Statut :</legend>
        <div className="flex flex-wrap gap-2">
          {pills.map(({ status, className }) => (
            <label
              key={status}
              className={`px-4 py-1.5 rounded-full text-sm cursor-pointer border-2 transition ${className} ${
                values.status === status ? 'border-current' : 'border-transparent'
              } has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-dark has-[:focus-visible]:ring-offset-2`}
            >
              <input
                type="radio"
                name="status"
                value={status}
                checked={values.status === status}
                onChange={() => set('status', status)}
                className="sr-only"
              />
              {STATUS_LABELS[status]}
            </label>
          ))}
        </div>
      </fieldset>

      <input type="hidden" name="priority" value={values.priority} />

      {state?.error && (
        <p role="alert" className="text-sm text-error-red">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={!isValid || isPending}
        className="self-start h-12 px-6 rounded-lg bg-grey-950 text-white font-medium hover:bg-grey-800 transition disabled:bg-grey-200 disabled:text-grey-600 disabled:cursor-not-allowed"
      >
        {isPending ? 'Enregistrement...' : task ? 'Enregistrer' : '+ Ajouter une tâche'}
      </button>
    </form>
  );
}
