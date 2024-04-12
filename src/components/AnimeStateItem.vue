<script setup lang="ts">
import { useAnimeStateStore } from '@/stores/AnimeStateStore'
import ExpandIcon from '@/assets/ExpandIcon.vue'
import ExpandLessIcon from '@/assets/ExpandLessIcon.vue'
import ArchiveIcon from '@/assets/ArchiveIcon.vue'
import EpisodeItem from '@/components/EpisodeItem.vue'
import { computed, reactive, ref } from 'vue'
import dayjs from 'dayjs'
import type { AnimeState, Episode } from '@/AnimeTypes'
import { useLoginStateStore } from '@/stores/LoginStateStore'

const props = defineProps<{
  animeState: AnimeState
  showOnlyUnwatched?: boolean
}>()

const animeStateStore = useAnimeStateStore()
const loginStateStore = useLoginStateStore()

const title = computed(() => {
  return props.animeState.anime_item.name_cn === ''
    ? props.animeState.anime_item.name
    : props.animeState.anime_item.name_cn
})

const episodes = computed(() => {
  const allEpisodes = animeStateStore.animeEpisodes.get(props.animeState.anime_id)
  if (!props.showOnlyUnwatched) {
    return allEpisodes
  } else {
    return allEpisodes?.filter((ep) => props.animeState.watched_episodes.includes(ep.ep) === false)
  }
})

const episodesExpanded = ref(false)

function episodeAired(ep: Episode): boolean {
  const airData = dayjs(ep.airdate, 'YYYY-MM-DD')
  return airData.isBefore(dayjs())
}

const performingAction = reactive([] as number[])

function changeWatchedState(ep: number) {
  if (performingAction.includes(ep)) {
    return
  }
  if (!loginStateStore.isLoggedIn) {
    return
  }
  performingAction.push(ep)
  animeStateStore.changeWatchedState(props.animeState.anime_id, ep).then(() => {
    performingAction.splice(performingAction.indexOf(ep), 1)
  })
}

function archiveAnime() {
  animeStateStore.changeAnimeVisibility(props.animeState.anime_id, false)
}
</script>

<template>
  <div class="flex flex-row">
    <img :src="props.animeState.anime_item.images.common" alt="anime image" class="anime_img" />
    <div class="flex flex-col flex-grow">
      <div class="flex flex-row justify-between">
        <span class="text-2xl font-bold">{{ title }}</span>
        <div class="flex flex-row">
          <mdui-button-icon variant="tonal" @click="archiveAnime">
            <mdui-icon>
              <ArchiveIcon />
            </mdui-icon>
          </mdui-button-icon>
        </div>
      </div>
      <span class="text-gray-400">{{ animeState.anime_item.name }}</span>
      <p>{{ animeState.anime_item.summary }}</p>
      <mdui-collapse>
        <mdui-collapse-item
          trigger=".trigger"
          :disable="!episodes || episodes.length === 0"
          @open="episodesExpanded = true"
          @close="episodesExpanded = false"
        >
          <mdui-button slot="header" class="trigger">
            Episodes
            <mdui-icon slot="end-icon">
              <ExpandLessIcon v-if="episodesExpanded" />
              <ExpandIcon v-else />
            </mdui-icon>
          </mdui-button>
          <mdui-list v-if="episodes">
            <EpisodeItem
              v-for="ep in episodes"
              :key="ep.id"
              :episode="ep"
              :aired="episodeAired(ep)"
              :watched="animeState.watched_episodes.includes(ep.ep)"
              @click="changeWatchedState(ep.ep)"
              :loading="performingAction.includes(ep.ep)"
            >
            </EpisodeItem>
          </mdui-list>
        </mdui-collapse-item>
      </mdui-collapse>
    </div>
  </div>
</template>

<style scope>
.anime_img {
  width: 200px;
  height: 250px;
  margin-right: 10px;
}
</style>
