import type { AxiosRequestConfig } from 'axios'
import { type Ref, computed, nextTick, reactive, ref } from 'vue'
import { bangumiClient, generateTokenConfig, getTokenConfig, httpClient } from './ApiHelper'
import { useStorage } from '@vueuse/core'
import { moveArrayElement } from '@vueuse/integrations/useSortable'

export enum LoginResult {
  Success,
  Invalid,
  Error
}

export class AnimeViewModel {
  private _allWatchLists: Array<WatchList> = reactive([])
  public get allWatchLists() {
    return this._allWatchLists
  }

  public get visibleWatchLists() {
    return computed(() => {
      return this._allWatchLists.filter((watchList) => {
        return !watchList.archived
      })
    })
  }

  private _allAnimes: Map<string, [boolean, number[]]> = reactive(
    new Map<string, [boolean, number[]]>()
  )
  public get allAnimes() {
    return this._allAnimes
  }

  private _archivedWatchLists = computed(() => {
    const ret = new Map<string, number[]>()
    for (const [key, [archived, value]] of this._allAnimes) {
      if (archived) {
        ret.set(key, value)
      }
    }
    return ret
  })
  public get archivedWatchLists() {
    return this._archivedWatchLists
  }

  public get visibleAnimes() {
    return computed(() => {
      const ret = new Map<string, number[]>()
      for (const [key, [archived, value]] of this._allAnimes) {
        if (!archived) {
          ret.set(
            key,
            value.filter((animeId) => {
              return this._allAnimeStates.get(animeId)?.visibility
            })
          )
        }
      }
      return ret
    })
  }

  private _watchListsOrder: Ref<string[]> = useStorage('watch_list_order', [])

  public get archivedAnimes() {
    return computed(() => {
      const ret = new Set<AnimeState>()
      for (const [_, state] of this._allAnimeStates) {
        if (!state.visibility) {
          ret.add(state)
        }
      }
      return ret
    })
  }

  public get visibleAnimeStates() {
    return computed(() => {
      const ret = new Map<number, AnimeState>()
      for (const [key, value] of this._allAnimeStates) {
        if (value.visibility) {
          ret.set(key, value)
        }
      }
      return ret
    })
  }

  private _allAnimeStates: Map<number, AnimeState> = reactive(new Map<number, AnimeState>())
  public get allAnimeStates() {
    return this._allAnimeStates
  }
  private _allEpisodes: Map<number, Episode[]> = reactive(new Map<number, Episode[]>())

  public _tokenConfig?: AxiosRequestConfig
  private _loggedIn: Ref<boolean> = ref(false)
  public get loggedIn() {
    return this._loggedIn
  }

  private _showSnackBar: Ref<boolean> = ref(false)
  public get showSnackBar() {
    return this._showSnackBar
  }
  private _snackBarMsg: Ref<string> = ref('')
  public get snackBarMsg() {
    return this._snackBarMsg
  }

  private _loading: Ref<boolean> = ref(true)
  public get loading() {
    return this._loading
  }

  private async init() {
    await getTokenConfig()
      .then((config) => {
        this._tokenConfig = config
        this._loggedIn.value = true
      })
      .finally(() => {
        this.fetchWatchList(true)
          .then(() => {
            this.fetchAllAnimes()
          })
          .catch((e) => {
            console.error(e)
          })
      })
  }

  public changeWatchListOrder(oldIndex: number, newIndex: number) {
    // for magic reasons, this doesn't work so we need to do it manually
    moveArrayElement(this._allWatchLists, oldIndex, newIndex)
    // const watchList = this._allWatchLists[oldIndex]
    // this._allWatchLists.splice(oldIndex, 1)
    // this._allWatchLists.splice(newIndex, 0, watchList)
    nextTick(() => {
      this._watchListsOrder.value = this._allWatchLists.map((watchList) => watchList.title)
    })
  }

  public async fetchWatchList(sort: boolean = false): Promise<void> {
    return httpClient.get<WatchList[]>('/anime/list', this._tokenConfig).then((response) => {
      if (sort) {
        const order = this._watchListsOrder.value
        const ret = []
        for (const title of order) {
          const watchList = response.data.find((watchList) => watchList.title === title)
          if (watchList) {
            ret.push(watchList)
          }
        }
        // push the rest
        for (const watchList of response.data) {
          if (!ret.includes(watchList)) {
            ret.push(watchList)
          }
        }
        this._allWatchLists.splice(0, this._allWatchLists.length, ...ret)
      } else {
        this._allWatchLists.splice(0, this._allWatchLists.length, ...response.data)
      }
    })
  }

  public fetchAllAnimes() {
    this._loading.value = true
    this._allWatchLists.forEach((watchList) => {
      this._allAnimes.set(watchList.title, [watchList.archived, watchList.animes])
      httpClient
        .post<AnimeState[]>(
          `/anime/get_anime_states`,
          {
            anime_ids: watchList.animes
          },
          this._tokenConfig
        )
        .then((states_response) => {
          this._loading.value = false
          states_response.data.forEach((state) => {
            this._allAnimeStates.set(state.anime_id, state)
          })
        })
    })
    this._loading.value = false
  }

