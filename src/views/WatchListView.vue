<script setup lang="ts">
import { useWatchListStore } from '@/stores/WatchListStore'
import { useAnimeStateStore } from '@/stores/AnimeStateStore'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import AnimeStateItem from '@/components/AnimeStateItem.vue'
import PlusIcon from '@/assets/PlusIcon.vue'
import CloseIcon from '@/assets/CloseIcon.vue'
import type { Dialog } from 'mdui/components/dialog'
import { useLoginStateStore } from '@/stores/LoginStateStore'
import SearchIcon from '@/assets/SearchIcon.vue'
import type { AnimeSearchResult } from '@/AnimeTypes'
import { bangumiClient } from '@/ApiHelper'
import AnimeSearchItem from '@/components/AnimeSearchItem.vue'
import { snackbar } from 'mdui/functions/snackbar'

const watchListStore = useWatchListStore()
const animeStateStore = useAnimeStateStore()
const loginStateStore = useLoginStateStore()

const currentWatchList = ref('')

onMounted(() => {
  watchListStore.fetchWatchLists().then(() => {
    currentWatchList.value = watchListStore.watchLists[0].title
  })
})

watch(currentWatchList, () => {
  animeStateStore.fetchWatchListContents(watchListStore.watchListMap.get(currentWatchList.value)!)
})

const cWatchList = computed(() => {
  return watchListStore.watchListMap.get(currentWatchList.value)
})
const animes = computed(() => {
  if (cWatchList.value) {
    return cWatchList.value.animes
      .filter((anime) => animeStateStore.visibleAnimesMap.has(anime))
      .map((anime) => animeStateStore.visibleAnimesMap.get(anime)!)
  } else {
    return []
  }
})

const addDrawer = ref<Dialog | null>(null)

function openAddDrawer() {
  if (addDrawer.value) {
    addDrawer.value.open = true
  }
}

function closeAddDrawer() {
  if (addDrawer.value) {
    addDrawer.value.open = false
  }
}

const animeSearchKeyword = ref('')

const searching = ref(false)

const searchResults = reactive<AnimeSearchResult[]>([])

function search() {
  searching.value = true
  searchResults.splice(0, searchResults.length)
  bangumiClient
    .post('v0/search/subjects', {
      keyword: animeSearchKeyword.value,
      filter: {
        type: [2]
      }
    })
    .then((response) => {
      const data = response.data.data
      searchResults.splice(0, searchResults.length, ...data)
    })
    .finally(() => {
      searching.value = false
    })
}

function addAnime(anime: AnimeSearchResult) {
  watchListStore.addAnimeToWatchList(currentWatchList.value, anime.id).then(() => {
    animeStateStore.fetchWatchListContents(cWatchList.value!)
    snackbar({ message: 'Added to list' })
  })
}
</script>

<template>
  <div class="flex flex-row h-screen">
    <mdui-list style="min-width: 300px">
      <mdui-list-item
        rounded
        v-for="watchList in watchListStore.watchLists"
        :active="currentWatchList == watchList.title"
        :key="watchList.title"
        :headline="watchList.title"
        @click="currentWatchList = watchList.title"
      >
      </mdui-list-item>
    </mdui-list>

    <mdui-list class="flex-shrink-1 overflow-y-auto">
      <div v-for="animeState in animes" :key="animeState.anime_id">
        <mdui-list-item nonclickable>
          <mdui-dropdown slot="custom" trigger="contextmenu" open-on-pointer>
            <AnimeStateItem slot="trigger" :animeState="animeState" class="mx-4"></AnimeStateItem>
            <mdui-menu>
              <mdui-menu-item> Remove </mdui-menu-item>
            </mdui-menu>
          </mdui-dropdown>
        </mdui-list-item>
        <mdui-divider inset middle class="my-2"></mdui-divider>
      </div>
    </mdui-list>

    <mdui-fab
      v-if="loginStateStore.isLoggedIn"
      class="absolute right-10 bottom-10"
      @click="openAddDrawer"
    >
      <mdui-icon slot="icon">
        <PlusIcon />
      </mdui-icon>
    </mdui-fab>
  </div>

  <mdui-dialog ref="addDrawer" fullscreen close-on-overlay-click close-on-esc placement="right">
    <div class="flex flex-col dialog sticky">
      <div class="flex flex-row w-full items-center">
        <mdui-button-icon variant="tonal" @click="closeAddDrawer">
          <mdui-icon>
            <CloseIcon />
          </mdui-icon>
        </mdui-button-icon>
        <mdui-text-field
          class="mx-4"
          :value="animeSearchKeyword"
          @input="animeSearchKeyword = $event.target.value"
          @keydown.enter="search"
        >
        </mdui-text-field>
        <mdui-button-icon @click="search" variant="filled">
          <mdui-circular-progress v-if="searching"></mdui-circular-progress>
          <mdui-icon v-else>
            <SearchIcon />
          </mdui-icon>
        </mdui-button-icon>
      </div>
      <div class="grid grid-cols-5 gap-2 mt-2">
        <AnimeSearchItem
          v-for="result in searchResults"
          :key="result.id"
          :anime="result"
          :added="animes.some((anime) => anime.anime_id === result.id)"
          @add="addAnime"
        />
      </div>
    </div>
  </mdui-dialog>
</template>
