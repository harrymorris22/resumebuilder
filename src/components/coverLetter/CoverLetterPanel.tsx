import { useAppStore } from '../../stores/useAppStore';

export function CoverLetterPanel() {
  const activeCoverLetter = useAppStore((s) => s.activeCoverLetter);

  if (!activeCoverLetter) {
    return (
      <div className="flex items-center justify-center h-full bg-stone-100 dark:bg-stone-900">
        <div className="text-center px-8">
          <p className="text-stone-400 dark:text-stone-500 text-sm">
            No cover letter yet. Use Job Match mode in the chat to analyze a job
            description — Claude will generate a cover letter after tailoring
            your resume.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-stone-100 dark:bg-stone-900">
      <div className="flex-1 overflow-y-auto p-6 flex justify-center">
        <div className="bg-white shadow-lg w-full max-w-[8.5in] min-h-[11in] p-12 font-serif text-stone-900">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {activeCoverLetter.text}
          </div>
        </div>
      </div>
    </div>
  );
}
