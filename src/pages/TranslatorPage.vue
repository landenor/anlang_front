<script setup lang="ts">
import { f7Icon, f7Link, f7List, f7ListItem, f7Navbar, f7Page, f7Preloader } from 'framework7-vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { errorMessage } from '../api/http'
import { translationApi, type Translation } from '../api/translation'
import { useHoldRecorder } from '../composables/useHoldRecorder'

type Speaker = 0 | 1
interface Message {
  id: number
  speaker: Speaker
  sourceLanguage: string
  targetLanguage: string
  originalUrl: string
  translation?: Translation
  error?: string
}

const languages = [
  { code: 'ru', name: 'Русский' }, { code: 'en', name: 'Английский' },
  { code: 'de', name: 'Немецкий' }, { code: 'fr', name: 'Французский' },
  { code: 'es', name: 'Испанский' }, { code: 'it', name: 'Итальянский' },
  { code: 'pt', name: 'Португальский' }, { code: 'zh', name: 'Китайский' },
  { code: 'ja', name: 'Японский' }, { code: 'ko', name: 'Корейский' },
  { code: 'tr', name: 'Турецкий' }, { code: 'ar', name: 'Арабский' },
]
const selectedLanguages = ref<[string, string]>(['ru', 'en'])
const languageSelectParams = {
  openIn: 'popup',
  cssClass: 'translator-language-select',
  pageTitle: 'Выберите язык',
  popupCloseLinkText: 'Закрыть',
  searchbar: true,
  searchbarPlaceholder: 'Найти язык',
  searchbarDisableText: 'Отмена',
  appendSearchbarNotFound: 'Язык не найден',
  closeOnSelect: true,
  setValueText: false,
} as const
const messages = ref<Message[]>([])
const chat = ref<HTMLElement>()
const sending = ref(false)
const speaker = ref<Speaker>(0)
let chatId: string | undefined
let sequence = 0
let visible = true
let recordedLanguages: [string, string] = ['ru', 'en']

const { phase, error, start, release, cancel } = useHoldRecorder((audio) => void send(audio))
const locked = computed(() => sending.value || phase.value !== 'idle')
const status = computed(() => {
  if (sending.value) return 'Распознаём и переводим…'
  if (phase.value === 'permission') return 'Разрешите доступ к микрофону и продолжайте удерживать кнопку'
  if (phase.value === 'recording') return 'Идёт запись. Отпустите кнопку, чтобы отправить'
  if (phase.value === 'finishing') return 'Завершаем запись…'
  return 'Удерживайте микрофон, пока говорите'
})
const languageName = (code: string) => languages.find((language) => language.code === code)?.name ?? code

async function scrollToEnd() {
  await nextTick()
  chat.value?.scrollTo({ top: chat.value.scrollHeight, behavior: 'smooth' })
}

async function send(audio: Blob) {
  const message: Message = {
    id: ++sequence,
    speaker: speaker.value,
    sourceLanguage: recordedLanguages[0],
    targetLanguage: recordedLanguages[1],
    originalUrl: URL.createObjectURL(audio),
  }
  messages.value.push(message)
  sending.value = true
  void scrollToEnd()
  try {
    const result = await translationApi.audio(audio, message.sourceLanguage, message.targetLanguage, chatId)
    chatId = result.translateChatId
    const row = messages.value.find((item) => item.id === message.id)
    if (row) row.translation = result
  } catch (cause) {
    const row = messages.value.find((item) => item.id === message.id)
    if (row) row.error = errorMessage(cause)
  } finally {
    sending.value = false
    if (visible) void scrollToEnd()
  }
}

function begin(side: Speaker, key: string) {
  if (locked.value || !visible) return
  speaker.value = side
  recordedLanguages = [selectedLanguages.value[side], selectedLanguages.value[side === 0 ? 1 : 0]]
  void start(key)
}

