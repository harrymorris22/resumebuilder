import { useSortable } from '@dnd-kit/sortable';

interface SectionDragHandleProps {
  id: string;
  listeners: ReturnType<typeof useSortable>['listeners'];
  attributes: ReturnType<typeof useSortable>['attributes'];
}

export function SectionDragHandle({ listeners, attributes }: SectionDragHandleProps) {
  return (
    <button
      {...listeners}
      {...attributes}
      className="absolute -left-6 top-1 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-opacity"
      aria-label="Drag to reorder section"
      tabIndex={-1}
    >
      <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
        <circle cx="5" cy="3" r="1.5" />
        <circle cx="11" cy="3" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="5" cy="13" r="1.5" />
        <circle cx="11" cy="13" r="1.5" />
      </svg>
    </button>
  );
}
