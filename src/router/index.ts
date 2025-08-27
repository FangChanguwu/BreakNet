import { createRouter, createWebHistory } from 'vue-router';

import type { RouteRecordRaw } from 'vue-router'
const routes: RouteRecordRaw[] = [
    {
        path: "/login",
        name: "login",
        component: () => import('../views/LoginView.vue'),
        meta: { public: true }
    },
    {
        path: '/',
        name: 'home',
        component: () => import('../views/HomeView.vue'),
        meta: { requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach((to) => {
    const isPublic = !!to.meta.public
    const token = localStorage.getItem('token')
    if (!isPublic && !token) {
        return { name: 'login', query: { redirect: to.fullPath } }
    }
    return true
})

export default router