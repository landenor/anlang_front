import type { Router } from 'framework7/types'
import { pathToRegexp } from 'path-to-regexp'
import { routes, type AppRoute, type RouteAccess } from '../routes'
import { useAuthStore } from '../stores/auth'

// Сессия проверяется до монтирования приложения (см. App.vue), поэтому здесь состояние уже известно.

/** Куда отправить пользователя, если ему нельзя на маршрут; null — можно. */
function redirectFor(access: RouteAccess | undefined): string | null {
  const { isAuthenticated } = useAuthStore()
  switch (access) {
    case 'public':
      return null
    // Авторизованным незачем видеть вход и регистрацию.
    case 'guest':
      return isAuthenticated ? '/' : null
    default:
      return isAuthenticated ? null : '/login'
  }
}

/** Проверка доступа для переходов внутри приложения (routesBeforeEnter у View). */
export function guardRoute({ to, resolve, reject, router }: Router.RouteCallbackCtx) {
  const url = redirectFor((to.route as AppRoute).access)
  if (!url) {
    resolve()
    return
  }
  reject()
  router.navigate(url, { reloadAll: true, clearPreviousHistory: true })
}

/**
 * Начальную страницу framework7-vue рендерит сам, минуя guard'ы роутера.
 * Поэтому до создания View подменяем адрес, если на открытую страницу нельзя.
 */
export function guardInitialUrl() {
  // Тот же поиск, что у роутера Framework7: первый подходящий маршрут, та же библиотека путей.
  const route = routes.find((r) => pathToRegexp(r.path).test(window.location.pathname))
  const url = redirectFor(route?.access)
  if (url) {
    window.history.replaceState(window.history.state, '', url)
  }
}
