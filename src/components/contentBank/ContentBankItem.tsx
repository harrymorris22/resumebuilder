import type { ContentBankItem } from '../../types/resume';

interface ContentBankItemCardProps {
  item: ContentBankItem;
  onDelete: () => void;
}

export function ContentBankItemCard({ item, onDelete }: ContentBankItemCardProps) {
  return (
    <div
      className={`p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm ${
        item.superseded ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-gray-800 dark:text-gray-200 flex-1">{item.text}</p>
        <button
          onClick={onDelete}
          className="text-gray-300 hover:text-rose-500 transition-colors flex-shrink-0 mt-0.5"
          aria-label="Delete item"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span
          className={`px-1.5 py-0.5 text-xs rounded ${
            item.source === 'ai'
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}
        >
          {item.source === 'ai' ? 'AI' : 'Manual'}
        </span>
        <span className="text-xs text-gray-400">{item.type}</span>
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            {tag}
          </span>
        ))}
      </div>

      {item.metadata && (item.metadata.company || item.metadata.role) && (
        <div className="text-xs text-gray-400 mt-1">
          {[item.metadata.role, item.metadata.company].filter(Boolean).join(' at ')}
        </div>
      )}
    </div>
  );
}
