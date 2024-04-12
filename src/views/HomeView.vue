<script setup lang="ts">
import type { AnimeItem, Episode } from '@/AnimeTypes'
import EpisodeItem from '@/components/EpisodeItem.vue'
import { useAnimeStateStore } from '@/stores/AnimeStateStore'
import { useLoginStateStore } from '@/stores/LoginStateStore'
import { computed, onMounted, reactive, ref } from 'vue'

const animeStateStore = useAnimeStateStore()
const loginStateStore = useLoginStateStore()

const loading = ref(false)

const unWatched = computed(() => {
  const unwatched = [[], [], []] as { item: AnimeItem; eps: Episode[] }[][]
  animeStateStore.unwatchedAnimes.forEach((item, index) => {
    unwatched[index % 3].push(item)
  })
  return unwatched
})

onMounted(() => {
  loading.value = true
  animeStateStore.fetchAll().then(() => {
    loading.value = false
  })
})

function openBangumi(id: number) {
  // open a new tab to the bangumi page
  window.open(`https://bgm.tv/subject/${id}`)
}

const performingAction = reactive([] as number[])

function changeWatchedState(animeId: number, ep: Episode) {
  if (performingAction.includes(ep.id)) {
    return
  }
  if (!loginStateStore.isLoggedIn) {
    return
  }
  performingAction.push(ep.id)
  animeStateStore.changeWatchedState(animeId, ep.ep).then(() => {
    performingAction.splice(performingAction.indexOf(ep.id), 1)
  })
}
</script>

<template>
  <mdui-linear-progress v-if="loading" class="fixed top-0"></mdui-linear-progress>
  <div class="flex flex-row w-full max-h-full h-full">
    <div class="flex flex-col overflow-y-scroll flex-1 h-full">
      <span class="font-bold text-4xl w-full text-center mt-4">Air Today</span>
      <div class="grid grid-cols-3 w-full gap-4 mt-4">
        <mdui-card v-for="item in animeStateStore.onAirAnimes" :key="item.ep.id">
          <img
            :src="item.item.images.common"
            class="w-full cursor-pointer"
            @click="openBangumi(item.item.id)"
          />
          <p class="w-full text-center text-2xl align-middle my-2">
            {{ item.ep.ep }} - {{ item.item.name_cn === '' ? item.item.name : item.item.name_cn }}
          </p>
        </mdui-card>
      </div>
    </div>
    <div class="flex flex-col overflow-y-scroll flex-1">
      <span class="font-bold text-4xl w-full text-center mt-4">Unwatched</span>
      <div class="grid grid-cols-3 w-full">
        <div v-for="(group, index) in unWatched" :key="index" class="mx-4">
          <mdui-card v-for="state in group" :key="state.item.id" class="my-4">
            <img
              :src="state.item.images.common"
              class="w-full cursor-pointer"
              @click="openBangumi(state.item.id)"
            />
            <mdui-badge class="absolute top-0 right-0">{{ state.eps.length }}</mdui-badge>
            <mdui-collapse>
              <mdui-collapse-item>
                <mdui-list-item slot="header">
                  <p class="w-full text-center text-2xl align-middle my-2 trigger line-clamp-1">
                    {{ state.item.name_cn === '' ? state.item.name : state.item.name_cn }}
                  </p>
                </mdui-list-item>
                <mdui-list>
                  <EpisodeItem
                    v-for="ep in state.eps"
                    :key="ep.id"
                    :episode="ep"
                    :aired="true"
                    :watched="false"
                    :loading="performingAction.includes(ep.id)"
                    @click="changeWatchedState(state.item.id, ep)"
                  />
                </mdui-list>
              </mdui-collapse-item>
            </mdui-collapse>
          </mdui-card>
        </div>
      </div>
    </div>
  </div>
</template>
