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

                // Configure token with Bearer prefix
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

                // Update state
                this.token = token
                this.user = user

                // Persist to localStorage
                localStorage.setItem('token', token)
                localStorage.setItem('user', JSON.stringify(user))

                return response.data
            } catch (error) {
                console.error('Store: Login error:', error)
                throw error.response?.data?.error || 'Login failed'
            }
        },

        initialize() {
            const token = localStorage.getItem('token')
            if (token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            }
        },

        logout() {
            this.token = null
            this.user = null
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            delete axios.defaults.headers.common['Authorization']
        }
    }
})