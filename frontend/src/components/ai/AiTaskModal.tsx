'use client';

import { useActionState, useState, useTransition } from 'react';
import { addGeneratedTasks, generateTasksAction, type GenerateState } from '@/app/actions/ai';
import Modal from '@/components/ui/Modal';
import type { GeneratedTask } from '@/lib/ai';

const inputClass =
  'px-3 py-2 rounded-md border border-grey-200 bg-white text-grey-950 focus:outline-none focus:ring-2 focus:ring-brand-main';

/** Bouton "✦ IA" + modale de génération de tâches */
export default function AiTaskButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="h-12 px-6 rounded-lg bg-brand-main text-white font-medium hover:bg-brand-dark transition"
      >
        <span aria-hidden="true">✦ </span>IA
        <span className="sr-only"> : générer des tâches</span>
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={
          <span className="flex items-center gap-2">
            Créer des tâches
            <span className="px-2 py-0.5 rounded-full bg-brand-main text-white text-xs font-semibold">
              IA
            </span>
          </span>
        }
      >
        <AiTaskGenerator projectId={projectId} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function AiTaskGenerator({ projectId, onDone }: { projectId: string; onDone: () => void }) {
  const [state, formAction, isPending] = useActionState<GenerateState, FormData>(
    generateTasksAction.bind(null, projectId),
    undefined
  );

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-3" noValidate>
        <label htmlFor="ai-prompt" className="text-sm text-grey-950">
          Décrivez ce que vous voulez accomplir
        </label>
        <textarea
          id="ai-prompt"
          name="prompt"
          rows={3}
          maxLength={1000}
          defaultValue={state?.prompt}
          placeholder="Ex. : Mettre en place l'authentification avec mot de passe oublié"
          data-autofocus
          className={inputClass}
        />
        <button
          type="submit"
          disabled={isPending}
          className="self-end h-11 px-5 rounded-lg bg-grey-950 text-white text-sm font-medium hover:bg-grey-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {state?.tasks ? 'Régénérer' : 'Générer'}
        </button>
      </form>

      {/* role="status" : le lecteur d'écran annonce le chargement sans interrompre */}
      <div role="status" aria-live="polite">
        {isPending && (
          <p className="flex items-center gap-3 text-sm text-grey-600">
            <span
              aria-hidden="true"
              className="w-5 h-5 rounded-full border-2 border-brand-light border-t-brand-main animate-spin"
            />
            Analyse des tâches existantes du projet, puis génération en cours...
          </p>
        )}
      </div>

      {!isPending && state?.error && (
        <p role="alert" className="text-sm text-error-red">
          {state.error}
        </p>
      )}

      {/* key : chaque nouvelle génération repart d'une liste neuve */}
      {!isPending && state?.tasks && (
        <GeneratedTaskList
          key={state.generatedAt}
          projectId={projectId}
          initialTasks={state.tasks}
          onDone={onDone}
        />
      )}
    </div>
  );
}

/** Relecture des tâches proposées : modifier, supprimer, puis ajouter */
function GeneratedTaskList({
  projectId,
  initialTasks,
  onDone,
}: {
  projectId: string;
  initialTasks: GeneratedTask[];
  onDone: () => void;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string>();
  const [isAdding, startTransition] = useTransition();

  const update = (index: number, task: GeneratedTask) =>
    setTasks((prev) => prev.map((t, i) => (i === index ? task : t)));
  const remove = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
    setEditingIndex(null);
  };

  const addAll = () =>
    startTransition(async () => {
      const result = await addGeneratedTasks(projectId, tasks);
      if (result.error) setError(result.error);
      else onDone();
    });

  return (
    <section aria-labelledby="ai-results-title" className="flex flex-col gap-4">
      <h3 id="ai-results-title" className="text-sm font-semibold text-grey-950">
        Tâches proposées ({tasks.length})
      </h3>

      {tasks.length === 0 ? (
        <p className="text-sm text-grey-600">
          Vous avez retiré toutes les propositions. Modifiez votre demande pour en générer
          d&apos;autres.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {tasks.map((task, index) => (
            <li key={index} className="rounded-lg border border-grey-200 p-4">
              {editingIndex === index ? (
                <EditGeneratedTask
                  task={task}
                  index={index}
                  onSave={(updated) => {
                    update(index, updated);
                    setEditingIndex(null);
                  }}
                  onCancel={() => setEditingIndex(null)}
                />
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="font-medium text-grey-950">{task.title}</p>
                  {task.description && <p className="text-sm text-grey-600">{task.description}</p>}
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setEditingIndex(index)}
                      className="text-sm text-grey-950 underline"
                    >
                      Modifier<span className="sr-only"> la tâche {task.title}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-sm text-error-red underline"
                    >
                      Supprimer<span className="sr-only"> la tâche {task.title}</span>
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      {error && (
        <p role="alert" className="text-sm text-error-red">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={addAll}
        disabled={isAdding || tasks.length === 0 || editingIndex !== null}
        className="self-start h-12 px-6 rounded-lg bg-grey-950 text-white font-medium hover:bg-grey-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isAdding
          ? 'Ajout en cours...'
          : `Ajouter ${tasks.length > 1 ? `les ${tasks.length} tâches` : 'la tâche'}`}
      </button>
    </section>
  );
}

function EditGeneratedTask({
  task,
  index,
  onSave,
  onCancel,
}: {
  task: GeneratedTask;
  index: number;
  onSave: (task: GeneratedTask) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const tooShort = title.trim().length < 2;

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={`ai-title-${index}`} className="sr-only">
        Titre
      </label>
      <input
        id={`ai-title-${index}`}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        autoFocus
        className={`h-11 ${inputClass}`}
      />
      <label htmlFor={`ai-description-${index}`} className="sr-only">
        Description
      </label>
      <textarea
        id={`ai-description-${index}`}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        maxLength={1000}
        className={inputClass}
      />
      {tooShort && (
        <p role="alert" className="text-sm text-error-red">
          Le titre doit contenir au moins 2 caractères.
        </p>
      )}
      <div className="flex gap-4">
        <button
          type="button"
          disabled={tooShort}
          onClick={() => onSave({ title: title.trim(), description: description.trim() })}
          className="h-9 px-4 rounded-lg bg-grey-950 text-white text-sm font-medium disabled:opacity-60"
        >
          Valider
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-grey-600 underline">
          Annuler
        </button>
      </div>
    </div>
  );
}
