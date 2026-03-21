import { InlineEditor } from '../../resume/InlineEditor';

interface SummarySectionProps {
  data: { text: string };
  onUpdate: (data: { text: string }) => void;
}

export function SummarySection({ data, onUpdate }: SummarySectionProps) {
  return (
    <div className="mb-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
        Professional Summary
      </h2>
      <InlineEditor
        value={data.text}
        onChange={(text) => onUpdate({ text })}
        placeholder="Write a brief professional summary highlighting your key strengths and career objectives..."
        tag="p"
        className="text-sm text-gray-700 leading-relaxed"
        multiline
      />
    </div>
  );
}
