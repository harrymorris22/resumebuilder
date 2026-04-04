import type { ContactInfo } from '../../../types/resume';

interface ContactSectionProps {
  data: ContactInfo;
}

export function ContactSection({ data }: ContactSectionProps) {
  const details = [data.email, data.phone, data.location].filter(Boolean);
  const urls = [data.linkedin, data.github, data.website].filter(Boolean);

  return (
    <div className="text-center mb-6 border-b border-stone-300 pb-4">
      {data.fullName && (
        <h1 className="text-2xl font-bold text-stone-900">{data.fullName}</h1>
      )}

      {details.length > 0 && (
        <div className="flex items-center justify-center gap-1 mt-1 text-sm text-stone-600 flex-wrap">
          {details.map((d, i) => (
            <span key={i}>
              {i > 0 && <span className="text-stone-400 mr-1">|</span>}
              {d}
            </span>
          ))}
        </div>
      )}

      {urls.length > 0 && (
        <div className="flex items-center justify-center gap-1 mt-0.5 text-sm text-stone-500 flex-wrap">
          {urls.map((u, i) => (
            <span key={i}>
              {i > 0 && <span className="text-stone-400 mr-1">|</span>}
              {u}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
