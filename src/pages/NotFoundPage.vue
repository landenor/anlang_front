<script setup lang="ts">
import { f7Block, f7Button, f7Navbar, f7Page } from 'framework7-vue'
</script>

<template>
  <f7-page>
    <f7-navbar title="Страница не найдена" />
    <f7-block class="text-align-center">
      <p>Такой страницы нет.</p>
      <f7-button fill href="/" :reload-all="true">На главную</f7-button>
    </f7-block>
  </f7-page>
</template>
