import { createHttpApi } from './http';
import { localApi } from './local';
import type { AuthApi } from './types';

/**
 * The active backend. Set EXPO_PUBLIC_API_URL (for example
 * https://api.usta.az) to talk to the Laravel API; without it the app runs on
 * the on-device demo backend.
 */
const API_URL = process.env.EXPO_PUBLIC_API_URL;

export const authApi: AuthApi = API_URL ? createHttpApi(API_URL) : localApi;

export * from './types';
