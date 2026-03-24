<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { i18n } from '../i18n'
import { useAppStore } from '../stores/app'
import { SUPPORTED_LOCALES, type SupportedLocale } from '../types/i18n'

const appStore = useAppStore()
const { locale } = storeToRefs(appStore)

const localeLabelKeys: Record<SupportedLocale, string> = {
  'zh-CN': '语言名称-简体中文',
  'en-US': '语言名称-英文',
}

const currentLocale = computed({
  get: () => locale.value,
  set: (value: SupportedLocale) => {
    appStore.setLanguage(value)
  },
})
</script>

<template>
  <div class="language-switcher panel">
    <label for="locale-switcher">{{ i18n`语言切换-标签` }}</label>

    <select id="locale-switcher" v-model="currentLocale">
      <option
        v-for="supportedLocale in SUPPORTED_LOCALES"
        :key="supportedLocale"
        :value="supportedLocale"
      >
        {{ i18n`${localeLabelKeys[supportedLocale]}` }}
      </option>
    </select>

    <small>{{ i18n`语言切换-提示` }}</small>
  </div>
</template>