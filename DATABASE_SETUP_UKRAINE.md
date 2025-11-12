# 🗄️ Настройка базы данных на хостинге Ukraine.com.ua

## 📋 Параметры для создания БД

### 1. Создание базы данных в панели управления

В панели управления хостинга Ukraine.com.ua создайте базу данных со следующими параметрами:

#### Рекомендуемые параметры:

**Имя базы данных:**
```
foldis00_padelo2
```
(или любое другое имя, которое разрешает ваш хостинг)

**Тип базы данных:**
```
MySQL 8.0+ (рекомендуется)
```
или
```
MariaDB 10.6+ (альтернатива)
```

**Кодировка:**
```
utf8mb4_unicode_ci
```
(важно для поддержки эмодзи и всех языков, включая арабский)

**Размер:**
- Начните с **100 MB** (достаточно для начала)
- Можно увеличить позже при необходимости

---

## 🔐 Доступы для подключения

После создания БД вам будут предоставлены следующие данные:

### Пример структуры данных:

```
Host (хост):     localhost
                 или
                 foldis00.mysql.tools
                 или
                 mysql.foldis00.ua
                 
Database (БД):   foldis00_padelo2

Username (пользователь): foldis00_padelo2

Password (пароль): [сгенерированный хостингом или ваш]
```

**⚠️ ВАЖНО:** Запишите эти данные - они понадобятся для подключения!

---

## 📊 Структура таблиц

После создания БД нужно создать следующие таблицы:

### Таблица: `tournament_registrations`

```sql
CREATE TABLE `tournament_registrations` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `token` VARCHAR(64) NOT NULL UNIQUE,
  `tournament_id` INT(11) NOT NULL,
  `tournament_name` VARCHAR(255) NOT NULL,
  `locale` VARCHAR(10) NOT NULL DEFAULT 'en',
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `telegram` VARCHAR(100) DEFAULT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `categories` JSON NOT NULL,
  `tshirt_size` VARCHAR(10) NOT NULL,
  `message` TEXT DEFAULT NULL,
  `partner_name` VARCHAR(100) DEFAULT NULL,
  `partner_email` VARCHAR(255) DEFAULT NULL,
  `partner_phone` VARCHAR(50) DEFAULT NULL,
  `partner_tshirt_size` VARCHAR(10) DEFAULT NULL,
  `partner_photo_name` VARCHAR(255) DEFAULT NULL,
  `partner_photo_data` LONGTEXT DEFAULT NULL,
  `confirmed` BOOLEAN DEFAULT FALSE,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `confirmed_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_token` (`token`),
  INDEX `idx_email` (`email`),
  INDEX `idx_tournament` (`tournament_id`),
  INDEX `idx_confirmed` (`confirmed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🔧 Настройка переменных окружения

После получения данных БД, создайте файл `.env.local` в корне проекта:

```bash
# Database Configuration
DATABASE_HOST=localhost
DATABASE_NAME=foldis00_padelo2
DATABASE_USER=foldis00_padelo2
DATABASE_PASSWORD=6p^XZbu!34

# Site URL
NEXT_PUBLIC_SITE_URL=https://padelo2.com

# Email Configuration (для отправки писем)
# Выберите один из вариантов:

# Вариант 1: Resend (рекомендуется)
RESEND_API_KEY=re_MoaNSNHY_Fs2h8YSh8DyG9odc4b3iQ1Nn

# Вариант 2: SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx

# Вариант 3: SMTP (если хостинг предоставляет)
SMTP_HOST=smtp.ukraine.com.ua
SMTP_PORT=587
SMTP_USER=noreply@padelo2.com
SMTP_PASSWORD=ваш_пароль_smtp
SMTP_FROM=noreply@padelo2.com
```

---

## 📝 Что нужно предоставить мне для настройки:

1. **Host (хост БД):** `_________________`
2. **Database name (имя БД):** `_________________`
3. **Username (пользователь):** `_________________`
4. **Password (пароль):** `_________________`
5. **Port (порт, обычно 3306):** `_________________`

После получения этих данных я:
- ✅ Настрою подключение к БД
- ✅ Обновлю код для работы с MySQL
- ✅ Настрою отправку email
- ✅ Протестирую регистрацию на турниры

---

## 🚀 Следующие шаги:

1. **Создайте БД** в панели управления хостинга
2. **Запишите данные доступа**
3. **Отправьте мне эти данные**
4. Я настрою всё для production

---

## ⚠️ Безопасность:

- **НЕ коммитьте** `.env.local` в Git
- Используйте **сильные пароли** для БД
- Ограничьте доступ к БД только с вашего сервера
- Регулярно делайте **бэкапы БД**

