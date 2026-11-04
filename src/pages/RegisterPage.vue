<script setup lang="ts">
import { Button as VanButton, CellGroup as VanCellGroup, Field as VanField, NavBar as VanNavBar, Icon as VanIcon } from 'vant'
import { RouterLink } from 'vue-router'

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
  <main class="auth-page">
    <van-nav-bar title="Регистрация" left-text="Назад" left-arrow @click-left="$router.replace('/login')" />

    <div v-if="registeredEmail" class="auth-container">
      <section class="block text-align-center" >
        <van-icon name="envelop-o" class="status-icon" />
        <h2>Проверьте почту</h2>
        <p>
          Мы отправили письмо на <b>{{ registeredEmail }}</b>. Перейдите по ссылке из него, чтобы подтвердить
          email, а затем войдите.
        </p>
      </section>
      <section class="block">
        <van-button type="primary" size="large" to="/login">Перейти ко входу</van-button>
        <van-button class="margin-top" :loading="resending" @click="resendConfirmation">
          Отправить письмо повторно
        </van-button>
      </section>
    </div>

    <div v-else class="auth-container">
      <form @submit.prevent="submit" novalidate>
        <van-cell-group inset>
          <van-field
            v-model="form.displayName"
            label="Имя"
            type="text"
            name="name"
            autocomplete="name"
            placeholder="Как к вам обращаться"
            :maxlength="100"
            :error-message="fieldErrors.displayName"
          />
          <van-field
            v-model="form.email"
            label="Email"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="you@example.com"
            :error-message="fieldErrors.email"
          />
          <van-field
            v-model="form.password"
            label="Пароль"
            type="password"
            name="new-password"
            autocomplete="new-password"
            placeholder="Не короче 8 символов, с цифрой"
            :error-message="fieldErrors.password"
          />
          <van-field
            v-model="form.passwordConfirm"
            label="Повторите пароль"
            type="password"
            name="password-confirm"
            autocomplete="new-password"
            placeholder="Ещё раз пароль"
            :error-message="fieldErrors.passwordConfirm"
          />
        </van-cell-group>

        <section v-if="error" class="block form-message error">{{ error }}</section>

        <section class="block">
          <van-button native-type="submit" type="primary" size="large" :loading="loading">Зарегистрироваться</van-button>
        </section>
      </form>

      <SocialLoginButtons />

      <section class="block text-align-center" >
        Уже есть аккаунт? <RouterLink to="/login">Войти</RouterLink>
      </section>
    </div>
  </main>
</template>
