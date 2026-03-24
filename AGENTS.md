# AGENTS.md

## 作用范围

- 本文件对整个仓库生效。

## 核心原则

- 保持依赖边清晰、显式，并且便于分析。
- 任何非本地符号，都必须在使用它的文件中显式导入。
- 除非用户明确批准例外情况，否则不要使用隐式全局变量、自动导入、原型补丁或框架级全局注入。

## Vue 与 TypeScript 约定

- 在 Vue 单文件组件中，模板里使用到的所有辅助方法，都必须先在 `<script setup>` 中导入，再通过这个导入的绑定在模板里使用。
- 当同一个模块同时导出多种角色时，优先使用能表达职责的命名。比如：`i18nPlugin` 表示 Vue 插件实例，`i18n` 表示翻译辅助方法。
- 如果框架特性确实强制要求隐式依赖，尽量把例外范围控制到最小，并在代码注释或最终交付说明中明确指出。

## i18n 约定

- 保持 locale 标识为 `zh-CN` 和 `en-US`。
- 保持 locale message key 为中文扁平字符串。
- 不要重新引入 `app.title`、`home.featureRouting` 这类嵌套 key。
- 不要在组件中使用 `$t(...)`。
- 显式从 `src/i18n/index.ts` 导入 `i18n`，并使用 `i18n\`语言切换-标签\`` 这种 tagged template 调用方式。
- 当需要访问插件级 locale 状态或运行时 i18n 实例时，显式导入 `i18nPlugin`。
- 不要为 `vue-i18n` 启用 `globalInjection`。

## 验证要求

- 每次生成或修改代码后，先运行 `npm run sync:i18n:check`，检查是否引入了新增的 i18n 中文 key，并确认词表与 locale 是否需要同步。
- i18n 相关改动后，运行 `node scripts/check-i18n.mjs`。
- 在声明应用改动完成前，运行 `npm run build`。
