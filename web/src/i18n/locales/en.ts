export const en = {
  "language.option.english": "English",
  "language.option.russian": "Russian",
  "language.switcherLabel": "Change language",
  "language.short.english": "EN",
  "language.short.russian": "RU",
  "theme.modeLight": "Light mode",
  "theme.modeDark": "Dark mode",
  "theme.switchToLight": "Switch to light theme",
  "theme.switchToDark": "Switch to dark theme",
  "theme.light": "Light",
  "theme.dark": "Dark",
  "onboarding.title": "Welcome",
  "onboarding.subtitle": "Select your Vault folder",
  "onboarding.currentFolder": "Current folder",
  "onboarding.noFolder": "No folder selected",
  "onboarding.folderHint":
    "Your recipes, products, days and shopping list will be stored as Markdown/YAML files inside this folder. You can sync it later via GitHub or Drive.",
  "onboarding.chooseExisting": "Choose existing folder",
  "onboarding.createVault": "Create new Vault",
  "onboarding.remember": "Remember this folder on this device",
  "onboarding.howVaultWorks": "How Vault works",
  "onboarding.status.restorePermission":
    "We need permission to access the remembered folder. Please select it again.",
  "onboarding.status.reconnected": "Reconnected to “{{folder}}”. Vault files will sync here.",
  "onboarding.status.restoreError":
    "We couldn't restore the previously selected folder. Please choose it again.",
  "onboarding.status.unsupported": "Your browser does not support selecting folders yet.",
  "onboarding.status.permissionDenied": "We were not granted permission to use that folder.",
  "onboarding.status.connected": "Connected to “{{folder}}”. Vault files will sync here.",
  "onboarding.status.connectedPending":
    "Folder connected. We will finalize setup after confirming permissions.",
  "onboarding.status.rememberFailed":
    "We connected but could not remember that folder. Try enabling storage access.",
  "onboarding.status.accessError":
    "We could not access that folder. Please try again or choose another.",
  "onboarding.status.createInfo":
    "A fresh /vault structure will be generated once you confirm the destination folder.",
  "onboarding.status.vaultInfo":
    "Vault is a folder that contains recipes, products, days, shopping, and user settings in Markdown/YAML files."
} as const;

export type TranslationKey = keyof typeof en;
