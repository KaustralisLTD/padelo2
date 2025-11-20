# Инструкция по настройке OAuth (Google и Apple)

## Что такое OAuth и зачем это нужно?

OAuth — это протокол авторизации, который позволяет пользователям входить на ваш сайт используя свои аккаунты Google или Apple, без необходимости создавать отдельный аккаунт и запоминать пароль.

**Преимущества:**
- Удобство для пользователей (не нужно создавать новый аккаунт)
- Безопасность (пароли хранятся у Google/Apple, а не у вас)
- Быстрая регистрация (один клик вместо заполнения формы)
- Меньше отказов при регистрации

---

## Настройка Google OAuth

### Шаг 1: Создание проекта в Google Cloud Console

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Войдите в свой Google аккаунт
3. Нажмите на выпадающий список проектов вверху и выберите **"New Project"** (Новый проект)
4. Введите название проекта (например, "PadelO2") и нажмите **"Create"**

### Шаг 2: Включение Google+ API

1. В меню слева выберите **"APIs & Services"** → **"Library"**
2. Найдите **"Google+ API"** или **"Google Identity Services API"**
3. Нажмите **"Enable"** (Включить)

### Шаг 3: Создание OAuth 2.0 Client ID

1. Перейдите в **"APIs & Services"** → **"Credentials"**
2. Нажмите **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Если появится запрос на настройку OAuth consent screen:
   - Выберите **"External"** (Внешний) и нажмите **"Create"**
   - Заполните обязательные поля:
     - **App name**: PadelO2
     - **User support email**: ваш email
     - **Developer contact information**: ваш email
   - Нажмите **"Save and Continue"**
   - На шаге "Scopes" нажмите **"Save and Continue"**
   - На шаге "Test users" (если приложение в режиме тестирования) добавьте тестовые email, затем **"Save and Continue"**
   - Нажмите **"Back to Dashboard"**

4. Вернитесь в **"Credentials"** → **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. Выберите **Application type**: **"Web application"**
6. Введите **Name**: "PadelO2 Web Client"
7. В разделе **"Authorized redirect URIs"** добавьте:
   ```
   https://padelo2.com/api/auth/oauth/google/callback
   http://localhost:3000/api/auth/oauth/google/callback  (для разработки)
   ```
8. Нажмите **"Create"**
9. **Скопируйте Client ID и Client Secret** — они понадобятся для .env файла

### Шаг 4: Добавление в .env файл

Откройте файл `.env.local` (или `.env`) в корне проекта и добавьте:

```env
GOOGLE_CLIENT_ID=ваш_client_id_здесь
GOOGLE_CLIENT_SECRET=ваш_client_secret_здесь
GOOGLE_REDIRECT_URI=https://padelo2.com/api/auth/oauth/google/callback
```

**Примечание:** `GOOGLE_REDIRECT_URI` опционален, так как система использует значение по умолчанию, но лучше указать явно.

---

## Настройка Apple OAuth (Sign in with Apple)

### Шаг 1: Регистрация в Apple Developer Program

