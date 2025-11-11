# 🚀 Быстрый деплой на Ukraine.com.ua

## Шаг 1: Сборка проекта
```bash
npm run build
```

## Шаг 2: Загрузка на FTP

### Автоматически (если установлен lftp):
```bash
npm run deploy:ftp
```

### Вручную через FileZilla:
1. Подключитесь:
   - Host: `foldis00.ftp.tools`
   - User: `foldis00_padel`
   - Pass: `pM6ziY9ozU`

2. Загрузите:
   - ✅ `.next/` (без `.next/cache/`)
   - ✅ `public/`
   - ✅ `messages/`
   - ✅ `app/`
   - ✅ `components/`
   - ✅ `package.json`, `next.config.mjs`, `i18n.ts`, `middleware.ts`, `tsconfig.json`, `tailwind.config.ts`

## Шаг 3: Настройка на сервере

1. **В панели управления Ukraine.com.ua:**
   - Перейдите в раздел "Node.js"
   - Создайте новое Node.js приложение
   - Укажите версию Node.js 18+ или 20+

2. **Установите зависимости:**
   ```bash
   npm install --production
   ```

3. **Запустите приложение:**
   ```bash
   npm start
   ```

## 📚 Полная инструкция:
См. `DEPLOY_FTP.md`

## 🔗 Документация хостинга:
- [Node.js на Ukraine.com.ua](https://www.ukraine.com.ua/wiki/hosting/nodejs/)
- [Next.js на Ukraine.com.ua](https://www.ukraine.com.ua/wiki/hosting/nodejs/nextjs/)

