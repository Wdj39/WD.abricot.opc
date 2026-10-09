'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import { ChevronDownIcon } from '@/components/ui/Icons';
import type { UserSummary } from '@/types';

/**
 * Liste déroulante à choix multiples (maquette : « Choisir un ou plusieurs
 * collaborateurs », puis « 2 collaborateurs »).
 *
 * Accessibilité : un bouton aria-expanded qui déplie un <fieldset> de vraies
 * cases à cocher. Chaque case est lue avec le nom de la personne, se coche à
 * la barre d'espace, et part avec le formulaire (name = `name`) sans code en plus.
 * Échap ou un clic en dehors replie la liste.
 */
export default function MultiSelect({
  label,
  name,
  options,
  selectedIds,
  onChange,
  placeholder = 'Choisir un ou plusieurs collaborateurs',
}: {
  label: string;
  name: string;
  options: UserSummary[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const labelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Clic en dehors → on replie
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const toggle = (id: string) =>
    onChange(selectedIds.includes(id) ? selectedIds.filter((i) => i !== id) : [...selectedIds, id]);

  const count = selectedIds.length;
  const summary = count === 0 ? placeholder : `${count} collaborateur${count > 1 ? 's' : ''}`;

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col gap-2"
      onKeyDown={(e) => {
        // Échap replie la liste sans fermer toute la modale
        if (e.key === 'Escape' && open) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(false);
          buttonRef.current?.focus();
        }
      }}
    >
      <span id={labelId} className="text-sm text-grey-950">
        {label}
      </span>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-labelledby={`${labelId} ${panelId}-summary`}
        onClick={() => setOpen((o) => !o)}
        className="h-12 px-4 flex items-center justify-between gap-3 rounded-md border border-grey-200 bg-white text-left text-sm focus:outline-none focus:ring-2 focus:ring-brand-main"
      >
        <span id={`${panelId}-summary`} className={count === 0 ? 'text-grey-600' : 'text-grey-950'}>
          {summary}
        </span>
        <ChevronDownIcon
          size={16}
          className={`shrink-0 text-grey-950 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Les cases restent dans le DOM même repliées (hidden) : les personnes
          cochées sont envoyées avec le formulaire dans tous les cas */}
      <fieldset
        id={panelId}
        hidden={!open}
        className="absolute left-0 right-0 top-full mt-1 z-10 max-h-60 overflow-y-auto rounded-md border border-grey-200 bg-white py-2 shadow-lg"
      >
        <legend className="sr-only">{label}</legend>
        {options.length === 0 ? (
          <p className="px-4 py-2 text-sm text-grey-600">Aucun membre dans ce projet.</p>
        ) : (
          options.map((user) => (
            <label
              key={user.id}
              className="flex items-center gap-3 px-4 py-2 text-sm text-grey-950 cursor-pointer hover:bg-grey-100 has-[:focus-visible]:bg-grey-100"
            >
              <input
                type="checkbox"
                name={name}
                value={user.id}
                checked={selectedIds.includes(user.id)}
                onChange={() => toggle(user.id)}
                className="w-4 h-4 accent-brand-dark"
              />
              <Avatar user={user} size="sm" />
              {user.name ?? user.email}
            </label>
          ))
        )}
      </fieldset>
    </div>
  );
}
