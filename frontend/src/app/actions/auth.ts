"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { TOKEN_COOKIE } from "@/lib/constants";
import type {
  ApiResponse,
  AuthData,
  AuthFormState,
  ValidationError,
} from "@/types";

/**
 * Envoie les identifiants au backend et renvoie soit le token,
 * soit un message d'erreur lisible par l'utilisateur.
 */
async function callAuthApi(
  endpoint: "/auth/login" | "/auth/register",
  body: Record<string, string>
): Promise<{ token?: string; error?: string }> {
  try {
    const response = await fetch(`${process.env.API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // En cas d'erreur, "data" contient { errors: [...] } au lieu de { user, token }
    const result: ApiResponse<AuthData & { errors?: ValidationError[] }> =
      await response.json();

    if (!response.ok || !result.success || !result.data?.token) {
      // Erreur de validation : on affiche le premier message détaillé
      const detail = result.data?.errors?.[0]?.message;
      return { error: detail ?? result.message ?? "Une erreur est survenue." };
    }

    return { token: result.data.token };
  } catch {
    // Le backend ne répond pas (arrêté, mauvaise URL…)
    return { error: "Le serveur est indisponible. Réessayez plus tard." };
  }
}

/**
 * Enregistre le token dans un cookie httpOnly :
 * il est envoyé automatiquement au serveur mais reste
 * inaccessible au JavaScript du navigateur (protection XSS).
 */
async function saveToken(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 jours, comme la durée du token côté backend
  });
}

/** Action de connexion, appelée par le formulaire /login */
export async function login(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      error: "Veuillez renseigner votre email et votre mot de passe.",
      email,
    };
  }

  const { token, error } = await callAuthApi("/auth/login", { email, password });
  if (!token) return { error, email };

  await saveToken(token);
  redirect("/dashboard");
}

/** Action d'inscription, appelée par le formulaire /signup */
export async function signup(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      error: "Veuillez renseigner votre email et votre mot de passe.",
      email,
    };
  }

  const { token, error } = await callAuthApi("/auth/register", { email, password });
  if (!token) return { error, email };

  await saveToken(token);
  redirect("/dashboard");
}

/** Déconnexion : suppression du cookie puis retour à /login */
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);
  redirect("/login");
}