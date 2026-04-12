import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (!user) return null;

  const photoURL = user.photoURL;
  const displayName = user.displayName || user.email || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 p-1 rounded-md hover:bg-stone-100 transition-colors"
        title={displayName}
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt=""
            className="w-6 h-6 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-[10px] font-medium flex items-center justify-center">
            {initials}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-stone-200 py-1 z-50">
          <div className="px-3 py-2 border-b border-stone-100">
            <p className="text-sm font-medium text-stone-900 truncate">{displayName}</p>
            {user.email && (
              <p className="text-xs text-stone-500 truncate">{user.email}</p>
            )}
          </div>
          <button
            onClick={() => {
              setOpen(false);
              signOut();
            }}
            className="w-full text-left px-3 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
