import axios from 'axios'

// Configure base URL
const instance = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})

// Add token to requests if available
const token = localStorage.getItem('token')
if (token) {
    instance.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Add response interceptor
instance.interceptors.response.use(
    response => response,
    error => {
        console.error('Axios error:', error.response || error)
        if (error.response?.status === 401) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default instance