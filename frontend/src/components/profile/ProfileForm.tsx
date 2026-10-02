'use client';

import { useActionState } from 'react';
import { updateProfile } from '@/app/actions/profile';
import { splitName } from '@/lib/utils';
import type { User } from '@/types';

const inputClass =
  'h-12 px-3 rounded-md border border-grey-200 bg-white text-grey-950 focus:outline-none focus:ring-2 focus:ring-brand-main';

export default function ProfileForm({ user }: { user: User }) {
  const [state, formAction, isPending] = useActionState(updateProfile, undefined);

  // Après une erreur : on réaffiche ce que l'utilisateur avait tapé.
  // Sinon : les valeurs actuelles du compte.
  const { firstName, lastName } = splitName(user.name);
  const values = state?.values ?? { firstName, lastName, email: user.email };

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="lastName" className="text-sm text-grey-950">
            Nom
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            autoComplete="family-name"
            defaultValue={values.lastName}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="firstName" className="text-sm text-grey-950">
            Prénom
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            autoComplete="given-name"
            defaultValue={values.firstName}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm text-grey-950">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={values.email}
          aria-invalid={state?.error ? true : undefined}
          className={inputClass}
        />
      </div>

      {/* role="alert" pour les erreurs (lu immédiatement), role="status" pour les succès */}
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
        {isPending ? 'Enregistrement...' : 'Modifier les informations'}
      </button>
    </form>
  );
}
