import { request } from './http'

export interface Translation {
  translateChatId: string
  messageId: string
  sourceLanguage: string
  targetLanguage: string
  sourceText: string
  translatedText: string
  audioUrl: string
  audioUrlExpiresAt: string
  audioContentType: string
}

export const translationApi = {
  audio(audio: Blob, sourceLanguage: string, targetLanguage: string, chatId?: string) {
    const body = new FormData()
    const extension = audio.type.includes('mp4') ? 'm4a' : audio.type.includes('ogg') ? 'ogg' : 'webm'
    body.append('audio', audio, `message.${extension}`)
    body.append('sourceLanguage', sourceLanguage)
    body.append('targetLanguage', targetLanguage)
    if (chatId) body.append('translateChatId', chatId)
    return request<Translation>('/api/translation/audio', { method: 'POST', body })
  },
}
