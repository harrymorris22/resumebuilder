import { useState } from 'react';
import { useAppStore } from '../../stores/useAppStore';

interface ActionChip {
  label: string;
  prompt: string;
  action?: 'upload' | 'tailor';
}

function getChips(
  hasName: boolean,
  hasExperience: boolean,
  hasSummary: boolean,
  isJobMode: boolean
): ActionChip[] {
  if (isJobMode) return [];

  if (!hasName && !hasExperience) {
    return [
      { label: 'Tell me about yourself', prompt: "Let's start building my resume. Ask me about my background." },
      { label: 'Upload existing resume', prompt: '', action: 'upload' },
    ];
  }

  if (hasName && !hasExperience) {
    return [
      { label: 'Add work experience', prompt: 'I want to add a new work experience. Ask me about it.' },
      { label: 'Upload existing resume', prompt: '', action: 'upload' },
    ];
  }

  const chips: ActionChip[] = [
    { label: 'Analyze my resume', prompt: 'Review my current resume and give me specific suggestions for improvement. Look at bullet strength, missing sections, keyword gaps, and overall structure.' },
    { label: 'Strengthen weak bullets', prompt: 'Find the weakest bullet points in my resume and suggest STAR-format rewrites for each one.' },
    { label: "What's missing?", prompt: "Based on my resume, what sections or experiences might be missing? Ask me probing questions like 'Do you have a story about X?' for things that could strengthen my profile." },
    { label: 'Tailor to a job', prompt: '', action: 'tailor' },
  ];

  if (!hasSummary) {
    chips.splice(3, 0, {
      label: 'Write my summary',
      prompt: 'Write a professional summary based on my resume content.',
    });
  }

  return chips;
}

export function ActionSuggestions({
  onSend,
  onUpload,
  onTailor,
  collapsed,
}: {
  onSend: (prompt: string) => void;
  onUpload: () => void;
  onTailor: () => void;
  collapsed?: boolean;
}) {
  const resumes = useAppStore((s) => s.resumes);
  const activeResumeId = useAppStore((s) => s.activeResumeId);
  const chatSessions = useAppStore((s) => s.chatSessions);
  const activeChatSessionId = useAppStore((s) => s.activeChatSessionId);

  const [expanded, setExpanded] = useState(false);

  const activeResume = resumes.find((r) => r.id === activeResumeId);
  const activeSession = chatSessions.find((s) => s.id === activeChatSessionId);
  const isJobMode = activeSession?.mode === 'job-customisation';

  if (!activeResume) return null;

  const contactSection = activeResume.sections.find((s) => s.content.type === 'contact');
  const hasName = contactSection?.content.type === 'contact' && !!contactSection.content.data.fullName;
  const expSection = activeResume.sections.find((s) => s.content.type === 'experience');
  const hasExperience = expSection?.content.type === 'experience' && expSection.content.data.items.length > 0;
  const sumSection = activeResume.sections.find((s) => s.content.type === 'summary');
  const hasSummary = sumSection?.content.type === 'summary' && !!sumSection.content.data.text;

  const chips = getChips(hasName, hasExperience, hasSummary, isJobMode);
  if (chips.length === 0) return null;

  if (collapsed && !expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="text-xs text-gray-400 hover:text-primary-500 transition-colors py-1"
      >
        More actions...
      </button>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-2 py-2"
      role="toolbar"
      aria-label="Suggested actions"
    >
      {chips.map((chip) => (
        <button
          key={chip.label}
          onClick={() => {
            if (chip.action === 'upload') {
              onUpload();
            } else if (chip.action === 'tailor') {
              onTailor();
            } else {
              onSend(chip.prompt);
            }
          }}
          className="px-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 dark:hover:bg-primary-900/20 dark:hover:border-primary-500 dark:hover:text-primary-300 transition-colors"
        >
          {chip.label}
        </button>
      ))}
      {collapsed && expanded && (
        <button
          onClick={() => setExpanded(false)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2"
        >
          Less
        </button>
      )}
    </div>
  );
}
