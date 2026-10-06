import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { authApi } from './index';
import type { Business, Session, User } from './types';

/** Keychain / Keystore on phones; localStorage on web, where SecureStore doesn't exist. */
const secureStorage: StateStorage =
  Platform.OS === 'web'
    ? {
        getItem: (k) => globalThis.localStorage?.getItem(k) ?? null,
        setItem: (k, v) => globalThis.localStorage?.setItem(k, v),
        removeItem: (k) => globalThis.localStorage?.removeItem(k),
      }
    : {
        getItem: (k) => SecureStore.getItemAsync(k),
        setItem: (k, v) => SecureStore.setItemAsync(k, v),
        removeItem: (k) => SecureStore.deleteItemAsync(k),
      };

type SessionState = {
  session: Session | null;
  hydrated: boolean;
  setSession: (s: Session) => void;
  setUser: (u: User) => void;
  setBusiness: (b: Business) => void;
  /** Re-reads the account from the backend; signs out if the token is no longer valid. */
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useSession = create<SessionState>()(
  persist(
    (set, get) => ({
      session: null,
      hydrated: false,
      setSession: (session) => set({ session }),
      setUser: (user) => {
        const s = get().session;
        if (s) set({ session: { ...s, user } });
      },
      setBusiness: (business) => {
        const s = get().session;
        if (s) set({ session: { ...s, business } });
      },
      refresh: async () => {
        const s = get().session;
        if (!s) return;
        try {
          set({ session: await authApi.me(s.token) });
        } catch (e) {
          if ((e as { code?: string }).code === 'session_expired') set({ session: null });
        }
      },
      signOut: async () => {
        const s = get().session;
        set({ session: null });
        if (s) await authApi.logout(s.token).catch(() => undefined);
      },
    }),
    {
      name: 'usta-session-v1',
      storage: createJSONStorage(() => secureStorage),
      partialize: ({ session }) => ({ session }),
    },
  ),
);

// Storage can be synchronous (web) or async (SecureStore), so hydration may
// already be done here. Either way, mark ready once and re-validate the token.
const markReady = () => {
  useSession.setState({ hydrated: true });
  void useSession.getState().refresh();
};
if (useSession.persist.hasHydrated()) markReady();
else useSession.persist.onFinishHydration(markReady);

/** Fields a social sign-in can leave empty, which booking needs. */
export const missingProfile = (u: User) =>
  !u.firstName || !u.lastName || !u.phone || (u.role === 'customer' && (!u.birthDate || !u.gender));
