import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

// ---------- mocks (hoisted so vi.mock factories can reference them) ----------

const mocks = vi.hoisted(() => ({
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  firebaseSignOut: vi.fn(),
  auth: { fake: 'auth' } as Record<string, unknown> | null,
  googleProvider: { providerId: 'google.com' },
  hasFirebaseConfig: true,
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (...args: unknown[]) => mocks.onAuthStateChanged(...args),
  signInWithPopup: (...args: unknown[]) => mocks.signInWithPopup(...args),
  signOut: (...args: unknown[]) => mocks.firebaseSignOut(...args),
  GoogleAuthProvider: vi.fn(),
}));

vi.mock('../config/firebase', () => ({
  get auth() { return mocks.auth; },
  get googleProvider() { return mocks.googleProvider; },
  get hasFirebaseConfig() { return mocks.hasFirebaseConfig; },
}));

import { AuthProvider, useAuth } from './AuthContext';

// ---------- helpers ----------

function wrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

function wrapperWith(props: { onBeforeSignOut?: () => Promise<void> }) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <AuthProvider onBeforeSignOut={props.onBeforeSignOut}>{children}</AuthProvider>;
  };
}

// ---------- tests ----------

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mutable mock state
    mocks.auth = { fake: 'auth' };
    mocks.hasFirebaseConfig = true;
    // Default: onAuthStateChanged immediately invokes callback with null user
    mocks.onAuthStateChanged.mockImplementation((_auth: unknown, cb: (u: unknown) => void) => {
      cb(null);
      return vi.fn(); // unsubscribe
    });
    mocks.signInWithPopup.mockResolvedValue({ user: { uid: '123' } });
    mocks.firebaseSignOut.mockResolvedValue(undefined);
  });

  // ---------- 1. subscribes to onAuthStateChanged ----------

  it('subscribes to onAuthStateChanged and sets user + loading', async () => {
    const fakeUser = { uid: 'u1', email: 'a@b.com' };
    mocks.onAuthStateChanged.mockImplementation((_auth: unknown, cb: (u: unknown) => void) => {
      cb(fakeUser);
      return vi.fn();
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBe(fakeUser);
    expect(result.current.uid).toBe('u1');
    expect(mocks.onAuthStateChanged).toHaveBeenCalledWith(mocks.auth, expect.any(Function));
  });

  it('unsubscribes from onAuthStateChanged on unmount', () => {
    const unsubscribe = vi.fn();
    mocks.onAuthStateChanged.mockReturnValue(unsubscribe);

    const { unmount } = renderHook(() => useAuth(), { wrapper });
    unmount();

    expect(unsubscribe).toHaveBeenCalled();
  });

  // ---------- 2. Firebase not configured ----------

  it('sets loading=false and user=null when auth is null (no Firebase config)', async () => {
    mocks.auth = null;
    mocks.hasFirebaseConfig = false;

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.loading).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.uid).toBeNull();
    expect(result.current.firebaseAvailable).toBe(false);
    expect(mocks.onAuthStateChanged).not.toHaveBeenCalled();
  });

  // ---------- 3. signIn calls signInWithPopup ----------

  it('signIn calls signInWithPopup with auth and googleProvider', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn();
    });

    expect(mocks.signInWithPopup).toHaveBeenCalledWith(mocks.auth, mocks.googleProvider);
  });

  // ---------- 4. popup-closed-by-user is silent ----------

  it('signIn handles auth/popup-closed-by-user silently', async () => {
    mocks.signInWithPopup.mockRejectedValue({ code: 'auth/popup-closed-by-user' });
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn();
    });

    // No error event dispatched
    expect(dispatchSpy).not.toHaveBeenCalled();
    dispatchSpy.mockRestore();
  });

  // ---------- 5. popup-blocked dispatches firestore-error ----------

  it('signIn handles auth/popup-blocked by dispatching firestore-error', async () => {
    mocks.signInWithPopup.mockRejectedValue({ code: 'auth/popup-blocked' });
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn();
    });

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = (dispatchSpy as Mock).mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe('firestore-error');
    expect(event.detail).toContain('popup was blocked');
    dispatchSpy.mockRestore();
  });

  it('signIn dispatches generic firestore-error for unknown errors', async () => {
    mocks.signInWithPopup.mockRejectedValue({ code: 'auth/internal-error' });
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn();
    });

    expect(dispatchSpy).toHaveBeenCalledTimes(1);
    const event = (dispatchSpy as Mock).mock.calls[0][0] as CustomEvent;
    expect(event.type).toBe('firestore-error');
    expect(event.detail).toContain('Sign-in failed');
    dispatchSpy.mockRestore();
  });

  // ---------- 6. signOut calls onBeforeSignOut then firebaseSignOut ----------

  it('signOut calls onBeforeSignOut callback before firebaseSignOut', async () => {
    const callOrder: string[] = [];
    const onBeforeSignOut = vi.fn(async () => {
      callOrder.push('onBeforeSignOut');
    });
    mocks.firebaseSignOut.mockImplementation(async () => {
      callOrder.push('firebaseSignOut');
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: wrapperWith({ onBeforeSignOut }),
    });

    await act(async () => {
      await result.current.signOut();
    });

    expect(onBeforeSignOut).toHaveBeenCalled();
    expect(mocks.firebaseSignOut).toHaveBeenCalledWith(mocks.auth);
    expect(callOrder).toEqual(['onBeforeSignOut', 'firebaseSignOut']);
  });

  it('signOut works without onBeforeSignOut callback', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mocks.firebaseSignOut).toHaveBeenCalledWith(mocks.auth);
  });

  // ---------- 7. useAuth throws outside AuthProvider ----------

  it('useAuth throws when used outside AuthProvider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });

  // ---------- edge: signIn/signOut no-op when auth is null ----------

  it('signIn no-ops when auth is null', async () => {
    mocks.auth = null;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signIn();
    });

    expect(mocks.signInWithPopup).not.toHaveBeenCalled();
  });

  it('signOut no-ops when auth is null', async () => {
    mocks.auth = null;

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.signOut();
    });

    expect(mocks.firebaseSignOut).not.toHaveBeenCalled();
  });
});
