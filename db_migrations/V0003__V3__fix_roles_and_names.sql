-- Исправляем роли: Panteelev и Teh — прорабы, Mostovoi — решит сам пользователь
UPDATE t_p62154592_foreman_app_manageme.users SET role = 'foreman' WHERE login = 'Panteelev';
UPDATE t_p62154592_foreman_app_manageme.users SET role = 'foreman' WHERE login = 'Teh';

-- Убираем "(Управленец)" из имён прорабов
UPDATE t_p62154592_foreman_app_manageme.users SET full_name = 'Пантелеев Сергей' WHERE login = 'Panteelev';
UPDATE t_p62154592_foreman_app_manageme.users SET full_name = 'Тех' WHERE login = 'Teh';
UPDATE t_p62154592_foreman_app_manageme.users SET full_name = 'Мастовой Андрей' WHERE login = 'Mostovoi';
UPDATE t_p62154592_foreman_app_manageme.users SET full_name = 'Масалов Николай' WHERE login = 'MASALOV';
