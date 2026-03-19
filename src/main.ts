import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import "./assets/css/bootstrap.css"
import App from './App.vue'
import router from './router'

import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate) // 启用持久化插件
app.use(router)
app.use(pinia)
app.mount('#app')