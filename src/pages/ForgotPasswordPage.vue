<script setup lang="ts">
import { Button as VanButton, CellGroup as VanCellGroup, Field as VanField, NavBar as VanNavBar, Icon as VanIcon } from 'vant'

import { ref } from 'vue'
import { authApi } from '../api/auth'
import { errorMessage } from '../api/http'
import { validateEmail } from '../utils/validation'

const email = ref('')
const loading = ref(false)
const error = ref('')
const sent = ref(false)

async function submit() {
  error.value = validateEmail(email.value.trim()) ?? ''
  if (error.value) return

  loading.value = true
  try {
    await authApi.forgotPassword(email.value.trim())
    sent.value = true
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="auth-page">
    <van-nav-bar title="Восстановление пароля" left-text="Назад" left-arrow @click-left="$router.replace('/login')" />

    <div class="auth-container">
      <section v-if="sent" class="block text-align-center">
        <van-icon name="envelop-o" class="status-icon" />
        <h2>Проверьте почту</h2>
        <!-- Бэкенд не сообщает, есть ли такой аккаунт, поэтому формулировка нейтральная. -->
        <p>
          Если аккаунт с адресом <b>{{ email.trim() }}</b> существует, мы отправили на него ссылку для смены
          пароля.
        </p>
        <van-button type="primary" size="large" to="/login">Вернуться ко входу</van-button>
      </section>

      <form v-else @submit.prevent="submit" novalidate>
        <section class="block">
          <p>Укажите email, и мы пришлём ссылку для смены пароля.</p>
          <p>Если вы входили только через Яндекс или VK, так же можно задать пароль для входа по email.</p>
        </section>
        <van-cell-group inset>
          <van-field
            v-model="email"
            label="Email"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="you@example.com"
          />
        </van-cell-group>

        <section v-if="error" class="block form-message error">{{ error }}</section>

        <section class="block">
          <van-button native-type="submit" type="primary" size="large" :loading="loading">Отправить ссылку</van-button>
        </section>
      </form>
    </div>
  </main>
</template>
