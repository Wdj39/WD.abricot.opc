import { SearchIcon } from '@/components/ui/Icons';

/** Champ de recherche avec loupe, utilisé sur le dashboard et la page projet */
export default function SearchBar({
  value,
  onChange,
  id = 'task-search',
  label = 'Rechercher une tâche',
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  label?: string;
}) {
  return (
    <div className="relative w-full sm:w-72">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className="w-full h-11 pl-4 pr-10 rounded-lg border border-grey-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-main"
      />
      <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-grey-400" />
    </div>
  );
}
