import axios, { type AxiosRequestConfig } from 'axios'

export const httpClient = axios.create({
  baseURL: 'https://api.spie.cc'
})

export const bangumiClient = axios.create({
  baseURL: 'https://api.bgm.tv'
})

export function getTokenConfig(): Promise<AxiosRequestConfig> {
  const token = localStorage.getItem('token')
  if (token == undefined) {
    return Promise.reject()
  }
  return Promise.resolve(generateTokenConfig(token))
}

export function generateTokenConfig(token: string): AxiosRequestConfig {
  return {
    headers: {
      Authorization: 'token ' + token
    }
  }
}
