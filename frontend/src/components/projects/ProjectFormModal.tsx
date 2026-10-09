'use client';

import { useActionState, useEffect, useState } from 'react';
import { createProject, deleteProject, updateProject } from '@/app/actions/projects';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
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
  canDelete = false,
}: {
  open: boolean;
  onClose: () => void;
  project?: Project;
  canDelete?: boolean; // réservé au propriétaire (règle du backend)
}) {
  const isEdit = Boolean(project);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEdit ? 'Modifier un projet' : 'Créer un projet'}
      >
        <ProjectForm project={project} onSuccess={onClose} />
        {project && canDelete && (
          <div className="border-t border-grey-200 pt-5">
            <button
              type="button"
              onClick={() => {
                // On ferme la modale d'édition avant d'ouvrir la confirmation :
                // deux <dialog> modaux empilés compliqueraient le focus
                onClose();
                setConfirmOpen(true);
              }}
              className="text-sm text-error-red underline hover:no-underline"
            >
              Supprimer le projet
            </button>
          </div>
        )}
      </Modal>
      {project && canDelete && (
        <ConfirmDialog
          open={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          title="Supprimer le projet"
          message={
            <>
              Le projet <strong>{project.name}</strong>, toutes ses tâches et leurs commentaires
              seront définitivement supprimés.
            </>
          }
          confirmLabel="Supprimer le projet"
          // En cas de succès, l'action redirige vers /projects
          onConfirm={() => deleteProject(project.id)}
        />
      )}
    </>
  );
}

function ProjectForm({ project, onSuccess }: { project?: Project; onSuccess: () => void }) {
  // En modification, on "attache" l'id du projet à l'action avec bind()
  const action = project ? updateProject.bind(null, project.id) : createProject;
  const [state, formAction, isPending] = useActionState<ProjectFormState, FormData>(
    action,
    undefined
  );

  // Champs contrôlés : bouton grisé tant que titre ou description est vide (maquette)
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const isValid = name.trim() !== '' && description.trim() !== '';

  // Modification réussie → on ferme la modale (la création, elle, redirige)
  useEffect(() => {
    if (state?.success) onSuccess();
  }, [state, onSuccess]);

  const contributors = project
    ? project.members.filter((m) => m.user.id !== project.owner.id).map((m) => m.user)
    : [];

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <p className="text-xs text-grey-600">Les champs marqués d&apos;un * sont obligatoires.</p>

      <div className="flex flex-col gap-1">
        <label htmlFor="project-name" className="text-sm text-grey-950">
          Titre<span aria-hidden="true">*</span>
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="project-description" className="text-sm text-grey-950">
          Description<span aria-hidden="true">*</span>
        </label>
        <textarea
          id="project-description"
          name="description"
          rows={2}
          required
          aria-required="true"
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
        disabled={!isValid || isPending}
        className="self-start h-12 px-6 rounded-lg bg-grey-950 text-white font-medium hover:bg-grey-800 transition disabled:bg-grey-200 disabled:text-grey-600 disabled:cursor-not-allowed"
      >
        {isPending ? 'Enregistrement...' : project ? 'Enregistrer' : 'Ajouter un projet'}
      </button>
    </form>
  );
}
