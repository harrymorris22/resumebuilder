import type { EducationItem } from '../../../types/resume';
import { InlineEditor } from '../../resume/InlineEditor';

interface EducationSectionProps {
  data: { items: EducationItem[] };
  onUpdate: (data: { items: EducationItem[] }) => void;
}

export function EducationSection({ data, onUpdate }: EducationSectionProps) {
  const updateItem = (index: number, updated: Partial<EducationItem>) => {
    const items = [...data.items];
    items[index] = { ...items[index], ...updated };
    onUpdate({ items });
  };

  if (data.items.length === 0) {
    return (
      <div className="mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 border-b border-stone-300 pb-1 mb-1">
          Education
        </h2>
        <p className="text-sm text-stone-300 italic">
          Your education will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 border-b border-stone-300 pb-1 mb-1">
        Education
      </h2>
      {data.items.map((item, i) => (
        <div key={item.id} className="mb-2">
          <div className="flex justify-between items-baseline">
            <div>
              <InlineEditor
                value={item.degree}
                onChange={(v) => updateItem(i, { degree: v })}
                placeholder="Degree"
                tag="span"
                className="font-semibold text-sm text-stone-900"
              />
              {(item.field || !item.degree) && (
                <>
                  <span className="text-stone-400 mx-1">in</span>
                  <InlineEditor
                    value={item.field}
                    onChange={(v) => updateItem(i, { field: v })}
                    placeholder="Field of Study"
                    tag="span"
                    className="text-sm text-stone-700"
                  />
                </>
              )}
              {item.institution && (
                <>
                  <span className="text-stone-400 mx-1">—</span>
                  <InlineEditor
                    value={item.institution}
                    onChange={(v) => updateItem(i, { institution: v })}
                    placeholder="Institution Name"
                    tag="span"
                    className="text-sm text-stone-600"
                  />
                </>
              )}
              {item.gpa && (
                <span className="text-xs text-stone-500 ml-1">(GPA: {item.gpa})</span>
              )}
            </div>
            <span className="text-xs text-stone-500 whitespace-nowrap ml-2">
              {item.dateRange.start}
              {item.dateRange.start && ' - '}
              {item.dateRange.end ?? 'Present'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
