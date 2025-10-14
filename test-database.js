import mongoose from 'mongoose';
import MetricasUsuario from './models/MetricasUsuario.js';

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/auditoria');

async function testDatabase() {
  try {
    console.log('🔍 Verificando registros MetricasUsuario...');

    // Buscar alguns registros
    const registros = await MetricasUsuario.find({}).limit(5).select('usuarioNome lojaNome loja');

    console.log(`📊 Total de registros encontrados: ${registros.length}`);

    registros.forEach((registro, index) => {
      console.log(`${index + 1}. Usuario: ${registro.usuarioNome}`);
      console.log(`   lojaNome: ${registro.lojaNome || 'NÃO DEFINIDO'}`);
      console.log(`   loja ObjectId: ${registro.loja}`);
      console.log('---');
    });

    // Verificar quantos têm lojaNome
    const comLojaNome = await MetricasUsuario.countDocuments({ lojaNome: { $exists: true, $ne: null } });
    const total = await MetricasUsuario.countDocuments();

    console.log(`📈 Registros com lojaNome: ${comLojaNome} de ${total}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    mongoose.disconnect();
  }
}

testDatabase();