# Explicit I18n Helper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all implicit `$t(...)` usage with an explicitly imported `i18n` tagged template helper while preserving the current translation behavior.

**Architecture:** Keep `vue-i18n` as the runtime engine, but expose two explicit exports from `src/i18n/index.ts`: `i18nPlugin` for Vue app/plugin wiring and `i18n` for translation lookups in components. Disable global injection so every translation dependency is visible from imports, which supports later dependency analysis.

**Tech Stack:** Vue 3, TypeScript, vue-i18n, Pinia, vue-router, Node.js

---

### Task 1: Tighten verification around explicit i18n usage

**Files:**
- Modify: `scripts/check-i18n.mjs`

- [ ] Step 1: Add failing checks that require `src/i18n/index.ts` to export `i18n`
- [ ] Step 2: Add failing checks that forbid `$t(` in component source files
- [ ] Step 3: Run `node scripts/check-i18n.mjs` and confirm it fails before implementation

### Task 2: Export explicit i18n helpers

**Files:**
- Modify: `src/i18n/index.ts`
- Modify: `src/main.ts`

- [ ] Step 1: Rename the Vue plugin export to `i18nPlugin`
- [ ] Step 2: Export an `i18n` tagged template helper that delegates to `i18nPlugin.global.t(...)`
- [ ] Step 3: Disable implicit `globalInjection`
- [ ] Step 4: Update app bootstrap code to use `i18nPlugin`

### Task 3: Migrate component usage to explicit imports

**Files:**
- Modify: `src/App.vue`
- Modify: `src/components/LanguageSwitcher.vue`
- Modify: `src/views/HomeView.vue`
- Modify: `src/views/AboutView.vue`

- [ ] Step 1: Import `i18n` explicitly in every component that renders translated content
- [ ] Step 2: Replace all `$t(...)` calls with `i18n` tagged template expressions
- [ ] Step 3: Use explicit `i18nPlugin` import where runtime locale state is needed

### Task 4: Verify the explicit-dependency migration

**Files:**
- Modify: `scripts/check-i18n.mjs`

- [ ] Step 1: Run `node scripts/check-i18n.mjs` and confirm it passes
- [ ] Step 2: Run `npm run build` and confirm the project still type-checks and bundles
- [ ] Step 3: Search `src/` for lingering `$t(` usage and confirm none remain