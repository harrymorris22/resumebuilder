import { ApplicationsPage } from './ApplicationsPage';

interface ApplicationsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ApplicationsDrawer({ open, onClose }: ApplicationsDrawerProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Drawer — wider than other drawers to fit table + tiles + detail panel */}
      <div className="fixed inset-y-0 left-0 w-full max-w-6xl bg-white border-r border-stone-200 z-50 flex flex-col shadow-lg">
        <div className="flex items-center justify-between px-4 h-14 border-b border-stone-200 flex-shrink-0">
          <h2 className="text-sm font-medium text-stone-800">Applications</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ApplicationsPage onClose={onClose} />
        </div>
      </div>
    </>
  );
}
