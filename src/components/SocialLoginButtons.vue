<script setup lang="ts">
import { f7Block, f7Button } from 'framework7-vue'
import { onMounted, onUnmounted, ref } from 'vue'
import type { Provider } from '../api/auth'
import { enabledProviders, providerNames, startExternalLogin } from '../auth/externalAuth'
import { showToast } from '../utils/toast'

// Логотипы 24×24, рисуются цветом текста кнопки; знак вырезан из подложки (fill-rule evenodd).
// VK — simple-icons (CC0), «Я» — Font Awesome yandex (CC BY 4.0) в круге, как у кнопки Яндекс ID.
const providerIcons: Record<Provider, string> = {
  yandex:
    'M12 0a12 12 0 1 0 0 24a12 12 0 1 0 0-24Z' +
    'M12.94 13.52L10.72 18.5H9.1l2.44-5.33c-1.15-.58-1.91-1.64-1.91-3.58C9.63 6.86 11.36 5.5 13.41 5.5H15.5v13h-1.4V13.52h-1.16zm1.16-6.84h-.75c-1.13 0-2.22.75-2.22 2.91 0 2.09 1 2.76 2.22 2.76h.75V6.68z',
  vk: 'm9.489.004.729-.003h3.564l.73.003.914.01.433.007.418.011.403.014.388.016.374.021.36.025.345.03.333.033c1.74.196 2.933.616 3.833 1.516.9.9 1.32 2.092 1.516 3.833l.034.333.029.346.025.36.02.373.025.588.012.41.013.644.009.915.004.98-.001 3.313-.003.73-.01.914-.007.433-.011.418-.014.403-.016.388-.021.374-.025.36-.03.345-.033.333c-.196 1.74-.616 2.933-1.516 3.833-.9.9-2.092 1.32-3.833 1.516l-.333.034-.346.029-.36.025-.373.02-.588.025-.41.012-.644.013-.915.009-.98.004-3.313-.001-.73-.003-.914-.01-.433-.007-.418-.011-.403-.014-.388-.016-.374-.021-.36-.025-.345-.03-.333-.033c-1.74-.196-2.933-.616-3.833-1.516-.9-.9-1.32-2.092-1.516-3.833l-.034-.333-.029-.346-.025-.36-.02-.373-.025-.588-.012-.41-.013-.644-.009-.915-.004-.98.001-3.313.003-.73.01-.914.007-.433.011-.418.014-.403.016-.388.021-.374.025-.36.03-.345.033-.333c.196-1.74.616-2.933 1.516-3.833.9-.9 2.092-1.32 3.833-1.516l.333-.034.346-.029.36-.025.373-.02.588-.025.41-.012.644-.013.915-.009ZM6.79 7.3H4.05c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95V7.3H10.5v6.92c-1.6-.4-3.62-2.34-3.71-6.92Z',
}

const pending = ref<Provider | null>(null)

// Если пользователь вернулся со страницы провайдера кнопкой «Назад», страница может прийти из bfcache.
const resetPending = () => (pending.value = null)
onMounted(() => window.addEventListener('pageshow', resetPending))
onUnmounted(() => window.removeEventListener('pageshow', resetPending))

async function login(provider: Provider) {
  pending.value = provider
  try {
    await startExternalLogin(provider)
  } catch {
    pending.value = null
    showToast('Не удалось начать вход, попробуйте ещё раз')
  }
}
</script>

<template>
  <f7-block v-if="enabledProviders.length > 0">
    <div class="auth-divider">или</div>
    <div class="social-buttons margin-top">
      <f7-button
        v-for="provider in enabledProviders"
        :key="provider"
        class="social-button"
        :class="`social-${provider}`"
        fill
        large
        :preloader="true"
        :loading="pending === provider"
        :disabled="pending !== null"
        @click="login(provider)"
      >
        <svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" fill-rule="evenodd" :d="providerIcons[provider]" />
        </svg>
        <span>Войти через {{ providerNames[provider] }}</span>
      </f7-button>
    </div>
  </f7-block>
</template>
