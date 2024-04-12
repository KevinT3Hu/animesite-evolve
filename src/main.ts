import { createApp } from 'vue'

import App from './App.vue'
import router from './router'
import { getTokenConfig } from './ApiHelper'
import './MduiImports'
import { createPinia } from 'pinia'

import './assets/main.css'
import { useLoginStateStore } from './stores/LoginStateStore'

const app = createApp(App)
app.use(router)

const pinia = createPinia()
app.use(pinia)

app.mount('#app')

const loginStateStore = useLoginStateStore()

getTokenConfig().then((config) => {
  loginStateStore.validate(config)
})
