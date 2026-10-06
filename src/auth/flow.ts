import { router, useRootNavigationState, type Href } from 'expo-router';
import { useCallback } from 'react';

import { toast } from '@/components/Toaster';
import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { useStore } from '@/store/useStore';

import { AuthError, type Session } from './types';
import { missingProfile, useSession } from './useSession';

/** Routes that belong to the sign-in / sign-up flow and close together when it finishes. */
const FLOW = /^(auth\/|business\/(register|plans))/;

type NavState = { routes?: { name: string; state?: NavState }[] } | undefined;

/** The root navigator wraps the app's stack in a single `__root` route; unwrap to the real stack. */
function stackRoutes(state: NavState) {
  let s = state;
  while (s?.routes?.length === 1 && s.routes[0].state) s = s.routes[0].state;
  return s?.routes ?? [];
}

/** Maps an error from any backend to a message key. */
export function authErrorKey(e: unknown): StringKey {
  const code = e instanceof AuthError ? e.code : (e as { code?: string })?.code;
  switch (code) {
    case 'invalid_credentials':
      return 'errInvalidCredentials';
    case 'email_taken':
      return 'errEmailTaken';
    case 'otp_invalid':
      return 'errOtpInvalid';
    case 'otp_expired':
      return 'errOtpExpired';
    case 'too_many_attempts':
      return 'errTooManyAttempts';
    case 'resend_too_soon':
      return 'errResendTooSoon';
    case 'network':
      return 'errNetwork';
    case 'session_expired':
      return 'errSessionExpired';
    default:
      return 'errUnknown';
  }
}

/**
 * Closes every account screen on top of the stack and returns to where the
 * flow was opened from (a booking, a review, the profile tab…), optionally
 * opening another screen afterwards.
 */
export function useExitAuthFlow() {
  const state = useRootNavigationState();
  return useCallback(
    (then?: Href) => {
      const routes = stackRoutes(state as NavState);
      let n = 0;
      for (let i = routes.length - 1; i >= 0 && FLOW.test(routes[i].name); i--) n++;
      if (n > 0 && router.canDismiss()) router.dismiss(n);
      else if (router.canGoBack()) router.back();
      if (then) router.push(then);
    },
    [state],
  );
}

/** Stores the session and decides where a fresh sign-in goes next. */
export function useFinishSignIn() {
  const i18n = useI18n();
  const exit = useExitAuthFlow();
  const setSession = useSession((s) => s.setSession);
  return useCallback(
    (session: Session) => {
      setSession(session);
      // Reviews show this name; keep it in step with the account.
      const { firstName, lastName } = session.user;
      if (firstName) {
        useStore.getState().setName(`${firstName}${lastName ? ` ${lastName[0]}.` : ''}`);
      }
      useStore.getState().setAuthPrompted();
      if (missingProfile(session.user)) {
        router.replace('/auth/complete');
        return;
      }
      if (session.user.role === 'business' && !session.business?.subscription) {
        router.replace('/business/plans');
        return;
      }
      toast(i18n.t('welcomeUser', { name: firstName || session.user.email }));
      exit(session.user.role === 'business' ? '/business' : undefined);
    },
    [exit, i18n, setSession],
  );
}

/** Use before booking or reviewing: returns true if signed in, otherwise opens sign-in. */
export function requireSignIn(reason: StringKey, message: string): boolean {
  if (useSession.getState().session) return true;
  toast(message, 'info');
  router.push({ pathname: '/auth/sign-in', params: { reason } });
  return false;
}
