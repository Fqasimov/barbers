import type { CategoryId } from '@/data/types';

export type Gender = 'male' | 'female';
export type Role = 'customer' | 'business';
export type Provider = 'password' | 'google' | 'apple';

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  /** E.164, e.g. +994501234567. Empty until the user adds it (social sign-in). */
  phone: string;
  /** ISO date, YYYY-MM-DD. Empty until the user adds it. */
  birthDate: string;
  gender: Gender | null;
  role: Role;
  provider: Provider;
  emailVerified: boolean;
  createdAt: string;
};

/** Who a venue serves. Drives which places a signed-in user sees. */
export type Audience = 'all' | 'women' | 'men';

export type PlanId = 'start' | 'pro' | 'studio';

export type Subscription = {
  plan: PlanId;
  status: 'trialing' | 'active' | 'expired';
  startedAt: string;
  trialEndsAt: string;
};

export type Business = {
  id: string;
  ownerId: string;
  salonName: string;
  categories: CategoryId[];
  district: string;
  address: string;
  audience: Audience;
  /** New venues are reviewed before they appear in search. */
  status: 'pending_review' | 'live';
  subscription: Subscription | null;
  createdAt: string;
};

export type Session = { token: string; user: User; business: Business | null };

export type OtpPurpose = 'register' | 'reset';

/** What the server tells the app after it emails a one-time code. */
export type OtpChallenge = {
  email: string;
  purpose: OtpPurpose;
  expiresAt: string;
  /** The earliest time "send again" is allowed. */
  resendAt: string;
  /**
   * Local demo backend only: the code that would have been emailed. A real
   * backend never returns it.
   */
  demoCode?: string;
};

export type RegisterInput = {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  gender: Gender;
  email: string;
  password: string;
};

export type BusinessRegisterInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  salonName: string;
  categories: CategoryId[];
  district: string;
  address: string;
  audience: Audience;
};

export type ProfilePatch = Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'birthDate' | 'gender'>>;

export type SocialProfile = {
  /** Google ID token or Apple identity token. The backend verifies it. */
  idToken: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_taken'
  | 'not_verified'
  | 'otp_invalid'
  | 'otp_expired'
  | 'too_many_attempts'
  | 'resend_too_soon'
  | 'not_found'
  | 'session_expired'
  | 'validation'
  | 'network'
  | 'unknown';

export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    /** Field-level messages from the server (Laravel 422), keyed by field. */
    public fields?: Record<string, string>,
    /** For `not_verified`: a fresh code was sent. */
    public challenge?: OtpChallenge,
  ) {
    super(code);
    this.name = 'AuthError';
  }
}

/** The contract every backend implements: the on-device demo now, Laravel later. */
export interface AuthApi {
  readonly kind: 'demo' | 'http';
  register(input: RegisterInput): Promise<OtpChallenge>;
  registerBusiness(input: BusinessRegisterInput): Promise<OtpChallenge>;
  /** Confirms the emailed code for a new account and signs it in. */
  verifyEmail(email: string, code: string): Promise<Session>;
  resendOtp(email: string, purpose: OtpPurpose): Promise<OtpChallenge>;
  login(email: string, password: string): Promise<Session>;
  forgotPassword(email: string): Promise<OtpChallenge>;
  /** Exchanges a password-reset code for a short-lived reset token. */
  verifyResetCode(email: string, code: string): Promise<string>;
  resetPassword(resetToken: string, password: string): Promise<Session>;
  socialSignIn(provider: 'google' | 'apple', profile: SocialProfile): Promise<Session>;
  me(token: string): Promise<Session>;
  updateProfile(token: string, patch: ProfilePatch): Promise<User>;
  startTrial(token: string, plan: PlanId): Promise<Business>;
  logout(token: string): Promise<void>;
}
