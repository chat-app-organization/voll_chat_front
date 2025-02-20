<template>
  <div class="flex flex-col h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-white shadow p-4">
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-semibold">Chat</h1>

        <!-- Mostra o usuário logado ao lado do botão Logout -->
        <div class="flex items-center gap-4">
          <span class="text-gray-700">Logado como: <strong>{{ currentUser?.email }}</strong></span>
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
          <h2 class="text-lg font-semibold mb-4 text-black">Usuários</h2>

          <!-- Loading State -->
          <div v-if="loading" class="text-center text-gray-500">
            Carregando...
          </div>

          <!-- Empty State -->
          <div v-else-if="users.length === 0" class="text-center text-gray-500">
            Nenhum usuário disponível.
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
            Carregando mensagens...
          </div>

          <!-- No User Selected -->
          <div v-else-if="!selectedUser" class="text-center text-gray-500">
            Selecione um usuário para iniciar o chat.
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
                placeholder="Digite sua mensagem..."
                class="flex-1 p-2 border rounded text-black bg-white"
                :disabled="!selectedUser"
            />
            <button
                type="submit"
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                :disabled="!selectedUser || !newMessage.trim()"
            >
              Enviar
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

// Instâncias e variáveis
const router = useRouter();
const authStore = useAuthStore();

const currentUser = ref(null); // Usuário logado
const users = ref([]); // Lista de usuários
const selectedUser = ref(null); // Usuário selecionado
const messages = ref([]); // Mensagens na conversa
const newMessage = ref(''); // Conteúdo da nova mensagem
const loading = ref(false); // Indicador de carregamento de usuários
const loadingMessages = ref(false); // Indicador de carregamento de mensagens
const messagesContainer = ref(null); // Contêiner para scroll automático

const cable = ref(null); // WebSocket
const channel = ref(null); // Canal WebSocket

// Funções auxiliares
const formatDate = (date) => format(new Date(date), 'HH:mm');

// Scroll para baixo
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

// Computed: Mensagens ordenadas
const sortedMessages = computed(() =>
    [...messages.value].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
);

// Busca o usuário logado
const fetchCurrentUser = async () => {
  try {
    if (!authStore.token) throw new Error('Sem token disponível');
    currentUser.value = authStore.user;
  } catch (error) {
    console.error('Erro ao buscar usuário atual:', error);
    router.push('/login');
  }
};

// Busca a lista de usuários
const fetchUsers = async () => {
  try {
    loading.value = true;
    const { data } = await axios.get('/api/v1/users');
    users.value = data.filter((user) => user.id !== currentUser.value?.id);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
  } finally {
    loading.value = false;
  }
};

// Busca as mensagens do usuário selecionado
const fetchMessages = async () => {
  if (!selectedUser.value) return;

  try {
    loadingMessages.value = true;
    const { data } = await axios.get('/api/v1/messages', {
      params: { user_id: selectedUser.value.id }
    });
    messages.value = data;
    scrollToBottom(); // Atualiza o scroll
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
  } finally {
    loadingMessages.value = false;
  }
};

// Envia uma nova mensagem
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

    messages.value.push(response.data); // Adiciona à lista local
    newMessage.value = ''; // Limpa o campo de entrada
    scrollToBottom();
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
  }
};

// Configura WebSocket
const setupChatChannel = () => {
  if (!currentUser.value) {
    console.error('Usuário atual não definido!');
    return;
  }

  // Verifica se o canal já está configurado para o usuário atual
  if (channel.value && selectedUser.value) {
    console.log('Canal já configurado. Nenhuma nova assinatura necessária.');
    return; // Impede reconfiguração desnecessária
  }

  // Desconecte o canal antigo, se houver
  if (channel.value) {
    channel.value.unsubscribe();
    console.log('Canal anterior desconectado.');
  }

  // Conecta ao WebSocket do servidor
  const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3000';
  cable.value = createConsumer(`${wsUrl}/cable?token=${authStore.token}`);

  // Assina o canal
  channel.value = cable.value.subscriptions.create(
      { channel: 'ChatChannel' },
      {
        connected() {
          console.log('Conectado ao WebSocket no ChatChannel.');
        },
        received(data) {
          console.log('Nova mensagem via WebSocket:', data);

          if (
              selectedUser.value &&
              (data.sender.id === selectedUser.value.id || data.sender.id === currentUser.value.id)
          ) {
            const exists = messages.value.some((msg) => msg.id === data.id);
            if (!exists) {
              messages.value.push(data); // Adiciona a mensagem ao chat
              scrollToBottom();
            }
          } else {
            console.warn('Mensagem recebida não pertence à conversa ativa.');
          }
        },
        disconnected() {
          console.log('WebSocket desconectado do ChatChannel.');
        }
      }
  );
};

// Ações de usuário
const selectUser = (user) => {
  selectedUser.value = user;
};

const logout = () => {
  try {
    authStore.logout(); // Chama o método logout da store
    router.push('/login'); // Redireciona para a página de login
  } catch (error) {
    console.error('Erro ao executar logout:', error);
  }
};



// Lifecycle
onMounted(async () => {
  await fetchCurrentUser();
  await fetchUsers();
});

// Watches
watch(selectedUser, async (newUser) => {
  if (newUser) {
    await fetchMessages();
    setupChatChannel();
  }
});
</script>