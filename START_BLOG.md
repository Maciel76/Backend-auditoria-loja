# 🚀 Guia de Inicialização do Blog

## 📋 Pré-requisitos

1. **MongoDB** deve estar rodando na porta padrão (27017)
2. **Node.js** instalado
3. **Frontend Vue** rodando (porta 8080)

---

## ⚡ Passo a Passo para Iniciar

### 1. Verificar se o MongoDB está rodando

```bash
# Windows (abra um terminal/cmd)
mongod --version

# Ou verifique se o serviço está ativo
# Se não estiver rodando, inicie:
net start MongoDB
```

### 2. Iniciar o Backend

```bash
# Navegue até a pasta do backend
cd "C:\Users\Maciel Ribeiro\Desktop\Projetos\backoff\backend"

# Inicie o servidor
node server.js
```

**Você deve ver:**
```
✅ Conectado ao MongoDB Local
✅ Rotas de loja carregadas
✅ Rotas de upload carregadas
✅ Rotas de artigos carregadas
...
🚀 SERVIDOR DE AUDITORIAS COM MÉTRICAS RODANDO
📍 URL: http://localhost:3000
```

### 3. Testar a API

Abra o navegador e acesse:
```
http://localhost:3000/test
```

Você deve ver:
```json
{
  "message": "Servidor funcionando",
  "loja": "não especificada"
}
```

### 4. Testar a API de Artigos

```
http://localhost:3000/api/articles
```

Deve retornar:
```json
{
  "artigos": [],
  "paginacao": {
    "total": 0,
    "pagina": 1,
    "limite": 20,
    "totalPaginas": 0
  }
}
```

### 5. Acessar o Dashboard

No frontend Vue, acesse:
```
http://localhost:8080/dashboard
```

Clique em **"Blog"** no menu lateral e depois em **"Nova Postagem"**.

---

## 🐛 Resolução de Problemas

### Erro: "Backend não está rodando"

**Solução:** Verifique se o servidor está rodando em `http://localhost:3000`

```bash
# No terminal onde o backend está rodando, você deve ver:
🚀 SERVIDOR DE AUDITORIAS COM MÉTRICAS RODANDO
📍 URL: http://localhost:3000
```

### Erro: "Erro ao conectar ao MongoDB"

**Solução 1:** Inicie o MongoDB
```bash
# Windows
net start MongoDB

# Ou inicie manualmente
mongod
```

**Solução 2:** Verifique se está rodando na porta correta
```bash
# Deve estar em: mongodb://127.0.0.1:27017/auditoria
```

### Erro: "CORS Error" ou "Network Error"

**Solução:** Verifique se o backend está configurado para aceitar requisições do frontend

O arquivo `server.js` já tem CORS configurado:
```javascript
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, x-loja");
  next();
});
```

### Erro: "Título é obrigatório" ou "Conteúdo é obrigatório"

**Solução:** Preencha todos os campos obrigatórios:
- ✅ Título
- ✅ Conteúdo (use o editor Quill)
- ✅ Pelo menos 1 categoria

---

## 📝 Criar Seu Primeiro Artigo

