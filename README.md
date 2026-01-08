# Auditoria de Setores - Backend

## O que é este sistema?

Este backend é responsável por processar, armazenar e disponibilizar os dados de auditoria de setores de lojas. Ele recebe uploads de planilhas, persiste os dados no MongoDB, fornece rotas para consulta, estatísticas, relatórios e integrações com o frontend.

## Tecnologias utilizadas

- **Node.js**: Plataforma principal
- **Express**: Framework para rotas e APIs
- **MongoDB**: Banco de dados NoSQL (suporte para MongoDB Atlas)
- **Mongoose**: ODM para MongoDB
- **Multer**: Upload de arquivos
- **xlsx**: Leitura de planilhas Excel

## Propósito

Facilitar o controle e análise de auditorias em lojas, permitindo integração com o frontend, persistência dos dados, geração de relatórios e estatísticas por setor, colaborador e data.

## O que ele faz?

- Recebe uploads de planilhas de auditoria
- Persiste dados de produtos, setores, colaboradores e auditorias
- Disponibiliza rotas para consulta, estatísticas e relatórios
- Permite filtrar dados por data, setor, status, produto
- Exporta dados para o frontend

## Passo a passo para rodar localmente

### 1. Clonar o projeto

```sh
git clone https://github.com/Maciel76/Auditoria-loja.git
git clone https://github.com/Maciel76/Backend-auditoria-loja.git
```

### 2. Organizar a estrutura de pastas

Crie uma pasta chamada `auditoria` e mova as pastas `Auditoria-loja` (frontend) e `Backend-auditoria-loja` (backend) para dentro dela. A estrutura final ficará assim:

```
auditoria/
├── frontend/      # Código do frontend (Auditoria-loja)
├── backend/       # Código do backend (Backend-auditoria-loja)
```

Renomeie as pastas, se necessário, para `frontend` e `backend` para facilitar o uso dos comandos seguintes.

### 2. Instalar dependências do backend

```sh
cd Auditoria-loja/backend
npm install
```

### 3. Configurar o MongoDB

#### MongoDB Local (padrão)
- Certifique-se de ter o MongoDB instalado e rodando localmente (padrão: mongodb://127.0.0.1:27017)
- O backend já está configurado para conectar no banco local

#### MongoDB Atlas (nuvem) - Recomendado para produção
- Crie uma conta no [MongoDB Atlas](https://www.mongodb.com/atlas/database)
- Crie um cluster gratuito
- Configure seu IP para acesso (adicionar 0.0.0.0/0 para acesso de qualquer lugar ou adicione seu IP específico)
- Crie um usuário de banco de dados
- Copie a string de conexão fornecida pelo Atlas
- Crie um arquivo `.env` na raiz do diretório backend com a variável `MONGODB_URI`:

```
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database-name>?retryWrites=true&w=majority
```

### 4. Iniciar o backend

```sh
node server.js
```

### 5. Testar rotas

- O backend estará rodando em `http://localhost:3000`
- Use o frontend para consumir as rotas ou ferramentas como Postman/Insomnia para testar as APIs

## Principais rotas

- `POST /upload` - Upload de planilha
- `GET /dados-setores` - Consulta de dados dos setores
- `GET /datas-auditoria` - Datas disponíveis para filtro
- `GET /estatisticas-setores` - Estatísticas por setor
- `GET /relatorios` - Relatórios gerais

## Requisitos

- Node.js (v18 ou superior)
- npm
- MongoDB
- Git

---

Se tiver dúvidas, ou entre em contato com o desenvolvedor.

- [WhatsApp: (62) 98280-9010](https://wa.me/5562982809010)
- [E-mail: stwcontato@hotmail.com](mailto:stwcontato@hotmail.com)
