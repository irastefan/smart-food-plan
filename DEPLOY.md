# Деплой на GitHub Pages

## Автоматический деплой

Проект настроен для автоматического деплоя на GitHub Pages при пуше в ветку `main`.

### Настройка репозитория

1. Перейдите в Settings вашего репозитория на GitHub
2. В разделе "Pages" выберите:
   - Source: "GitHub Actions"
3. Сохраните настройки

### Процесс деплоя

1. Сделайте изменения в коде
2. Закоммитьте и запушьте в ветку `main`:
   ```bash
   git add .
   git commit -m "Update app"
   git push origin main
   ```
3. GitHub Actions автоматически соберет и задеплоит приложение

### Ручной деплой (альтернативный способ)

Если нужно задеплоить вручную:

```bash
cd web
npm run deploy
```

### URL приложения

После успешного деплоя приложение будет доступно по адресу:
`https://[ваш-username].github.io/smart-food-plan/`

### Структура проекта

- Основной код находится в папке `web/`
- GitHub Actions workflow: `.github/workflows/deploy.yml`
- Собранные файлы попадают в `web/dist/`