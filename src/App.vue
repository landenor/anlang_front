<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { ConfigProvider as VanConfigProvider, Loading as VanLoading } from 'vant'
import { RouterView } from 'vue-router'
import { router } from './routes'
import { useAuthStore } from './stores/auth'
const auth = useAuthStore()
const ready = ref(false)
const media = window.matchMedia('(prefers-color-scheme: dark)')
const theme = ref<'light' | 'dark'>(media.matches ? 'dark' : 'light')

function updateTheme() { theme.value = media.matches ? 'dark' : 'light' }

media.addEventListener('change', updateTheme)

onBeforeUnmount(() => media.removeEventListener('change', updateTheme))

void router.isReady().then(() => { ready.value = true })

watch(() => auth.isAuthenticated, (authenticated, previous) => {
  if (previous && !authenticated) void router.replace('/login')
})

</script>
<template>
  <van-config-provider :theme="theme">
    <div v-if="!ready" class="app-loading" role="status" aria-label="Восстанавливаем сессию"><van-loading size="42" /></div>
    <RouterView v-else v-slot="{ Component, route }">
      <component :is="Component" :key="route.matched.length > 1 ? route.matched[0]?.path : route.path.startsWith('/auth/callback/') ? route.path : route.fullPath" />
    </RouterView>
  </van-config-provider>
</template>
