<script setup lang="ts">
import { f7Block, f7Button, f7Link, f7List, f7ListInput, f7Navbar, f7Page } from 'framework7-vue'
import { reactive, ref } from 'vue'
import { authApi } from '../api/auth'
import { errorMessage } from '../api/http'
import SocialLoginButtons from '../components/SocialLoginButtons.vue'
import { showToast } from '../utils/toast'
import { validateEmail, validatePassword } from '../utils/validation'

const form = reactive({ displayName: '', email: '', password: '', passwordConfirm: '' })
const fieldErrors = reactive({ displayName: '', email: '', password: '', passwordConfirm: '' })
const loading = ref(false)
const error = ref('')
/** Email, на который отправлено письмо подтверждения; после этого показываем экран «Проверьте почту». */
const registeredEmail = ref('')
const resending = ref(false)

function validate(): boolean {
  fieldErrors.displayName = form.displayName.trim() ? '' : 'Введите имя'
  fieldErrors.email = validateEmail(form.email.trim()) ?? ''
  fieldErrors.password = validatePassword(form.password) ?? ''
  fieldErrors.passwordConfirm = form.password === form.passwordConfirm ? '' : 'Пароли не совпадают'
  return Object.values(fieldErrors).every((e) => !e)
}

async function submit() {
  error.value = ''
  if (!validate()) return

  loading.value = true
  try {
    const email = form.email.trim()
    await authApi.register({ email, password: form.password, displayName: form.displayName.trim() })
    registeredEmail.value = email
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

async function resendConfirmation() {
  resending.value = true
  try {
    await authApi.resendConfirmation(registeredEmail.value)
    showToast('Письмо отправлено повторно')
  } catch (e) {
    showToast(errorMessage(e))
  } finally {
    resending.value = false
  }
}
</script>

<template>
  <f7-page class="auth-page" no-toolbar>
    <f7-navbar title="Регистрация" back-link="Назад" back-link-url="/login" />

    <div v-if="registeredEmail" class="auth-container">
      <f7-block class="text-align-center">
        <i class="f7-icons status-icon">envelope</i>
        <h2>Проверьте почту</h2>
        <p>
          Мы отправили письмо на <b>{{ registeredEmail }}</b>. Перейдите по ссылке из него, чтобы подтвердить
          email, а затем войдите.
        </p>
      </f7-block>
      <f7-block>
        <f7-button fill large href="/login" :reload-all="true">Перейти ко входу</f7-button>
        <f7-button class="margin-top" :preloader="true" :loading="resending" @click="resendConfirmation">
          Отправить письмо повторно
        </f7-button>
      </f7-block>
    </div>

    <div v-else class="auth-container">
      <form @submit.prevent="submit" novalidate>
        <f7-list strong-ios dividers-ios inset>
          <f7-list-input
            v-model:value="form.displayName"
            label="Имя"
            type="text"
            name="name"
            autocomplete="name"
            placeholder="Как к вам обращаться"
            :maxlength="100"
            :error-message="fieldErrors.displayName"
            :error-message-force="!!fieldErrors.displayName"
          />
          <f7-list-input
            v-model:value="form.email"
            label="Email"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="you@example.com"
            :error-message="fieldErrors.email"
            :error-message-force="!!fieldErrors.email"
          />
          <f7-list-input
            v-model:value="form.password"
            label="Пароль"
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
          <f7-button type="submit" fill large :preloader="true" :loading="loading">Зарегистрироваться</f7-button>
        </f7-block>
      </form>

      <SocialLoginButtons />

      <f7-block class="text-align-center">
        Уже есть аккаунт? <f7-link href="/login" back>Войти</f7-link>
      </f7-block>
    </div>
  </f7-page>
</template>
