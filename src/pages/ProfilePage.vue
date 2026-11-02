<script setup lang="ts">
import {
  f7, f7Block, f7BlockTitle, f7Button, f7Link, f7List, f7ListItem, f7Navbar, f7Page,
} from 'framework7-vue'
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()

const loginMethodNames: Record<string, string> = { yandex: 'Яндекс ID', vk: 'VK ID' }

const loginMethods = computed(() => {
  const user = auth.user
  if (!user) return []
  const methods = user.externalLogins.map((p) => loginMethodNames[p] ?? p)
  if (user.hasPassword) methods.unshift('Email и пароль')
  return methods
})

/** Аккаунт без пароля, но с email: пароль можно задать через «Забыли пароль». */
const canSetPassword = computed(() => !!auth.user && !auth.user.hasPassword && !!auth.user.email)

function confirmLogout() {
  // Переход на /login сделает App.vue, когда сессия станет пустой.
  f7.dialog.confirm('Выйти из аккаунта?', 'AnLang', () => void auth.logout())
}
</script>

<template>
  <f7-page>
    <f7-navbar title="Профиль">
      <template #left>
        <f7-link panel-open="#app-menu" icon-f7="line_horizontal_3" aria-label="Открыть меню" />
      </template>
    </f7-navbar>

    <template v-if="auth.user">
      <f7-block class="display-flex align-items-center" style="gap: 16px">
        <img v-if="auth.user.avatarUrl" :src="auth.user.avatarUrl" class="profile-avatar" alt="" />
        <i v-else class="f7-icons profile-avatar display-flex justify-content-center align-items-center">person</i>
        <div>
          <h2 class="no-margin">Привет, {{ auth.user.displayName || 'друг' }}!</h2>
          <div class="text-color-gray">{{ auth.user.email ?? 'Email не указан' }}</div>
        </div>
      </f7-block>

      <f7-block-title>Аккаунт</f7-block-title>
      <f7-list strong inset dividers-ios>
        <f7-list-item title="Способы входа" :after="loginMethods.join(', ')" />
        <f7-list-item
          v-if="auth.user.email"
          title="Email"
          :after="auth.user.emailConfirmed ? 'подтверждён' : 'не подтверждён'"
        />
        <f7-list-item v-if="canSetPassword" link="/forgot-password" title="Задать пароль для входа по email" />
      </f7-list>

      <f7-block>
        <f7-button color="red" outline @click="confirmLogout">Выйти</f7-button>
      </f7-block>
    </template>
  </f7-page>
</template>
