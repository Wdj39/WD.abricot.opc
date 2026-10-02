import 'server-only';
import { apiFetch } from '@/lib/api';
import type { Project, ProjectWithProgress, Task } from '@/types';

/**
 * Récupère les projets de l'utilisateur avec leur progression.
 *
 * GET /projects ne renvoie que le nombre TOTAL de tâches, pas le nombre de
 * tâches terminées. On récupère donc les tâches de chaque projet
 * (GET /projects/:id/tasks), toutes en parallèle grâce à Promise.all.
 * Les tâches annulées ne comptent pas dans la progression.
 */
export async function getProjectsWithProgress(): Promise<{
  projects?: ProjectWithProgress[];
  error?: string;
}> {
  const { data, error } = await apiFetch<{ projects: Project[] }>('/projects');
  if (error || !data) return { error: error ?? 'Réponse vide du serveur.' };

  const projects = await Promise.all(
    data.projects.map(async (project) => {
      const { data: taskData } = await apiFetch<{ tasks: Task[] }>(`/projects/${project.id}/tasks`);
      const tasks = (taskData?.tasks ?? []).filter((t) => t.status !== 'CANCELLED');
      return {
        ...project,
        doneCount: tasks.filter((t) => t.status === 'DONE').length,
        totalCount: tasks.length,
      };
    })
  );

  return { projects };
}
