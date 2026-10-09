'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';
import type { Task, TaskFormState, TaskFormValues, TaskPriority, TaskStatus } from '@/types';

/** Lit les champs du formulaire de tâche */
function readTaskForm(formData: FormData): TaskFormValues {
  return {
    title: String(formData.get('title') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    dueDate: String(formData.get('dueDate') ?? ''),
    status: String(formData.get('status') ?? 'TODO') as TaskStatus,
    priority: String(formData.get('priority') ?? 'MEDIUM') as TaskPriority,
    // Une case cochée "assigneeIds" par personne assignée
    assigneeIds: formData.getAll('assigneeIds').map(String),
  };
}

/** Champs obligatoires (maquette) : titre, description, échéance */
function validateTask(values: TaskFormValues): string | null {
  if (!values.title) return 'Le titre de la tâche est obligatoire.';
  if (!values.description) return 'La description de la tâche est obligatoire.';
  if (!values.dueDate) return "L'échéance de la tâche est obligatoire.";
  return null;
}

/** Rafraîchit toutes les pages qui affichent des tâches */
function refreshTaskPages(projectId: string) {
  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/projects'); // barres de progression
  revalidatePath('/dashboard'); // tâches assignées
}

/**
 * Création d'une tâche (POST /projects/:id/tasks).
 * Le backend crée toujours la tâche "À faire" : si un autre statut est
 * choisi, on enchaîne une mise à jour (PUT) juste après.
 */
export async function createTask(
  projectId: string,
  _prevState: TaskFormState,
  formData: FormData
): Promise<TaskFormState> {
  const values = readTaskForm(formData);
  const invalid = validateTask(values);
  if (invalid) return { error: invalid, values };

  const { data, error } = await apiFetch<{ task: Task }>(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: {
      title: values.title,
      description: values.description,
      priority: values.priority,
      dueDate: values.dueDate || undefined,
      assigneeIds: values.assigneeIds,
    },
  });
  if (error || !data) return { error: error ?? 'Création impossible.', values };

  if (values.status !== 'TODO') {
    await apiFetch(`/projects/${projectId}/tasks/${data.task.id}`, {
      method: 'PUT',
      body: { status: values.status },
    });
  }

  refreshTaskPages(projectId);
  return { success: true };
}

/** Modification d'une tâche (PUT /projects/:id/tasks/:taskId) */
export async function updateTask(
  projectId: string,
  taskId: string,
  _prevState: TaskFormState,
  formData: FormData
): Promise<TaskFormState> {
  const values = readTaskForm(formData);
  const invalid = validateTask(values);
  if (invalid) return { error: invalid, values };

  const { error } = await apiFetch(`/projects/${projectId}/tasks/${taskId}`, {
    method: 'PUT',
    body: {
      ...values,
      // Chaîne vide → null côté backend : l'échéance est retirée
      dueDate: values.dueDate,
    },
  });
  if (error) return { error, values };

  refreshTaskPages(projectId);
  return { success: true };
}

/** Suppression d'une tâche (DELETE /projects/:id/tasks/:taskId) */
export async function deleteTask(projectId: string, taskId: string): Promise<{ error?: string }> {
  const { error } = await apiFetch(`/projects/${projectId}/tasks/${taskId}`, {
    method: 'DELETE',
  });
  if (error) return { error };

  refreshTaskPages(projectId);
  return {};
}
