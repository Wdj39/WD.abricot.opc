'use client';

import { useState } from 'react';
import ProjectFormModal from '@/components/projects/ProjectFormModal';
import type { Project } from '@/types';

/**
 * Bouton qui ouvre la modale projet.
 * Les pages restent des Server Components : seul ce petit bouton est interactif.
 */
export default function ProjectModalButton({
  project,
  variant = 'primary',
  canDelete = false,
}: {
  project?: Project;
  variant?: 'primary' | 'link';
  canDelete?: boolean; // propriétaire : la modale propose « Supprimer le projet »
}) {
  const [open, setOpen] = useState(false);

  const className =
    variant === 'link'
      ? 'text-sm text-brand-dark underline hover:no-underline'
      : 'h-12 px-6 rounded-lg bg-grey-950 text-white font-medium hover:bg-grey-800 transition';

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {project ? 'Modifier' : '+ Créer un projet'}
      </button>
      <ProjectFormModal
        open={open}
        onClose={() => setOpen(false)}
        project={project}
        canDelete={canDelete}
      />
    </>
  );
}
