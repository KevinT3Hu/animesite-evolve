import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue')
    },
    {
      path: '/watchlist',
      name: 'watchlist',
      component: () => import('@/views/WatchListView.vue')
    }
  ]
})

export default router
