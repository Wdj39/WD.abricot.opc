'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { DotsIcon, PencilIcon, TrashIcon } from '@/components/ui/Icons';

/**
 * Bouton « … » d'une tâche, qui déplie ses actions (Modifier / Supprimer).
 *
 * Accessibilité — motif « disclosure » (WAI-ARIA) plutôt que role="menu" :
 * un simple bouton aria-expanded qui affiche une liste de vrais <button>.
 * On navigue avec Tab comme partout ailleurs, sans raccourcis à apprendre.
 * - Échap ferme la liste et rend le focus au bouton « … »
 * - un clic en dehors, ou le focus qui quitte le composant, la ferme aussi
 */
export default function TaskActionsMenu({
  taskTitle,
  onEdit,
  onDelete,
}: {
  taskTitle: string;
  onEdit?: () => void; // absent = l'utilisateur n'a pas le droit de modifier
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Clic en dehors → fermeture
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  /**
   * Avant d'ouvrir une modale, on remet le focus sur « … » : à sa fermeture,
   * la modale rend le focus à l'élément qui l'avait avant (ici « … »),
   * et pas à un bouton de la liste qui n'existe plus.
   */
  const choose = (action: () => void) => {
    setOpen(false);
    triggerRef.current?.focus();
    action();
  };

  const itemClass =
    'w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-grey-100 focus:outline-none focus-visible:bg-grey-100';

  return (
    <div
      ref={containerRef}
      className="relative"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && open) {
          e.stopPropagation();
          setOpen(false);
          triggerRef.current?.focus();
        }
      }}
      // Le focus sort du composant (Tab) → fermeture
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Actions pour la tâche ${taskTitle}`}
        onClick={() => setOpen((o) => !o)}
        className="w-11 h-11 flex items-center justify-center rounded-lg border border-grey-200 bg-white text-grey-950 hover:bg-grey-100 transition"
      >
        <DotsIcon size={16} />
      </button>

      {open && (
        <ul
          id={menuId}
          className="absolute right-0 top-full mt-2 z-10 min-w-40 py-2 rounded-lg border border-grey-200 bg-white shadow-lg"
        >
          {onEdit && (
            <li>
              <button
                type="button"
                onClick={() => choose(onEdit)}
                className={`${itemClass} text-grey-950`}
              >
                <PencilIcon size={14} />
                Modifier
              </button>
            </li>
          )}
          <li>
            <button
              type="button"
              onClick={() => choose(onDelete)}
              className={`${itemClass} text-error-red`}
            >
              <TrashIcon size={14} />
              Supprimer
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
