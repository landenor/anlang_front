<script setup lang="ts">
import { f7, f7App, f7Preloader, f7View } from 'framework7-vue'
import { ref, watch } from 'vue'
import { guardInitialUrl, guardRoute } from './auth/guards'
import AppMenu from './components/AppMenu.vue'
import { routes } from './routes'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
// Пока проверяем сессию, роутер не создаём: guard'ам маршрутов нужен уже известный статус входа.
const ready = ref(false)
void auth.bootstrap().then(() => {
  guardInitialUrl()
  ready.value = true
})

const f7params = {
  name: 'AnLang',
  theme: 'auto',
  darkMode: 'auto' as const,
  touch: { touchHighlight: false },
  // secondary доступен как color="secondary" / класс color-secondary / var(--f7-color-secondary).
  colors: { primary: '#0e4fe7', secondary: '#56e7fd' },
  // Material-палитра: насыщенный primary, нейтральные серые поверхности (поля ввода, фон) без оттенка primary.
  mdColorScheme: 'monochrome-vibrant' as const,
  routes,
  dialog: { buttonOk: 'OK', buttonCancel: 'Отмена' },
}

// Сессия закончилась (выход, отозванный refresh token) — уводим на страницу входа.
watch(
  () => auth.isAuthenticated,
  (isAuthenticated, wasAuthenticated) => {
    // Во время bootstrap приложение Framework7 ещё не создано.
    const router = f7?.views.main?.router
    if (wasAuthenticated && !isAuthenticated && router && router.currentRoute.path !== '/login') {
      router.navigate('/login', { reloadAll: true, clearPreviousHistory: true })
    }
  },
)
</script>

<template>
  <div v-if="!ready" class="app-loading">
    <f7-preloader :size="42" />
  </div>
  <f7-app v-else v-bind="f7params">
    <AppMenu v-if="auth.isAuthenticated" />
    <!--
      Реальные пути вместо #! (browser-history-separator=""): на них возвращают провайдеры
      (/auth/callback/yandex) и ведут ссылки из писем (/confirm-email?...).
      Предзагрузка предыдущей страницы выключена: иначе на старте подгружался бы "/" со своим guard'ом.
    -->
    <f7-view
      main
      url="/"
      browser-history
      browser-history-separator=""
      browser-history-initial-match
      :browser-history-store-history="false"
      :preload-previous-page="false"
      :ios-swipe-back="false"
      :routes-before-enter="guardRoute"
    />
  </f7-app>
</template>
