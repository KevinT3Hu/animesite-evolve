<script setup lang="ts">
import type { AnimeSearchResult } from '@/AnimeTypes'
import CheckIcon from '@/assets/CheckIcon.vue'
import PlusIcon from '@/assets/PlusIcon.vue'

defineProps<{
  anime: AnimeSearchResult
  added: boolean
}>()

defineEmits({
  add: (anime: AnimeSearchResult) => true
})
</script>

<template>
  <mdui-card class="flex flex-row" clickable>
    <img :src="anime.image" alt="anime cover" class="w-24 h-32" />
    <div class="flex flex-col ml-2 mt-2">
      <p class="text-2xl">{{ anime.name_cn === '' ? anime.name : anime.name_cn }}</p>
      <p class="text-lg">{{ anime.name }}</p>
    </div>
    <mdui-button-icon class="absolute right-1" :disable="added" @click="$emit('add', anime)">
      <mdui-icon>
        <CheckIcon v-if="added" />
        <PlusIcon v-else />
      </mdui-icon>
    </mdui-button-icon>
  </mdui-card>
</template>
