#!/bin/bash

# Скрипт для деплоя PadelO2 на FTP (Ukraine.com.ua)
# Использование: ./deploy-ftp.sh

echo "🚀 Начинаем деплой PadelO2 на FTP (Ukraine.com.ua)..."

# FTP данные
FTP_HOST="foldis00.ftp.tools"
FTP_USER="foldis00_padel"
FTP_PASS="pM6ziY9ozU"
FTP_DIR="/"  # Корневая директория на сервере

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Сборка проекта
echo -e "${YELLOW}📦 Собираем production build...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при сборке проекта!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Сборка завершена успешно!${NC}"

# 2. Проверка наличия lftp
if command -v lftp &> /dev/null; then
    echo -e "${YELLOW}📤 Загружаем файлы через lftp...${NC}"
    
    lftp -c "
    set ftp:ssl-allow no
    set ftp:passive-mode yes
    open -u $FTP_USER,$FTP_PASS $FTP_HOST
    cd $FTP_DIR
    
    echo 'Загрузка .next/...'
    mirror -R --delete --verbose --exclude-glob='.next/cache/*' .next/ .next/
    
    echo 'Загрузка public/...'
    mirror -R --delete --verbose public/ public/
    
    echo 'Загрузка messages/...'
    mirror -R --delete --verbose messages/ messages/
    
    echo 'Загрузка app/...'
    mirror -R --delete --verbose app/ app/
    
    echo 'Загрузка components/...'
    mirror -R --delete --verbose components/ components/
    
    echo 'Загрузка конфигурационных файлов...'
    put package.json
    put package-lock.json 2>/dev/null || true
    put next.config.mjs
    put i18n.ts
    put middleware.ts
    put tsconfig.json
    put tailwind.config.ts
    put postcss.config.js 2>/dev/null || true
    
    bye
    "
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Загрузка завершена успешно!${NC}"
    else
        echo -e "${RED}❌ Ошибка при загрузке файлов!${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  lftp не установлен. Используйте FileZilla или другой FTP клиент.${NC}"
    echo ""
    echo -e "${GREEN}📋 Файлы для загрузки:${NC}"
    echo "  ✅ .next/ (папка со сборкой, исключая .next/cache/)"
    echo "  ✅ public/ (статические файлы)"
    echo "  ✅ messages/ (переводы)"
    echo "  ✅ app/ (исходные файлы приложения)"
    echo "  ✅ components/ (компоненты React)"
    echo "  ✅ package.json"
    echo "  ✅ next.config.mjs"
    echo "  ✅ i18n.ts"
    echo "  ✅ middleware.ts"
    echo "  ✅ tsconfig.json"
    echo "  ✅ tailwind.config.ts"
    echo ""
    echo -e "${GREEN}❌ НЕ загружайте:${NC}"
    echo "  ❌ node_modules/ (установится на сервере)"
    echo "  ❌ .git/"
    echo "  ❌ .next/cache/ (можно не загружать)"
    echo ""
    echo -e "${GREEN}🔗 Данные для подключения:${NC}"
    echo "  Host: $FTP_HOST"
    echo "  User: $FTP_USER"
    echo "  Pass: $FTP_PASS"
    echo ""
    echo -e "${YELLOW}📝 Следующие шаги:${NC}"
    echo "  1. Загрузите файлы через FileZilla"
    echo "  2. В панели управления Ukraine.com.ua активируйте Node.js"
    echo "  3. Установите зависимости: npm install --production"
    echo "  4. Запустите приложение: npm start"
fi

echo ""
echo -e "${GREEN}✨ Готово!${NC}"
echo -e "${YELLOW}📚 Документация: https://www.ukraine.com.ua/wiki/hosting/nodejs/nextjs/${NC}"
echo ""
echo "Следующие шаги на сервере:"
echo "  1. Войдите в панель управления хостингом"
echo "  2. Активируйте Node.js приложение"
echo "  3. Выполните: npm install --production"
echo "  4. Запустите: npm start"
