import type { Task, TaskPriority, TaskStatus } from '@/types';

/** Libellés affichés pour chaque statut */
export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: 'À faire',
  IN_PROGRESS: 'En cours',
  DONE: 'Terminée',
  CANCELLED: 'Annulée',
};

/** Libellés affichés pour chaque priorité */
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Basse',
  MEDIUM: 'Moyenne',
  HIGH: 'Haute',
  URGENT: 'Urgente',
};

/**
 * Rang de chaque priorité (0 = la plus urgente).
 * Le backend trie la priorité comme du texte (ordre alphabétique :
 * HIGH, LOW, MEDIUM, URGENT), ce qui place les tâches URGENT en dernier.
 * On refait donc le tri ici, avec le bon ordre.
 */
const PRIORITY_RANK: Record<TaskPriority, number> = {
  URGENT: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

/** Tri par urgence : priorité d'abord, puis échéance la plus proche */
export function sortByUrgency(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (byPriority !== 0) return byPriority;
    // Les tâches sans échéance passent après celles qui en ont une
    const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
    const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
    return dateA - dateB;
  });
}

/** Recherche insensible à la casse et aux accents (titre, description, projet) */
export function filterTasks(tasks: Task[], query: string): Task[] {
  const normalize = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const q = normalize(query.trim());
  if (!q) return tasks;

  return tasks.filter((task) =>
    [task.title, task.description ?? '', task.project.name].some((field) =>
      normalize(field).includes(q)
    )
  );
}

/** "9 mars" (ou "9 mars 2024" si ce n'est pas l'année en cours) */
export function formatDueDate(isoDate: string): string {
  const date = new Date(isoDate);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    ...(sameYear ? {} : { year: 'numeric' }),
  }).format(date);
}

/** true si l'échéance est dépassée et la tâche pas encore terminée */
export function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'DONE') return false;
  return new Date(task.dueDate).getTime() < Date.now();
}

// ===== Mois (vue Kanban) — format "AAAA-MM" =====

/** Mois courant au format "AAAA-MM" */
export function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** true si la date ISO tombe dans le mois "AAAA-MM" */
export function isInMonth(isoDate: string, month: string): boolean {
  const date = new Date(isoDate);
  const [year, monthNumber] = month.split('-').map(Number);
  return date.getFullYear() === year && date.getMonth() + 1 === monthNumber;
}

/** Décale un mois "AAAA-MM" de n mois (ex. shiftMonth("2026-01", -1) → "2025-12") */
export function shiftMonth(month: string, n: number): string {
  const [year, monthNumber] = month.split('-').map(Number);
  const date = new Date(year, monthNumber - 1 + n, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/** "2026-10" → "octobre 2026" */
export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    new Date(year, monthNumber - 1, 1)
  );
}
