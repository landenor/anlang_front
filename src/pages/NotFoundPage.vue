<script setup lang="ts">
import { Button as VanButton, NavBar as VanNavBar } from 'vant'

</script>

<template>
  <main class="app-page">
    <van-nav-bar title="Страница не найдена" />
    <section class="block text-align-center" >
      <p>Такой страницы нет.</p>
      <van-button type="primary" to="/">На главную</van-button>
    </section>
  </main>
</template>
