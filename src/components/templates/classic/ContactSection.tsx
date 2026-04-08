import type { ContactInfo } from '../../../types/resume';
import { getContactLinks } from '../../../utils/contactLinks';

interface ContactSectionProps {
  data: ContactInfo;
}

export function ContactSection({ data }: ContactSectionProps) {
  const details = [data.email, data.phone, data.location].filter(Boolean);
  const links = getContactLinks(data);

  const allItems = details.length + links.length;

  return (
    <div className="text-center mb-3 border-b border-stone-300 pb-2">
      {data.fullName && (
        <h1 className="text-2xl font-bold text-stone-900">{data.fullName}</h1>
      )}

      {allItems > 0 && (
        <div className="flex items-center justify-center gap-1 mt-1 text-sm text-stone-600 flex-wrap">
          {details.map((d, i) => (
            <span key={`d-${i}`}>
              {i > 0 && <span className="text-stone-400 mr-1">|</span>}
              {d}
            </span>
          ))}
          {links.map((link, i) => (
            <span key={`l-${i}`}>
              {(details.length > 0 || i > 0) && <span className="text-stone-400 mr-1">|</span>}
              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-stone-600 underline decoration-stone-300 hover:text-stone-900">
                {link.label}
              </a>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
