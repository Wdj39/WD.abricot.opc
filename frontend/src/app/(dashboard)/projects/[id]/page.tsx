import Link from 'next/link';
import { notFound } from 'next/navigation';
import Avatar from '@/components/ui/Avatar';
import ProjectTasks from '@/components/projects/ProjectTasks';
import { apiFetch } from '@/lib/api';
import type { Project, Task } from '@/types';

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Projet et tâches chargés en parallèle
  const [projectRes, tasksRes] = await Promise.all([
    apiFetch<{ project: Project }>(`/projects/${id}`),
    apiFetch<{ tasks: Task[] }>(`/projects/${id}/tasks`),
  ]);

  // Le backend vérifie l'accès AVANT l'existence du projet : un id inconnu
  // renvoie donc 403, pas 404. C'est volontaire (on ne révèle pas quels
  // projets existent). Le 404 est gardé au cas où le backend évoluerait.
  if (projectRes.status === 404) notFound();

  // Projet inexistant OU projet dont l'utilisateur ne fait pas partie
  if (projectRes.status === 403) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className="text-2xl font-semibold text-grey-950">Projet introuvable</h1>
        <p className="text-grey-600">
          Ce projet n&apos;existe pas ou vous n&apos;en faites pas partie.
        </p>
        <Link href="/projects" className="text-brand-dark underline hover:text-brand-main">
          Retour à mes projets
        </Link>
      </div>
    );
  }

  const project = projectRes.data?.project;
  if (!project) {
    return (
      <p role="alert" className="text-error-red">
        Impossible de charger le projet : {projectRes.error}
      </p>
    );
  }

  const isAdmin = project.userRole === 'ADMIN';
  // Le propriétaire peut aussi figurer dans "members" : on évite le doublon
  const contributors = project.members.filter((m) => m.user.id !== project.owner.id);

  return (
    <div className="flex flex-col gap-8">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/projects"
            aria-label="Retour à mes projets"
            className="mt-1 flex items-center justify-center w-10 h-10 shrink-0 rounded-lg border border-grey-200 bg-white text-grey-950 hover:bg-grey-100 transition"
          >
            <span aria-hidden="true">←</span>
          </Link>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-grey-950">{project.name}</h1>
              {/* Seuls les administrateurs peuvent modifier ; la modale arrivera plus tard */}
              {isAdmin && (
                <button
                  type="button"
                  disabled
                  title="Bientôt disponible"
                  className="text-sm text-brand-dark underline disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Modifier
                </button>
              )}
            </div>
            <p className="text-grey-600">{project.description || 'Aucune description'}</p>
          </div>
        </div>

        <div className="flex gap-3 shrink-0">
          <button
            type="button"
            disabled
            title="Bientôt disponible"
            className="h-12 px-6 rounded-lg bg-grey-950 text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Créer une tâche
          </button>
          <button
            type="button"
            disabled
            title="Bientôt disponible"
            className="h-12 px-6 rounded-lg bg-brand-main text-white font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            ✦ IA
          </button>
        </div>
      </div>

      {/* Contributeurs */}
      <section
        aria-labelledby="contributors-title"
        className="bg-grey-100 rounded-xl px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <h2 id="contributors-title" className="font-semibold text-grey-950">
          Contributeurs{' '}
          <span className="font-normal text-grey-600">
            {contributors.length + 1} personne{contributors.length + 1 > 1 ? 's' : ''}
          </span>
        </h2>
        <ul className="flex flex-wrap items-center gap-3">
          <li className="flex items-center gap-2">
            <Avatar user={project.owner} highlight size="sm" />
            <span className="px-3 py-1 rounded-full bg-brand-light text-brand-dark text-sm">
              Propriétaire
            </span>
          </li>
          {contributors.map((m) => (
            <li key={m.id} className="flex items-center gap-2">
              <Avatar user={m.user} size="sm" />
              <span className="px-3 py-1 rounded-full bg-white text-grey-950 text-sm">
                {m.user.name ?? m.user.email}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Tâches */}
      {tasksRes.error ? (
        <p role="alert" className="text-error-red">
          Impossible de charger les tâches : {tasksRes.error}
        </p>
      ) : (
        <ProjectTasks tasks={tasksRes.data?.tasks ?? []} />
      )}
    </div>
  );
}
