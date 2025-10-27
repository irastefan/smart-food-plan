import type { TranslationKey } from "./en";

export const ru = {
  "language.option.english": "Английский",
  "language.option.russian": "Русский",
  "language.switcherLabel": "Сменить язык",
  "language.short.english": "EN",
  "language.short.russian": "RU",
  "theme.modeLight": "Светлая тема",
  "theme.modeDark": "Тёмная тема",
  "theme.switchToLight": "Переключить на светлую тему",
  "theme.switchToDark": "Переключить на тёмную тему",
  "theme.light": "Светлая",
  "theme.dark": "Тёмная",
  "onboarding.title": "Добро пожаловать",
  "onboarding.subtitle": "Выберите папку Vault",
  "onboarding.currentFolder": "Текущая папка",
  "onboarding.noFolder": "Папка не выбрана",
  "onboarding.folderHint":
    "Ваши рецепты, продукты, дни и список покупок будут храниться в виде файлов Markdown/YAML внутри этой папки. Позже вы сможете синхронизировать её через GitHub или Drive.",
  "onboarding.chooseExisting": "Выбрать существующую папку",
  "onboarding.createVault": "Создать новый Vault",
  "onboarding.remember": "Запомнить эту папку на этом устройстве",
  "onboarding.howVaultWorks": "Как работает Vault",
  "onboarding.status.restorePermission":
    "Нужно разрешение на доступ к сохранённой папке. Пожалуйста, выберите её снова.",
  "onboarding.status.reconnected": "Снова подключено к «{{folder}}». Файлы Vault будут синхронизироваться здесь.",
  "onboarding.status.restoreError":
    "Не удалось восстановить ранее выбранную папку. Пожалуйста, выберите её снова.",
  "onboarding.status.unsupported": "Ваш браузер пока не поддерживает выбор папок.",
  "onboarding.status.permissionDenied": "Мы не получили разрешение на использование этой папки.",
  "onboarding.status.connected": "Подключено к «{{folder}}». Файлы Vault будут синхронизироваться здесь.",
  "onboarding.status.connectedPending":
    "Папка подключена. Мы завершим настройку после подтверждения разрешений.",
  "onboarding.status.rememberFailed":
    "Мы подключились, но не смогли запомнить эту папку. Попробуйте включить доступ к хранилищу.",
  "onboarding.status.accessError":
    "Не удалось получить доступ к этой папке. Попробуйте ещё раз или выберите другую.",
  "onboarding.status.createInfo":
    "Структура /vault будет создана после подтверждения папки назначения.",
  "onboarding.status.vaultInfo":
    "Vault — это папка с рецептами, продуктами, днями, покупками и настройками пользователя в файлах Markdown/YAML."
} satisfies Record<TranslationKey, string>;
