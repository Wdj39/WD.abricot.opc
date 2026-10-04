'use client';

import { useEffect, useId, useState } from 'react';
import { searchUsers } from '@/app/actions/projects';
import Avatar from '@/components/ui/Avatar';
import type { UserSummary } from '@/types';

/**
 * Sélection de contributeurs : recherche (nom ou email) + liste des personnes
 * choisies. Chaque personne choisie produit un <input type="hidden"
 * name="contributors"> : le formulaire parent les envoie automatiquement.
 */
export default function ContributorPicker({
  initial = [],
  excludeIds = [],
}: {
  initial?: UserSummary[];
  excludeIds?: string[]; // ex. le propriétaire, qui ne peut pas être ajouté
}) {
  const [selected, setSelected] = useState<UserSummary[]>(initial);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSummary[]>([]);
  const inputId = useId();

  // Recherche avec un délai de 300 ms ("debounce") : on n'interroge pas le
  // backend à chaque lettre tapée, seulement quand l'utilisateur fait une pause
  useEffect(() => {
    if (query.trim().length < 2) return;
    let cancelled = false; // ignore une réponse arrivée après une saisie plus récente
    const timer = setTimeout(async () => {
      const users = await searchUsers(query);
      if (!cancelled) setResults(users);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  // Moins de 2 caractères : on ignore d'éventuels anciens résultats
  const hasQuery = query.trim().length >= 2;
  const hidden = new Set([...excludeIds, ...selected.map((u) => u.id)]);
  const suggestions = hasQuery ? results.filter((u) => !hidden.has(u.id)) : [];

  const add = (user: UserSummary) => {
    setSelected((prev) => [...prev, user]);
    setQuery('');
    setResults([]);
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm text-grey-950">
        Contributeurs
      </label>
      <input
        id={inputId}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher par nom ou email"
        autoComplete="off"
        className="h-12 px-3 rounded-md border border-grey-200 bg-white text-grey-950 focus:outline-none focus:ring-2 focus:ring-brand-main"
      />

      {suggestions.length > 0 && (
        <ul
          aria-label="Suggestions"
          className="flex flex-col rounded-md border border-grey-200 divide-y divide-grey-100"
        >
          {suggestions.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => add(user)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-grey-50 focus:outline-none focus:bg-brand-light"
              >
                <Avatar user={user} size="sm" />
                <span className="flex flex-col">
                  <span className="text-sm">{user.name ?? user.email}</span>
                  {user.name && <span className="text-xs text-grey-600">{user.email}</span>}
                </span>
                <span className="sr-only">: ajouter au projet</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {hasQuery && results.length > 0 && suggestions.length === 0 && (
        <p className="text-sm text-grey-600">Toutes les personnes trouvées sont déjà ajoutées.</p>
      )}

      {selected.length > 0 && (
        <ul aria-label="Contributeurs sélectionnés" className="flex flex-wrap gap-2">
          {selected.map((user) => (
            <li
              key={user.id}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full bg-grey-100 text-sm"
            >
              <Avatar user={user} size="sm" />
              {user.name ?? user.email}
              <button
                type="button"
                onClick={() => setSelected((prev) => prev.filter((u) => u.id !== user.id))}
                aria-label={`Retirer ${user.name ?? user.email}`}
                className="w-5 h-5 flex items-center justify-center rounded-full text-grey-600 hover:bg-grey-200"
              >
                <span aria-hidden="true">×</span>
              </button>
              <input type="hidden" name="contributors" value={user.email} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
