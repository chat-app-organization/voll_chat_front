<template>
  <div class="flex flex-col h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-white shadow p-4">
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-semibold">Chat</h1>

        <!-- Display logged-in user beside Logout button -->
        <div class="flex items-center gap-4">
          <span class="text-gray-700">Logged in as: <strong>{{ currentUser?.email }}</strong></span>
          <button
              @click="logout"
              class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <!-- Main Chat Area -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Users List -->
      <div class="w-1/4 bg-white border-r overflow-hidden">
        <div class="p-4">
          <h2 class="text-lg font-semibold mb-4 text-black">Users</h2>

          <!-- Loading State -->
          <div v-if="loading" class="text-center text-gray-500">
            Loading...
          </div>

          <!-- Empty State -->
          <div v-else-if="users.length === 0" class="text-center text-gray-500">
            No users available.
          </div>

          <!-- Users List -->
          <div
              v-else
              v-for="user in users"
              :key="user.id"
              @click="selectUser(user)"
              class="p-3 cursor-pointer rounded border hover:bg-gray-100 bg-white text-black truncate"
              :class="{ 'bg-blue-100': selectedUser?.id === user.id }"
          >
            {{ user.email }}
          </div>
        </div>
      </div>

      <!-- Chat Messages Area -->
      <div class="flex-1 flex flex-col">
        <!-- Messages Container -->
        <div ref="messagesContainer" class="flex-1 p-4 overflow-y-auto">
          <!-- Loading State -->
          <div v-if="loadingMessages" class="text-center text-gray-500">
            Loading messages...
          </div>

          <!-- No User Selected -->
          <div v-else-if="!selectedUser" class="text-center text-gray-500">
            Select a user to start the chat.
          </div>

          <!-- Messages -->
          <div
              v-else
              v-for="message in sortedMessages"
              :key="message.id"
              :class="[
              'mb-4 max-w-[70%] rounded-lg p-3',
              message.sender.id === currentUser.id
                ? 'ml-auto bg-blue-500 text-white'
                : 'bg-gray-200 text-black'
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
                placeholder="Enter your message..."
                class="flex-1 p-2 border rounded text-black bg-white"
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
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { createConsumer } from '@rails/actioncable'
import axios from '@/plugins/axios'
import { format } from 'date-fns'

const router = useRouter();
const authStore = useAuthStore();

const currentUser = ref(null);
const users = ref([]);
const selectedUser = ref(null);
const messages = ref([]);
const newMessage = ref('');
const loading = ref(false);
const loadingMessages = ref(false);
const messagesContainer = ref(null);

const cable = ref(null);
const channel = ref(null);

const formatDate = (date) => format(new Date(date), 'HH:mm');

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const sortedMessages = computed(() =>
    [...messages.value].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
);

const fetchCurrentUser = async () => {
  try {
    if (!authStore.token) throw new Error('No token available');
    currentUser.value = authStore.user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    router.push('/login');
  }
};

const fetchUsers = async () => {
  try {
    loading.value = true;
    const { data } = await axios.get('/api/v1/users');
    users.value = data.filter((user) => user.id !== currentUser.value?.id);
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    loading.value = false;
  }
};

const fetchMessages = async () => {
  if (!selectedUser.value) return;

  try {
    loadingMessages.value = true;
    const { data } = await axios.get('/api/v1/messages', {
      params: { user_id: selectedUser.value.id }
    });
    messages.value = data;
    scrollToBottom();
  } catch (error) {
    console.error('Error fetching messages:', error);
  } finally {
    loadingMessages.value = false;
  }
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedUser.value) return;

  try {
    const response = await axios.post('/api/v1/messages', {
      message: {
        content: newMessage.value,
        sender_id: currentUser.value.id,
        recipient_id: selectedUser.value.id
      }
    });

    messages.value.push(response.data);
    newMessage.value = '';
    scrollToBottom();
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

const setupChatChannel = () => {
  if (!currentUser.value) {
    console.error('Current user not defined!');
    return;
  }

  if (channel.value && selectedUser.value) {
    console.log('Channel already set up. No new subscription is needed.');
    return;
  }

  if (channel.value) {
    channel.value.unsubscribe();
    console.log('Previous channel disconnected.');
  }

  const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3000';
  cable.value = createConsumer(`${wsUrl}/cable?token=${authStore.token}`);

  channel.value = cable.value.subscriptions.create(
      { channel: 'ChatChannel' },
      {
        connected() {
          console.log('Connected to WebSocket on ChatChannel.');
        },
        received(data) {
          console.log('New message via WebSocket:', data);

          if (
              selectedUser.value &&
              (data.sender.id === selectedUser.value.id || data.sender.id === currentUser.value.id)
          ) {
            const exists = messages.value.some((msg) => msg.id === data.id);
            if (!exists) {
              messages.value.push(data);
              scrollToBottom();
            }
          } else {
            console.warn('Received message does not belong to the active conversation.');
          }
        },
        disconnected() {
          console.log('WebSocket disconnected from ChatChannel.');
        }
      }
  );
};

const selectUser = (user) => {
  selectedUser.value = user;
};

const logout = () => {
  try {
    authStore.logout();
    router.push('/login');
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

onMounted(async () => {
  await fetchCurrentUser();
  await fetchUsers();
});

watch(selectedUser, async (newUser) => {
  if (newUser) {
    await fetchMessages();
    setupChatChannel();
  }
});
</script>