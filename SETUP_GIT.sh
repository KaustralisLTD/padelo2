#!/bin/bash

# Скрипт для настройки Git и загрузки на GitHub

echo "🚀 Настройка Git репозитория..."

cd "/Users/spilberg/AI Projects/PadelO2"

# 1. Инициализация Git
echo "📦 Инициализация Git..."
git init

# 2. Добавление файлов
echo "➕ Добавление файлов..."
git add .

# 3. Первый коммит
echo "💾 Создание первого коммита..."
git commit -m "Initial commit: PadelO2 website"

echo ""
echo "✅ Git репозиторий готов!"
echo ""
echo "📋 Следующие шаги:"
echo ""
echo "1. Создайте репозиторий на GitHub:"
echo "   - Зайдите на https://github.com"
echo "   - Нажмите '+' → 'New repository'"
echo "   - Название: padelo2"
echo "   - НЕ добавляйте README, .gitignore, License"
echo "   - Нажмите 'Create repository'"
echo ""
echo "2. Подключите к GitHub (замените YOUR_USERNAME):"
echo "   git remote add origin https://github.com/YOUR_USERNAME/padelo2.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "3. В Vercel Dashboard:"
echo "   - Нажмите 'Add New Project'"
echo "   - Выберите ваш репозиторий padelo2"
echo "   - Нажмите 'Import' и 'Deploy'"
echo ""

