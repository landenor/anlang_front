AnLang — SPA для разговорной практики иностранных языков. Vant 4 + Vue Router 4 + Vue 3 (`<script setup>`) + TypeScript + Vite, состояние в Pinia. Интерфейс, комментарии в коде и тексты ошибок — на русском.

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

**Старт приложения** (`main.ts`, `App.vue`): `auth.bootstrap()` восстанавливает сессию через `POST /api/auth/refresh`. Глобальный `router.beforeEach` ждёт этот общий промис перед проверкой доступа, включая первый переход. Пока `router.isReady()` не завершён, рендерится только прелоадер; затем монтируется `RouterView`.

**Роутинг** (`routes.ts`, `auth/guards.ts`): у маршрута поле `meta.access` — `'guest'` (только неавторизованным), `'public'` (всем), без поля — только после входа. `guardRoute` вызывается из глобального `router.beforeEach`. Используются реальные пути без `#!` (`createWebHistory`) и без завершающего слеша — на них возвращают OAuth-провайдеры (`/auth/callback/:provider`) и ведут ссылки из писем (`/confirm-email`, `/reset-password`). Навигация после входа/выхода — `router.replace(url)`; доступ повторно проверяется и при переходах по истории браузера. При размещении сервер должен отдавать `index.html` для путей SPA.

**HTTP** (`api/http.ts`): `request<T>()` поверх fetch с `credentials: 'include'`, Bearer-токеном, однократным повтором после refresh на 401 и превращением ProblemDetails в `ApiError` (`message` = `title`, `details` = значения `errors`). Для показа пользователю всегда `errorMessage(e)` — для ошибок валидации ASP.NET `title` английский, поэтому выводятся `details`. Стор подключается к клиенту через `configureHttp()` (инверсия зависимости, чтобы не было циклического импорта). Эндпоинты описываются объектами в `api/*.ts` (`authApi`, `usersApi`); публичные — с `auth: false`.

**Сессия** (`stores/auth.ts`): access token только в памяти, проактивное обновление за 60 с до `expiresAt`. Refresh token одноразовый, поэтому параллельные `refreshSession()` разделяют один промис. Сессия сбрасывается только при 401 от refresh, не при сетевой ошибке. `App.vue` следит за `isAuthenticated` и уводит на `/login`, когда сессия пропала.

**Внешний вход** (`auth/externalAuth.ts`, `auth/pkce.ts`, `pages/AuthCallbackPage.vue`): authorization code + PKCE; `codeVerifier` и `state` хранятся в `sessionStorage` под ключом `oauth:{provider}`, обмен code на сессию делает бэкенд (`authApi.external`). Code одноразовый — страница колбэка помнит обработанные коды на уровне модуля и чистит query из адресной строки. Кнопка провайдера показывается, только если задан его client ID (`enabledProviders`).

**Страницы**: используют `useRouter`/`useRoute` из `vue-router`, компоненты Vant импортируются локально, тосты — `utils/toast.ts`. Query-параметры ссылок авторизации читаются через `readQuery` (`utils/routeQuery.ts`). `AppHeader` содержит меню на основе `Popup`. Русская локаль Vant подключена в `main.ts`, тема следует системной через `ConfigProvider` в `App.vue`. Правила пароля в `utils/validation.ts` должны совпадать с настройками Identity в бэкенде (от 8 символов, хотя бы одна цифра).

## Проверка в браузере

Chrome не установлен, расширение Claude-in-Chrome может быть недоступно. Рабочий вариант — headless Edge (`C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe --headless=new --no-proxy-server --remote-debugging-port=N`), управляемый по CDP скриптом на Node 22; `--dump-dom` снимает DOM слишком рано (виден только прелоадер bootstrap). В Git Bash curl к localhost требует `--noproxy '*'` (системный прокси отвечает 503), а JSON с кириллицей нужно передавать из UTF-8 файла.
