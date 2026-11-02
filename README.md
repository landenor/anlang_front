# AnLang — фронтенд

Приложение для перевода иностранных языков. Framework7 + Vue 3 + TypeScript + Vite, состояние в Pinia.

## Запуск

```bash
npm install
cp .env.example .env   # заполнить client ID провайдеров
npm run dev            # http://localhost:5173
```

Бэкенд (`AnLangBackend`) должен работать на `http://localhost:5087`: Vite проксирует на него `/api`, поэтому фронт и API живут на одном origin (cookie `refresh_token` работает во всех браузерах, CORS не нужен). Порт 5173 зафиксирован: он прописан в redirect URI Яндекса и VK.

## Авторизация

- Email и пароль: регистрация с подтверждением email, вход, «Забыли пароль», смена пароля по ссылке.
- Яндекс ID и VK ID: authorization code + PKCE, обмен code на сессию делает бэкенд. Подробности и настройка провайдеров: `AnLangBackend/docs/external-auth-spa.md`. Кнопка провайдера показывается, только если в `.env` задан его client ID.
- Access token хранится только в памяти, после перезагрузки страницы сессия восстанавливается через `POST /api/auth/refresh`.

## Структура

```
src/
  api/        http.ts — fetch-клиент (Bearer, авто-refresh на 401, ProblemDetails → ApiError); auth.ts — эндпоинты
  auth/       PKCE, вход через провайдеров, guard'ы маршрутов
  stores/     auth.ts — сессия и текущий пользователь
  pages/      экраны (маршруты в routes.ts)
  components/ общие компоненты
```

Маршруты без завершающего слеша и с реальными путями (`browser-history-separator=""`): на `/auth/callback/{provider}` возвращают провайдеры, на `/confirm-email` и `/reset-password` ведут ссылки из писем.
