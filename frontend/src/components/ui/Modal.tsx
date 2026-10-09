'use client';

import { useEffect, useRef } from 'react';

/**
 * Modale basée sur l'élément HTML natif <dialog>.
 * showModal() apporte gratuitement :
 * - le focus piégé à l'intérieur (Tab ne sort pas de la modale)
 * - la fermeture avec la touche Échap
 * - le fond assombri (::backdrop) et le reste de la page rendu inerte
 * - le retour du focus sur le bouton d'ouverture à la fermeture
 *
 * Focus initial : l'élément marqué data-autofocus (ex. le premier champ d'un
 * formulaire, comme le recommandent les règles WAI-ARIA), sinon showModal()
 * choisit le premier élément focusable.
 */
export default function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Synchronise l'état React (open) avec le <dialog> du navigateur
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // Après l'ouverture : on déplace le focus vers le champ prévu
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="modal-title"
      // Échap déclenche "close" : on prévient le parent
      onClose={onClose}
      // Clic sur le fond (en dehors du contenu) → fermeture
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-xl max-h-[90vh] overflow-y-auto rounded-xl p-0 bg-white text-grey-950 shadow-xl backdrop:bg-grey-950/40"
    >
      {/* Le contenu n'est monté que si la modale est ouverte : le formulaire
          repart de zéro à chaque ouverture */}
      {open && (
        <div className="px-8 sm:px-12 py-10 flex flex-col gap-8">
          <div className="flex items-start justify-between gap-4">
            <h2 id="modal-title" className="text-2xl font-medium text-grey-950">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="flex items-center justify-center w-8 h-8 rounded-lg text-grey-600 hover:bg-grey-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-main"
            >
              <span aria-hidden="true" className="text-xl leading-none">
                ×
              </span>
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
