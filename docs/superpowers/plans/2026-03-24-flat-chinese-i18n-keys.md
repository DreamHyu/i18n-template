# Flat Chinese I18n Keys Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert all i18n usage to flat Chinese keys while keeping `zh-CN` and `en-US` locale bundles and preserving the current runtime behavior.

**Architecture:** Introduce a lightweight repository-local verification script that asserts locale bundle shape and expected key usage, then migrate both locale files and every `$t(...)` call to the new flat Chinese keys. Keep locale switching, persistence, and fallback behavior unchanged.

**Tech Stack:** Vue 3, TypeScript, vue-i18n, Pinia, vue-router, Node.js

---

### Task 1: Add a failing i18n verification script

**Files:**
- Create: `scripts/check-i18n.mjs`
- Modify: `package.json`

- [ ] Step 1: Write the verification script for the target flat-key behavior
- [ ] Step 2: Run `node scripts/check-i18n.mjs` and confirm it fails against the current nested keys
- [ ] Step 3: Add an npm script for the verification command

### Task 2: Flatten locale bundles and rename keys

**Files:**
- Modify: `src/i18n/locales/zh-CN.ts`
- Modify: `src/i18n/locales/en-US.ts`

- [ ] Step 1: Replace nested objects with flat Chinese-key objects in both locale files
- [ ] Step 2: Keep both locale files structurally aligned except for the intentional fallback-only Chinese key
- [ ] Step 3: Re-run `node scripts/check-i18n.mjs` and confirm locale-shape assertions pass

### Task 3: Update runtime consumers to use the new keys

**Files:**
- Modify: `src/App.vue`
- Modify: `src/components/LanguageSwitcher.vue`
- Modify: `src/views/HomeView.vue`
- Modify: `src/views/AboutView.vue`

- [ ] Step 1: Replace every old dotted translation key with the new flat Chinese key
- [ ] Step 2: Keep the existing locale switcher, page layout, and fallback demonstration behavior intact
- [ ] Step 3: Re-run `node scripts/check-i18n.mjs` and confirm key-usage assertions pass

### Task 4: Verify the migration end to end

**Files:**
- Modify: `package.json`

- [ ] Step 1: Run `npm run build` and confirm the project type-checks and bundles successfully
- [ ] Step 2: Search for stale runtime keys like `app.` / `home.` / `about.` / `language.` and confirm they are gone from `src/`
- [ ] Step 3: Review the final diff for accidental behavior changes outside i18n
