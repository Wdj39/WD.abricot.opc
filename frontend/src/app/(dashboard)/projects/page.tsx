import ProjectCard from '@/components/projects/ProjectCard';
import ProjectModalButton from '@/components/projects/ProjectModalButton';
import { getProjectsWithProgress } from '@/lib/projects';

export default async function ProjectsPage() {
  const { projects, error } = await getProjectsWithProgress();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-grey-950">Mes projets</h1>
          <p className="text-grey-600">Gérez vos projets</p>
        </div>
        <ProjectModalButton />
      </div>

      {error ? (
        <p role="alert" className="text-error-red">
          Impossible de charger vos projets : {error}
        </p>
      ) : projects && projects.length > 0 ? (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-16 text-center text-grey-600 bg-white rounded-xl border border-grey-200">
          Vous ne participez à aucun projet pour l&apos;instant.
        </p>
      )}
    </div>
  );
}
