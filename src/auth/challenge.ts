import { create } from 'zustand';

import type { OtpChallenge } from './types';

/**
 * The code that was just sent (and, after a reset code is confirmed, the
 * short-lived reset token), handed between screens in memory — never through
 * the URL.
 */
export const useChallenge = create<{
  challenge: OtpChallenge | null;
  resetToken: string | null;
  set: (c: OtpChallenge) => void;
  setResetToken: (t: string | null) => void;
}>()((set) => ({
  challenge: null,
  resetToken: null,
  set: (challenge) => set({ challenge }),
  setResetToken: (resetToken) => set({ resetToken }),
}));
