import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi, usersApi, type AccessTokenResponse, type CurrentUser } from '../api/auth'
import { ApiError, configureHttp } from '../api/http'

/** За сколько до истечения access token обновлять его заранее. */
const REFRESH_AHEAD_MS = 60_000

/** Web Lock на обновление сессии: cookie refresh_token общая для всех вкладок, а токен одноразовый. */
const REFRESH_LOCK = 'anlang:auth-refresh'

/**
 * Выполняет запрос под межвкладочной блокировкой. Следующая вкладка дождётся ответа первой
 * и отправит уже новую cookie, а не тот же самый токен, который сервер только что отозвал.
 */
function withRefreshLock<T>(callback: () => Promise<T>): Promise<T> {
  // navigator.locks есть только в безопасном контексте (https или localhost).
  if (!('locks' in navigator)) {
    return callback()
  }
  return navigator.locks.request(REFRESH_LOCK, callback)
}

export const useAuthStore = defineStore('auth', () => {
  // Access token держим только в памяти; после перезагрузки страницы он восстанавливается через refresh cookie.
  const accessToken = ref<string | null>(null)
  const user = ref<CurrentUser | null>(null)

  const isAuthenticated = computed(() => accessToken.value !== null && user.value !== null)

  let refreshTimer: ReturnType<typeof setTimeout> | undefined
  let refreshing: Promise<boolean> | null = null

  function setTokens(tokens: AccessTokenResponse) {
    accessToken.value = tokens.accessToken
    clearTimeout(refreshTimer)
    const delay = new Date(tokens.expiresAt).getTime() - Date.now() - REFRESH_AHEAD_MS
    refreshTimer = setTimeout(() => void refreshSession(), Math.max(delay, 5_000))
  }

  function clearSession() {
    clearTimeout(refreshTimer)
    accessToken.value = null
    user.value = null
  }

  /**
   * Обновляет access token. Single-flight: пока запрос идёт, все вызовы в вкладке получают один промис,
   * а между вкладками запросы выстраиваются в очередь через Web Lock — refresh token одноразовый.
   */
  function refreshSession(): Promise<boolean> {
    refreshing ??= withRefreshLock(() => authApi.refresh())
      .then((tokens) => {
        setTokens(tokens)
        return true
      })
      .catch((error: unknown) => {
        // Сессию сбрасываем, только если сервер её отверг; при сбое сети оставляем как есть.
        if (error instanceof ApiError && error.status === 401) {
          clearSession()
        }
        return false
      })
      .finally(() => {
        refreshing = null
      })
    return refreshing
  }

  /** Сохраняет токены после входа и загружает профиль. */
  async function applyTokens(tokens: AccessTokenResponse) {
    setTokens(tokens)
    try {
      user.value = await usersApi.me()
    } catch (error) {
      clearSession()
      throw error
    }
  }

  async function loadUser() {
    user.value = await usersApi.me()
  }

  /** Восстанавливает сессию при старте приложения. */
  async function bootstrap() {
    try {
      if (await refreshSession()) {
        await loadUser()
      }
    } catch {
      clearSession()
    }
  }

  async function login(email: string, password: string) {
    await applyTokens(await authApi.login({ email, password }))
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // Локальную сессию завершаем в любом случае.
    } finally {
      clearSession()
    }
  }

  configureHttp({
    getAccessToken: () => accessToken.value,
    refreshSession,
  })

  return {
    user,
    isAuthenticated,
    bootstrap,
    applyTokens,
    loadUser,
    login,
    logout,
    clearSession,
  }
})
