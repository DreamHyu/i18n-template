<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { i18n } from './i18n'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div>
        <p class="eyebrow">{{ i18n`应用眉标` }}</p>
        <h1>{{ i18n`应用标题` }}</h1>
        <p class="lead">{{ i18n`应用副标题` }}</p>
      </div>

      <LanguageSwitcher />
    </header>

    <nav class="app-nav" :aria-label="i18n`应用主导航`">
      <RouterLink to="/" class="nav-link" active-class="is-active">
        {{ i18n`导航-首页` }}
      </RouterLink>
      <RouterLink to="/about" class="nav-link" active-class="is-active">
        {{ i18n`导航-关于模板` }}
      </RouterLink>
    </nav>

    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>