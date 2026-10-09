'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { deleteTask } from '@/app/actions/tasks';
import Avatar from '@/components/ui/Avatar';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import StatusBadge from '@/components/ui/StatusBadge';
import { CalendarIcon, ChevronDownIcon } from '@/components/ui/Icons';
import TaskActionsMenu from '@/components/tasks/TaskActionsMenu';
import TaskComments from '@/components/tasks/TaskComments';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import { formatDueDate, isOverdue } from '@/lib/tasks';
import type { Task, UserSummary } from '@/types';

/**
 * Carte d'une tâche sur la page d'un projet (maquette) :
 * titre + statut, menu « … », échéance, personnes assignées,
 * puis les commentaires dans un accordéon.
 *
 * - canEdit : « Modifier » n'est proposé qu'aux administrateurs du projet
 *   (spécifications : un contributeur peut seulement créer ou supprimer)
 * - initiallyOpen : la tâche ciblée par ?task=... (lien « Voir » du tableau
 *   de bord) arrive dépliée, et la page défile jusqu'à elle
 */
export default function ProjectTaskCard({
  task,
  projectId,
  members,
  currentUser,
  canEdit,
  initiallyOpen = false,
}: {
  task: Task;
  projectId: string;
  members: UserSummary[];
  currentUser: UserSummary;
  canEdit: boolean;
  initiallyOpen?: boolean;
}) {
  const [commentsOpen, setCommentsOpen] = useState(initiallyOpen);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const commentsId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const overdue = isOverdue(task);

  // Arrivée depuis « Voir » : on amène la tâche à l'écran et on y place le focus
  useEffect(() => {
    if (!initiallyOpen) return;
    toggleRef.current?.scrollIntoView({ block: 'center' });
    toggleRef.current?.focus({ preventScroll: true });
  }, [initiallyOpen]);

  const confirmDelete = async () => {
    const result = await deleteTask(projectId, task.id);
    // La carte va disparaître (et le bouton « … » avec elle) : on place le
    // focus sur le titre de la liste, une fois la modale fermée
    if (!result.error) setTimeout(() => document.getElementById('tasks-title')?.focus(), 100);
    return result;
  };

  return (
    <article className="rounded-xl border border-grey-200 bg-white px-6 sm:px-10 pt-6 sm:pt-8 pb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-grey-950">{task.title}</h3>
            <StatusBadge status={task.status} />
          </div>
          {task.description && (
            <p className="text-sm text-grey-600 whitespace-pre-line">{task.description}</p>
          )}
        </div>
        <TaskActionsMenu
          taskTitle={task.title}
          onEdit={canEdit ? () => setEditOpen(true) : undefined}
          onDelete={() => setDeleteOpen(true)}
        />
      </div>

      {/* Liste de définitions : « Échéance : … », « Assigné à : … » */}
      <dl className="mt-5 flex flex-col gap-4 text-xs">
        <div className="flex items-center gap-2">
          <dt className="text-grey-600 shrink-0 whitespace-nowrap">Échéance :</dt>
          <dd
            className={`flex flex-wrap items-center gap-1.5 ${overdue ? 'text-error-red' : 'text-grey-950'}`}
          >
            {task.dueDate ? (
              <>
                <CalendarIcon size={14} />
                {formatDueDate(task.dueDate)}
                {overdue && <span className="font-medium whitespace-nowrap">· En retard</span>}
              </>
            ) : (
              'Aucune'
            )}
          </dd>
        </div>
        <div className="flex items-start gap-2">
          <dt className="text-grey-600 py-1 shrink-0 whitespace-nowrap">Assigné à :</dt>
          <dd>
            {task.assignees.length === 0 ? (
              <span className="inline-block py-1 text-grey-950">Personne</span>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {task.assignees.map((a) => (
                  <li key={a.id} className="flex items-center gap-1.5">
                    <Avatar user={a.user} size="sm" />
                    <span className="px-3 py-1 rounded-full bg-grey-200 text-grey-800">
                      {a.user.name ?? a.user.email}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </dd>
        </div>
      </dl>

      {/* Accordéon des commentaires : bouton aria-expanded + zone contrôlée */}
      <div className="mt-6 border-t border-grey-200">
        <h4>
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={commentsOpen}
            aria-controls={commentsId}
            onClick={() => setCommentsOpen((o) => !o)}
            className="w-full flex items-center justify-between py-4 text-sm text-grey-950"
          >
            Commentaires ({task.comments.length})
            <ChevronDownIcon
              size={16}
              className={`transition-transform ${commentsOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </h4>
        <div id={commentsId} hidden={!commentsOpen} className="pb-4">
          {commentsOpen && (
            <TaskComments
              comments={task.comments}
              projectId={projectId}
              taskId={task.id}
              currentUser={currentUser}
            />
          )}
        </div>
      </div>

      {canEdit && (
        <TaskFormModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          projectId={projectId}
          members={members}
          task={task}
        />
      )}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Supprimer la tâche"
        message={
          <>
            La tâche <strong>{task.title}</strong> et ses commentaires seront définitivement
            supprimés.
          </>
        }
        confirmLabel="Supprimer"
        onConfirm={confirmDelete}
      />
    </article>
  );
}
