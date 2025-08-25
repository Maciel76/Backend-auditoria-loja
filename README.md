# Auditoria de Setores - Backend

## O que é este sistema?
Este backend é responsável por processar, armazenar e disponibilizar os dados de auditoria de setores de lojas. Ele recebe uploads de planilhas, persiste os dados no MongoDB, fornece rotas para consulta, estatísticas, relatórios e integrações com o frontend.

## Tecnologias utilizadas
- **Node.js**: Plataforma principal
- **Express**: Framework para rotas e APIs
- **MongoDB**: Banco de dados NoSQL
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
git clone https://github.com/SeuUsuario/Auditoria-loja.git
```

### 2. Instalar dependências do backend

```sh
cd Auditoria-loja/backend
npm install
```

### 3. Configurar o MongoDB
- Certifique-se de ter o MongoDB instalado e rodando localmente (padrão: mongodb://localhost:27017)
- O backend já está configurado para conectar no banco local

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
Se tiver dúvidas, consulte o README do frontend ou entre em contato com o desenvolvedor.
