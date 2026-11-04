<script setup lang="ts">
import { Button as VanButton, NavBar as VanNavBar, Loading as VanLoading, Icon as VanIcon } from 'vant'

import { useRoute } from 'vue-router'
import { readQuery } from '../utils/routeQuery'
import { onMounted, ref } from 'vue'
import { authApi } from '../api/auth'
import { errorMessage } from '../api/http'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const query = readQuery(route.query)

const auth = useAuthStore()

const status = ref<'loading' | 'success' | 'error'>('loading')
const error = ref('')

onMounted(async () => {
  // Ссылка из письма: /confirm-email?userId=...&token=...
  const { userId, token } = query
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
  <main class="auth-page">
    <van-nav-bar title="Подтверждение email" />

    <div class="auth-container">
      <section v-if="status === 'loading'" class="block text-align-center">
        <van-loading />
        <p>Подтверждаем email…</p>
      </section>

      <section v-else-if="status === 'success'" class="block text-align-center">
        <van-icon name="checked" class="status-icon color-green" />
        <h2>Email подтверждён</h2>
        <p v-if="auth.isAuthenticated">Спасибо! Можно продолжать занятия.</p>
        <p v-else>Теперь вы можете войти в аккаунт.</p>
        <van-button v-if="auth.isAuthenticated" type="primary" size="large" to="/">На главную</van-button>
        <van-button v-else type="primary" size="large" to="/login">Войти</van-button>
      </section>

      <section v-else class="block text-align-center">
        <van-icon name="close" class="status-icon color-red" />
        <h2>Не удалось подтвердить email</h2>
        <p>{{ error }}</p>
        <p>Запросите новое письмо на странице входа: введите email и пароль, затем «Отправить письмо повторно».</p>
        <van-button type="primary" size="large" to="/login">Ко входу</van-button>
      </section>
    </div>
  </main>
</template>
