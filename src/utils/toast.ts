import { f7 } from 'framework7-vue'

export function showToast(text: string) {
  f7.toast.show({ text, position: 'center', closeTimeout: 2500 })
}
