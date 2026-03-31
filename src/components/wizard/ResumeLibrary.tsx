import { useAppStore } from '../../stores/useAppStore';

interface ResumeLibraryProps {
  open: boolean;
  onClose: () => void;
}

export function ResumeLibrary({ open, onClose }: ResumeLibraryProps) {
  const resumes = useAppStore((s) => s.resumes);
  const jobDescriptions = useAppStore((s) => s.jobDescriptions);
  const setActiveResumeId = useAppStore((s) => s.setActiveResumeId);
  const setGeneratedResumeId = useAppStore((s) => s.setGeneratedResumeId);
  const setActiveJobDescriptionId = useAppStore((s) => s.setActiveJobDescriptionId);
  const setWizardStep = useAppStore((s) => s.setWizardStep);
  const removeResume = useAppStore((s) => s.removeResume);

  if (!open) return null;

  // Group resumes by their target job
  const resumesByJob = new Map<string | undefined, typeof resumes>();
  for (const resume of resumes) {
    const key = resume.targetJobId || undefined;
    if (!resumesByJob.has(key)) resumesByJob.set(key, []);
    resumesByJob.get(key)!.push(resume);
  }

  const handleSelectResume = (resumeId: string, jobId?: string) => {
    setActiveResumeId(resumeId);
    setGeneratedResumeId(resumeId);
    if (jobId) setActiveJobDescriptionId(jobId);
    setWizardStep('refine');
    onClose();
  };

  const sortedEntries = [...resumesByJob.entries()].sort((a, b) => {
    // Resumes with jobs first, then ungrouped
    if (a[0] && !b[0]) return -1;
    if (!a[0] && b[0]) return 1;
    // By most recent resume in group
    const latestA = Math.max(...a[1].map((r) => new Date(r.updatedAt).getTime()));
    const latestB = Math.max(...b[1].map((r) => new Date(r.updatedAt).getTime()));
    return latestB - latestA;
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-stone-800 border-l border-stone-200 dark:border-stone-700 z-50 flex flex-col shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-stone-200 dark:border-stone-700 flex-shrink-0">
          <h2 className="text-sm font-medium text-stone-800 dark:text-stone-200">
            My Resumes
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {resumes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-stone-400 dark:text-stone-500">
                No resumes yet. Generate your first CV in Step 4.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedEntries.map(([jobId, groupResumes]) => {
                const jd = jobId ? jobDescriptions.find((j) => j.id === jobId) : null;
                return (
                  <div key={jobId || 'ungrouped'}>
                    {/* Group header */}
                    <h3 className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2">
                      {jd ? `${jd.title} at ${jd.company}` : 'General'}
                    </h3>

                    <div className="space-y-1.5">
                      {groupResumes.map((resume) => (
                        <div
                          key={resume.id}
                          className="flex items-center justify-between p-3 rounded-md border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 hover:border-primary-500 cursor-pointer transition-colors group"
                          onClick={() => handleSelectResume(resume.id, jobId)}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-stone-700 dark:text-stone-300 truncate">
                              {resume.name}
                            </p>
                            <p className="text-xs text-stone-400 dark:text-stone-500">
                              {resume.templateId} · {new Date(resume.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeResume(resume.id);
                            }}
                            className="p-1 text-stone-300 hover:text-red-500 dark:text-stone-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                            aria-label={`Delete ${resume.name}`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-stone-200 dark:border-stone-700 flex-shrink-0">
          <p className="text-xs text-stone-400 dark:text-stone-500 text-center">
            {resumes.length} resume{resumes.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </>
  );
}