  public async getAnimeEpisodes(animeId: number): Promise<Episode[]> {
    if (this._allEpisodes.has(animeId)) {
      return this._allEpisodes.get(animeId) ?? []
    } else {
      this.loading.value = true
      return bangumiClient
        .get('/v0/episodes', {
          params: {
            subject_id: animeId,
            type: 0
          }
        })
        .then((response) => {
          this._loading.value = false
          this._allEpisodes.set(animeId, response.data.data)
          return response.data.data
        })
    }
  }

  public async updateRating(animeId: number, rating: number) {
    return httpClient.post(
      '/anime/update_anime_rating',
      {
        anime_id: animeId,
        rating: rating
      },
      this._tokenConfig
    )
  }

  public async login(otp: string): Promise<LoginResult> {
    return httpClient
      .post('/login', {
        otp: otp
      })
      .then((res) => {
        this._tokenConfig = generateTokenConfig(res.data)
        this._loggedIn.value = true
        localStorage.setItem('token', res.data)
        return LoginResult.Success
      })
      .catch((err) => {
        switch (err.response.status) {
          case 401:
            return LoginResult.Invalid
          default:
            return LoginResult.Error
        }
      })
  }

  public async createNewWatchList(title: string): Promise<boolean> {
    return httpClient
      .post('/anime/add_new_watch_list', { watch_list_name: title }, this._tokenConfig)
      .then(() => {
        this.fetchWatchList().then(() => {
          this.fetchAllAnimes()
        })
        return true
      })
      .catch(() => {
        return false
      })
  }

  public async addAnime(animeId: number, watchListName: string): Promise<void> {
    this._loading.value = true
    return bangumiClient
      .get<AnimeItem>('v0/subjects/' + animeId)
      .then((ret) => {
        const item = ret.data
        // add to database
        httpClient
          .post('anime/insert_anime_item', item, this._tokenConfig)
          .then(() => {
            httpClient
              .post(
                'anime/add_item_to_watch_list',
                {
                  anime_id: animeId,
                  watch_list_name: watchListName
                },
                this._tokenConfig
              )
              .then(() => {
                this.sb('Anime added to watch list')
                this._allAnimes.get(watchListName)?.[1].push(animeId)
                httpClient
                  .post<AnimeState[]>(
                    'anime/get_anime_states',
                    {
                      anime_ids: [animeId]
                    },
                    this._tokenConfig
                  )
                  .then((res) => {
                    this._allAnimeStates.set(animeId, res.data[0])
                  })
              })
              .catch(() => {
                this.sb('Failed to add anime to watch list')
              })
          })
          .catch(() => {
            this.sb('Failed to add anime to database')
          })
      })
      .catch(() => {
        this.sb('Failed to get anime info from bangumi')
      })
      .finally(() => {
        this._loading.value = false
      })
  }

  public async changeWatchedState(animeId: number, ep: number) {
    if (this.loggedIn.value) {
      const watched = this._allAnimeStates.get(animeId)?.watched_episodes.includes(ep) ?? false
      const nowWatched = !watched
      httpClient
        .post(
          'anime/update_episode_watched_state',
          {
            anime_id: animeId,
            ep: ep,
            watched: nowWatched
          },
          this._tokenConfig
        )
        .then(() => {
          if (nowWatched) {
            this._allAnimeStates.get(animeId)?.watched_episodes.push(ep)
          } else {
            const index = this.allAnimeStates.get(animeId)?.watched_episodes.indexOf(ep)
            if (index !== undefined && index !== -1) {
              this.allAnimeStates.get(animeId)?.watched_episodes.splice(index, 1)
            }
          }
        })
    }
  }

  public async changeVisibility(animeId: number, visibility: boolean) {
    return httpClient
      .post(
        'anime/update_anime_visibility',
        {
          anime_id: animeId,
          visible: visibility
        },
        this._tokenConfig
      )
      .then(() => {
        this._allAnimeStates.set(animeId, {
          ...this._allAnimeStates.get(animeId)!!,
          visibility: visibility
        })
      })
  }

  public async changeWatchListArchived(watchListName: string) {
    const archived = !this._allAnimes.get(watchListName)!![0]
    return httpClient
      .post(
        'anime/update_watch_list_archived',
        {
          watch_list_name: watchListName,
          archived: archived
        },
        this._tokenConfig
      )
      .then(() => {
        this._allAnimes.set(watchListName, [archived, this._allAnimes.get(watchListName)!![1]])
      })
  }

  public async deleteWatchList(watchListName: string) {
    return httpClient.post(
      'anime/delete_watch_list',
      {
        watch_list_name: watchListName
      },
      this._tokenConfig
    )
  }

  public sb(message: string) {
    this._snackBarMsg.value = message
    this._showSnackBar.value = true
  }

  private static instance: AnimeViewModel
  public static async getInstance(): Promise<AnimeViewModel> {
    if (!AnimeViewModel.instance) {
      AnimeViewModel.instance = new AnimeViewModel()
      await AnimeViewModel.instance.init().catch((e) => {
        console.error(e)
      })
    }
    return AnimeViewModel.instance
  }
}
