'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { signup } from '@/app/actions/auth';

export default function SignupForm() {
  // Même principe que LoginForm, mais relié à l'action "signup"
  const [state, formAction, isPending] = useActionState(signup, undefined);

  return (
    <div className="flex-1 flex flex-col items-center">
      {/* my-auto : le bloc titre + formulaire est centré verticalement,
          le lien du bas reste collé en bas de la colonne (maquette) */}
      <div className="my-auto w-full flex flex-col items-center gap-8 py-12">
        <h1 className="text-3xl font-semibold text-brand-main">Inscription</h1>

        <form action={formAction} className="w-full flex flex-col gap-5" noValidate>
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
              // Réaffiche l'email saisi après une erreur
              defaultValue={state?.email}
              aria-invalid={state?.error ? true : undefined}
              className="h-12 px-3 rounded-md border border-grey-200 bg-white text-grey-950 focus:outline-none focus:ring-2 focus:ring-brand-main"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-sm text-grey-950">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              // "new-password" : le navigateur propose de générer un mot de passe fort
              autoComplete="new-password"
              required
              // Relie le champ à l'aide ci-dessous : les lecteurs d'écran la lisent
              aria-describedby="password-hint"
              aria-invalid={state?.error ? true : undefined}
              className="h-12 px-3 rounded-md border border-grey-200 bg-white text-grey-950 focus:outline-none focus:ring-2 focus:ring-brand-main"
            />
            <p id="password-hint" className="text-xs text-grey-600">
              8 caractères minimum, avec une majuscule, une minuscule, un chiffre et un caractère
              spécial (@$!%*?&).
            </p>
          </div>

          {/* Message d'erreur annoncé par les lecteurs d'écran grâce à role="alert" */}
          {state?.error && (
            <p role="alert" className="text-sm text-error-red text-center">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="self-center mt-2 w-44 h-12 rounded-lg bg-grey-950 text-white font-medium hover:bg-grey-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? 'Inscription...' : "S'inscrire"}
          </button>
        </form>
      </div>

      <p className="text-sm text-grey-950">
        Déjà inscrit ?{' '}
        <Link href="/login" className="text-brand-dark underline hover:no-underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
