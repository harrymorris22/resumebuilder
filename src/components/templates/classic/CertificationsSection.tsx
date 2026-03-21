import type { CertificationItem } from '../../../types/resume';
import { InlineEditor } from '../../resume/InlineEditor';

interface CertificationsSectionProps {
  data: { items: CertificationItem[] };
  onUpdate: (data: { items: CertificationItem[] }) => void;
}

export function CertificationsSection({ data, onUpdate }: CertificationsSectionProps) {
  const updateItem = (index: number, updated: Partial<CertificationItem>) => {
    const items = [...data.items];
    items[index] = { ...items[index], ...updated };
    onUpdate({ items });
  };

  if (data.items.length === 0) {
    return (
      <div className="mb-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
          Certifications
        </h2>
        <p className="text-sm text-gray-300 italic">
          Your certifications will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 border-b border-gray-300 pb-1 mb-2">
        Certifications
      </h2>
      {data.items.map((item, i) => (
        <div key={item.id} className="mb-1 flex justify-between items-baseline text-sm">
          <div>
            <InlineEditor
              value={item.name}
              onChange={(v) => updateItem(i, { name: v })}
              placeholder="Certification Name"
              tag="span"
              className="font-semibold text-gray-900"
            />
            <span className="text-gray-400 mx-1">-</span>
            <InlineEditor
              value={item.issuer}
              onChange={(v) => updateItem(i, { issuer: v })}
              placeholder="Issuing Organization"
              tag="span"
              className="text-gray-600"
            />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
            {item.date}
          </span>
        </div>
      ))}
    </div>
  );
}
