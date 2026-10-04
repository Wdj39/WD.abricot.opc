'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import type { Project, ProjectFormState, UserSummary } from '@/types';

/** Recherche d'utilisateurs par nom ou email (GET /users/search) */
export async function searchUsers(query: string): Promise<UserSummary[]> {
  // Le backend exige au moins 2 caractères
  if (query.trim().length < 2) return [];
  const { data } = await apiFetch<{ users: UserSummary[] }>(
    `/users/search?query=${encodeURIComponent(query.trim())}`
  );
  return data?.users ?? [];
}

/** Lit nom, description et emails des contributeurs depuis le formulaire */
function readProjectForm(formData: FormData) {
  return {
    name: String(formData.get('name') ?? '').trim(),
    description: String(formData.get('description') ?? '').trim(),
    // Un champ caché "contributors" par personne sélectionnée
    contributors: formData.getAll('contributors').map(String),
  };
}

/** Création d'un projet (POST /projects) puis redirection vers sa page */
export async function createProject(
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const { name, description, contributors } = readProjectForm(formData);
  if (!name) return { error: 'Le titre du projet est obligatoire.', values: { name, description } };

  const { data, error } = await apiFetch<{ project: Project }>('/projects', {
    method: 'POST',
    body: { name, description, contributors },
  });
  if (error || !data)
    return { error: error ?? 'Création impossible.', values: { name, description } };

  revalidatePath('/projects');
  redirect(`/projects/${data.project.id}`);
}

/**
 * Modification d'un projet.
 * Le backend sépare les opérations : PUT pour nom/description, puis une
 * requête par contributeur ajouté (POST) ou retiré (DELETE). On compare la
 * liste envoyée avec les membres actuels, relus côté serveur (on ne fait pas
 * confiance à une liste "avant" qui viendrait du navigateur).
 */
export async function updateProject(
  projectId: string,
  _prevState: ProjectFormState,
  formData: FormData
): Promise<ProjectFormState> {
  const { name, description, contributors } = readProjectForm(formData);
  if (!name) return { error: 'Le titre du projet est obligatoire.', values: { name, description } };

  const { error } = await apiFetch(`/projects/${projectId}`, {
    method: 'PUT',
    body: { name, description },
  });
  if (error) return { error, values: { name, description } };

  const { data } = await apiFetch<{ project: Project }>(`/projects/${projectId}`);
  if (data) {
    const { project } = data;
    const current = project.members.filter((m) => m.user.id !== project.owner.id);
    const wanted = new Set(contributors.map((e) => e.toLowerCase()));
    const currentEmails = new Set(current.map((m) => m.user.email.toLowerCase()));

    const toAdd = [...wanted].filter((email) => !currentEmails.has(email));
    const toRemove = current.filter((m) => !wanted.has(m.user.email.toLowerCase()));

    // Toutes les requêtes partent en parallèle
    const results = await Promise.all([
      ...toAdd.map((email) =>
        apiFetch(`/projects/${projectId}/contributors`, { method: 'POST', body: { email } })
      ),
      ...toRemove.map((m) =>
        apiFetch(`/projects/${projectId}/contributors/${m.user.id}`, { method: 'DELETE' })
      ),
    ]);
    const failed = results.find((r) => r.error);
    if (failed) {
      revalidatePath(`/projects/${projectId}`);
      return { error: `Projet modifié, mais un contributeur pose problème : ${failed.error}` };
    }
  }

  revalidatePath(`/projects/${projectId}`);
  revalidatePath('/projects');
  return { success: true };
}
