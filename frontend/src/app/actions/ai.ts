'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';
import { AiError, generateTasks, type GeneratedTask } from '@/lib/ai';
import type { Project, Task } from '@/types';

export type GenerateState =
  // generatedAt : identifiant de chaque génération (pour réinitialiser la liste affichée)
  { tasks?: GeneratedTask[]; error?: string; prompt?: string; generatedAt?: number } | undefined;

/** Génère des tâches à partir de la demande saisie dans la modale IA */
export async function generateTasksAction(
  projectId: string,
  _prevState: GenerateState,
  formData: FormData
): Promise<GenerateState> {
  const prompt = String(formData.get('prompt') ?? '').trim();
  if (prompt.length < 5) {
    return { error: 'Décrivez votre besoin en quelques mots (5 caractères minimum).', prompt };
  }

  // Contexte du projet pour le RAG : sa description et ses tâches existantes
  const [projectRes, tasksRes] = await Promise.all([
    apiFetch<{ project: Project }>(`/projects/${projectId}`),
    apiFetch<{ tasks: Task[] }>(`/projects/${projectId}/tasks`),
  ]);
  if (!projectRes.data) return { error: projectRes.error ?? 'Projet introuvable.', prompt };

  try {
    const tasks = await generateTasks(prompt, projectRes.data.project, tasksRes.data?.tasks ?? []);
    return { tasks, prompt, generatedAt: Date.now() };
  } catch (error) {
    const message =
      error instanceof AiError ? error.message : 'Une erreur inattendue est survenue.';
    return { error: message, prompt };
  }
}

/** Ajoute au projet les tâches validées par l'utilisateur */
export async function addGeneratedTasks(
  projectId: string,
  tasks: GeneratedTask[]
): Promise<{ created: number; error?: string }> {
  // Revalidation côté serveur : la liste vient du navigateur
  const valid = tasks
    .map((t) => ({
      title: t.title.trim().slice(0, 200),
      description: t.description.trim().slice(0, 1000),
    }))
    .filter((t) => t.title.length >= 2);
  if (valid.length === 0) return { created: 0, error: 'Aucune tâche valide à ajouter.' };

  const results = await Promise.all(
    valid.map((task) => apiFetch(`/projects/${projectId}/tasks`, { method: 'POST', body: task }))
  );
  const created = results.filter((r) => !r.error).length;

  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/projects');

  if (created < valid.length) {
    return {
      created,
      error: `${created} tâche(s) ajoutée(s) sur ${valid.length}. ${results.find((r) => r.error)?.error ?? ''}`,
    };
  }
  return { created };
}
