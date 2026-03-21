import { useRef, useCallback } from 'react';
import type { KeyboardEvent } from 'react';

interface InlineEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  tag?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3';
  multiline?: boolean;
}

export function InlineEditor({
  value,
  onChange,
  placeholder = 'Click to edit',
  className = '',
  tag: Tag = 'span',
  multiline = false,
}: InlineEditorProps) {
  const ref = useRef<HTMLElement>(null);

  const handleBlur = useCallback(() => {
    if (ref.current) {
      const text = ref.current.innerText.trim();
      if (text !== value) {
        onChange(text);
      }
    }
  }, [value, onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !multiline) {
        e.preventDefault();
        ref.current?.blur();
      }
      if (e.key === 'Escape') {
        if (ref.current) {
          ref.current.innerText = value;
          ref.current.blur();
        }
      }
    },
    [value, multiline]
  );

  return (
    <Tag
      ref={ref as React.Ref<never>}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      className={`outline-none focus:ring-2 focus:ring-primary-500/30 focus:bg-primary-50/30 rounded px-0.5 -mx-0.5 cursor-text ${
        !value ? 'text-gray-300 italic' : ''
      } ${className}`}
      data-placeholder={placeholder}
      role="textbox"
      aria-label={placeholder}
      tabIndex={0}
    >
      {value || placeholder}
    </Tag>
  );
}
