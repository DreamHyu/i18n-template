<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useAppStore } from '../stores/app'
import { i18n } from '../i18n'

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
      <h2 class="section-title">{{ $t('about.title') }}</h2>
      <p class="muted">{{ $t('about.description') }}</p>

      <div class="list">
        <div class="list-item">
          <p><strong>Pinia locale</strong></p>
          <p>{{ locale }}</p>
        </div>
        <div class="list-item">
          <p><strong>i18n locale</strong></p>
          <p>{{ i18n.global.locale.value }}</p>
        </div>
        <div class="list-item">
          <p>{{ $t('about.localeSync') }}</p>
          <p>{{ $t('about.routing') }}</p>
        </div>
      </div>
    </article>

    <aside class="stack">
      <div class="panel stack">
        <h2 class="section-title">{{ $t('about.fallbackTitle') }}</h2>
        <p class="muted">{{ $t('about.fallbackDescription') }}</p>
        <div class="list-item">
          {{ $t('about.fallbackOnlyInChinese') }}
        </div>
      </div>

      <div class="panel stack">
        <h2 class="section-title">{{ $t('about.codeTitle') }}</h2>
        <pre class="code-block"><code>{{ structureSnippet }}</code></pre>
      </div>
    </aside>
  </section>
</template>
