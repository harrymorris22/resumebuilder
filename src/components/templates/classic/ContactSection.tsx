import type { ContactInfo } from '../../../types/resume';
import { InlineEditor } from '../../resume/InlineEditor';

interface ContactSectionProps {
  data: ContactInfo;
  onUpdate: (data: ContactInfo) => void;
}

export function ContactSection({ data, onUpdate }: ContactSectionProps) {
  const update = (field: keyof ContactInfo, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  return (
    <div className="text-center mb-6 border-b border-gray-300 pb-4">
      <InlineEditor
        value={data.fullName}
        onChange={(v) => update('fullName', v)}
        placeholder="Your Name"
        tag="h1"
        className="text-2xl font-bold text-gray-900"
      />

      <div className="flex items-center justify-center gap-1 mt-1 text-sm text-gray-600 flex-wrap">
        <InlineEditor
          value={data.email}
          onChange={(v) => update('email', v)}
          placeholder="email@example.com"
        />
        {(data.email || data.phone) && <span className="text-gray-400">|</span>}
        <InlineEditor
          value={data.phone}
          onChange={(v) => update('phone', v)}
          placeholder="(555) 123-4567"
        />
        {(data.phone || data.location) && <span className="text-gray-400">|</span>}
        <InlineEditor
          value={data.location}
          onChange={(v) => update('location', v)}
          placeholder="City, State"
        />
      </div>

      <div className="flex items-center justify-center gap-1 mt-0.5 text-sm text-gray-500 flex-wrap">
        {(data.linkedin || data.github || data.website || !data.fullName) && (
          <>
            <InlineEditor
              value={data.linkedin ?? ''}
              onChange={(v) => update('linkedin', v)}
              placeholder="LinkedIn"
            />
            {(data.linkedin && (data.github || data.website)) && (
              <span className="text-gray-400">|</span>
            )}
            <InlineEditor
              value={data.github ?? ''}
              onChange={(v) => update('github', v)}
              placeholder="GitHub"
            />
            {(data.github && data.website) && (
              <span className="text-gray-400">|</span>
            )}
            <InlineEditor
              value={data.website ?? ''}
              onChange={(v) => update('website', v)}
              placeholder="Website"
            />
          </>
        )}
      </div>
    </div>
  );
}
