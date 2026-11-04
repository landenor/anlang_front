<script lang="ts">
// code одноразовый: повторная отправка вернёт 400. Храним обработанные коды на уровне модуля,
// чтобы повторное монтирование страницы не запустило обмен второй раз.
const handledCodes = new Set<string>()
</script>

<script setup lang="ts">
import { Button as VanButton, NavBar as VanNavBar, Loading as VanLoading, Icon as VanIcon } from 'vant'

import { useRouter, useRoute } from 'vue-router'
import { readQuery } from '../utils/routeQuery'
import { onMounted, ref } from 'vue'
import { errorMessage } from '../api/http'
import { completeExternalLogin, isProvider, providerNames } from '../auth/externalAuth'
import { useAuthStore } from '../stores/auth'
import { showToast } from '../utils/toast'

const router = useRouter()
const route = useRoute()
const query = readQuery(route.query)

const auth = useAuthStore()
const provider = String(route.params.provider ?? '')
const title = isProvider(provider) ? `Вход через ${providerNames[provider]}` : 'Вход'
const error = ref('')

onMounted(async () => {
  const callbackQuery = { ...query }
  // Убираем code из адресной строки и состояния роутера без повторного монтирования страницы.
  await router.replace({ path: route.path, query: {} })

  if (!isProvider(provider)) {
    error.value = 'Неизвестный способ входа'
    return
  }
  const code = callbackQuery.code ?? ''
  if (code && handledCodes.has(code)) return
  handledCodes.add(code)

  try {
    const tokens = await completeExternalLogin(provider, callbackQuery)
    await auth.applyTokens(tokens)
    if (tokens.isNewUser) showToast('Добро пожаловать в AnLang!')
    void router.replace('/')
  } catch (e) {
    error.value = errorMessage(e)
  }
})
</script>

<template>
  <main class="auth-page">
    <van-nav-bar :title="title" />

    <div class="auth-container">
      <section v-if="!error" class="block text-align-center">
        <van-loading />
        <p>Выполняем вход…</p>
      </section>

      <section v-else class="block text-align-center">
        <van-icon name="close" class="status-icon color-red" />
        <h2>Не удалось войти</h2>
        <p class="form-message">{{ error }}</p>
        <van-button type="primary" size="large" to="/login">Попробовать снова</van-button>
      </section>
    </div>
  </main>
</template>
