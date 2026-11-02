import Framework7 from 'framework7/lite-bundle'
import Framework7Vue from 'framework7-vue/bundle'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import 'framework7/css/bundle'
import 'framework7-icons/css/framework7-icons.css'
import './styles/app.css'

import App from './App.vue'

Framework7.use(Framework7Vue)

createApp(App).use(createPinia()).mount('#app')