function pointerDown(event: PointerEvent, side: Speaker) {
  if (event.button !== 0 || locked.value) return
  event.preventDefault()
  const button = event.currentTarget as HTMLElement
  button.setPointerCapture(event.pointerId)
  begin(side, `pointer:${event.pointerId}`)
}

function keyDown(event: KeyboardEvent, side: Speaker) {
  if (event.code !== 'Space' && event.code !== 'Enter') return
  event.preventDefault()
  if (!event.repeat) begin(side, `key:${event.code}`)
}

function keyUp(event: KeyboardEvent) {
  if (event.code !== 'Space' && event.code !== 'Enter') return
  event.preventDefault()
  release(`key:${event.code}`)
}

function hide() {
  visible = false
  cancel()
}
function visibilityChanged() {
  if (document.hidden) cancel()
}
onMounted(() => {
  window.addEventListener('blur', cancel)
  document.addEventListener('visibilitychange', visibilityChanged)
})
onBeforeUnmount(() => {
  window.removeEventListener('blur', cancel)
  document.removeEventListener('visibilitychange', visibilityChanged)
  messages.value.forEach((message) => URL.revokeObjectURL(message.originalUrl))
})
</script>

<template>
  <f7-page class="translator-page" @page:beforeout="hide" @page:beforein="visible = true">
    <f7-navbar title="Переводчик">
      <template #left>
        <f7-link panel-open="#app-menu" icon-f7="line_horizontal_3" aria-label="Открыть меню" />
      </template>
    </f7-navbar>

    <div ref="chat" class="translator-chat" role="log" aria-label="Диалог двух собеседников" aria-live="polite">
      <div v-if="!messages.length" class="translator-empty">
        <f7-icon f7="bubble_left_bubble_right" :size="48" />
        <h2>Понимайте друг друга</h2>
        <p>Выберите язык каждого собеседника.<br />Удерживайте свою кнопку и говорите — перевод появится здесь.</p>
      </div>
      <article
        v-for="message in messages" :key="message.id" class="translator-message"
        :class="{ 'translator-message-right': message.speaker === 1 }"
      >
        <div class="translator-message-meta">
          {{ languageName(message.sourceLanguage) }} → {{ languageName(message.targetLanguage) }}
        </div>
        <template v-if="message.translation">
          <p class="translator-original">{{ message.translation.sourceText }}</p>
          <p class="translator-translation">{{ message.translation.translatedText }}</p>
          <audio :src="message.translation.audioUrl" controls preload="none" aria-label="Прослушать перевод" />
        </template>
        <template v-else>
          <audio :src="message.originalUrl" controls preload="none" aria-label="Прослушать запись" />
          <p v-if="message.error" class="translator-error" role="alert">{{ message.error }}</p>
          <p v-else class="translator-pending"><f7-preloader :size="18" /> Распознаём и переводим…</p>
        </template>
      </article>
    </div>

    <div class="translator-controls">
      <p class="translator-status" role="status">{{ status }}</p>
      <p v-if="error" class="translator-error" role="alert">{{ error }}</p>
      <div class="translator-speakers">
        <div v-for="side in ([0, 1] as const)" :key="side" class="translator-speaker">
          <button
            type="button" class="translator-mic"
            :class="{ 'translator-mic-active': speaker === side && phase === 'recording' }"
            :disabled="sending || (phase !== 'idle' && speaker !== side)"
            :aria-label="`Удерживайте для записи: собеседник ${side + 1}, ${languageName(selectedLanguages[side])}`"
            :aria-pressed="speaker === side && phase === 'recording'"
            @pointerdown="pointerDown($event, side)"
            @pointerup="release(`pointer:${$event.pointerId}`)"
            @pointercancel="cancel" @lostpointercapture="release(`pointer:${$event.pointerId}`)"
            @keydown="keyDown($event, side)" @keyup="keyUp" @blur="cancel"
            @contextmenu.prevent
          >
            <f7-icon f7="mic_fill" :size="26" />
          </button>
          <f7-list class="translator-language" strong outline>
            <f7-list-item
              title="Язык"
              :after="languageName(selectedLanguages[side])"
              smart-select :smart-select-params="languageSelectParams" :disabled="locked"
            >
              <select
                v-model="selectedLanguages[side]" :name="`language-${side}`" :disabled="locked"
                :aria-label="`Язык собеседника ${side + 1}`"
              >
                <option v-for="language in languages" :key="language.code" :value="language.code">{{ language.name }}</option>
              </select>
            </f7-list-item>
          </f7-list>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<style scoped>
