import { request } from '@/api/client';

import type { AuthApi, Business, OtpChallenge, Session, User } from './types';

/** Accounts on the Laravel API (Sanctum bearer tokens). Contract: docs/api.md. */
export function createHttpApi(): AuthApi {
  return {
    kind: 'http',
    register: (input) => request<OtpChallenge>('POST', '/auth/register', { body: input }),
    registerBusiness: (input) => request<OtpChallenge>('POST', '/business/register', { body: input }),
    verifyEmail: (email, code) => request<Session>('POST', '/auth/email/verify', { body: { email, code } }),
    resendOtp: (email, purpose) => request<OtpChallenge>('POST', '/auth/otp/resend', { body: { email, purpose } }),
    login: (email, password) => request<Session>('POST', '/auth/login', { body: { email, password } }),
    forgotPassword: (email) => request<OtpChallenge>('POST', '/auth/password/forgot', { body: { email } }),
    verifyResetCode: async (email, code) =>
      (await request<{ resetToken: string }>('POST', '/auth/password/verify', { body: { email, code } })).resetToken,
    resetPassword: (resetToken, password) =>
      request<Session>('POST', '/auth/password/reset', { body: { resetToken, password } }),
    socialSignIn: (provider, profile) => request<Session>('POST', `/auth/social/${provider}`, { body: profile }),
    me: (token) => request<Session>('GET', '/me', { token }),
    updateProfile: (token, patch) => request<User>('PATCH', '/me', { body: patch, token }),
    startTrial: (token, plan, period = 'month') =>
      request<Business>('POST', '/business/subscription/trial', { body: { plan, period }, token }),
    logout: (token) => request<void>('POST', '/auth/logout', { token }),
    deleteAccount: (token, password) => request<void>('DELETE', '/me', { body: password ? { password } : {}, token }),
    registerPushToken: (token, pushToken, platform) =>
      request<void>('POST', '/me/push-tokens', { body: { token: pushToken, platform }, token }),
    unregisterPushToken: (token, pushToken) =>
      request<void>('DELETE', '/me/push-tokens', { body: { token: pushToken }, token }),
  };
}
