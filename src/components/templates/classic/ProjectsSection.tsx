import type { ProjectItem } from '../../../types/resume';
import { InlineEditor } from '../../resume/InlineEditor';

interface ProjectsSectionProps {
  data: { items: ProjectItem[] };
  onUpdate: (data: { items: ProjectItem[] }) => void;
}

export function ProjectsSection({ data, onUpdate }: ProjectsSectionProps) {
  const updateItem = (index: number, updated: Partial<ProjectItem>) => {
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

  if (data.items.length === 0) return null;

  return (
    <div className="mb-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
        Projects
      </h2>
      {data.items.map((item, i) => (
        <div key={item.id} className="mb-3">
          <div className="flex items-baseline gap-2">
            <InlineEditor
              value={item.name}
              onChange={(v) => updateItem(i, { name: v })}
              placeholder="Project Name"
              tag="span"
              className="font-semibold text-sm text-gray-900"
            />
            {item.technologies.length > 0 && (
              <span className="text-xs text-gray-500">
                ({item.technologies.join(', ')})
              </span>
            )}
          </div>
          <InlineEditor
            value={item.description}
            onChange={(v) => updateItem(i, { description: v })}
            placeholder="Brief project description"
            tag="p"
            className="text-sm text-gray-600 mt-0.5"
          />
          {item.bullets.length > 0 && (
            <ul className="list-disc ml-4 mt-1 space-y-0.5">
              {item.bullets.map((bullet, bi) => (
                <li key={bi} className="text-sm text-gray-700">
                  <InlineEditor
                    value={bullet}
                    onChange={(v) => updateBullet(i, bi, v)}
                    placeholder="Describe..."
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
