import { defineStore } from 'pinia'
import axios from '../plugins/axios'

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || null,
        user: JSON.parse(localStorage.getItem('user')) || null
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
    },

    actions: {
        async login(email, password) {
            try {
                const response = await axios.post('/api/v1/auth/login', {
                    email,
                    password
                })

                const { token, user } = response.data

                // Primeiro configurar o token no Axios
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

                // Depois atualizar o estado
                this.token = token
                this.user = user

                // Por último, persistir no localStorage
                localStorage.setItem('token', token)
                localStorage.setItem('user', JSON.stringify(user))

                return response.data
            } catch (error) {
                console.error('Store: Erro no login:', error)
                throw error.response?.data?.error || 'Login failed'
            }
        },

        logout() {
            console.log('Store: Realizando logout')
            this.token = null
            this.user = null
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            delete axios.defaults.headers.common['Authorization']
        }
    }
})