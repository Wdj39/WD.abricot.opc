'use client';

import { useActionState, useId, useState } from 'react';
import { addComment, type CommentFormState } from '@/app/actions/comments';
import Avatar from '@/components/ui/Avatar';
import type { Comment, UserSummary } from '@/types';

/** "23 mars, 11:20" (ou "23 mars 2025, 11:20" si ce n'est pas l'année en cours) */
function formatCommentDate(isoDate: string): string {
  const date = new Date(isoDate);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  const day = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date);
  const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(
    date
  );
  return `${day}, ${time}`;
}

/** Liste des commentaires d'une tâche + formulaire d'ajout (maquette : accordéon) */
export default function TaskComments({
  comments,
  projectId,
  taskId,
  currentUser,
}: {
  comments: Comment[];
  projectId: string;
  taskId: string;
  currentUser: UserSummary;
}) {
  return (
    <div className="flex flex-col gap-4">
      {comments.length === 0 ? (
        <p className="text-sm text-grey-600">Aucun commentaire pour l&apos;instant.</p>
      ) : (
        <ol className="flex flex-col gap-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3">
              <Avatar
                user={comment.author}
                size="sm"
                highlight={comment.author.id === currentUser.id}
              />
              <div className="flex-1 min-w-0 rounded-lg bg-grey-100 px-4 py-3 flex flex-col gap-2">
                <p className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
                  <span className="text-grey-950">
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

      <CommentForm projectId={projectId} taskId={taskId} currentUser={currentUser} />
    </div>
  );
}

function CommentForm({
  projectId,
  taskId,
  currentUser,
}: {
  projectId: string;
  taskId: string;
  currentUser: UserSummary;
}) {
  // Champ contrôlé : le bouton « Envoyer » reste grisé tant qu'il est vide (maquette)
  const [content, setContent] = useState('');
  const fieldId = useId();

  // On enveloppe l'action serveur : si l'envoi réussit, on vide le champ
  const [state, formAction, isPending] = useActionState<CommentFormState, FormData>(
    async (prevState, formData) => {
      const result = await addComment(projectId, taskId, prevState, formData);
      if (result?.success) setContent('');
      return result;
    },
    undefined
  );

  return (
    <form action={formAction} className="flex flex-col gap-3" noValidate>
      <div className="flex gap-3">
        <Avatar user={currentUser} size="sm" highlight />
        <div className="flex-1 min-w-0">
          <label htmlFor={fieldId} className="sr-only">
            Ajouter un commentaire
          </label>
          <textarea
            id={fieldId}
            name="content"
            rows={3}
            maxLength={2000}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ajouter un commentaire..."
            required
            className="w-full px-4 py-3 rounded-lg bg-grey-100 text-sm text-grey-950 placeholder:text-grey-600 focus:outline-none focus:ring-2 focus:ring-brand-main"
          />
        </div>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-error-red">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending || content.trim() === ''}
        className="self-end h-11 px-10 rounded-lg bg-grey-950 text-white text-sm font-medium hover:bg-grey-800 transition disabled:bg-grey-200 disabled:text-grey-600 disabled:cursor-not-allowed"
      >
        {isPending ? 'Envoi...' : 'Envoyer'}
      </button>
    </form>
  );
}
