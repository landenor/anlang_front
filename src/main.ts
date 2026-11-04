import { createPinia } from 'pinia'
import { createApp } from 'vue'
import { Locale } from 'vant'
import ruRU from 'vant/es/locale/lang/ru-RU'
import 'vant/lib/index.css'
import './styles/app.css'
import App from './App.vue'
import { router } from './routes'
import { guardRoute } from './auth/guards'
import { useAuthStore } from './stores/auth'
Locale.use('ru-RU', ruRU)
const app = createApp(App)
app.use(createPinia())
// Первый переход, как и последующие, ждёт восстановления сессии.
const sessionReady = useAuthStore().bootstrap()
router.beforeEach(async (to) => {
  await sessionReady
  return guardRoute(to)
})
app.use(router).mount('#app')
