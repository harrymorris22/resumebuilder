import { useState } from 'react';
import { ResumePreview } from './ResumePreview';
import { CoverLetterPanel } from '../coverLetter/CoverLetterPanel';
import { ContentPoolPage } from '../contentPool/ContentPoolPage';
import { useAppStore } from '../../stores/useAppStore';

type Tab = 'resume' | 'cover-letter' | 'cv-content';

export function RightPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('resume');
  const activeCoverLetter = useAppStore((s) => s.activeCoverLetter);
  const contentPool = useAppStore((s) => s.contentPool);

  const tabClass = (tab: Tab) =>
    `px-3 py-1 text-sm rounded-md transition-colors ${
      activeTab === tab
        ? 'bg-stone-100 dark:bg-stone-700 text-stone-900 dark:text-white font-medium'
        : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'
    }`;

  return (
    <div className="flex flex-col h-full">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-4 h-10 border-b border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 flex-shrink-0">
        <button onClick={() => setActiveTab('resume')} className={tabClass('resume')}>
          Resume
        </button>
        <button onClick={() => setActiveTab('cv-content')} className={tabClass('cv-content')}>
          CV Content
          {contentPool.length > 0 && (
            <span className="ml-1 text-xs text-stone-400 dark:text-stone-500">{contentPool.length}</span>
          )}
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
        {activeTab === 'resume' && <ResumePreview />}
        {activeTab === 'cv-content' && <ContentPoolPage />}
        {activeTab === 'cover-letter' && <CoverLetterPanel />}
      </div>
    </div>
  );
}
