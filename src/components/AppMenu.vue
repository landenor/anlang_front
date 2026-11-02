<script setup lang="ts">
import {
  f7Icon, f7Link, f7List, f7ListItem, f7Navbar, f7NavRight, f7Page, f7Panel,
} from 'framework7-vue'
</script>

<template>
  <f7-panel id="app-menu" left cover>
    <f7-page>
      <f7-navbar title="AnLang">
        <f7-nav-right>
          <f7-link panel-close icon-f7="xmark" aria-label="Закрыть меню" />
        </f7-nav-right>
      </f7-navbar>
      <f7-list strong inset>
        <f7-list-item title="Профиль" link="/" view=".view-main" panel-close selected>
          <template #media>
            <f7-icon f7="person" />
          </template>
        </f7-list-item>
      </f7-list>
    </f7-page>
  </f7-panel>
</template>
