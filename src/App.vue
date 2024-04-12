<script setup lang="ts">
import HomeOutlinedIcon from '@/assets/HomeOutlinedIcon.vue'
import HomeFilledIcon from '@/assets/HomeFilledIcon.vue'
import ListOutlinedIcon from '@/assets/ListOutlinedIcon.vue'
import ListFilledIcon from '@/assets/ListFilledIcon.vue'
import AccountCircleOffIcon from '@/assets/AccountCircleOffIcon.vue'
import AccountCircleIcon from '@/assets/AccountCircleIcon.vue'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { NavigationRail } from 'mdui/components/navigation-rail'
import type { Dialog } from 'mdui/components/dialog'
import { snackbar } from 'mdui/functions/snackbar'
import { useLoginStateStore } from './stores/LoginStateStore'
import { LoginResult } from './AnimeViewModel'

const loginStateStore = useLoginStateStore()

const otpValue = ref('')

interface Route {
  label: string
  route: string
  icon: any
  activeIcon: any
}

const router = useRouter()

const routes: Route[] = [
  {
    label: 'Home',
    route: 'home',
    icon: HomeOutlinedIcon,
    activeIcon: HomeFilledIcon
  },
  {
    label: 'WatchList',
    route: 'watchlist',
    icon: ListOutlinedIcon,
    activeIcon: ListFilledIcon
  }
] as const

const nav = ref<NavigationRail | null>(null)
const loginDialog = ref<Dialog | null>(null)

const route = useRoute()
const currentRoute = ref(route.name)

watch(
  () => route.name,
  (name) => {
    currentRoute.value = name
  }
)

function handleRouteChange() {
  if (nav.value && nav.value.value) {
    currentRoute.value = nav.value.value
    router.push({ name: nav.value.value })
  }
}

function openLoginDialog() {
  if (loginDialog.value) {
    loginDialog.value.open = true
  }
}

const loginLoading = ref(false)

watch(
  () => otpValue.value,
  (value) => {
    if (value.length === 8) {
      loginLoading.value = true
      loginStateStore
        .login(value)
        .then((res) => {
          if (res !== LoginResult.Success) {
            snackbar({ message: 'Login failed: ' + res })
            return
          }
          if (loginDialog.value) {
            loginDialog.value.open = false
          }
          snackbar({ message: 'Login success' })
        })
        .finally(() => {
          loginLoading.value = false
        })
    }
  }
)
</script>

<template>
  <mdui-layout class="flex flex-row w-screen h-screen">
    <mdui-navigation-rail
      contained
      ref="nav"
      :value="currentRoute"
      @change="handleRouteChange"
      divider
    >
      <mdui-navigation-rail-item v-for="route in routes" :key="route.label" :value="route.route">
        <mdui-icon slot="icon">
          <component :is="route.icon" />
        </mdui-icon>
        <mdui-icon slot="active-icon">
          <component :is="route.activeIcon" />
        </mdui-icon>
        {{ route.label }}
      </mdui-navigation-rail-item>
      <div slot="bottom">
        <mdui-button-icon v-if="loginStateStore.isLoggedIn">
          <mdui-icon>
            <AccountCircleIcon />
          </mdui-icon>
        </mdui-button-icon>
        <mdui-button-icon v-else @click="openLoginDialog">
          <mdui-icon>
            <AccountCircleOffIcon />
          </mdui-icon>
        </mdui-button-icon>
      </div>
    </mdui-navigation-rail>

    <mdui-layout-main>
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </mdui-layout-main>
  </mdui-layout>

  <mdui-dialog ref="loginDialog" close-on-overlay-click @closed="otpValue = ''">
    <div class="flex flex-col justify-center items-center">
      <h class="font-bold text-2xl mb-4">Login</h>
      <mdui-text-field
        autofocus
        :disable="loginLoading"
        type="number"
        inputmode="numeric"
        :value="otpValue"
        variant="outlined"
        @input="otpValue = $event.target.value"
      ></mdui-text-field>
      <mdui-linear-progress v-if="loginLoading" class="w-full"></mdui-linear-progress>
    </div>
  </mdui-dialog>
</template>
