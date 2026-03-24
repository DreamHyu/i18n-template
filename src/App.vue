<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import LanguageSwitcher from './components/LanguageSwitcher.vue'
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div>
        <p class="eyebrow">{{ $t('app.eyebrow') }}</p>
        <h1>{{ $t('app.title') }}</h1>
        <p class="lead">{{ $t('app.subtitle') }}</p>
      </div>

      <LanguageSwitcher />
    </header>

    <nav class="app-nav" :aria-label="$t('app.navigation')">
      <RouterLink to="/" class="nav-link" active-class="is-active">
        {{ $t('nav.home') }}
      </RouterLink>
      <RouterLink to="/about" class="nav-link" active-class="is-active">
        {{ $t('nav.about') }}
      </RouterLink>
    </nav>

    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>
