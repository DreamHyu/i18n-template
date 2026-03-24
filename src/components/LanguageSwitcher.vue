<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '../stores/app'
import { SUPPORTED_LOCALES, type SupportedLocale } from '../types/i18n'

const appStore = useAppStore()
const { locale } = storeToRefs(appStore)

const currentLocale = computed({
  get: () => locale.value,
  set: (value: SupportedLocale) => {
    appStore.setLanguage(value)
  },
})
</script>

<template>
  <div class="language-switcher panel">
    <label for="locale-switcher">{{ $t('language.label') }}</label>

    <select id="locale-switcher" v-model="currentLocale">
      <option
        v-for="supportedLocale in SUPPORTED_LOCALES"
        :key="supportedLocale"
        :value="supportedLocale"
      >
        {{ $t(`language.${supportedLocale}`) }}
      </option>
    </select>

    <small>{{ $t('language.hint') }}</small>
  </div>
</template>
