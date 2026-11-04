import type { LocationQuery } from 'vue-router'
/** Повторяющиеся и пустые параметры не принимаем как значения ссылок авторизации. */
export function readQuery(query: LocationQuery): Record<string, string | undefined> {
  return Object.fromEntries(Object.entries(query).map(([key, value]) => [key, typeof value === 'string' ? value : undefined]))
}
