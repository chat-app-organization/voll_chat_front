import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            redirect: '/login'
        },
        {
            path: '/login',
            name: 'login',
            component: () => import('../views/Login.vue'),
            meta: { public: true }
        },
        {
            path: '/chat',
            name: 'chat',
            component: () => import('../views/Chat.vue'),
            meta: { requiresAuth: true }
        }
    ]
});
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    console.log('Router Guard:', { to, token });

    if (to.meta.requiresAuth && !token) {
        console.log('Redirecionando para login - não autenticado');
        next('/login');
    } else if (to.path === '/login' && token) {
        console.log('Redirecionando para chat - já autenticado');
        next('/chat');
    } else {
        console.log('Navegação permitida');
        next();
    }
});
export default router;