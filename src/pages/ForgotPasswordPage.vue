<script setup lang="ts">
import { f7Block, f7Button, f7List, f7ListInput, f7Navbar, f7Page } from 'framework7-vue'
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
  <f7-page class="auth-page" no-toolbar>
    <f7-navbar title="Восстановление пароля" back-link="Назад" back-link-url="/login" />

    <div class="auth-container">
      <f7-block v-if="sent" class="text-align-center">
        <i class="f7-icons status-icon">envelope</i>
        <h2>Проверьте почту</h2>
        <!-- Бэкенд не сообщает, есть ли такой аккаунт, поэтому формулировка нейтральная. -->
        <p>
          Если аккаунт с адресом <b>{{ email.trim() }}</b> существует, мы отправили на него ссылку для смены
          пароля.
        </p>
        <f7-button fill large href="/login" :reload-all="true">Вернуться ко входу</f7-button>
      </f7-block>

      <form v-else @submit.prevent="submit" novalidate>
        <f7-block>
          <p>Укажите email, и мы пришлём ссылку для смены пароля.</p>
          <p>Если вы входили только через Яндекс или VK, так же можно задать пароль для входа по email.</p>
        </f7-block>
        <f7-list strong-ios dividers-ios inset>
          <f7-list-input
            v-model:value="email"
            label="Email"
            type="email"
            name="email"
            autocomplete="email"
            placeholder="you@example.com"
          />
        </f7-list>

        <f7-block v-if="error" class="form-message error">{{ error }}</f7-block>

        <f7-block>
          <f7-button type="submit" fill large :preloader="true" :loading="loading">Отправить ссылку</f7-button>
        </f7-block>
      </form>
    </div>
  </f7-page>
</template>
