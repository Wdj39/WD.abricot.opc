import { STATUS_LABELS } from '@/lib/tasks';
import type { TaskStatus } from '@/types';

// Couleurs de la maquette : rouge "À faire", orange "En cours", vert "Terminée".
// Texte en variante "-dark" : contraste ≥ 4,5:1 sur le fond clair (WCAG AA).
const STYLES: Record<TaskStatus, string> = {
  TODO: 'bg-error-red-light text-error-red-dark',
  IN_PROGRESS: 'bg-warning-orange-light text-warning-orange-dark',
  DONE: 'bg-success-green-light text-success-green-dark',
  CANCELLED: 'bg-grey-100 text-grey-600',
};

export default function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
