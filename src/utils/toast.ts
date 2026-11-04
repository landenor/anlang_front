import { showToast as toast } from 'vant'
export function showToast(text: string) {
  toast({ message: text, position: 'middle', duration: 2500 })
}
