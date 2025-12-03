# TODO List

## Критичные задачи (выполнено)
- ✅ Исправлена ошибка компиляции: дублирование categoryCount и totalPrice в email-templates-tournament.ts
- ✅ Добавлен горизонтальный скролл для таблиц в админке (/admin/logs и другие страницы)
- ✅ Добавлены переводы для действий в логах (login, logout, send_email, register) в en.json
- ✅ Добавлен User ID под email в колонке User в логах
- ✅ Для Entity Type - Pair - Update добавлена информация о затронутых пользователях (affectedUserIds, affectedUserEmails)
- ✅ Улучшена фильтрация логов: теперь фильтр по user ID или email показывает действия как сделанные пользователем, так и сделанные по отношению к нему
- ✅ Исправлена страница логов: добавлен горизонтальный скролл (min-w-[1600px]), кнопки копирования для User и Entity ID
- ✅ Добавлены переводы для Admin.logs.entityTypes.tournament_registration для всех языков
- ✅ Исправлена логика снятия выделения после удаления участника/пользователя
- ✅ Заменен window.confirm на ConfirmDialog в AdminUsersContent
- ✅ Исправлена логика клика на иконку "Турниры" в свернутом меню админки
- ✅ Добавлены переводы для Admin.users.confirmDeleteUser для всех языков
- ✅ Созданы страницы для всех подразделов настроек админки (courts, extras, pricing, holidays, policies, company, clubs, admins, terms)
- ✅ Создана страница not-found.tsx для админских настроек с ссылками на Settings и Dashboard
- ✅ Исправлена проблема с белым экраном при переходе на страницы настроек - теперь отображается корректная 404 страница

## Осталось выполнить

### 1. Переводы для остальных языков
- [x] Добавить переводы ResetPassword и ошибок логина для de, it, ca, nl, da, sv, no, ar, zh - ✅ Выполнено
- [x] Добавить переводы Admin.logs.actions.login, logout, send_email, register для всех языков (кроме en) - ✅ Выполнено
- [x] Добавить переводы Admin.logs.affectedUsers и Admin.logs.affectedEmails для всех языков - ✅ Выполнено
- [x] Добавить перевод Admin.settings.comingSoon для всех языков - ✅ Уже добавлен во всех языках

### 2. Функционал страниц настроек админки
- [ ] Реализовать функционал страницы Courts (/admin/settings/courts)
- [ ] Реализовать функционал страницы Extras (/admin/settings/extras)
- [ ] Реализовать функционал страницы Pricing (/admin/settings/pricing)
- [ ] Реализовать функционал страницы Holidays (/admin/settings/holidays)
- [ ] Реализовать функционал страницы Policies (/admin/settings/policies)
- [ ] Реализовать функционал страницы Company (/admin/settings/company)
- [ ] Реализовать функционал страницы Clubs (/admin/settings/clubs)
- [ ] Реализовать функционал страницы Manage Admins (/admin/settings/admins)
- [ ] Реализовать функционал страницы Terms (/admin/settings/terms)

### 3. Дополнительные улучшения (опционально)
- [x] Проверить работу горизонтального скролла на всех страницах админки - ✅ Проверено: AdminLogsContent (min-w-[1600px]), AdminUsersContent (min-w-[1200px]), TournamentParticipantsPage (min-w-[1400px])
- [x] Добавить подсказки/тултипы для Entity ID колонки - ✅ Добавлен тултип с объяснением Entity ID для всех 14 языков
- [ ] Оптимизировать производительность фильтрации логов при большом количестве записей
- [x] Улучшить отображение 404 страницы для админки - добавлена страница not-found.tsx с ссылками на Settings и Dashboard

