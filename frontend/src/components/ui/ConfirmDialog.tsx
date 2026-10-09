'use client';

import { useState, useTransition } from 'react';
import Modal from '@/components/ui/Modal';

/**
 * Demande de confirmation avant une action irréversible (suppression).
 * - onConfirm renvoie { error } en cas d'échec : le message est affiché
 *   dans la modale (role="alert") au lieu de la fermer.
 * - Le focus arrive sur « Annuler » : la réponse la moins risquée est celle
 *   qu'on valide si on appuie sur Entrée par réflexe.
 */
export default function ConfirmDialog({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => Promise<{ error?: string } | void>;
}) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const close = () => {
    setError(undefined);
    onClose();
  };

  const confirm = () =>
    startTransition(async () => {
      const result = await onConfirm();
      if (result?.error) setError(result.error);
      else close();
    });

  return (
    <Modal open={open} onClose={close} title={title}>
      <div className="flex flex-col gap-6">
        <p className="text-grey-950">{message}</p>
        {error && (
          <p role="alert" className="text-sm text-error-red">
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={confirm}
            disabled={isPending}
            className="h-11 px-5 rounded-lg bg-error-red text-white text-sm font-medium hover:bg-error-red-dark transition disabled:opacity-60"
          >
            {isPending ? 'Suppression...' : confirmLabel}
          </button>
          <button
            type="button"
            data-autofocus
            onClick={close}
            className="h-11 px-5 rounded-lg border border-grey-200 bg-white text-sm font-medium text-grey-950 hover:bg-grey-100 transition"
          >
            Annuler
          </button>
        </div>
      </div>
    </Modal>
  );
}
