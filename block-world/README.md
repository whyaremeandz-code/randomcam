# Block World

Отдельный мобильный 3D-прототип: исследуй остров, двигайся джойстиком или WASD, прыгай и строй из цветных блоков.

## Запуск

```sh
npm install
npm run dev
```

Для production:

```sh
npm run build
```

Проект подготовлен к оболочке Capacitor. Для генерации iOS-проекта на Mac с Xcode:

```sh
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

Подписанный IPA требует Xcode и подписи Apple. Это оригинальный sandbox-прототип, не клиент Roblox; многопользовательский режим пока не входит в проект.