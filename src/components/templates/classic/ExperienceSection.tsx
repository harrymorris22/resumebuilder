import type { ExperienceItem } from '../../../types/resume';
import { InlineEditor } from '../../resume/InlineEditor';

interface ExperienceSectionProps {
  data: { items: ExperienceItem[] };
  onUpdate: (data: { items: ExperienceItem[] }) => void;
}

function formatDateRange(dr: ExperienceItem['dateRange']) {
  const start = dr.start || 'Start Date';
  const end = dr.end ?? 'Present';
  return `${start} - ${end}`;
}

export function ExperienceSection({ data, onUpdate }: ExperienceSectionProps) {
  const updateItem = (index: number, updated: Partial<ExperienceItem>) => {
    const items = [...data.items];
    items[index] = { ...items[index], ...updated };
    onUpdate({ items });
  };

  const updateBullet = (itemIndex: number, bulletIndex: number, value: string) => {
    const items = [...data.items];
    const bullets = [...items[itemIndex].bullets];
    bullets[bulletIndex] = value;
    items[itemIndex] = { ...items[itemIndex], bullets };
    onUpdate({ items });
  };

  if (data.items.length === 0) {
    return (
      <div className="mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 border-b border-stone-300 pb-1 mb-2">
          Experience
        </h2>
        <p className="text-sm text-stone-300 italic">
          Your work experience will appear here. Chat with the AI to add entries.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 border-b border-stone-300 pb-1 mb-2">
        Experience
      </h2>
      {data.items.map((item, i) => (
        <div key={item.id} className="mb-3">
          <div className="flex justify-between items-baseline">
            <div>
              <InlineEditor
                value={item.title}
                onChange={(v) => updateItem(i, { title: v })}
                placeholder="Job Title"
                tag="span"
                className="font-semibold text-sm text-stone-900"
              />
              <span className="text-stone-400 mx-1">at</span>
              <InlineEditor
                value={item.company}
                onChange={(v) => updateItem(i, { company: v })}
                placeholder="Company Name"
                tag="span"
                className="text-sm text-stone-700"
              />
            </div>
            <div className="text-xs text-stone-500 whitespace-nowrap ml-2">
              <InlineEditor
                value={formatDateRange(item.dateRange)}
                onChange={(v) => {
                  const parts = v.split(' - ').map((s) => s.trim());
                  updateItem(i, {
                    dateRange: {
                      start: parts[0] || '',
                      end: parts[1] === 'Present' ? null : parts[1] || '',
                    },
                  });
                }}
                placeholder="Date Range"
              />
            </div>
          </div>
          {item.location && (
            <InlineEditor
              value={item.location}
              onChange={(v) => updateItem(i, { location: v })}
              placeholder="Location"
              tag="div"
              className="text-xs text-stone-500"
            />
          )}
          {item.bullets.length > 0 && (
            <ul className="list-disc ml-4 mt-1 space-y-0.5">
              {item.bullets.map((bullet, bi) => (
                <li key={bi} className="text-sm text-stone-700">
                  <InlineEditor
                    value={bullet}
                    onChange={(v) => updateBullet(i, bi, v)}
                    placeholder="Describe your achievement..."
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
