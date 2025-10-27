# Smart Food Plan – Web Prototype

## Overview

Smart Food Plan is a React + TypeScript web application that acts as the groundwork for an offline-first nutrition tracker. Data will live inside a user-selected “Vault” folder using Markdown/YAML files so that information stays portable across platforms.

This repository currently contains the initial onboarding flow and infrastructure for theming and vault folder persistence.

## Current Features

- **Vite + React + TypeScript setup** with module aliasing and sensible build scripts (see `web/package.json`).
- **Dark / Light design system** using a single source of truth for palette variables (`web/src/theme/theme.ts`) and runtime theme switching via `ThemeProvider`.
- **Reusable UI primitives** (`Button`, `Card`, `Checkbox`, `ThemeToggle`) styled to match the Forest Mint & Morning Mint concepts.
- **Onboarding Vault screen** (`web/src/screens/OnboardingVaultScreen.tsx`) that guides new users through selecting a vault directory.
- **Folder persistence** backed by IndexedDB (`web/src/utils/vaultStorage.ts`) so the chosen directory is restored automatically when “Remember this folder” is enabled.

## Tech Stack

- React 18 with TypeScript
- Vite 5 for development and builds
- CSS Modules for component styling
- IndexedDB for remembering the vault directory

## Local Development

```bash
cd web
npm install
npm run dev
```

The app opens on `http://localhost:5173`. Use the theme toggle in the upper-right corner to switch between dark and light palettes.

## Production Build

```bash
npm run build
npm run preview
```

`npm run build` runs TypeScript checks followed by a Vite production build. `npm run preview` starts a local server for inspecting the generated assets under `web/dist`.

## Next Steps

- Generate the full `/vault` folder structure when creating a new vault.
- Build the remaining screens (meal plan dashboard, recipes, products, etc.) using the shared theme tokens.
- Add localization scaffolding per the architecture doc (ru/en).
- Design persistence APIs for syncing with GitHub/Drive once desktop PWA capabilities are ready.

---

For detailed product requirements and architecture notes, refer to `architecture.md`.
