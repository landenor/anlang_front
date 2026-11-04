import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import CommonLayout from './layouts/CommonLayout.vue'
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

declare module 'vue-router' {
  interface RouteMeta { access?: RouteAccess; title?: string }
}

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: CommonLayout,
    children: [
      { path: '', component: ProfilePage, meta: { title: 'Профиль' } },
      { path: 'translator', component: TranslatorPage, meta: { title: 'Переводчик' } },
    ],
  },
  { path: '/login', component: LoginPage, meta: { access: 'guest' } },
  { path: '/register', component: RegisterPage, meta: { access: 'guest' } },
  { path: '/forgot-password', component: ForgotPasswordPage, meta: { access: 'public' } },
  { path: '/reset-password', component: ResetPasswordPage, meta: { access: 'public' } },
  { path: '/confirm-email', component: ConfirmEmailPage, meta: { access: 'public' } },
  { path: '/auth/callback/:provider', component: AuthCallbackPage, meta: { access: 'public' } },
  { path: '/:pathMatch(.*)*', component: NotFoundPage, meta: { access: 'public' } },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
