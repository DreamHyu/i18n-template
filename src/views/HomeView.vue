<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { i18n } from '../i18n'
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
      <p class="eyebrow">{{ i18n`应用眉标` }}</p>
      <h2 class="section-title">{{ i18n`首页-标题` }}</h2>
      <p class="muted">{{ i18n`首页-描述` }}</p>

      <div class="meta-row">
        <span class="pill">
          {{ i18n`通用-当前语言` }}: <code>{{ locale }}</code>
        </span>
        <span class="pill secondary">
          {{ i18n`通用-回退语言` }}: <code>{{ FALLBACK_LOCALE }}</code>
        </span>
      </div>

      <div class="panel">
        <div class="stack">
          <p><strong>{{ i18n`首页-运行时能力标题` }}</strong></p>
          <p class="muted">{{ i18n`首页-运行时能力描述` }}</p>
          <p>{{ i18n`通用-已持久化到本地存储` }}: {{ i18n`通用-是` }}</p>
        </div>
      </div>
    </article>

    <aside class="stack">
      <div class="panel stack">
        <h2 class="section-title">{{ i18n`首页-状态示例标题` }}</h2>
        <p class="muted">{{ i18n`首页-状态示例描述` }}</p>

        <div class="actions">
          <button class="button primary" type="button" @click="counterStore.increment">
            {{ i18n`首页-增加计数按钮` }}
          </button>
        </div>

        <p>
          {{ i18n`首页-当前计数标签` }}:
          <strong>{{ count }}</strong>
        </p>
      </div>

      <div class="panel stack">
        <h2 class="section-title">{{ i18n`首页-内置内容标题` }}</h2>

        <div class="list">
          <div class="list-item">{{ i18n`首页-功能-路由一致性` }}</div>
          <div class="list-item">{{ i18n`首页-功能-语言持久化` }}</div>
          <div class="list-item">{{ i18n`首页-功能-目录结构` }}</div>
          <div class="list-item">{{ i18n`首页-功能-回退机制` }}</div>
        </div>
      </div>
    </aside>
  </section>
</template>