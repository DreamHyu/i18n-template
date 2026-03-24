<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useCounterStore } from '../stores/counter'
import { useAppStore } from '../stores/app'
import { FALLBACK_LOCALE } from '../types/i18n'

const counterStore = useCounterStore()
const appStore = useAppStore()

const { count } = storeToRefs(counterStore)
const { locale } = storeToRefs(appStore)
</script>

<template>
  <section class="page-grid">
    <article class="panel soft hero-card stack">
      <p class="eyebrow">{{ $t('app.eyebrow') }}</p>
      <h2 class="section-title">{{ $t('home.title') }}</h2>
      <p class="muted">{{ $t('home.description') }}</p>

      <div class="meta-row">
        <span class="pill">
          {{ $t('common.currentLanguage') }}: <code>{{ locale }}</code>
        </span>
        <span class="pill secondary">
          {{ $t('common.fallback') }}: <code>{{ FALLBACK_LOCALE }}</code>
        </span>
      </div>

      <div class="panel">
        <div class="stack">
          <p><strong>{{ $t('home.runtime') }}</strong></p>
          <p class="muted">{{ $t('home.runtimeDescription') }}</p>
          <p>{{ $t('common.persisted') }}: {{ $t('common.yes') }}</p>
        </div>
      </div>
    </article>

    <aside class="stack">
      <div class="panel stack">
        <h2 class="section-title">{{ $t('home.storeTitle') }}</h2>
        <p class="muted">{{ $t('home.storeDescription') }}</p>

        <div class="actions">
          <button class="button primary" type="button" @click="counterStore.increment">
            {{ $t('home.increment') }}
          </button>
        </div>

        <p>
          {{ $t('home.countLabel') }}:
          <strong>{{ count }}</strong>
        </p>
      </div>

      <div class="panel stack">
        <h2 class="section-title">{{ $t('home.featuresTitle') }}</h2>

        <div class="list">
          <div class="list-item">{{ $t('home.featureRouting') }}</div>
          <div class="list-item">{{ $t('home.featurePersistence') }}</div>
          <div class="list-item">{{ $t('home.featureStructure') }}</div>
          <div class="list-item">{{ $t('home.featureFallback') }}</div>
        </div>
      </div>
    </aside>
  </section>
</template>
