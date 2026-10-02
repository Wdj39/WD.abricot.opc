import Link from 'next/link';
import Avatar from '@/components/ui/Avatar';
import type { ProjectWithProgress } from '@/types';

const MAX_VISIBLE_MEMBERS = 4;

export default function ProjectCard({ project }: { project: ProjectWithProgress }) {
  const { doneCount, totalCount } = project;
  const percent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

  // Le propriétaire peut aussi figurer dans "members" : on évite le doublon
  const members = project.members.filter((m) => m.user.id !== project.owner.id);
  const visibleMembers = members.slice(0, MAX_VISIBLE_MEMBERS);
  const hiddenCount = members.length - visibleMembers.length;
  const teamSize = members.length + 1;

  return (
    <article className="relative h-full bg-white rounded-xl border border-grey-200 p-6 flex flex-col gap-5 transition hover:shadow-md focus-within:ring-2 focus-within:ring-brand-main">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-grey-950">
          {/* Le lien s'étend à toute la carte grâce au pseudo-élément after: */}
          <Link
            href={`/projects/${project.id}`}
            className="after:absolute after:inset-0 focus:outline-none"
          >
            {project.name}
          </Link>
        </h2>
        <p className="text-sm text-grey-600 line-clamp-2 min-h-10">
          {project.description || 'Aucune description'}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="text-grey-600">Progression</span>
          <span className="font-medium text-grey-950">{percent}%</span>
        </div>
        {/* role="progressbar" : la valeur est lue par les lecteurs d'écran */}
        <div
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progression du projet ${project.name}`}
          className="h-2 rounded-full bg-grey-100 overflow-hidden"
        >
          <div className="h-full rounded-full bg-brand-main" style={{ width: `${percent}%` }} />
        </div>
        <p className="text-xs text-grey-600">
          {totalCount === 0 ? 'Aucune tâche' : `${doneCount}/${totalCount} tâches terminées`}
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <p className="text-sm text-grey-600">Équipe ({teamSize})</p>
        <div className="flex items-center gap-2">
          <Avatar user={project.owner} highlight size="sm" />
          <span className="px-2 py-0.5 rounded-full bg-brand-light text-brand-dark text-xs font-medium">
            Propriétaire
          </span>
          {visibleMembers.length > 0 && (
            <ul className="flex -space-x-1 ml-1" aria-label="Contributeurs">
              {visibleMembers.map((m) => (
                <li key={m.id}>
                  <Avatar user={m.user} size="sm" />
                </li>
              ))}
              {hiddenCount > 0 && (
                <li>
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-grey-100 text-grey-600 text-[11px] font-semibold ring-2 ring-white">
                    +{hiddenCount}
                  </span>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
