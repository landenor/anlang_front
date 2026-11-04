<script setup lang="ts">
import { Popup as VanPopup, NavBar as VanNavBar, Cell as VanCell, CellGroup as VanCellGroup } from 'vant'
const show = defineModel<boolean>({ default: false })
</script>
<template>
  <van-popup v-model:show="show" position="left" class="app-menu" close-on-popstate>
    <van-nav-bar title="AnLang" right-text="Закрыть" @click-right="show = false" />
    <van-cell-group inset>
      <van-cell title="Профиль" icon="user-o" is-link to="/" @click="show = false" />
      <van-cell title="Переводчик" icon="chat-o" is-link to="/translator" @click="show = false" />
    </van-cell-group>
  </van-popup>
</template>
