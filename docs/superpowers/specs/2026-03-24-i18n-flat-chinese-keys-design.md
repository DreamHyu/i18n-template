# i18n Flat Chinese Keys Design

**Context**

This project currently uses nested locale objects such as `app.title` and `home.featureRouting`.
The requested change keeps the existing `zh-CN` and `en-US` locale interfaces, but replaces all i18n keys with Chinese text and flattens every locale bundle into a single-level object.

**Goals**

- Keep locale identifiers as `zh-CN` and `en-US`
- Replace all nested translation keys with flat Chinese keys
- Keep the current runtime behavior for locale switching, persistence, routing, and fallback
- Preserve the About page fallback demonstration, with the key itself also expressed in Chinese

**Non-Goals**

- Removing `vue-i18n`
- Converting the project to Chinese-only locale support
- Refactoring routing, Pinia, or app structure beyond what this migration needs

**Design**

The locale bundles in `src/i18n/locales/zh-CN.ts` and `src/i18n/locales/en-US.ts` will become flat objects where each property key is a human-readable Chinese string. Keys will no longer be grouped under `app`, `home`, `about`, or `language`.

Representative mappings:

- `app.eyebrow` -> `应用眉标`
- `app.title` -> `应用标题`
- `nav.home` -> `导航-首页`
- `home.featureRouting` -> `首页功能-路由一致性`
- `about.fallbackTitle` -> `关于页-回退标题`

The UI components and views will update every `$t(...)` call to the new flat Chinese keys. The fallback-only line on the About page will stay missing from `en-US` so the runtime fallback behavior continues to be visible.

**Verification**

- Search the codebase to ensure old dotted keys such as `app.` / `home.` / `about.` / `language.` are removed from runtime usage
- Run the production build to verify the app still type-checks and bundles correctly
