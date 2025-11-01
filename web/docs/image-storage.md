# Система хранения изображений рецептов

## Обзор

Приложение использует файловую систему для хранения изображений рецептов, что обеспечивает:
- Оптимальную производительность
- Меньший размер файлов рецептов
- Возможность повторного использования изображений

## Структура хранения

```
vault/
├── recipes/
│   ├── recipe-1.md
│   └── recipe-2.md
└── images/
    ├── salad-recipe-1699123456.jpg
    └── protein-smoothie-1699123789.png
```

## Как это работает

### 1. Загрузка изображения
- Пользователь выбирает изображение в форме создания/редактирования рецепта
- Изображение сохраняется как файл в папке `images/`
- Имя файла: `{recipe-slug}-{timestamp}.{extension}`

### 2. Хранение ссылки
- В рецепте сохраняется относительный путь: `images/recipe-name-123456.jpg`
- Вместо base64 строки (экономия ~33% места)

### 3. Отображение изображения
- При загрузке рецепта изображение читается из файловой системы
- Создается blob URL для отображения в браузере

## API функции

### `saveImageToVault(vaultHandle, file, recipeSlug)`
Сохраняет файл изображения в папку images и возвращает относительный путь.

### `getImageFromVault(vaultHandle, imagePath)`
Загружает изображение из файловой системы и возвращает blob URL.

### `deleteImageFromVault(vaultHandle, imagePath)`
Удаляет изображение из файловой системы.

### `cleanupUnusedImages(vaultHandle, usedImagePaths)`
Удаляет неиспользуемые изображения (не связанные ни с одним рецептом).

## Миграция

Для миграции существующих рецептов с base64 изображениями используйте:

```typescript
import { migrateAllRecipeImages } from '@/utils/imageMigration';

const result = await migrateAllRecipeImages(vaultHandle);
console.log(`Migrated ${result.migrated} of ${result.total} recipes`);
```

## Поддерживаемые форматы

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

## Ограничения

- Максимальный размер файла: определяется браузером (обычно ~100MB)
- Изображения хранятся локально в выбранной папке Vault
- Требуется поддержка File System Access API в браузере