1. **Acesse o Dashboard:** `http://localhost:8080/dashboard`
2. **Clique em "Blog"** no menu lateral
3. **Clique em "Nova Postagem"** (botão roxo no topo)
4. **Preencha o formulário:**
   - **Imagem de Capa:** Cole uma URL de imagem (ex: https://via.placeholder.com/800x450)
   - **Título:** "Meu Primeiro Artigo"
   - **Slug:** Deixe vazio (será gerado automaticamente)
   - **Conteúdo:** Escreva algo no editor Quill
   - **Resumo:** Breve descrição
   - **Autor:** Seu nome
   - **Categorias:** Selecione pelo menos uma
   - **Tags:** Digite e pressione Enter para adicionar
   - **Status:** Publicado
   - **Destaque:** Marque se quiser que apareça no topo do blog

5. **Clique em "Publicar"**

6. **Visualize no blog:** Acesse `http://localhost:8080/blog`

---

## 🧪 Testar o Sistema Completo

### Teste 1: Criar Artigo
- ✅ Dashboard → Blog → Nova Postagem → Preencher → Publicar
- ✅ Deve aparecer um toast verde: "Artigo criado com sucesso!"

### Teste 2: Ver Artigo no Blog
- ✅ Acesse `/blog`
- ✅ Deve aparecer o artigo criado
- ✅ Clique no artigo para ver os detalhes

### Teste 3: Editar Artigo
- ✅ Dashboard → Blog → Clique no ícone de editar
- ✅ Altere o título
- ✅ Clique em "Atualizar"

### Teste 4: Marcar como Destaque
- ✅ Dashboard → Blog → Clique no ícone de estrela
- ✅ Artigo deve aparecer com badge "Destaque"
- ✅ No blog público, deve aparecer no topo

### Teste 5: Publicar/Despublicar
- ✅ Dashboard → Blog → Clique no ícone de olho
- ✅ Status deve mudar de "Publicado" para "Rascunho"

### Teste 6: Adicionar Comentário
- ✅ Blog → Clique em um artigo
- ✅ Role até "Deixe seu comentário"
- ✅ Preencha nome e comentário
- ✅ Clique em "Enviar Comentário"

### Teste 7: Compartilhar
- ✅ Blog → Artigo → Botões de compartilhamento
- ✅ Clique em "Copiar Link"
- ✅ Toast deve mostrar: "Link copiado!"

---

## 📊 Verificar Dados no MongoDB

Caso queira ver os dados salvos no banco:

```bash
# Abra o MongoDB Compass ou use o shell
mongo

# Selecione o database
use auditoria

# Veja os artigos
db.articles.find().pretty()

# Contar artigos
db.articles.count()

# Ver artigo em destaque
db.articles.findOne({ destaque: true })

# Ver artigos publicados
db.articles.find({ status: 'published' }).pretty()
```

---

## 🎯 Checklist de Verificação

Antes de criar um artigo, verifique:

- [ ] MongoDB está rodando
- [ ] Backend está rodando (http://localhost:3000)
- [ ] Frontend está rodando (http://localhost:8080)
- [ ] API responde em http://localhost:3000/test
- [ ] Console do backend não tem erros
- [ ] Console do navegador não tem erros de CORS

---

## 💡 Dicas Úteis

1. **Editor Quill:** Use a barra de ferramentas para formatar o texto (negrito, itálico, listas, etc.)

2. **Slug:** É a URL amigável do artigo. Exemplo:
   - Título: "Como Criar um Blog"
   - Slug: "como-criar-um-blog"
   - URL final: `/blog/[id]`

3. **Categorias:** Escolha a categoria que melhor descreve o artigo

4. **Tags:** Use tags específicas para facilitar a busca (ex: "vue", "javascript", "tutorial")

5. **Imagens:** Use URLs de imagens externas ou serviços como:
   - Unsplash: https://unsplash.com
   - Placeholder: https://via.placeholder.com/800x450
   - Lorem Picsum: https://picsum.photos/800/450

6. **Tempo de Leitura:** É calculado automaticamente baseado no conteúdo (200 palavras/minuto)

---

## 🔧 Comandos Úteis

### Reiniciar o Backend
```bash
# Pressione Ctrl+C para parar
# Depois execute novamente:
node server.js
```

### Ver Logs do Backend
```bash
# Os logs aparecem no terminal onde você executou:
node server.js
```

### Limpar o Cache do Navegador
```bash
# No navegador, pressione:
Ctrl + Shift + Delete
# Ou
Ctrl + F5 (hard refresh)
```

---

## 📞 Ainda com Problemas?

Se ainda estiver tendo erros:

1. **Verifique o console do navegador** (F12 → Console)
   - Deve mostrar o erro exato

2. **Verifique o terminal do backend**
   - Deve mostrar o erro do servidor

3. **Teste a API manualmente:**
   ```bash
   # Windows PowerShell
   Invoke-RestMethod -Uri http://localhost:3000/api/articles -Method GET

   # Ou use Postman/Insomnia para testar
   ```

4. **Verifique se todas as dependências estão instaladas:**
   ```bash
   cd backend
   npm install
   ```

---

## ✅ Tudo Funcionando?

Se tudo estiver funcionando corretamente, você deve conseguir:

- ✅ Criar artigos pelo dashboard
- ✅ Ver artigos no blog público
- ✅ Editar artigos
- ✅ Excluir artigos
- ✅ Marcar como destaque
- ✅ Publicar/despublicar
- ✅ Adicionar comentários
- ✅ Compartilhar artigos

**Parabéns! Seu sistema de blog está funcionando perfeitamente!** 🎉
