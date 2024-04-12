import { bangumiClient, httpClient } from '@/ApiHelper'
import { defineStore } from 'pinia'
import { useLoginStateStore } from './LoginStateStore'
import dayjs from 'dayjs'
import { useWatchListStore } from './WatchListStore'
import type { AnimeItem, AnimeState, Episode, WatchList } from '@/AnimeTypes'

export const useAnimeStateStore = defineStore({
  id: 'animeState',
  state: () => ({
    animeStates: [] as AnimeState[],
    animeEpisodes: new Map() as Map<number, Episode[]>
  }),
  getters: {
    animeStatesMap(): Map<number, AnimeState> {
      return new Map(this.animeStates.map((animeState) => [animeState.anime_id, animeState]))
    },
    onAirAnimes(): { item: AnimeItem; ep: Episode }[] {
      const items = [] as { item: AnimeItem; ep: Episode }[]
      const now = new Date()
      this.animeStates.forEach((animeState) => {
        this.animeEpisodes.get(animeState.anime_id)?.forEach((episode) => {
          if (dayjs(episode.airdate).isSame(now, 'day')) {
            items.push({
              item: animeState.anime_item,
              ep: episode
            })
            return
          }
        })
      })
      return items
    },
    visibleAnimes(): AnimeState[] {
      return this.animeStates.filter((animeState) => animeState.visibility)
    },
    visibleAnimesMap(): Map<number, AnimeState> {
      return new Map(this.visibleAnimes.map((animeState) => [animeState.anime_id, animeState]))
    },
    unwatchedAnimes(): { item: AnimeItem; eps: Episode[] }[] {
      const now = new Date()
      return this.visibleAnimes
        .map((animeState) => {
          const eps = this.animeEpisodes.get(animeState.anime_id)?.filter((episode) => {
            return (
              dayjs(episode.airdate).isBefore(now, 'day') &&
              !animeState.watched_episodes.includes(episode.ep)
            )
          })
          return {
            item: animeState.anime_item,
            eps: eps || []
          }
        })
        .filter((item) => item.eps.length > 0)
    }
  },
  actions: {
    async fetchWatchListContents(watchList: WatchList) {
      const animes = watchList.animes
      const animesToFetch = animes.filter((anime) => !this.animeStatesMap.has(anime))
      if (animesToFetch.length === 0) {
        return
      }
      const loginStateStore = useLoginStateStore()
      return httpClient
        .post<
          AnimeState[]
        >('/anime/get_anime_states', { anime_ids: animesToFetch }, loginStateStore.tokenConfig)
        .then((response) => {
          this.animeStates.push(...response.data)
          animes.forEach((animeId) => {
            this.fetchEpisodes(animeId)
          })
        })
    },
    async fetchEpisodes(animeId: number) {
      if (this.animeEpisodes.has(animeId)) {
        return
      }
      return bangumiClient
        .get('/v0/episodes', {
          params: {
            subject_id: animeId,
            type: 0
          }
        })
        .then((response) => {
          this.animeEpisodes.set(animeId, response.data.data)
        })
    },
    async fetchAll() {
      const watchListStore = useWatchListStore()
      return watchListStore.fetchWatchLists().then(() => {
        watchListStore.watchLists.forEach((watchList) => {
          this.fetchWatchListContents(watchList)
        })
      })
    },
    async changeWatchedState(animeId: number, ep: number) {
      const loginStateStore = useLoginStateStore()
      if (!loginStateStore.isLoggedIn) {
        return Promise.reject('Not logged in')
      }
      const watched = this.animeStatesMap.get(animeId)!.watched_episodes.includes(ep)
      const nowWatched = !watched
      httpClient
        .post(
          'anime/update_episode_watched_state',
          {
            anime_id: animeId,
            ep: ep,
            watched: nowWatched
          },
          loginStateStore.tokenConfig
        )
        .then(() => {
          if (nowWatched) {
            this.animeStatesMap.get(animeId)!.watched_episodes.push(ep)
          } else {
            const watchedEpisodes = this.animeStatesMap.get(animeId)!.watched_episodes
            const index = watchedEpisodes.indexOf(ep)
            if (index > -1) {
              watchedEpisodes.splice(index, 1)
            }
          }
        })
    },
    async changeAnimeVisibility(animeId: number, visibility: boolean) {
      const loginStateStore = useLoginStateStore()
      return httpClient
        .post(
          'anime/update_anime_visibility',
          {
            anime_id: animeId,
            visible: visibility
          },
          loginStateStore.tokenConfig
        )
        .then(() => {
          this.animeStates.filter((animeState) => animeState.anime_id === animeId)[0].visibility =
            visibility
        })
    }
  }
})
