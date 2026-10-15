# Moment AI

Мобильный AI-чат для iPhone: потоковые ответы, поиск Google с источниками и помощь с кодом. Приложение использует OpenAI-совместимый API, поэтому ответы и скорость зависят от выбранного провайдера и модели.

## Запуск в браузере

Нужен Node.js 20 или новее.

```sh
npm install
npm run dev
```

Откройте локальный адрес из вывода Vite. В приложении нажмите кнопку настроек и укажите API URL, название модели и API-ключ. По умолчанию используется OpenRouter (`https://openrouter.ai/api/v1`, модель `openai/gpt-4o-mini`). Можно указать любой доступный провайдер с совместимым `/chat/completions` API и поддержкой потоковой передачи.

Для поиска Google укажите ключ Google Programmable Search и Search engine ID (CX). Поиск требует включённого Custom Search JSON API и может иметь квоты/стоимость. Без этих значений приложение отвечает без веб-поиска.

## Сборка iOS / IPA

Этот репозиторий содержит Capacitor-оболочку, но создать подписанный IPA на Linux нельзя: для iOS-сборки нужен macOS с Xcode и подписью Apple. На Mac:

```sh
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

В Xcode выберите личную команду подписи и соберите приложение на устройство или экспортируйте IPA. Затем передайте IPA в Sideloadly и подпишите Apple ID. Для повторной установки бесплатная подпись Apple ID обычно требует периодического обновления.

### Скачать IPA через GitHub Actions

Workflow `.github/workflows/build-ios.yml` собирает unsigned IPA на macOS и кладёт его в ZIP. После отправки проекта в GitHub откройте вкладку **Actions**, выберите **Build unsigned iOS IPA** и запустите **Run workflow**. Когда задача завершится, скачайте artifact `MomentAI-download`, распакуйте `MomentAI-download.zip` и выберите `MomentAI.ipa` в Sideloadly на Windows. Для Sideloadly подпись выполняется вашим Apple ID.

## Block World

Отдельный оригинальный мобильный 3D sandbox-прототип находится в `block-world/`. Запуск: `npm install --prefix block-world`, затем `npm --prefix block-world run dev`. На Mac iOS-проект открывается командами из `block-world/README.md`.

Workflow `.github/workflows/build-block-world.yml` собирает unsigned iOS IPA на GitHub macOS runner и упаковывает его в ZIP. После слияния изменений откройте **Actions**, выберите **Build Block World iOS IPA**, затем скачайте artifact `BlockWorld-download`. В ZIP лежит `BlockWorld.ipa` для Sideloadly.

## GameDock

Отдельный iOS лаунчер-компаньон лежит в `gamedock/`. Он хранит пользовательские HTTPS-ссылки на Roblox-игры и открывает их через официальный клиент Roblox; прямого подключения к серверам и модификации клиента нет. Запуск: `npm install --prefix gamedock`, затем `npm --prefix gamedock run dev`.

Workflow `.github/workflows/build-gamedock.yml` собирает IPA и ZIP на GitHub Actions. После слияния изменений скачайте artifact `GameDock-download`; внутри будет `GameDock.ipa` для Sideloadly.

## Важно

API-ключи сохраняются локально в браузере/приложении. Не используйте этот клиент для распространения ключа или публичного сервиса: для этого нужен серверный прокси. «Без ограничений» гарантировать нельзя: ограничения безопасности и квоты задают провайдер модели и Google. В системной инструкции нет дополнительных запретов на обычные вопросы и написание кода; достоверность ответов не гарантируется, поэтому проверяйте важные факты и код.