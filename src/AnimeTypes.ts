export interface ImageSet {
  large: string
  common: string
  medium: string
  small: string
}

export interface Tag {
  name: string
  count: number
}

export interface Rating {
  rank: number
  total: number
  score: number
}

export interface AnimeItem {
  id: number
  name: string
  name_cn: string
  summary: string
  date?: string
  eps: number
  total_episodes: number
  images: ImageSet
  tags?: Tag[]
  rating?: Rating
}

export interface AnimeState {
  anime_id: number
  anime_item: AnimeItem
  favorite: boolean
  watched_episodes: number[]
  visibility: boolean
  rating?: number
}

export interface Episode {
  id: number
  name: string
  name_cn: string
  ep: number
  airdate: string
}

export interface WatchList {
  title: string
  archived: boolean
  animes: number[]
}

export interface AnimeSearchResult {
  date: string
  id: number
  image: string
  name: string
  name_cn: string
  rank: number
  score: number
  summary: string
  tags: Tag[]
}
