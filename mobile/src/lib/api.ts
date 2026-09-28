import { API_URL } from '../config';

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(data?.message ?? 'Request failed', res.status);
  return data as T;
}

async function authedRequest<T>(
  method: 'GET' | 'POST',
  path: string,
  accessToken: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new ApiError(data?.message ?? 'Request failed', res.status);
  return data as T;
}

export interface AuthResponse {
  message: string;
  user: { id: string; email: string; displayName: string };
  accessToken: string;
  refreshToken: string;
}

export interface ChatroomDto {
  id: string;
  name: string | null;
  isGroup: boolean;
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
}

export const api = {
  register: (email: string, password: string, displayName: string) =>
    request<{ message: string }>('/auth/register', { email, password, displayName }),

  verifyEmail: (email: string, code: string) =>
    request<{ message: string }>('/auth/verify-email', { email, code }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    request<AuthResponse>('/auth/refresh', { refreshToken }),

  lookupUser: (email: string, accessToken: string) =>
    authedRequest<{ user: PublicUser | null }>(
      'GET',
      `/users/lookup?email=${encodeURIComponent(email)}`,
      accessToken,
    ),

  createDm: (targetUserId: string, accessToken: string) =>
    authedRequest<{ chatroom: ChatroomDto }>(
      'POST',
      '/chatrooms/dm',
      accessToken,
      { targetUserId },
    ),

  listChatrooms: (accessToken: string) =>
    authedRequest<{ chatrooms: ChatroomDto[] }>('GET', '/chatrooms', accessToken),
};