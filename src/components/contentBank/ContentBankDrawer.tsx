import { useState, useMemo } from 'react';
import { useAppStore } from '../../stores/useAppStore';
import { ContentBankItemCard } from './ContentBankItem';
import type { ContentBankItem } from '../../types/resume';

interface ContentBankDrawerProps {
  open: boolean;
  onClose: () => void;
}

const TYPES: Array<ContentBankItem['type'] | 'all'> = ['all', 'bullet', 'summary', 'skill', 'experience', 'project'];

export function ContentBankDrawer({ open, onClose }: ContentBankDrawerProps) {
  const items = useAppStore((s) => s.contentBankItems);
  const removeItem = useAppStore((s) => s.removeContentBankItem);
  const [typeFilter, setTypeFilter] = useState<ContentBankItem['type'] | 'all'>('all');
  const [showSuperseded, setShowSuperseded] = useState(false);
  const [searchText, setSearchText] = useState('');

  const filtered = useMemo(() => {
    return items
      .filter((i) => {
        if (!showSuperseded && i.superseded) return false;
        if (typeFilter !== 'all' && i.type !== typeFilter) return false;
        if (searchText && !i.text.toLowerCase().includes(searchText.toLowerCase()) && !i.tags.some((t) => t.toLowerCase().includes(searchText.toLowerCase()))) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [items, typeFilter, showSuperseded, searchText]);

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-[400px] max-w-full bg-white dark:bg-gray-800 shadow-2xl flex flex-col ml-auto">
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Content Bank
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close content bank"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 space-y-2">
          <input
            type="text"
            placeholder="Search content..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="flex gap-1 flex-wrap">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2 py-0.5 text-xs rounded-md transition-colors ${
                  typeFilter === t
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-xs text-gray-500">
            <input
              type="checkbox"
              checked={showSuperseded}
              onChange={(e) => setShowSuperseded(e.target.checked)}
              className="rounded"
            />
            Show archived items
          </label>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 dark:text-gray-500 text-sm">
                {items.length === 0
                  ? 'Your content bank is empty. Chat with Claude to start building.'
                  : 'No items match your filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => (
                <ContentBankItemCard
                  key={item.id}
                  item={item}
                  onDelete={() => removeItem(item.id)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400">
          {filtered.length} of {items.length} items
        </div>
      </div>
    </div>
  );
}
