import { bangumiClient, httpClient } from '@/ApiHelper'
import { defineStore } from 'pinia'
import { useLoginStateStore } from './LoginStateStore'
import type { AnimeItem, WatchList } from '@/AnimeTypes'
import { useAnimeStateStore } from './AnimeStateStore'

export const useWatchListStore = defineStore({
  id: 'watchList',
  state: () => ({
    watchLists: [] as WatchList[]
  }),
  getters: {
    archivedWatchLists(): WatchList[] {
      return this.watchLists.filter((watchList) => watchList.archived)
    },
    activeWatchLists(): WatchList[] {
      return this.watchLists.filter((watchList) => !watchList.archived)
    },
    watchListMap(): Map<string, WatchList> {
      const watchListMap = new Map<string, WatchList>()
      this.watchLists.forEach((watchList) => {
        watchListMap.set(watchList.title, watchList)
      })
      return watchListMap
    }
  },
  actions: {
    async fetchWatchLists() {
      return httpClient
        .get<WatchList[]>('/anime/list')
        .then((response) => {
          this.watchLists = response.data
        })
        .catch((err) => {
          console.log(err)
        })
    },
    async createNewWatchList(title: string) {
      const loginStateStore = useLoginStateStore()
      return httpClient
        .post('/anime/add_new_watch_list', { watch_list_name: title }, loginStateStore.tokenConfig)
        .then(() => {
          this.fetchWatchLists()
        })
    },
    async updateWatchListArchived(watchListName: string) {
      const archived = !this.watchLists.find((watchList) => watchList.title === watchListName)
        ?.archived
      const loginStateStore = useLoginStateStore()
      return httpClient
        .post(
          '/anime/update_watch_list_archived',
          { watch_list_name: watchListName, archived: archived },
          loginStateStore.tokenConfig
        )
        .then(() => {
          this.fetchWatchLists()
        })
    },
    async deleteWatchList(watchListName: string) {
      const loginStateStore = useLoginStateStore()
      return httpClient
        .post(
          '/anime/delete_watch_list',
          { watch_list_name: watchListName },
          loginStateStore.tokenConfig
        )
        .then(() => {
          this.fetchWatchLists()
        })
    },
    async addAnimeToWatchList(watchListName: string, animeId: number) {
      const loginStateStore = useLoginStateStore()
      const animeStateStore = useAnimeStateStore()
      return bangumiClient.get<AnimeItem>('/v0/subjects/' + animeId).then((response) => {
        return httpClient
          .post('/anime/insert_anime_item', response.data, loginStateStore.tokenConfig)
          .then(() => {
            httpClient
              .post(
                'anime/add_item_to_watch_list',
                {
                  anime_id: animeId,
                  watch_list_name: watchListName
                },
                loginStateStore.tokenConfig
              )
              .then(() => {
                return animeStateStore.fetchAll()
              })
          })
      })
    }
  }
})
