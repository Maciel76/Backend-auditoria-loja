// Script de teste para atualizar cover da loja
const http = require('http');

const BACKEND_URL = 'http://localhost:3000';

async function testarAtualizacaoCover() {
  try {
    console.log('🧪 Iniciando teste de atualização de cover...\n');

    // Teste 1: Tentar atualizar cover para loja 105
    const lojaCodigo = '105';
    const coverId = 'gradient-5'; // Vermelho Laranja

    console.log(`📍 Testando para loja: ${lojaCodigo}`);
    console.log(`🎨 Cover a ser aplicado: ${coverId}\n`);

    const postData = JSON.stringify({ coverId: coverId });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/atualizar-cover',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-loja': lojaCodigo,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    return new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let data = '';

        console.log(`📊 Status da resposta: ${res.statusCode} ${res.statusMessage}`);

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log('\n✅ SUCESSO! Cover atualizado:');
            try {
              const jsonData = JSON.parse(data);
              console.log(JSON.stringify(jsonData, null, 2));
            } catch (e) {
              console.log(data);
            }
            resolve(true);
          } else {
            console.log('\n❌ ERRO na resposta:');
            console.log(data);
            resolve(false);
          }
        });
      });

      req.on('error', (error) => {
        console.error('\n❌ ERRO na requisição:', error.message);
        resolve(false);
      });

      req.write(postData);
      req.end();
    });

  } catch (error) {
    console.error('\n❌ ERRO no teste:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Executar teste
console.log('═══════════════════════════════════════════════════');
console.log('     TESTE DE ATUALIZAÇÃO DE COVER DA LOJA');
console.log('═══════════════════════════════════════════════════\n');

testarAtualizacaoCover()
  .then(sucesso => {
    console.log('\n═══════════════════════════════════════════════════');
    if (sucesso) {
      console.log('✅ TESTE CONCLUÍDO COM SUCESSO!');
      console.log('O cover foi salvo corretamente no banco de dados.');
    } else {
      console.log('❌ TESTE FALHOU!');
      console.log('Verifique os logs acima para mais detalhes.');
    }
    console.log('═══════════════════════════════════════════════════');
    process.exit(sucesso ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  });
