<script setup lang="ts">
import { Button as VanButton, CellGroup as VanCellGroup, Field as VanField, NavBar as VanNavBar, Icon as VanIcon, showDialog } from 'vant'

import { useRouter, useRoute } from 'vue-router'
import { readQuery } from '../utils/routeQuery'
import { reactive, ref } from 'vue'
import { authApi } from '../api/auth'
import { errorMessage } from '../api/http'
import { useAuthStore } from '../stores/auth'
import { validatePassword } from '../utils/validation'

const router = useRouter()
const route = useRoute()
const query = readQuery(route.query)

const auth = useAuthStore()

// Ссылка из письма: /reset-password?userId=...&token=...
const userId = query.userId
const token = query.token
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
    await showDialog({ title: 'Пароль изменён', message: 'Теперь войдите с новым паролем.' })
    // Бэкенд завершил все сессии пользователя, поэтому сбрасываем и текущую.
    auth.clearSession()
    void router.replace('/login')
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <van-nav-bar title="Новый пароль" />

    <div class="auth-container">
      <section v-if="!linkValid" class="block text-align-center">
        <van-icon name="close" class="status-icon" />
        <h2>Ссылка недействительна</h2>
        <p>Запросите новую ссылку для смены пароля.</p>
        <van-button type="primary" size="large" to="/forgot-password">Запросить ссылку</van-button>
      </section>

      <form v-else @submit.prevent="submit" novalidate>
        <van-cell-group inset>
          <van-field
            v-model="form.password"
            label="Новый пароль"
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
          <van-button native-type="submit" type="primary" size="large" :loading="loading">Сохранить пароль</van-button>
        </section>
      </form>
    </div>
  </main>
</template>
