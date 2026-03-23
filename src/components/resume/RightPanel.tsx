import { useState } from 'react';
import { ResumePreview } from './ResumePreview';
import { CoverLetterPanel } from '../coverLetter/CoverLetterPanel';
import { useAppStore } from '../../stores/useAppStore';

type Tab = 'resume' | 'cover-letter';

export function RightPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('resume');
  const activeCoverLetter = useAppStore((s) => s.activeCoverLetter);

  const tabClass = (tab: Tab) =>
    `px-3 py-1 text-sm rounded-md transition-colors ${
      activeTab === tab
        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    }`;

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 h-10 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
        <button onClick={() => setActiveTab('resume')} className={tabClass('resume')}>
          Resume
        </button>
        <button onClick={() => setActiveTab('cover-letter')} className={tabClass('cover-letter')}>
          Cover Letter
          {activeCoverLetter && (
            <span className="ml-1 w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'resume' ? <ResumePreview /> : <CoverLetterPanel />}
      </div>
    </div>
  );
}
