'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';

export type CommentFormState = { error?: string; success?: boolean } | undefined;

/**
 * Ajout d'un commentaire (POST /projects/:id/tasks/:taskId/comments).
 * Remarque : le backend contient des fonctions de modification et de
 * suppression de commentaire, mais aucune route ne les expose. Seuls l'ajout
 * et la lecture sont donc possibles.
 */
export async function addComment(
  projectId: string,
  taskId: string,
  _prevState: CommentFormState,
  formData: FormData
): Promise<CommentFormState> {
  const content = String(formData.get('content') ?? '').trim();
  if (!content) return { error: 'Le commentaire ne peut pas être vide.' };

  const { error } = await apiFetch(`/projects/${projectId}/tasks/${taskId}/comments`, {
    method: 'POST',
    body: { content },
  });
  if (error) return { error };

  // La page projet relit ses tâches (et donc leurs commentaires)
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/dashboard'); // compteur de commentaires
  return { success: true };
}
