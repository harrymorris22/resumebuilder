import type { SkillsData } from '../../../types/resume';
import { InlineEditor } from '../../resume/InlineEditor';

interface SkillsSectionProps {
  data: SkillsData;
  onUpdate: (data: SkillsData) => void;
}

export function SkillsSection({ data, onUpdate }: SkillsSectionProps) {
  const updateCategory = (index: number, field: 'name' | 'skills', value: string | string[]) => {
    const categories = [...data.categories];
    categories[index] = { ...categories[index], [field]: value };
    onUpdate({ categories });
  };

  if (data.categories.length === 0) {
    return (
      <div className="mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 border-b border-stone-300 pb-1 mb-2">
          Skills
        </h2>
        <p className="text-sm text-stone-300 italic">
          Your skills will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-stone-700 border-b border-stone-300 pb-1 mb-2">
        Skills
      </h2>
      {data.categories.map((cat, i) => (
        <div key={cat.id} className="mb-1 text-sm">
          <InlineEditor
            value={cat.name}
            onChange={(v) => updateCategory(i, 'name', v)}
            placeholder="Category"
            tag="span"
            className="font-semibold text-stone-800"
          />
          <span className="text-stone-400">: </span>
          <InlineEditor
            value={cat.skills.join(', ')}
            onChange={(v) =>
              updateCategory(
                i,
                'skills',
                v.split(',').map((s) => s.trim()).filter(Boolean)
              )
            }
            placeholder="Skill 1, Skill 2, Skill 3"
            tag="span"
            className="text-stone-700"
          />
        </div>
      ))}
    </div>
  );
}
