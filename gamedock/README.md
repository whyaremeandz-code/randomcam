# GameDock

Отдельный iPhone-лаунчер-компаньон для избранных ссылок на Roblox-игры. Он не заменяет и не изменяет официальный клиент Roblox, а открывает сохранённую ссылку в системе. Подключения к серверам Roblox напрямую нет.

## Запуск в браузере

```sh
npm install
npm run dev
```

Добавляй полные HTTPS-ссылки вида `https://www.roblox.com/games/...`. Список хранится локально на устройстве.

## Сборка iOS

```sh
npm install
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

Для IPA нужен Mac с Xcode или GitHub Actions workflow. Подпись для установки выполняется твоим Apple ID в Sideloadly.