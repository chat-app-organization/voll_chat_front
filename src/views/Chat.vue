<template>
  <div class="flex flex-col h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-white shadow p-4">
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-semibold">Chat</h1>
        <button
            @click="logout"
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    </header>

    <!-- Main Chat Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Users List -->
      <div class="w-1/4 bg-white border-r">
        <div class="p-4">
          <h2 class="text-lg font-semibold mb-4">Users</h2>
          <!-- Loading State -->
          <div v-if="loading" class="text-center text-gray-500">
            Loading users...
          </div>
          <!-- Empty State -->
          <div v-else-if="users.length === 0" class="text-center text-gray-500">
            No users available
          </div>
          <!-- Users List -->
          <div
              v-else
              v-for="user in users"
              :key="user.id"
              @click="selectUser(user)"
              :class="[
              'p-3 cursor-pointer rounded hover:bg-gray-100',
              selectedUser?.id === user.id ? 'bg-blue-50' : ''
            ]"
          >
            {{ user.email }}
          </div>
        </div>
      </div>

      <!-- Messages Area -->
      <div class="flex-1 flex flex-col">
        <!-- Messages Container -->
        <div ref="messagesContainer" class="flex-1 p-4 overflow-y-auto">
          <!-- Loading State -->
          <div v-if="loadingMessages" class="text-center text-gray-500">
            Loading messages...
          </div>
          <!-- No Selected User State -->
          <div v-else-if="!selectedUser" class="text-center text-gray-500">
            Select a user to start chatting
          </div>
          <!-- Messages -->
          <div
              v-else
              v-for="message in messages"
              :key="message.id"
              :class="[
              'mb-4 max-w-[70%] rounded-lg p-3',
              message.sender.id === currentUser.id
                ? 'ml-auto bg-blue-500 text-white'
                : 'bg-gray-200'
            ]"
          >
            <div class="text-sm opacity-75 mb-1">
              {{ message.sender.email }}
            </div>
            <div>{{ message.content }}</div>
            <div class="text-xs opacity-75 mt-1">
              {{ formatDate(message.created_at) }}
            </div>
          </div>
        </div>

        <!-- Message Input -->
        <div class="p-4 border-t bg-white">
          <form @submit.prevent="sendMessage" class="flex gap-2">
            <input
                v-model="newMessage"
                type="text"
                placeholder="Type your message..."
                class="flex-1 p-2 border rounded"
                :disabled="!selectedUser"
            />
            <button
                type="submit"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                :disabled="!selectedUser || !newMessage.trim()"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { createConsumer } from '@rails/actioncable'
import axios from '@/plugins/axios'
import { format } from 'date-fns'

// Instances
const router = useRouter()
const authStore = useAuthStore()

// Reactive variables
const currentUser = ref(null)
const users = ref([])
const selectedUser = ref(null)
const messages = ref([])
const newMessage = ref('')
const messagesContainer = ref(null)
const loading = ref(false)
const loadingMessages = ref(false)

// WebSocket related
const cable = ref(null)
const channel = ref(null)

// Helper Functions
const formatDate = (date) => format(new Date(date), 'HH:mm')

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// API Calls
const fetchCurrentUser = async () => {
  try {
    if (!authStore.token) {
      throw new Error('No token available')
    }
    console.log('Current user from store:', authStore.user)
    currentUser.value = authStore.user
  } catch (error) {
    console.error('Error fetching current user:', error)
    router.push('/login')
  }
}

const fetchUsers = async () => {
  try {
    loading.value = true
    console.log('Fetching users...')
    const { data } = await axios.get('/api/v1/users')
    console.log('Users received:', data)
    users.value = data.filter(user => user.id !== currentUser.value?.id)
    console.log('Filtered users:', users.value)
  } catch (error) {
    console.error('Error fetching users:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
  } finally {
    loading.value = false
  }
}

const fetchMessages = async () => {
  if (!selectedUser.value) return;

  try {
    const { data } = await axios.get('/api/v1/messages', {
      params: { user_id: selectedUser.value.id }
    });
    messages.value = data;
    scrollToBottom();
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
  }
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedUser.value) return;

  try {
    const response = await axios.post('/api/v1/messages', {
      message: {
        content: newMessage.value,
        recipient_id: selectedUser.value.id
      }
    });

    // Adiciona a mensagem localmente
    messages.value.push(response.data);
    newMessage.value = '';
    scrollToBottom();
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
  }
};

// User Actions
const selectUser = (user) => {
  console.log('Selected user:', user)
  selectedUser.value = user
  setupChatChannel()
  fetchMessages()
}

const logout = async () => {
  try {
    if (channel.value) channel.value.unsubscribe()
    if (cable.value) cable.value.disconnect()
    await authStore.logout()
    await router.push('/login')
  } catch (error) {
    console.error('Error during logout:', error)
  }
}

// WebSocket Setup
// Setup ActionCable
const setupChatChannel = () => {
  if (!currentUser.value) return;

  if (channel.value) {
    channel.value.unsubscribe();
  }

  const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3000';
  cable.value = createConsumer(`${wsUrl}/cable?token=${authStore.token}`);

  channel.value = cable.value.subscriptions.create(
      { channel: 'ChatChannel' },
      {
        connected() {
          console.log('Connected to ChatChannel');
        },
        received(data) {
          messages.value.push(data);
          scrollToBottom();
        }
      }
  );
};

// Lifecycle Hooks
onMounted(async () => {
  console.log('Chat component mounted')
  await fetchCurrentUser()
  if (currentUser.value) {
    await fetchUsers()
    setupChatChannel()
  }
})

// Watchers
watch(selectedUser, () => {
  if (selectedUser.value) {
    fetchMessages()
  } else {
    messages.value = []
  }
})
</script>