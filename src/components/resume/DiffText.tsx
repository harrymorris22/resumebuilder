import { diffWords } from '../../utils/diffWords';

interface DiffTextProps {
  oldText: string;
  newText: string;
}

export function DiffText({ oldText, newText }: DiffTextProps) {
  if (oldText === newText) {
    return <span>{oldText}</span>;
  }

  const segments = diffWords(oldText, newText);

  return (
    <span>
      {segments.map((seg, i) => {
        if (seg.type === 'removed') {
          return (
            <span key={i} className="bg-red-100 text-red-700 line-through">
              {seg.text}
            </span>
          );
        }
        if (seg.type === 'added') {
          return (
            <span key={i} className="bg-green-100 text-green-700">
              {seg.text}
            </span>
          );
        }
        return <span key={i}>{seg.text}</span>;
      })}
    </span>
  );
}
