'use client';

import { useActionState, useState, useTransition } from 'react';
import { addGeneratedTasks, generateTasksAction, type GenerateState } from '@/app/actions/ai';
import Modal from '@/components/ui/Modal';
import { PencilIcon, SparkleIcon, TrashIcon } from '@/components/ui/Icons';
import type { GeneratedTask } from '@/lib/ai';

const inputClass =
  'px-4 py-2 rounded-md border border-grey-200 bg-white text-sm text-grey-950 focus:outline-none focus:ring-2 focus:ring-brand-main';

/** Bouton « ✦ IA » + modale de génération de tâches */
export default function AiTaskButton({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  // Le titre change quand des propositions sont affichées (maquette)
  const [hasResults, setHasResults] = useState(false);

  const close = () => {
    setOpen(false);
    setHasResults(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        // Fond brand-dark (contraste 6,3:1 avec le texte blanc) : l'orange de la
        // maquette (#d3590b) n'atteint que 4:1, sous le seuil WCAG AA de 4,5:1
        className="h-12 px-6 inline-flex items-center gap-2 rounded-lg bg-brand-dark text-white font-medium hover:bg-grey-950 transition"
      >
        <SparkleIcon size={14} />
        IA
        <span className="sr-only"> : générer des tâches</span>
      </button>
      <Modal
        open={open}
        onClose={close}
        title={
          <span className="flex items-center gap-3">
            <SparkleIcon size={20} className="text-brand-main" />
            {hasResults ? 'Vos tâches...' : 'Créer une tâche'}
            <span className="sr-only"> avec l&apos;IA</span>
          </span>
        }
      >
        <AiTaskGenerator projectId={projectId} onResults={setHasResults} onDone={close} />
      </Modal>
    </>
  );
}

function AiTaskGenerator({
  projectId,
  onResults,
  onDone,
}: {
  projectId: string;
  onResults: (hasResults: boolean) => void;
  onDone: () => void;
}) {
  // On enveloppe l'action serveur pour prévenir le parent (titre de la modale)
  const [state, formAction, isPending] = useActionState<GenerateState, FormData>(
    async (prevState, formData) => {
      const result = await generateTasksAction(projectId, prevState, formData);
      onResults(Boolean(result?.tasks));
      return result;
    },
    undefined
  );
  const [prompt, setPrompt] = useState('');

  return (
    <div className="flex flex-col gap-6">
      {/* role="status" : le lecteur d'écran annonce le chargement sans interrompre */}
      <div role="status" aria-live="polite">
        {isPending && (
          <p className="flex items-center gap-3 py-6 text-sm text-grey-600">
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
      {!isPending && state?.tasks ? (
        <GeneratedTaskList
          key={state.generatedAt}
          projectId={projectId}
          initialTasks={state.tasks}
          onDone={onDone}
        />
      ) : (
        // Espace vide de la maquette avant la première génération
        !isPending && <div className="min-h-40" aria-hidden="true" />
      )}

      {/* Champ « pilule » en bas de la modale, comme une messagerie.
          sticky : il reste visible pendant que la liste des propositions défile */}
      <div className="sticky bottom-0 -mb-10 pb-10 pt-2 bg-white">
        <form
          action={formAction}
          className="flex items-center gap-3 rounded-full bg-grey-100 pl-6 pr-2 py-2 focus-within:ring-2 focus-within:ring-brand-main"
          noValidate
        >
          <label htmlFor="ai-prompt" className="sr-only">
            Décrivez les tâches que vous souhaitez ajouter
          </label>
          <input
            id="ai-prompt"
            name="prompt"
            type="text"
            maxLength={1000}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Décrivez les tâches que vous souhaitez ajouter..."
            autoComplete="off"
            data-autofocus
            className="flex-1 min-w-0 h-10 bg-transparent text-sm text-grey-950 placeholder:text-grey-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isPending || prompt.trim().length < 5}
            aria-label={state?.tasks ? 'Générer de nouvelles propositions' : 'Générer les tâches'}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-brand-main text-white hover:bg-brand-dark transition disabled:bg-grey-200 disabled:text-grey-600 disabled:cursor-not-allowed"
          >
            <SparkleIcon size={14} />
          </button>
        </form>
      </div>
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
    <section aria-label="Tâches proposées par l'IA" className="flex flex-col gap-6">
      {tasks.length === 0 ? (
        <p className="text-sm text-grey-600">
          Vous avez retiré toutes les propositions. Modifiez votre demande pour en générer
          d&apos;autres.
        </p>
      ) : (
        <ol className="flex flex-col gap-4">
          {tasks.map((task, index) => (
            <li key={index} className="rounded-xl border border-grey-200 px-8 py-6">
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
                  <p className="text-lg text-grey-950">{task.title}</p>
                  {task.description && <p className="text-sm text-grey-600">{task.description}</p>}
                  <div className="mt-3 flex items-center gap-3 text-xs text-grey-600">
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="flex items-center gap-1.5 hover:text-error-red"
                    >
                      <TrashIcon size={14} />
                      Supprimer<span className="sr-only"> la tâche {task.title}</span>
                    </button>
                    <span aria-hidden="true" className="text-grey-200">
                      |
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingIndex(index)}
                      className="flex items-center gap-1.5 hover:text-grey-950"
                    >
                      <PencilIcon size={14} />
                      Modifier<span className="sr-only"> la tâche {task.title}</span>
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
        className="self-center h-12 px-6 rounded-lg bg-grey-950 text-white font-medium hover:bg-grey-800 transition disabled:bg-grey-200 disabled:text-grey-600 disabled:cursor-not-allowed"
      >
        {isAdding ? 'Ajout en cours...' : '+ Ajouter les tâches'}
      </button>

      <hr className="border-grey-200" />
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
      <label htmlFor={`ai-title-${index}`} className="text-sm text-grey-950">
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
      <label htmlFor={`ai-description-${index}`} className="text-sm text-grey-950">
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
