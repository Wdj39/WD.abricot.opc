'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { login } from '@/app/actions/auth';

export default function LoginForm() {
  // useActionState relie le formulaire à l'action serveur :
  // - state : le retour de l'action (message d'erreur éventuel)
  // - formAction : la fonction à passer au <form>
  // - isPending : true pendant l'envoi (pour désactiver le bouton)
  const [state, formAction, isPending] = useActionState(login, undefined);

  return (
    <div className="flex-1 flex flex-col items-center">
      {/* my-auto : le bloc titre + formulaire est centré verticalement,
          le lien du bas reste collé en bas de la colonne (maquette) */}
      <div className="my-auto w-full flex flex-col items-center gap-8 py-12">
        <h1 className="text-3xl font-semibold text-brand-main">Connexion</h1>

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
              autoComplete="current-password"
              required
              aria-invalid={state?.error ? true : undefined}
              className="h-12 px-3 rounded-md border border-grey-200 bg-white text-grey-950 focus:outline-none focus:ring-2 focus:ring-brand-main"
            />
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
            {isPending ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>

      <p className="text-sm text-grey-950">
        Pas encore de compte ?{' '}
        <Link href="/signup" className="text-brand-dark underline hover:no-underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
