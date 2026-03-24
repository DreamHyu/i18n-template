import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { i18nPlugin, setLocale } from './i18n'
import { router } from './router'
import { resolveInitialLocale } from './types/i18n'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

setLocale(resolveInitialLocale())

app.use(pinia)
app.use(router)
app.use(i18nPlugin)

app.mount('#app')