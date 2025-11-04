# Smart Food Plan – Web Prototype

## Overview

Smart Food Plan is an offline-first nutrition assistant built with React and TypeScript. Users connect a local “Vault” directory that stores Markdown- and YAML-based data, keeping recipes, products, and meal plans portable across platforms and devices.

The current prototype focuses on the full navigation shell, day planning workflows, and the infrastructure needed for vault persistence, internationalisation, and consistent design tokens.

## Feature Highlights

- **Hash-based navigation shell** – `AppShell` renders desktop and mobile navigation for every route and keeps the current section in sync with the URL hash, so refreshing preserves the active screen.【F:web/src/App.tsx†L1-L74】【F:web/src/routes/navigation.ts†L1-L79】
- **Offline vault access** – File System Access handles are cached in IndexedDB; helper modules read and write structured Markdown/YAML records for days, recipes, products, shopping lists, and user settings.【F:web/src/utils/vaultStorage.ts†L1-L142】【F:web/src/utils/vaultDays.ts†L1-L45】
- **Multi-language interface** – A lightweight i18n layer ships English and Russian strings, remembers the selected language in `localStorage`, and exposes toggles inside the app chrome.【F:web/src/i18n/I18nProvider.tsx†L1-L86】【F:web/src/components/AppShell.tsx†L1-L87】
- **Theme system** – Light and dark themes are defined in a single configuration and applied at runtime with CSS custom properties, matching the visual guidance described in `architecture.md`.【F:web/src/theme/ThemeProvider.tsx†L1-L86】【F:web/src/theme/theme.ts†L1-L59】
- **Reusable UI primitives** – Buttons, cards, forms, and action icons are styled via CSS Modules to ensure consistent spacing, radii, and typography across screens.【F:web/src/components/Button.tsx†L1-L61】【F:web/src/components/Card.tsx†L1-L33】

## Screens in the Prototype

All screens live under `web/src/screens/` and are wired into the hash router:

- **Meal plan day** – load, edit, and persist a single day plan, including inline item editing and weight tracking.【F:web/src/screens/MealPlanDayScreen.tsx†L1-L133】
- **Recipe flows** – view the recipe library, add recipes, attach them to a day plan, and inspect recipe details.【F:web/src/screens/RecipesListScreen.tsx†L1-L120】【F:web/src/screens/AddRecipeToDayScreen.tsx†L1-L120】
- **Product flows** – browse stored products, add a new product, and inspect individual product metadata.【F:web/src/screens/ProductLibraryScreen.tsx†L1-L127】【F:web/src/screens/ProductScreen.tsx†L1-L130】
- **Shopping list & statistics** – placeholder analytical and list experiences that will be backed by vault data in future milestones.【F:web/src/screens/ShoppingListScreen.tsx†L1-L105】【F:web/src/screens/StatisticsScreen.tsx†L1-L108】
- **Settings & onboarding** – configure vault access, toggle languages and themes, and connect storage during first-run onboarding.【F:web/src/screens/SettingsScreen.tsx†L1-L137】【F:web/src/screens/OnboardingVaultScreen.tsx†L1-L153】

## Directory Structure

```
smart-food-plan/
├── web/
│   ├── src/
│   │   ├── components/      # Buttons, cards, toggles, layout shell
│   │   ├── constants/       # Storage keys and shared constants
│   │   ├── i18n/            # Locale dictionaries and provider
│   │   ├── routes/          # Hash-based navigation helpers
│   │   ├── screens/         # Feature screens composed of primitives
│   │   ├── theme/           # Theme tokens and runtime provider
│   │   └── utils/           # File-system helpers and Markdown tools
│   ├── public/              # Static assets served by Vite
│   └── docs/                # In-depth design and data notes
├── architecture.md          # Product & visual direction
└── DEPLOY.md                # GitHub Pages deployment guide
```

## Data & Vault Storage

- The File System Access API prompts the user to pick a vault directory during onboarding. Handles are stored in IndexedDB so returning users resume automatically if they opted in to “remember this folder”.【F:web/src/screens/OnboardingVaultScreen.tsx†L1-L153】【F:web/src/utils/vaultStorage.ts†L51-L136】
- Markdown and YAML documents keep recipes (`vaultRecipes.ts`), products (`vaultProducts.ts`), meal plans (`vaultDays.ts`), shopping lists (`vaultShopping.ts`), and user preferences (`vaultUser.ts`) in human-readable files.
- Image files are saved separately under `vault/images/`; see `web/docs/image-storage.md` for the storage layout and helper API reference.

## Local Development

```bash
cd web
npm install
npm run dev
```

The app opens on `http://localhost:5173`. Use the language and theme toggles in the top bar to test runtime switches.【F:web/src/components/AppShell.tsx†L37-L87】

## Production Build & Preview

```bash
npm run build
npm run preview
```

`npm run build` runs the TypeScript compiler before triggering the Vite production build. `npm run preview` serves the generated bundle from `web/dist` so you can validate the output locally.【F:web/package.json†L1-L24】

## Additional Documentation

- `architecture.md` – visual direction, tone, and interaction guidelines for the product.
- `DEPLOY.md` – step-by-step instructions for deploying the web client to GitHub Pages.
- `web/docs/image-storage.md` – reference for vault image management helpers.
