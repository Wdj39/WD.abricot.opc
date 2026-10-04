'use client';

import { useActionState } from 'react';
import { addComment, type CommentFormState } from '@/app/actions/comments';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';
import { CalendarIcon } from '@/components/ui/Icons';
import { PRIORITY_LABELS, formatDueDate, isOverdue } from '@/lib/tasks';
import type { Task } from '@/types';

/** "4 oct. 2026 à 14:42" */
function formatCommentDate(isoDate: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoDate));
}

/** Détail d'une tâche avec ses commentaires */
export default function TaskDetailModal({
  task,
  projectId,
  onClose,
}: {
  task: Task | null; // null = modale fermée
  projectId: string;
  onClose: () => void;
}) {
  return (
    <Modal open={task !== null} onClose={onClose} title={task?.title ?? ''}>
      {task && <TaskDetail task={task} projectId={projectId} />}
    </Modal>
  );
}

function TaskDetail({ task, projectId }: { task: Task; projectId: string }) {
  const overdue = isOverdue(task);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={task.status} />
          <span className="text-sm text-grey-600">Priorité : {PRIORITY_LABELS[task.priority]}</span>
          {task.dueDate && (
            <span
              className={`flex items-center gap-1.5 text-sm ${overdue ? 'text-error-red' : 'text-grey-600'}`}
            >
              <CalendarIcon />
              <span className="sr-only">Échéance :</span>
              {formatDueDate(task.dueDate)}
              {overdue && <span className="font-medium">· En retard</span>}
            </span>
          )}
        </div>
        <p className="text-grey-950 whitespace-pre-line">
          {task.description || <span className="text-grey-600">Aucune description</span>}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-grey-950">Assigné à</h3>
        {task.assignees.length === 0 ? (
          <p className="text-sm text-grey-600">Personne pour l&apos;instant</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {task.assignees.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-grey-100 text-sm"
              >
                <Avatar user={a.user} size="sm" />
                {a.user.name ?? a.user.email}
              </li>
            ))}
          </ul>
        )}
      </div>

      <section
        aria-labelledby="comments-title"
        className="flex flex-col gap-4 border-t border-grey-200 pt-6"
      >
        <h3 id="comments-title" className="text-sm font-semibold text-grey-950">
          Commentaires ({task.comments.length})
        </h3>

        {task.comments.length === 0 ? (
          <p className="text-sm text-grey-600">Aucun commentaire pour l&apos;instant.</p>
        ) : (
          <ol className="flex flex-col gap-4">
            {task.comments.map((comment) => (
              <li key={comment.id} className="flex gap-3">
                <Avatar user={comment.author} size="sm" />
                <div className="flex-1 min-w-0 rounded-lg bg-grey-100 px-4 py-3">
                  <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-medium text-grey-950">
                      {comment.author.name ?? comment.author.email}
                    </span>
                    <time dateTime={comment.createdAt} className="text-xs text-grey-600">
                      {formatCommentDate(comment.createdAt)}
                    </time>
                  </p>
                  <p className="text-sm text-grey-950 whitespace-pre-line break-words">
                    {comment.content}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}

        <CommentForm projectId={projectId} taskId={task.id} />
      </section>
    </div>
  );
}

function CommentForm({ projectId, taskId }: { projectId: string; taskId: string }) {
  const [state, formAction, isPending] = useActionState<CommentFormState, FormData>(
    addComment.bind(null, projectId, taskId),
    undefined
  );

  return (
    // Après un envoi réussi, React vide automatiquement le champ
    <form action={formAction} className="flex flex-col gap-2" noValidate>
      <label htmlFor="comment-content" className="sr-only">
        Ajouter un commentaire
      </label>
      <textarea
        id="comment-content"
        name="content"
        rows={2}
        maxLength={2000}
        placeholder="Ajouter un commentaire..."
        required
        className="px-3 py-2 rounded-md border border-grey-200 bg-white text-grey-950 focus:outline-none focus:ring-2 focus:ring-brand-main"
      />
      {state?.error && (
        <p role="alert" className="text-sm text-error-red">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="self-end h-10 px-5 rounded-lg bg-grey-950 text-white text-sm font-medium hover:bg-grey-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? 'Envoi...' : 'Envoyer'}
      </button>
    </form>
  );
}
