<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
      <h2 class="text-2xl font-bold text-center text-gray-800 mb-8">Login</h2>

      <form @submit.prevent="handleLogin" class="space-y-6">
        <!-- Error Alert -->
        <div
            v-if="error"
            class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
        >
          {{ error }}
        </div>

        <!-- Email Input -->
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2">
            Email
          </label>
          <input
              v-model="email"
              type="email"
              required
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter your email"
          />
        </div>

        <!-- Password Input -->
        <div>
          <label class="block text-gray-700 text-sm font-bold mb-2">
            Password
          </label>
          <input
              v-model="password"
              type="password"
              required
              class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="Enter your password"
          />
        </div>

        <!-- Submit Button -->
        <button
            type="submit"
            :disabled="loading"
            class="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none disabled:opacity-50"
        >
          {{ loading ? 'Loading...' : 'Login' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  try {
    loading.value = true
    error.value = ''

    console.log('Tentando login com:', { email: email.value, password: password.value })

    await authStore.login(email.value, password.value)

    // Forçar navegação usando replace
    await router.replace({ name: 'chat' })
  } catch (err) {
    console.error('Erro no login:', err)
    error.value = err.toString()
  } finally {
    loading.value = false
  }
}
</script>