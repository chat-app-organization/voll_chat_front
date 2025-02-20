// plugins/axios.js
import axios from 'axios'

const instance = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})

// Interceptor de request
instance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
            // Log para debug
            console.log('Token sendo enviado:', token)
            console.log('Headers completos:', config.headers)
        }
        return config
    },
    error => {
        console.error('Erro no request:', error)
        return Promise.reject(error)
    }
)

// Interceptor de response
instance.interceptors.response.use(
    response => response,
    error => {
        console.error('Erro na resposta:', error.response)
        if (error.response?.status === 401) {
            console.error('Erro de autenticação:', error.response.data)
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default instance