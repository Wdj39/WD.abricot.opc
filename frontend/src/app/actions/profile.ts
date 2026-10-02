'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';
import type { PasswordFormState, ProfileFormState, User } from '@/types';

/** Mise à jour du prénom, du nom et de l'email (PUT /auth/profile) */
export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const values = {
    firstName: String(formData.get('firstName') ?? '').trim(),
    lastName: String(formData.get('lastName') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim(),
  };

  if (!values.email) {
    return { error: "L'email est obligatoire.", values };
  }

  // On recolle prénom + nom pour le champ unique "name" du backend.
  // Si les deux sont vides, on n'envoie pas le nom (le backend refuserait un nom vide).
  const name = `${values.firstName} ${values.lastName}`.trim();
  const body: { email: string; name?: string } = { email: values.email };
  if (name) body.name = name;

  const { error } = await apiFetch<{ user: User }>('/auth/profile', { method: 'PUT', body });
  if (error) return { error, values };

  // Rafraîchit toutes les pages : le header affichera les nouvelles initiales
  revalidatePath('/', 'layout');
  return { success: 'Vos informations ont bien été mises à jour.' };
}

/** Changement de mot de passe (PUT /auth/password) */
export async function updatePassword(
  _prevState: PasswordFormState,
  formData: FormData
): Promise<PasswordFormState> {
  const currentPassword = String(formData.get('currentPassword') ?? '');
  const newPassword = String(formData.get('newPassword') ?? '');
  const confirmPassword = String(formData.get('confirmPassword') ?? '');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'Veuillez remplir les trois champs.' };
  }

  // Vérification faite ici : le backend ne connaît pas la confirmation
  if (newPassword !== confirmPassword) {
    return { error: 'Les deux nouveaux mots de passe ne correspondent pas.' };
  }

  const { error } = await apiFetch('/auth/password', {
    method: 'PUT',
    body: { currentPassword, newPassword },
  });
  if (error) return { error };

  return { success: 'Votre mot de passe a bien été modifié.' };
}
