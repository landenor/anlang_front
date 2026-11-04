<script setup lang="ts">
import { ref } from 'vue'
import { NavBar as VanNavBar, Icon as VanIcon } from 'vant'
import AppMenu from './AppMenu.vue'
defineProps<{ title: string }>()
const showMenu = ref(false)

</script>
<template>
  <van-nav-bar :title="title">
    <template #left><button class="menu-button" aria-label="Открыть меню" @click="showMenu = true"><van-icon name="wap-nav" size="24" /></button></template>
  </van-nav-bar>
  <AppMenu v-model="showMenu" />
</template>
