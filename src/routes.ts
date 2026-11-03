import type { Router } from 'framework7/types'
import AuthCallbackPage from './pages/AuthCallbackPage.vue'
import ConfirmEmailPage from './pages/ConfirmEmailPage.vue'
import ForgotPasswordPage from './pages/ForgotPasswordPage.vue'
import ProfilePage from './pages/ProfilePage.vue'
import LoginPage from './pages/LoginPage.vue'
import NotFoundPage from './pages/NotFoundPage.vue'
import RegisterPage from './pages/RegisterPage.vue'
import ResetPasswordPage from './pages/ResetPasswordPage.vue'
import TranslatorPage from './pages/TranslatorPage.vue'

/** `guest` — только для неавторизованных, `public` — для всех. Без отметки — только после входа. */
export type RouteAccess = 'guest' | 'public'

export type AppRoute = Router.RouteParameters & { path: string; access?: RouteAccess }

// Доступ проверяют guard'ы из auth/guards.ts.
// Пути без завершающего слеша: в таком виде приходят redirect URI провайдеров и ссылки из писем.
export const routes: AppRoute[] = [
  { path: '/', component: ProfilePage },
  { path: '/translator', component: TranslatorPage },
  { path: '/login', component: LoginPage, access: 'guest' },
  { path: '/register', component: RegisterPage, access: 'guest' },
  { path: '/forgot-password', component: ForgotPasswordPage, access: 'public' },
  { path: '/reset-password', component: ResetPasswordPage, access: 'public' },
  { path: '/confirm-email', component: ConfirmEmailPage, access: 'public' },
  { path: '/auth/callback/:provider', component: AuthCallbackPage, access: 'public' },
  { path: '(.*)', component: NotFoundPage, access: 'public' },
]
