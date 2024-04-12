<script setup lang="ts">
import type { Episode } from '@/AnimeTypes'

defineProps<{
  episode: Episode
  watched: boolean
  aired: boolean
  loading: boolean
}>()
</script>

<template>
  <mdui-list-item :active="watched" :disabled="!aired">
    <mdui-circular-progress slot="icon" v-if="loading"></mdui-circular-progress>
    <p slot="icon" v-else>{{ episode.ep }}</p>
    <p>{{ episode.name }}</p>
    <p slot="description">{{ episode.name_cn }}</p>
    <p slot="end-icon">{{ episode.airdate }}</p>
  </mdui-list-item>
</template>
