/** Ошибка API: `message` — текст для пользователя из ProblemDetails.title, `details` — тексты из errors. */
export class ApiError extends Error {
  readonly status: number
  readonly details: string[]

  constructor(status: number, message: string, details: string[] = []) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

interface ProblemDetails {
  title?: string
  errors?: Record<string, string[]>
}

interface HttpHooks {
  getAccessToken(): string | null
  /** Обновляет access token по refresh cookie. Возвращает false, если сессии больше нет. */
  refreshSession(): Promise<boolean>
}

let hooks: HttpHooks = {
  getAccessToken: () => null,
  refreshSession: async () => false,
}

/** Подключает к HTTP-клиенту хранилище сессии (без прямого импорта, чтобы избежать цикла). */
export function configureHttp(value: HttpHooks) {
  hooks = value
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Передавать Bearer token и обновлять сессию при 401. По умолчанию true. */
  auth?: boolean
}

const baseUrl = import.meta.env.VITE_API_URL ?? ''

export async function request<T>(path: string, { method = 'GET', body, auth = true }: RequestOptions = {}): Promise<T> {
  const token = auth ? hooks.getAccessToken() : null
  let response = await send(path, method, body, token)

  if (response.status === 401 && auth) {
    // Пока запрос шёл, токен уже могли обновить: тогда повторяем с новым, не запуская ещё один refresh.
    const current = hooks.getAccessToken()
    const alreadyRefreshed = current !== null && current !== token
    if (alreadyRefreshed || (await hooks.refreshSession())) {
      response = await send(path, method, body, hooks.getAccessToken())
    }
  }

  if (!response.ok) {
    throw await toApiError(response)
  }
  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

async function send(path: string, method: string, body: unknown, token: string | null): Promise<Response> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    return await fetch(baseUrl + path, {
      method,
      headers,
      // Без этого браузер не сохранит и не отправит cookie refresh_token.
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Нет соединения с сервером. Проверьте интернет и попробуйте ещё раз')
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  const problem = (await response.json().catch(() => null)) as ProblemDetails | null
  const details = problem?.errors ? Object.values(problem.errors).flat() : []
  const fallback = response.status >= 500 ? 'Сервер временно недоступен' : 'Не удалось выполнить запрос'
  return new ApiError(response.status, problem?.title ?? fallback, details)
}

/** Текст ошибки для показа пользователю. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // Для ошибок валидации ASP.NET title на английском, поэтому показываем детали.
    return error.details.length > 0 ? error.details.join('\n') : error.message
  }
  return error instanceof Error ? error.message : 'Что-то пошло не так'
}
