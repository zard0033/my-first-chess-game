import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createAppRouter } from './router'
import App from './App.vue'
import './assets/main.css'
import 'vue3-chessboard/style.css'
import './assets/board-theme.css'

// Handle GitHub Pages SPA fallback redirect
const redirect = new URLSearchParams(window.location.search).get('redirect')
if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
  window.history.replaceState(null, '', redirect)
}

const app = createApp(App)
app.use(createPinia())
app.use(createAppRouter())
app.mount('#app')
