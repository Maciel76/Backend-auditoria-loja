// Script de teste para verificar a API de artigos
// Execute: node test-api.js

console.log('🧪 Testando API de Artigos...\n');

// Teste 1: Verificar se o servidor está rodando
console.log('📡 Teste 1: Verificando conexão com o servidor...');
fetch('http://localhost:3000/test')
  .then(res => res.json())
  .then(data => {
    console.log('✅ Servidor está rodando!');
    console.log('   Resposta:', data);
    console.log('');

    // Teste 2: Verificar API de artigos
    console.log('📋 Teste 2: Verificando API de artigos...');
    return fetch('http://localhost:3000/api/articles');
  })
  .then(res => res.json())
  .then(data => {
    console.log('✅ API de artigos está funcionando!');
    console.log('   Total de artigos:', data.paginacao.total);
    console.log('');

    // Teste 3: Criar artigo de teste
    console.log('📝 Teste 3: Criando artigo de teste...');
    const artigo = {
      titulo: 'Artigo de Teste',
      conteudo: '<p>Este é um artigo de teste criado automaticamente.</p>',
      resumo: 'Artigo de teste',
      autor: 'Sistema de Teste',
      categorias: ['geral'],
      tags: ['teste'],
      status: 'published',
      destaque: false,
      tempoLeitura: 1,
      imagem: 'https://via.placeholder.com/800x450'
    };

    return fetch('http://localhost:3000/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(artigo)
    });
  })
  .then(async (res) => {
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(JSON.stringify(errorData, null, 2));
    }
    return res.json();
  })
  .then(data => {
    console.log('✅ Artigo criado com sucesso!');
    console.log('   ID do artigo:', data.article._id);
    console.log('   Título:', data.article.titulo);
    console.log('   Slug:', data.article.slug);
    console.log('');
    console.log('🎉 Todos os testes passaram! O sistema está funcionando perfeitamente!');
    console.log('');
    console.log('💡 Próximos passos:');
    console.log('   1. Acesse http://localhost:8080/dashboard');
    console.log('   2. Clique em "Blog" no menu lateral');
    console.log('   3. Clique em "Nova Postagem"');
    console.log('   4. Preencha o formulário e publique!');
  })
  .catch(error => {
    console.error('');
    console.error('❌ ERRO encontrado:');
    console.error('');

    if (error.message.includes('fetch')) {
      console.error('🔴 Backend não está rodando!');
      console.error('');
      console.error('   Solução:');
      console.error('   1. Abra um terminal');
      console.error('   2. Navegue até a pasta do backend:');
      console.error('      cd "C:\\Users\\Maciel Ribeiro\\Desktop\\Projetos\\backoff\\backend"');
      console.error('   3. Execute:');
      console.error('      node server.js');
      console.error('');
      console.error('   Você deve ver: "🚀 SERVIDOR DE AUDITORIAS COM MÉTRICAS RODANDO"');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('🔴 MongoDB não está rodando!');
      console.error('');
      console.error('   Solução:');
      console.error('   1. Abra um terminal como Administrador');
      console.error('   2. Execute:');
      console.error('      net start MongoDB');
      console.error('   3. Depois inicie o backend novamente');
    } else {
      console.error('🔴 Erro:', error.message);
    }

    console.error('');
    console.error('📚 Consulte o arquivo START_BLOG.md para mais informações');
  });