1. Перейдите на [Apple Developer](https://developer.apple.com/)
2. Войдите в свой Apple ID (нужен платный аккаунт Developer Program - $99/год)
3. Если у вас нет аккаунта, зарегистрируйтесь и оплатите подписку

### Шаг 2: Создание App ID

1. Перейдите в **"Certificates, Identifiers & Profiles"**
2. Выберите **"Identifiers"** → **"+"** (добавить)
3. Выберите **"App IDs"** → **"Continue"**
4. Выберите **"App"** → **"Continue"**
5. Заполните:
   - **Description**: PadelO2
   - **Bundle ID**: com.padelo2.app (или ваш домен в обратном порядке)
6. Прокрутите вниз и включите **"Sign In with Apple"**
7. Нажмите **"Continue"** → **"Register"**

### Шаг 3: Создание Service ID

1. В **"Identifiers"** выберите **"Services IDs"** → **"+"**
2. Заполните:
   - **Description**: PadelO2 Web
   - **Identifier**: com.padelo2.web (или ваш уникальный идентификатор)
3. Нажмите **"Continue"** → **"Register"**
4. Откройте созданный Service ID и включите **"Sign In with Apple"**
5. Нажмите **"Configure"** рядом с "Sign In with Apple"
6. В разделе **"Primary App ID"** выберите созданный ранее App ID
7. В разделе **"Website URLs"** добавьте:
   - **Domains and Subdomains**: `padelo2.com`
   - **Return URLs**: 
     ```
     https://padelo2.com/api/auth/oauth/apple/callback
     http://localhost:3000/api/auth/oauth/apple/callback  (для разработки)
     ```
8. Нажмите **"Save"** → **"Continue"** → **"Save"**

### Шаг 4: Создание Key для Sign in with Apple

1. Перейдите в **"Keys"** → **"+"** (добавить)
2. Заполните:
   - **Key Name**: PadelO2 Sign In Key
   - Включите **"Sign In with Apple"**
3. Нажмите **"Configure"** рядом с "Sign In with Apple"
4. Выберите созданный ранее **Primary App ID**
5. Нажмите **"Save"** → **"Continue"** → **"Register"**
6. **ВАЖНО:** Скачайте файл ключа (.p8) — он доступен только один раз!
7. Запишите **Key ID** — он отображается на странице

### Шаг 5: Получение Team ID

1. В правом верхнем углу Apple Developer нажмите на свое имя
2. В разделе **"Membership"** найдите **Team ID** (10 символов)
3. Скопируйте его

### Шаг 6: Подготовка Private Key

1. Откройте скачанный файл `.p8` в текстовом редакторе
2. Скопируйте содержимое (включая строки `-----BEGIN PRIVATE KEY-----` и `-----END PRIVATE KEY-----`)
3. Это ваш `APPLE_PRIVATE_KEY`

### Шаг 7: Получение Client ID

- **APPLE_CLIENT_ID** = ваш **Service ID** (который вы создали в шаге 3, например: `com.padelo2.web`)

### Шаг 8: Добавление в .env файл

Откройте файл `.env.local` (или `.env`) и добавьте:

```env
APPLE_CLIENT_ID=com.padelo2.web
APPLE_TEAM_ID=ваш_team_id_здесь
APPLE_KEY_ID=ваш_key_id_здесь
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
ваш_приватный_ключ_здесь
-----END PRIVATE KEY-----"
APPLE_REDIRECT_URI=https://padelo2.com/api/auth/oauth/apple/callback
```

**ВАЖНО для APPLE_PRIVATE_KEY:**
- Ключ должен быть в кавычках
- Сохраните все переносы строк
- Можно использовать формат с `\n`:
  ```env
  APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nваш_ключ\n-----END PRIVATE KEY-----"
  ```

---

## Пример полного .env файла

```env
# Database
DATABASE_HOST=your_host
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=your_database

# Site URL
NEXT_PUBLIC_SITE_URL=https://padelo2.com

# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URI=https://padelo2.com/api/auth/oauth/google/callback

# Apple OAuth
APPLE_CLIENT_ID=com.padelo2.web
APPLE_TEAM_ID=ABCD123456
APPLE_KEY_ID=XYZ789ABC
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
-----END PRIVATE KEY-----"
APPLE_REDIRECT_URI=https://padelo2.com/api/auth/oauth/apple/callback
```

---

## Проверка настройки

После добавления всех переменных:

1. Перезапустите сервер разработки:
   ```bash
   npm run dev
   ```

2. Откройте страницу входа: `http://localhost:3000/login`

3. Проверьте, что кнопки "Google" и "Apple" отображаются

4. Попробуйте нажать на кнопку Google — должно произойти перенаправление на Google

5. После авторизации вы должны вернуться на сайт и автоматически войти

---

## Режим разработки vs Продакшн

### Для разработки (localhost):
- В Google Console добавьте `http://localhost:3000/api/auth/oauth/google/callback` в Authorized redirect URIs
- В Apple Service ID добавьте `http://localhost:3000/api/auth/oauth/apple/callback` в Return URLs

### Для продакшна:
- Используйте реальный домен: `https://padelo2.com/api/auth/oauth/google/callback`
- Убедитесь, что домен добавлен в настройки обоих провайдеров

---

## Частые проблемы и решения

### Google OAuth:
- **Ошибка "redirect_uri_mismatch"**: Проверьте, что URI в Google Console точно совпадает с тем, что используется в коде
- **Ошибка "access_denied"**: Пользователь отменил авторизацию

### Apple OAuth:
- **Ошибка "invalid_client"**: Проверьте APPLE_CLIENT_ID (должен быть Service ID, а не App ID)
- **Ошибка "invalid_grant"**: Проверьте формат APPLE_PRIVATE_KEY (должен быть с переносами строк)
- **Ошибка подписи JWT**: Убедитесь, что Key ID и Team ID правильные

---

## Безопасность

⚠️ **ВАЖНО:**
- Никогда не коммитьте `.env` файл в Git
- Добавьте `.env.local` в `.gitignore`
- Храните секретные ключи в безопасном месте
- В продакшне используйте переменные окружения хостинга (Vercel, Railway и т.д.)

---

## Дополнительные ресурсы

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Apple Sign In Documentation](https://developer.apple.com/sign-in-with-apple/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

