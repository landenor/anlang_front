<script setup lang="ts">
import { Button as VanButton, CellGroup as VanCellGroup, Cell as VanCell, Icon as VanIcon, showConfirmDialog } from 'vant'

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
  void showConfirmDialog({ title: 'AnLang', message: 'Выйти из аккаунта?' }).then(() => auth.logout()).catch(() => {})
}
</script>

<template>
  <main class="app-content">
    <template v-if="auth.user">
      <section class="block display-flex align-items-center"  style="gap: 16px">
        <img v-if="auth.user.avatarUrl" :src="auth.user.avatarUrl" class="profile-avatar" alt="" />
        <van-icon v-else name="user-o" class="profile-avatar display-flex justify-content-center align-items-center" size="32" />
        <div>
          <h2 class="no-margin">Привет, {{ auth.user.displayName || 'друг' }}!</h2>
          <div class="text-color-gray">{{ auth.user.email ?? 'Email не указан' }}</div>
        </div>
      </section>

      <h3 class="section-title">Аккаунт</h3>
      <van-cell-group inset>
        <van-cell title="Способы входа" :value="loginMethods.join(', ')" />
        <van-cell v-if="auth.user.email" title="Email" :value="auth.user.emailConfirmed ? 'подтверждён' : 'не подтверждён'" />
        <van-cell v-if="canSetPassword" is-link to="/forgot-password" title="Задать пароль для входа по email" />
      </van-cell-group>

      <section class="block">
        <van-button block plain type="danger" @click="confirmLogout">Выйти</van-button>
      </section>
    </template>
  </main>
</template>