.translator-page :deep(.page-content) { display: flex; flex-direction: column; overflow: hidden; }
.translator-chat { flex: 1; min-height: 0; overflow-y: auto; padding: 20px 16px; overscroll-behavior: contain; }
.translator-empty { max-width: 420px; margin: 8vh auto 0; text-align: center; color: var(--f7-block-footer-text-color); }
.translator-empty h2 { color: var(--f7-text-color); font-size: 23px; }
.translator-empty p { line-height: 1.6; }
.translator-message { box-sizing: border-box; width: fit-content; max-width: min(85%, 520px); padding: 14px; margin: 0 auto 16px 0; border-radius: 18px 18px 18px 4px; background: var(--f7-card-bg-color); border: 1px solid var(--f7-list-item-border-color, #ddd); overflow-wrap: anywhere; }
.translator-message-right { margin-left: auto; margin-right: 0; border-radius: 18px 18px 4px 18px; border-color: var(--f7-color-primary); }
.translator-message-meta { font-size: 12px; color: var(--f7-block-footer-text-color); }
.translator-original { color: var(--f7-block-footer-text-color); white-space: pre-wrap; }
.translator-translation { font-size: 18px; white-space: pre-wrap; }
.translator-message audio { display: block; width: 100%; max-width: 320px; margin-top: 12px; }
.translator-pending { display: flex; align-items: center; gap: 8px; }
.translator-controls { flex-shrink: 0; padding: 8px max(16px, env(safe-area-inset-right)) calc(16px + env(safe-area-inset-bottom)) max(16px, env(safe-area-inset-left)); background: var(--f7-card-bg-color); border-top: 1px solid var(--f7-list-item-border-color, #ddd); }
.translator-status { text-align: center; font-size: 13px; margin: 4px 0 14px; color: var(--f7-block-footer-text-color); }
.translator-error { color: var(--f7-color-red); white-space: pre-line; }
.translator-controls > .translator-error { text-align: center; }
.translator-speakers { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; max-width: 600px; margin: auto; }
.translator-speaker { display: flex; align-items: center; flex-direction: column; gap: 12px; min-width: 0; }
.translator-mic { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; box-sizing: border-box; width: min(80px, 100%); aspect-ratio: 1; padding: 8px; border: 0; border-radius: 50%; background: var(--translator-mic-bg, var(--f7-color-primary)); color: #fff; font: inherit; font-size: 13px; cursor: pointer; touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
.translator-speaker:nth-child(2) { --translator-mic-bg: #4c1d95; }
.translator-mic.translator-mic-active { background: var(--f7-color-red); color: #fff; box-shadow: 0 0 0 4px color-mix(in srgb, var(--f7-color-red) 22%, transparent); }
.translator-mic:disabled { opacity: .45; cursor: default; }
.translator-mic:focus-visible, .translator-language :deep(.item-link:focus-visible) { outline: 3px solid var(--f7-color-primary); outline-offset: 3px; }
.translator-language { width: 100%; margin: 0; --f7-list-item-padding-horizontal: 12px; }
.translator-language :deep(.item-inner) { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 4px; }
.translator-language :deep(.item-title) { max-width: 100%; font-size: 11px; color: var(--f7-block-footer-text-color); }
.translator-language :deep(.item-after) { max-width: 100%; margin-left: 0; font-size: 14px; color: var(--f7-text-color); }
</style>
