import { createRouter, createWebHistory } from 'vue-router'
import Editor from '@/views/Editor.vue'
import Preview from '@/views/Preview.vue'

const routes = [
  {
    path: '/',
    name: 'Editor',
    component: Editor
  },
  {
    path: '/preview',
    name: 'Preview',
    component: Preview
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
