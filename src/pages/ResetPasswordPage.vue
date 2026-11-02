<script setup lang="ts">
import { f7, f7Block, f7Button, f7List, f7ListInput, f7Navbar, f7Page } from 'framework7-vue'
import type { Router } from 'framework7/types'
import { reactive, ref } from 'vue'
import { authApi } from '../api/auth'
import { errorMessage } from '../api/http'
import { useAuthStore } from '../stores/auth'
import { validatePassword } from '../utils/validation'

const props = defineProps<{ f7route: Router.Route; f7router: Router.Router }>()

const auth = useAuthStore()

// Ссылка из письма: /reset-password?userId=...&token=...
const userId = props.f7route.query.userId
const token = props.f7route.query.token
const linkValid = Boolean(userId && token)

const form = reactive({ password: '', passwordConfirm: '' })
const fieldErrors = reactive({ password: '', passwordConfirm: '' })
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  fieldErrors.password = validatePassword(form.password) ?? ''
  fieldErrors.passwordConfirm = form.password === form.passwordConfirm ? '' : 'Пароли не совпадают'
  if (fieldErrors.password || fieldErrors.passwordConfirm || !userId || !token) return

  loading.value = true
  try {
    await authApi.resetPassword({ userId, token, newPassword: form.password })
    f7.dialog.alert('Теперь войдите с новым паролем.', 'Пароль изменён', () => {
      // Бэкенд завершил все сессии пользователя, поэтому сбрасываем и текущую.
      auth.clearSession()
      props.f7router.navigate('/login', { reloadAll: true, clearPreviousHistory: true })
    })
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <f7-page class="auth-page" no-toolbar>
    <f7-navbar title="Новый пароль" />

    <div class="auth-container">
      <f7-block v-if="!linkValid" class="text-align-center">
        <i class="f7-icons status-icon">xmark_circle</i>
        <h2>Ссылка недействительна</h2>
        <p>Запросите новую ссылку для смены пароля.</p>
        <f7-button fill large href="/forgot-password" :reload-all="true">Запросить ссылку</f7-button>
      </f7-block>

      <form v-else @submit.prevent="submit" novalidate>
        <f7-list strong-ios dividers-ios inset>
          <f7-list-input
            v-model:value="form.password"
            label="Новый пароль"
            type="password"
            name="new-password"
            autocomplete="new-password"
            placeholder="Не короче 8 символов, с цифрой"
            :error-message="fieldErrors.password"
            :error-message-force="!!fieldErrors.password"
          />
          <f7-list-input
            v-model:value="form.passwordConfirm"
            label="Повторите пароль"
            type="password"
            name="password-confirm"
            autocomplete="new-password"
            placeholder="Ещё раз пароль"
            :error-message="fieldErrors.passwordConfirm"
            :error-message-force="!!fieldErrors.passwordConfirm"
          />
        </f7-list>

        <f7-block v-if="error" class="form-message error">{{ error }}</f7-block>

        <f7-block>
          <f7-button type="submit" fill large :preloader="true" :loading="loading">Сохранить пароль</f7-button>
        </f7-block>
      </form>
    </div>
  </f7-page>
</template>
