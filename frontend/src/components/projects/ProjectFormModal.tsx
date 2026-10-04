'use client';

import { useActionState, useEffect } from 'react';
import { createProject, updateProject } from '@/app/actions/projects';
import ContributorPicker from '@/components/projects/ContributorPicker';
import Modal from '@/components/ui/Modal';
import type { Project, ProjectFormState } from '@/types';

const inputClass =
  'h-12 px-3 rounded-md border border-grey-200 bg-white text-grey-950 focus:outline-none focus:ring-2 focus:ring-brand-main';

/**
 * Modale de création (project absent) ou de modification (project fourni).
 */
export default function ProjectFormModal({
  open,
  onClose,
  project,
}: {
  open: boolean;
  onClose: () => void;
  project?: Project;
}) {
  const isEdit = Boolean(project);
  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Modifier un projet' : 'Créer un projet'}>
      <ProjectForm project={project} onSuccess={onClose} />
    </Modal>
  );
}

function ProjectForm({ project, onSuccess }: { project?: Project; onSuccess: () => void }) {
  // En modification, on "attache" l'id du projet à l'action avec bind()
  const action = project ? updateProject.bind(null, project.id) : createProject;
  const [state, formAction, isPending] = useActionState<ProjectFormState, FormData>(
    action,
    undefined
  );

  // Modification réussie → on ferme la modale (la création, elle, redirige)
  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state, onSuccess]);

  const contributors = project
    ? project.members.filter((m) => m.user.id !== project.owner.id).map((m) => m.user)
    : [];

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="project-name" className="text-sm text-grey-950">
          Titre <span aria-hidden="true">*</span>
        </label>
        <input
          id="project-name"
          // Le composant Modal place le focus ici à l'ouverture
          data-autofocus
          name="name"
          type="text"
          required
          aria-required="true"
          maxLength={100}
          defaultValue={state?.values?.name ?? project?.name}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="project-description" className="text-sm text-grey-950">
          Description
        </label>
        <textarea
          id="project-description"
          name="description"
          rows={3}
          maxLength={500}
          defaultValue={state?.values?.description ?? project?.description ?? ''}
          className="px-3 py-2 rounded-md border border-grey-200 bg-white text-grey-950 focus:outline-none focus:ring-2 focus:ring-brand-main"
        />
      </div>

      <ContributorPicker initial={contributors} excludeIds={project ? [project.owner.id] : []} />

      {state?.error && (
        <p role="alert" className="text-sm text-error-red">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start h-12 px-6 rounded-lg bg-grey-950 text-white font-medium hover:bg-grey-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? 'Enregistrement...' : project ? 'Enregistrer' : 'Ajouter un projet'}
      </button>
    </form>
  );
}
