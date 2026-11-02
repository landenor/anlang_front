<script setup lang="ts">
import { f7Block, f7Button, f7Navbar, f7Page, f7Preloader } from 'framework7-vue'
import type { Router } from 'framework7/types'
import { onMounted, ref } from 'vue'
import { authApi } from '../api/auth'
import { errorMessage } from '../api/http'
import { useAuthStore } from '../stores/auth'

const props = defineProps<{ f7route: Router.Route }>()

const auth = useAuthStore()

const status = ref<'loading' | 'success' | 'error'>('loading')
const error = ref('')

onMounted(async () => {
  // Ссылка из письма: /confirm-email?userId=...&token=...
  const { userId, token } = props.f7route.query
  if (!userId || !token) {
    error.value = 'Ссылка подтверждения недействительна'
    status.value = 'error'
    return
  }

  try {
    await authApi.confirmEmail({ userId, token })
    status.value = 'success'
    if (auth.isAuthenticated) await auth.loadUser().catch(() => {})
  } catch (e) {
    error.value = errorMessage(e)
    status.value = 'error'
  }
})
</script>

<template>
  <f7-page class="auth-page" no-toolbar>
    <f7-navbar title="Подтверждение email" />

    <div class="auth-container">
      <f7-block v-if="status === 'loading'" class="text-align-center">
        <f7-preloader />
        <p>Подтверждаем email…</p>
      </f7-block>

      <f7-block v-else-if="status === 'success'" class="text-align-center">
        <i class="f7-icons status-icon color-green">checkmark_circle</i>
        <h2>Email подтверждён</h2>
        <p v-if="auth.isAuthenticated">Спасибо! Можно продолжать занятия.</p>
        <p v-else>Теперь вы можете войти в аккаунт.</p>
        <f7-button v-if="auth.isAuthenticated" fill large href="/" :reload-all="true">На главную</f7-button>
        <f7-button v-else fill large href="/login" :reload-all="true">Войти</f7-button>
      </f7-block>

      <f7-block v-else class="text-align-center">
        <i class="f7-icons status-icon color-red">xmark_circle</i>
        <h2>Не удалось подтвердить email</h2>
        <p>{{ error }}</p>
        <p>Запросите новое письмо на странице входа: введите email и пароль, затем «Отправить письмо повторно».</p>
        <f7-button fill large href="/login" :reload-all="true">Ко входу</f7-button>
      </f7-block>
    </div>
  </f7-page>
</template>
