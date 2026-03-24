<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { i18n, i18nPlugin } from '../i18n'
import { useAppStore } from '../stores/app'

const appStore = useAppStore()
const { locale } = storeToRefs(appStore)

const structureSnippet = `src/
  i18n/
    index.ts
    locales/
      zh-CN.ts
      en-US.ts
  router/index.ts
  stores/
    app.ts
    counter.ts
  views/
    HomeView.vue
    AboutView.vue`
</script>

<template>
  <section class="about-grid">
    <article class="panel soft stack">
      <h2 class="section-title">{{ i18n`关于页-标题` }}</h2>
      <p class="muted">{{ i18n`关于页-描述` }}</p>

      <div class="list">
        <div class="list-item">
          <p><strong>{{ i18n`关于页-状态仓库语言标签` }}</strong></p>
          <p>{{ locale }}</p>
        </div>
        <div class="list-item">
          <p><strong>{{ i18n`关于页-国际化实例语言标签` }}</strong></p>
          <p>{{ i18nPlugin.global.locale.value }}</p>
        </div>
        <div class="list-item">
          <p>{{ i18n`关于页-语言同步说明` }}</p>
          <p>{{ i18n`关于页-路由切换说明` }}</p>
        </div>
      </div>
    </article>

    <aside class="stack">
      <div class="panel stack">
        <h2 class="section-title">{{ i18n`关于页-回退标题` }}</h2>
        <p class="muted">{{ i18n`关于页-回退描述` }}</p>
        <div class="list-item">
          {{ i18n`关于页-仅中文回退文案` }}
        </div>
      </div>

      <div class="panel stack">
        <h2 class="section-title">{{ i18n`关于页-目录结构标题` }}</h2>
        <pre class="code-block"><code>{{ structureSnippet }}</code></pre>
        <p>{{ i18n`新中文key` }}</p>
        <p>{{ i18n`自动提交` }}</p>
      </div>
    </aside>
  </section>
</template>