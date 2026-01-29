import { createApp } from 'vue'
import { createPinia } from 'pinia'
import * as Sentry from '@sentry/vue'
import App from './App.vue'
import router from './router'
import './assets/styles/main.css'

const app = createApp(App)

// 初始化 Sentry
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    app,
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration({ router })
    ],
    tracesSampleRate: 0.2
  })
}

app.use(createPinia())
app.use(router)

app.mount('#app')
