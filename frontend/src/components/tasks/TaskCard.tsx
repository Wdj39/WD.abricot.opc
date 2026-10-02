import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import StatusBadge from '@/components/ui/StatusBadge';
import { CalendarIcon, CommentIcon, FolderIcon } from '@/components/ui/Icons';
import { formatDueDate, isOverdue } from '@/lib/tasks';
import type { Task } from '@/types';

/**
 * Carte d'une tâche, réutilisée par la vue Liste et la vue Kanban.
 * - layout="row"  : ligne horizontale (vue Liste)
 * - layout="card" : bloc vertical compact (colonnes Kanban)
 * - showAssignees  : affiche les personnes assignées (page projet)
 * - showProject    : nom du projet (inutile sur la page du projet lui-même)
 * - showViewLink   : bouton "Voir" (masqué sur la page projet, où il
 *                    renverrait vers la page déjà affichée)
 */
export default function TaskCard({
  task,
  layout = 'row',
  showAssignees = false,
  showViewLink = true,
  showProject = true,
}: {
  task: Task;
  layout?: 'row' | 'card';
  showAssignees?: boolean;
  showViewLink?: boolean;
  showProject?: boolean;
}) {
  const overdue = isOverdue(task);
  const commentCount = task.comments.length;

  const meta = (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-grey-600">
      {showProject && (
        <li className="flex items-center gap-1.5">
          <FolderIcon />
          <span className="sr-only">Projet :</span>
          {task.project.name}
        </li>
      )}
      {task.dueDate && (
        <li className={`flex items-center gap-1.5 ${overdue ? 'text-error-red' : ''}`}>
          <CalendarIcon />
          <span className="sr-only">Échéance :</span>
          {formatDueDate(task.dueDate)}
          {overdue && <span className="font-medium">· En retard</span>}
        </li>
      )}
      <li className="flex items-center gap-1.5">
        <CommentIcon />
        {commentCount}
        <span className="sr-only">{commentCount > 1 ? 'commentaires' : 'commentaire'}</span>
      </li>
    </ul>
  );

  const assignees =
    showAssignees && task.assignees.length > 0 ? (
      <div className="flex items-center gap-2 text-sm text-grey-600">
        <span>Assigné à :</span>
        <ul className="flex -space-x-1" aria-label="Personnes assignées">
          {task.assignees.map((a) => (
            <li key={a.id}>
              <Avatar user={a.user} size="sm" />
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  // Pour l'instant "Voir" mène au projet ; il ouvrira le détail de la tâche plus tard
  const viewLink = (
    <Link
      href={`/projects/${task.projectId}`}
      className="inline-flex items-center justify-center h-10 px-6 rounded-lg bg-grey-950 text-white text-sm font-medium hover:bg-grey-800 transition"
    >
      Voir<span className="sr-only"> la tâche {task.title}</span>
    </Link>
  );

  if (layout === 'card') {
    return (
      <article className="bg-white rounded-xl border border-grey-200 p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold text-grey-950">{task.title}</h3>
          <StatusBadge status={task.status} />
        </div>
        {task.description && (
          <p className="text-sm text-grey-600 line-clamp-2">{task.description}</p>
        )}
        {meta}
        {assignees}
        {showViewLink && <div className="self-start mt-1">{viewLink}</div>}
      </article>
    );
  }

  return (
    <article className="bg-white rounded-xl border border-grey-200 p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 min-w-0">
        <div>
          <h3 className="font-semibold text-grey-950">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-grey-600 line-clamp-1">{task.description}</p>
          )}
        </div>
        {meta}
        {assignees}
      </div>
      <div className="flex items-center gap-4 sm:flex-col sm:items-end shrink-0">
        <StatusBadge status={task.status} />
        {showViewLink && viewLink}
      </div>
    </article>
  );
}
