# Voll Chat Front-End

Este é o front-end do **Voll Chat**, uma aplicação desenvolvida utilizando **Vue 3** e **Vite**.

## Índice
- [Pré-requisitos](#pré-requisitos)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Instalação e Execução](#instalação-e-execução)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Licença](#licença)

---

## Pré-requisitos

Antes de começar, você vai precisar ter os seguintes itens instalados:

- **Node.js** (versão 20 ou superior) - [Download Node.js](https://nodejs.org/)
- **npm** (gerenciador de pacotes do Node.js)

---

## Tecnologias Utilizadas

- **Vue 3** - Framework JavaScript progressivo.
- **Vite** - Ferramenta de build e desenvolvimento ultrarrápida.
- **Pinia** - Gerenciador de estado.
- **Vue Router** - Gerenciamento de rotas.
- **TailwindCSS** - Framework CSS utilitário.
- **Axios** - Cliente HTTP para consumo de APIs.
- **Date-Fns** - Biblioteca para manipulação de datas.

---

## Instalação e Execução

Siga os passos abaixo para instalar e executar o projeto em sua máquina local:

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/voll_chat_front.git
   ```

2. Acesse o diretório do projeto:
   ```bash
   cd voll_chat_front
   ```

3. Instale as dependências:
   ```bash
   npm install
   ```

4. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

5. Abra o navegador e acesse:
   ```
   http://localhost:5173/
   ```

---

## Estrutura de Pastas

Abaixo está uma visão geral básica da estrutura do projeto:

```plaintext
voll_chat_front/
├── public/                # Arquivos estáticos (imagens, fontes, etc.)
├── src/                   # Código fonte do projeto
│   ├── assets/            # Estilos e recursos (CSS, imagens)
│   ├── components/        # Componentes reutilizáveis Vue.js
│   ├── router/            # Configuração de rotas do Vue Router
│   ├── stores/            # Configurações do estado (Pinia)
│   ├── views/             # Páginas principais da aplicação
│   ├── App.vue            # Componente principal da aplicação
│   └── main.js            # Arquivo principal do Vue.js
├── .gitignore             # Arquivos/folders ignorados no Git
├── index.html             # Entrada principal do Vite
├── package.json           # Lista de dependências do projeto
├── postcss.config.js      # Configurações do PostCSS
├── tailwind.config.js     # Configurações do TailwindCSS
└── vite.config.js         # Configuração do Vite
```

---

## Scripts Disponíveis

Os scripts abaixo estão configurados no `package.json` e podem ser executados com `npm run <script>`:

- `dev`: Inicia o servidor de desenvolvimento local.

---

## Licença

Este projeto está sob a licença **MIT**.