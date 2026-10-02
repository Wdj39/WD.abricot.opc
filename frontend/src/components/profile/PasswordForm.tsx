'use client';

import { useActionState } from 'react';
import { updatePassword } from '@/app/actions/profile';

const inputClass =
  'h-12 px-3 rounded-md border border-grey-200 bg-white text-grey-950 focus:outline-none focus:ring-2 focus:ring-brand-main';

export default function PasswordForm() {
  // Les mots de passe ne sont jamais réaffichés : le formulaire se vide après chaque envoi
  const [state, formAction, isPending] = useActionState(updatePassword, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="flex flex-col gap-1">
        <label htmlFor="currentPassword" className="text-sm text-grey-950">
          Mot de passe actuel
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="newPassword" className="text-sm text-grey-950">
            Nouveau mot de passe
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            required
            aria-describedby="new-password-hint"
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="confirmPassword" className="text-sm text-grey-950">
            Confirmer le nouveau mot de passe
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className={inputClass}
          />
        </div>
      </div>

      <p id="new-password-hint" className="-mt-3 text-xs text-grey-600">
        8 caractères minimum, avec une majuscule, une minuscule, un chiffre et un caractère spécial
        (@$!%*?&).
      </p>

      {state?.error && (
        <p role="alert" className="text-sm text-error-red">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p role="status" className="text-sm text-success-green">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start h-12 px-6 rounded-lg bg-grey-950 text-white font-medium hover:bg-grey-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? 'Enregistrement...' : 'Modifier le mot de passe'}
      </button>
    </form>
  );
}
