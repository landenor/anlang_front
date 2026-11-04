<script setup lang="ts">
import { Button as VanButton, CellGroup as VanCellGroup, Field as VanField } from 'vant'
import { RouterLink } from 'vue-router'

import { useRouter } from 'vue-router'
import { reactive, ref } from 'vue'
import { authApi } from '../api/auth'
import { ApiError, errorMessage } from '../api/http'
import SocialLoginButtons from '../components/SocialLoginButtons.vue'
import { useAuthStore } from '../stores/auth'
import { showToast } from '../utils/toast'
import { validateEmail } from '../utils/validation'

const router = useRouter()

const auth = useAuthStore()

const email = ref('')
const password = ref('')
// Правила сложности пароля при входе не проверяем: достаточно, что поле заполнено.
const fieldErrors = reactive({ email: '', password: '' })
const loading = ref(false)
const error = ref('')
/** Бэкенд ответил 403: пароль верный, но email не подтверждён. */
const needsConfirmation = ref(false)
const resending = ref(false)

function validate(): boolean {
  fieldErrors.email = validateEmail(email.value.trim()) ?? ''
  fieldErrors.password = password.value ? '' : 'Введите пароль'
  return Object.values(fieldErrors).every((e) => !e)
}

async function submit() {
  error.value = ''
  needsConfirmation.value = false
  if (!validate()) return

  loading.value = true
  try {
    await auth.login(email.value.trim(), password.value)
    void router.replace('/')
  } catch (e) {
    error.value = errorMessage(e)
    needsConfirmation.value = e instanceof ApiError && e.status === 403
  } finally {
    loading.value = false
  }
}

async function resendConfirmation() {
  resending.value = true
  try {
    await authApi.resendConfirmation(email.value.trim())
    showToast('Письмо отправлено, проверьте почту')
  } catch (e) {
    showToast(errorMessage(e))
  } finally {
    resending.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <div class="auth-container">
      <h1 class="auth-title">AnLang</h1>
      <p class="auth-subtitle">Разговорная практика иностранных языков</p>

      <form @submit.prevent="submit" novalidate>
        <van-cell-group inset>
          <van-field
            v-model="email"
            label="Email"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="you@example.com"
            :error-message="fieldErrors.email"
          />
          <van-field
            v-model="password"
            label="Пароль"
            type="password"
            name="password"
            autocomplete="current-password"
            placeholder="Ваш пароль"
            :error-message="fieldErrors.password"
          />
        </van-cell-group>

        <section v-if="error" class="block form-message error">{{ error }}</section>
        <section v-if="needsConfirmation" class="block">
          <van-button plain type="primary" :loading="resending" @click="resendConfirmation">
            Отправить письмо повторно
          </van-button>
        </section>

        <section class="block">
          <van-button native-type="submit" type="primary" size="large" :loading="loading">Войти</van-button>
        </section>
      </form>

      <SocialLoginButtons />

      <section class="block auth-links" >
        <RouterLink to="/register">Регистрация</RouterLink>
        <RouterLink to="/forgot-password">Забыли пароль?</RouterLink>
      </section>
    </div>
  </main>
</template>
