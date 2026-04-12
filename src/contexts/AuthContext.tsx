import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { auth, googleProvider, hasFirebaseConfig } from '../config/firebase';

interface AuthContextValue {
  user: User | null;
  uid: string | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  firebaseAvailable: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  onBeforeSignOut?: () => Promise<void>;
}

export function AuthProvider({ children, onBeforeSignOut }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  // If auth isn't available, we're never loading. Otherwise start loading
  // and let onAuthStateChanged resolve it.
  const [loading, setLoading] = useState(() => !!auth);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async () => {
    if (!auth) return;
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error.code === 'auth/popup-closed-by-user') return;
      if (error.code === 'auth/popup-blocked') {
        window.dispatchEvent(
          new CustomEvent('firestore-error', { detail: 'Sign-in popup was blocked. Please allow popups for this site.' })
        );
        return;
      }
      console.error('Sign-in failed:', err);
      window.dispatchEvent(
        new CustomEvent('firestore-error', { detail: 'Sign-in failed. Please try again.' })
      );
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!auth) return;
    try {
      // Flush pending writes before clearing state
      if (onBeforeSignOut) await onBeforeSignOut();
      await firebaseSignOut(auth);
    } catch (err) {
      console.error('Sign-out failed:', err);
    }
  }, [onBeforeSignOut]);

  return (
    <AuthContext.Provider
      value={{
        user,
        uid: user?.uid ?? null,
        loading,
        signIn,
        signOut,
        firebaseAvailable: hasFirebaseConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
