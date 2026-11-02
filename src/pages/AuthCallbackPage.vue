<script lang="ts">
// code одноразовый: повторная отправка вернёт 400. Храним обработанные коды на уровне модуля,
// чтобы повторное монтирование страницы не запустило обмен второй раз.
const handledCodes = new Set<string>()
</script>

<script setup lang="ts">
import { f7Block, f7Button, f7Navbar, f7Page, f7Preloader } from 'framework7-vue'
import type { Router } from 'framework7/types'
import { onMounted, ref } from 'vue'
import { errorMessage } from '../api/http'
import { completeExternalLogin, isProvider, providerNames } from '../auth/externalAuth'
import { useAuthStore } from '../stores/auth'
import { showToast } from '../utils/toast'

const props = defineProps<{ f7route: Router.Route; f7router: Router.Router }>()

const auth = useAuthStore()
const provider = props.f7route.params.provider
const title = isProvider(provider) ? `Вход через ${providerNames[provider]}` : 'Вход'
const error = ref('')

onMounted(async () => {
  const query = { ...props.f7route.query }
  // Убираем code из адресной строки, чтобы его не отправили повторно (состояние роутера сохраняем).
  window.history.replaceState(window.history.state, '', window.location.pathname)

  if (!isProvider(provider)) {
    error.value = 'Неизвестный способ входа'
    return
  }
  const code = query.code ?? ''
  if (code && handledCodes.has(code)) return
  handledCodes.add(code)

  try {
    const tokens = await completeExternalLogin(provider, query)
    await auth.applyTokens(tokens)
    if (tokens.isNewUser) showToast('Добро пожаловать в AnLang!')
    props.f7router.navigate('/', { reloadAll: true, clearPreviousHistory: true })
  } catch (e) {
    error.value = errorMessage(e)
  }
})
</script>

<template>
  <f7-page class="auth-page" no-toolbar>
    <f7-navbar :title="title" />

    <div class="auth-container">
      <f7-block v-if="!error" class="text-align-center">
        <f7-preloader />
        <p>Выполняем вход…</p>
      </f7-block>

      <f7-block v-else class="text-align-center">
        <i class="f7-icons status-icon color-red">xmark_circle</i>
        <h2>Не удалось войти</h2>
        <p class="form-message">{{ error }}</p>
        <f7-button fill large href="/login" :reload-all="true">Попробовать снова</f7-button>
      </f7-block>
    </div>
  </f7-page>
</template>
