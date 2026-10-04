'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { createTask, deleteTask, updateTask } from '@/app/actions/tasks';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import { PRIORITY_LABELS, STATUS_LABELS } from '@/lib/tasks';
import type {
  Task,
  TaskFormState,
  TaskFormValues,
  TaskPriority,
  TaskStatus,
  UserSummary,
} from '@/types';

const inputClass =
  'h-12 px-3 rounded-md border border-grey-200 bg-white text-grey-950 focus:outline-none focus:ring-2 focus:ring-brand-main';

const STATUSES: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'];
const PRIORITIES: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

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

  // Enregistrement réussi → fermeture de la modale
  useEffect(() => {
    if (state?.success) onDone();
  }, [state, onDone]);

  // Après une erreur, on réaffiche ce qui avait été saisi
  const values = state?.values ?? initialValues(task);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="task-title" className="text-sm text-grey-950">
          Titre <span aria-hidden="true">*</span>
        </label>
        <input
          id="task-title"
          name="title"
          type="text"
          required
          aria-required="true"
          maxLength={200}
          defaultValue={values.title}
          data-autofocus
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="task-description" className="text-sm text-grey-950">
          Description
        </label>
        <textarea
          id="task-description"
          name="description"
          rows={3}
          maxLength={1000}
          defaultValue={values.description}
          className="px-3 py-2 rounded-md border border-grey-200 bg-white text-grey-950 focus:outline-none focus:ring-2 focus:ring-brand-main"
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label htmlFor="task-due-date" className="text-sm text-grey-950">
            Échéance
          </label>
          <input
            id="task-due-date"
            name="dueDate"
            type="date"
            defaultValue={values.dueDate}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="task-status" className="text-sm text-grey-950">
            Statut
          </label>
          <select
            // key : React recrée la liste avec la valeur conservée après une erreur
            key={values.status}
            id="task-status"
            name="status"
            defaultValue={values.status}
            className={inputClass}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="task-priority" className="text-sm text-grey-950">
            Priorité
          </label>
          <select
            key={values.priority}
            id="task-priority"
            name="priority"
            defaultValue={values.priority}
            className={inputClass}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* fieldset + legend : les lecteurs d'écran annoncent "Assigné à" avant chaque case */}
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm text-grey-950 mb-1">Assigné à</legend>
        <div className="flex flex-wrap gap-2">
          {members.map((member) => (
            <label
              key={member.id}
              className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-grey-200 bg-white text-sm cursor-pointer has-[:checked]:bg-brand-light has-[:checked]:border-brand-main has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-dark"
            >
              <input
                type="checkbox"
                name="assigneeIds"
                value={member.id}
                defaultChecked={values.assigneeIds.includes(member.id)}
                className="sr-only"
              />
              <Avatar user={member} size="sm" />
              {member.name ?? member.email}
            </label>
          ))}
        </div>
      </fieldset>

      {state?.error && (
        <p role="alert" className="text-sm text-error-red">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="submit"
          disabled={isPending}
          className="h-12 px-6 rounded-lg bg-grey-950 text-white font-medium hover:bg-grey-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? 'Enregistrement...' : task ? 'Enregistrer' : 'Ajouter une tâche'}
        </button>
        {task && <DeleteTaskButton projectId={projectId} taskId={task.id} onDeleted={onDone} />}
      </div>
    </form>
  );
}

/** Suppression en deux temps : un clic pour demander, un second pour confirmer */
function DeleteTaskButton({
  projectId,
  taskId,
  onDeleted,
}: {
  projectId: string;
  taskId: string;
  onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const confirmDelete = () =>
    startTransition(async () => {
      const result = await deleteTask(projectId, taskId);
      if (result.error) setError(result.error);
      else onDeleted();
    });

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm text-error-red underline hover:no-underline"
      >
        Supprimer la tâche
      </button>
    );
  }

  return (
    <div role="group" aria-label="Confirmer la suppression" className="flex items-center gap-3">
      <span className="text-sm text-grey-950">Supprimer définitivement ?</span>
      <button
        type="button"
        onClick={confirmDelete}
        disabled={isPending}
        className="h-10 px-4 rounded-lg bg-error-red text-white text-sm font-medium disabled:opacity-60"
      >
        {isPending ? 'Suppression...' : 'Oui, supprimer'}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-sm text-grey-600 underline"
      >
        Annuler
      </button>
      {error && (
        <p role="alert" className="w-full text-sm text-error-red">
          {error}
        </p>
      )}
    </div>
  );
}
