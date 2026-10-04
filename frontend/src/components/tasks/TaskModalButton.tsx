'use client';

import { useState } from 'react';
import TaskFormModal from '@/components/tasks/TaskFormModal';
import type { Task, UserSummary } from '@/types';

/** Bouton qui ouvre la modale de création ou de modification d'une tâche */
export default function TaskModalButton({
  projectId,
  members,
  task,
}: {
  projectId: string;
  members: UserSummary[];
  task?: Task;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          task
            ? 'h-10 px-5 rounded-lg border border-grey-200 bg-white text-sm font-medium text-grey-950 hover:bg-grey-100 transition'
            : 'h-12 px-6 rounded-lg bg-grey-950 text-white font-medium hover:bg-grey-800 transition'
        }
      >
        {task ? (
          <>
            Modifier<span className="sr-only"> la tâche {task.title}</span>
          </>
        ) : (
          'Créer une tâche'
        )}
      </button>
      <TaskFormModal
        open={open}
        onClose={() => setOpen(false)}
        projectId={projectId}
        members={members}
        task={task}
      />
    </>
  );
}
