import { isLive } from '@/api/client';

import { createHttpApi } from './http';
import { localApi } from './local';
import type { AuthApi } from './types';

/**
 * The active backend. With EXPO_PUBLIC_API_URL set (for example
 * https://api.ustatap.az) the app talks to the Laravel API; without it, to the
 * on-device demo backend.
 */
export const authApi: AuthApi = isLive ? createHttpApi() : localApi;

export * from './types';
