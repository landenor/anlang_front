import type { RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '../stores/auth'
export function guardRoute(to: RouteLocationNormalized) {
  const { isAuthenticated } = useAuthStore()
  if (to.meta.access === 'public') return true
  if (to.meta.access === 'guest') return isAuthenticated ? { path: '/', replace: true } : true
  return isAuthenticated ? true : { path: '/login', replace: true }
}
