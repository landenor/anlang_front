import { request } from './http'

export type Provider = 'yandex' | 'vk'

export interface AccessTokenResponse {
  accessToken: string
  /** ISO 8601 */
  expiresAt: string
  /** true — аккаунт только что создан (вход через провайдера) */
  isNewUser: boolean
}

export interface CurrentUser {
  id: string
  email: string | null
  emailConfirmed: boolean
  displayName: string | null
  avatarUrl: string | null
  hasPassword: boolean
  externalLogins: string[]
  createdAt: string
}

export interface ExternalLoginRequest {
  provider: Provider
  code: string
  codeVerifier: string
  redirectUri: string
  deviceId: string | null
  state: string
}

export const authApi = {
  register: (body: { email: string; password: string; displayName: string }) =>
    request<{ userId: string }>('/api/auth/register', { method: 'POST', body, auth: false }),

  login: (body: { email: string; password: string }) =>
    request<AccessTokenResponse>('/api/auth/login', { method: 'POST', body, auth: false }),

  external: (body: ExternalLoginRequest) =>
    request<AccessTokenResponse>('/api/auth/external', { method: 'POST', body, auth: false }),

  refresh: () => request<AccessTokenResponse>('/api/auth/refresh', { method: 'POST', auth: false }),

  logout: () => request<void>('/api/auth/logout', { method: 'POST', auth: false }),

  confirmEmail: (body: { userId: string; token: string }) =>
    request<void>('/api/auth/confirm-email', { method: 'POST', body, auth: false }),

  resendConfirmation: (email: string) =>
    request<void>('/api/auth/resend-confirmation', { method: 'POST', body: { email }, auth: false }),

  forgotPassword: (email: string) =>
    request<void>('/api/auth/forgot-password', { method: 'POST', body: { email }, auth: false }),

  resetPassword: (body: { userId: string; token: string; newPassword: string }) =>
    request<void>('/api/auth/reset-password', { method: 'POST', body, auth: false }),
}

export const usersApi = {
  me: () => request<CurrentUser>('/api/users/me'),
}
