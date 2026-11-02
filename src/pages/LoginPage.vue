<script setup lang="ts">
import { f7Block, f7Button, f7Link, f7List, f7ListInput, f7LoginScreenTitle, f7Page } from 'framework7-vue'
import type { Router } from 'framework7/types'
import { reactive, ref } from 'vue'
import { authApi } from '../api/auth'
import { ApiError, errorMessage } from '../api/http'
import SocialLoginButtons from '../components/SocialLoginButtons.vue'
import { useAuthStore } from '../stores/auth'
import { showToast } from '../utils/toast'
import { validateEmail } from '../utils/validation'

const props = defineProps<{ f7router: Router.Router }>()

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
    props.f7router.navigate('/', { reloadAll: true, clearPreviousHistory: true })
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
  <f7-page class="auth-page" no-navbar no-toolbar no-swipeback login-screen>
    <div class="auth-container">
      <f7-login-screen-title>AnLang</f7-login-screen-title>
      <p class="auth-subtitle">Разговорная практика иностранных языков</p>

      <form @submit.prevent="submit" novalidate>
        <f7-list strong-ios dividers-ios inset>
          <f7-list-input
            v-model:value="email"
            label="Email"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="you@example.com"
            :error-message="fieldErrors.email"
            :error-message-force="!!fieldErrors.email"
          />
          <f7-list-input
            v-model:value="password"
            label="Пароль"
            type="password"
            name="password"
            autocomplete="current-password"
            placeholder="Ваш пароль"
            :error-message="fieldErrors.password"
            :error-message-force="!!fieldErrors.password"
          />
        </f7-list>

        <f7-block v-if="error" class="form-message error">{{ error }}</f7-block>
        <f7-block v-if="needsConfirmation">
          <f7-button outline :preloader="true" :loading="resending" @click="resendConfirmation">
            Отправить письмо повторно
          </f7-button>
        </f7-block>

        <f7-block>
          <f7-button color="blue" type="submit" fill large :preloader="true" :loading="loading">Войти</f7-button>
        </f7-block>
      </form>

      <SocialLoginButtons />

      <f7-block class="auth-links">
        <f7-link href="/register">Регистрация</f7-link>
        <f7-link href="/forgot-password">Забыли пароль?</f7-link>
      </f7-block>
    </div>
  </f7-page>
</template>
