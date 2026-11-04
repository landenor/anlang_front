<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'

const route = useRoute()
</script>

<template>
  <div class="common-layout">
    <AppHeader :title="route.meta.title ?? 'AnLang'" />
    <RouterView v-slot="{ Component, route: pageRoute }">
      <component :is="Component" :key="pageRoute.fullPath" />
    </RouterView>
  </div>
</template>

<style scoped>
.common-layout { display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }
</style>
