AnLang — SPA для разговорной практики иностранных языков. Framework7 9 + Vue 3 (`<script setup>`) + TypeScript + Vite, состояние в Pinia. Интерфейс, комментарии в коде и тексты ошибок — на русском.

## Команды

```bash
npm run dev      # Vite на http://localhost:5173 (strictPort), /api проксируется на http://localhost:5087
npm run build    # vue-tsc -b && vite build — единственная проверка типов
npm run preview
```

Тестов и линтера нет; изменения проверяем `npm run build` (строгий TS: `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly` — никаких `enum`/parameter properties).

## Окружение и бэкенд

- Бэкенд: `D:\repos\anlang\AnLangBackend` (ASP.NET, `dotnet run` в `AnLangBackend/AnLangBackend`, http://localhost:5087, swagger). Postgres (5433) и Mailpit (UI http://localhost:8025) поднимаются docker-compose бэкенда; письма подтверждения/сброса пароля приходят в Mailpit. Документация API для SPA — `AnLangBackend/docs/` (внешняя авторизация: `external-auth-spa.md`).
- Порт 5173 нельзя менять: он зашит в redirect URI Яндекса и VK.
- Переменные: `VITE_API_URL` (пусто = тот же origin через прокси), `VITE_YANDEX_CLIENT_ID`, `VITE_VK_CLIENT_ID`. Реальные client ID лежат в `.env.development`; `.env` — шаблон с пустыми значениями (README ссылается на несуществующий `.env.example`). Типы — `src/env.d.ts`.
- Один origin с API принципиален: httpOnly cookie `refresh_token` работает без CORS и third-party cookie.

## Архитектура

**Старт приложения** (`App.vue`): пока `auth.bootstrap()` восстанавливает сессию через `POST /api/auth/refresh`, рендерится только прелоадер — `<f7-app>` и роутер ещё не созданы. Потом `guardInitialUrl()` через `history.replaceState` подменяет URL, если начальная страница недоступна (framework7-vue рендерит начальную страницу в обход `routesBeforeEnter`), и только после этого монтируется View.

**Роутинг** (`routes.ts`, `auth/guards.ts`): у маршрута поле `access` — `'guest'` (только неавторизованным), `'public'` (всем), без поля — только после входа. `guardRoute` подключён как `routes-before-enter` у главного View. Используются реальные пути без `#!` (`browser-history-separator=""`) и без завершающего слеша — на них возвращают OAuth-провайдеры (`/auth/callback/:provider`) и ведут ссылки из писем (`/confirm-email`, `/reset-password`). `guardInitialUrl` матчит маршрут через `path-to-regexp` той же версии, что у роутера Framework7, — при добавлении маршрутов это должно оставаться согласованным. Навигация после входа/выхода — `router.navigate(url, { reloadAll: true, clearPreviousHistory: true })`.

**HTTP** (`api/http.ts`): `request<T>()` поверх fetch с `credentials: 'include'`, Bearer-токеном, однократным повтором после refresh на 401 и превращением ProblemDetails в `ApiError` (`message` = `title`, `details` = значения `errors`). Для показа пользователю всегда `errorMessage(e)` — для ошибок валидации ASP.NET `title` английский, поэтому выводятся `details`. Стор подключается к клиенту через `configureHttp()` (инверсия зависимости, чтобы не было циклического импорта). Эндпоинты описываются объектами в `api/*.ts` (`authApi`, `usersApi`); публичные — с `auth: false`.

**Сессия** (`stores/auth.ts`): access token только в памяти, проактивное обновление за 60 с до `expiresAt`. Refresh token одноразовый, поэтому параллельные `refreshSession()` разделяют один промис. Сессия сбрасывается только при 401 от refresh, не при сетевой ошибке. `App.vue` следит за `isAuthenticated` и уводит на `/login`, когда сессия пропала.

**Внешний вход** (`auth/externalAuth.ts`, `auth/pkce.ts`, `pages/AuthCallbackPage.vue`): authorization code + PKCE; `codeVerifier` и `state` хранятся в `sessionStorage` под ключом `oauth:{provider}`, обмен code на сессию делает бэкенд (`authApi.external`). Code одноразовый — страница колбэка помнит обработанные коды на уровне модуля и чистит query из адресной строки. Кнопка провайдера показывается, только если задан его client ID (`enabledProviders`).

**Страницы**: получают `f7router`/`f7route` через props, используют компоненты `f7-*` из `framework7-vue`, тосты — `utils/toast.ts`. Правила пароля в `utils/validation.ts` должны совпадать с настройками Identity в бэкенде (от 8 символов, хотя бы одна цифра). По Framework7 API есть MCP-сервер `framework7`.

## Проверка в браузере

Chrome не установлен, расширение Claude-in-Chrome может быть недоступно. Рабочий вариант — headless Edge (`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe --headless=new --no-proxy-server --remote-debugging-port=N`), управляемый по CDP скриптом на Node 22; `--dump-dom` снимает DOM слишком рано (виден только прелоадер bootstrap). В Git Bash curl к localhost требует `--noproxy '*'` (системный прокси отвечает 503), а JSON с кириллицей нужно передавать из UTF-8 файла.
