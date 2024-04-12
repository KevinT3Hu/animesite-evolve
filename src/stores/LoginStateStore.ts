import { LoginResult } from '@/AnimeViewModel'
import { generateTokenConfig, httpClient } from '@/ApiHelper'
import type { AxiosRequestConfig } from 'axios'
import { defineStore } from 'pinia'

export const useLoginStateStore = defineStore({
  id: 'loginState',
  state: () => ({
    isLoggedIn: false,
    tokenConfig: undefined as AxiosRequestConfig | undefined
  }),
  actions: {
    async login(otp: string): Promise<LoginResult> {
      return httpClient
        .post('/login', { otp: otp })
        .then((res) => {
          this.tokenConfig = generateTokenConfig(res.data)
          this.isLoggedIn = true
          localStorage.setItem('token', res.data)
          return LoginResult.Success
        })
        .catch((error) => {
          switch (error.response.status) {
            case 401:
              return LoginResult.Invalid
            default:
              return LoginResult.Error
          }
        })
    },
    async validate(config: AxiosRequestConfig) {
      return httpClient
        .post('/validate', {}, config)
        .then(() => {
          this.isLoggedIn = true
          this.tokenConfig = config
          return Promise.resolve()
        })
        .catch((err) => {
          console.log(err)
          localStorage.removeItem('token')
          window.location.reload()
          return Promise.reject()
        })
    }
  }
})
