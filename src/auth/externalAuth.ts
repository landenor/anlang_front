import { authApi, type AccessTokenResponse, type Provider } from '../api/auth'
import { createCodeChallenge, randomString } from './pkce'

const clientIds: Record<Provider, string> = {
  yandex: import.meta.env.VITE_YANDEX_CLIENT_ID ?? '',
  vk: import.meta.env.VITE_VK_CLIENT_ID ?? '',
}

const authorizeUrls: Record<Provider, string> = {
  yandex: 'https://oauth.yandex.ru/authorize',
  vk: 'https://id.vk.com/authorize',
}

export const providerNames: Record<Provider, string> = {
  yandex: 'Яндекс',
  vk: 'VK',
}

export function isProvider(value: string | undefined): value is Provider {
  return value === 'yandex' || value === 'vk'
}

/** Провайдеры, для которых задан client ID в .env. */
export const enabledProviders = (Object.keys(clientIds) as Provider[]).filter((p) => clientIds[p])

// Должен в точности совпадать с redirect URI в кабинете провайдера и в запросе к бэкенду.
const redirectUri = (provider: Provider) => `${window.location.origin}/auth/callback/${provider}`

const storageKey = (provider: Provider) => `oauth:${provider}`

export async function startExternalLogin(provider: Provider): Promise<void> {
  const codeVerifier = randomString()
  const state = randomString()
  // sessionStorage переживает редирект, но не открытие новой вкладки.
  sessionStorage.setItem(storageKey(provider), JSON.stringify({ codeVerifier, state }))

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientIds[provider],
    redirect_uri: redirectUri(provider),
    state,
    code_challenge: await createCodeChallenge(codeVerifier),
    code_challenge_method: 'S256',
  })
  if (provider === 'vk') {
    params.set('scope', 'email')
  }

  window.location.assign(`${authorizeUrls[provider]}?${params}`)
}

/** Параметры, с которыми провайдер вернул пользователя на redirect URI. */
export type CallbackQuery = Record<string, string | undefined>

/** Обменивает code на сессию через бэкенд. Вызывать один раз: code одноразовый. */
export async function completeExternalLogin(provider: Provider, query: CallbackQuery): Promise<AccessTokenResponse> {
  const saved = sessionStorage.getItem(storageKey(provider))
  sessionStorage.removeItem(storageKey(provider))

  if (query.error) {
    throw new Error(query.error_description || 'Вход отменён')
  }

  const { codeVerifier, state } = saved ? (JSON.parse(saved) as { codeVerifier?: string; state?: string }) : {}
  if (!codeVerifier || !query.code || !query.state || query.state !== state) {
    throw new Error('Сессия входа устарела, попробуйте ещё раз')
  }

  return authApi.external({
    provider,
    code: query.code,
    codeVerifier,
    redirectUri: redirectUri(provider),
    deviceId: query.device_id ?? null, // есть только у VK
    state: query.state,
  })
}
