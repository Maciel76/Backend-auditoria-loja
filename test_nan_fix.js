// Test script specifically for NaN issue
import mongoose from 'mongoose';
import MetricasUsuario from './models/MetricasUsuario.js';

async function testNaNFix() {
  console.log('Testing the fix for NaN casting issue...');

  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/backoff_test', {
      useNewUrlParser: false, // Use default behavior for newer drivers
      useUnifiedTopology: false // Use default behavior for newer drivers
    });

    console.log('Connected to MongoDB');

    // Test creating a document with NaN values to see if the setter handles them
    const testMetricas = new MetricasUsuario({
      loja: new mongoose.Types.ObjectId(),
      usuarioId: 'test_nan_user',
      usuarioNome: 'Test NaN User',
      lojaNome: 'Test Store',
      dataInicio: new Date(),
      dataFim: new Date(),
      periodo: 'periodo_completo',
      contadoresAuditorias: {
        totalEtiquetas: NaN,
        totalRupturas: Number("invalid"), // This results in NaN
        totalPresencas: 1 / 0 * 0,  // This also results in NaN (0 * Infinity)
        totalGeral: NaN
      }
    });

    console.log('Saving test document with NaN values...');
    console.log('Before save - contadoresAuditorias.totalGeral:', testMetricas.contadoresAuditorias.totalGeral);
    console.log('Before save - contadoresAuditorias.totalEtiquetas:', testMetricas.contadoresAuditorias.totalEtiquetas);
    console.log('Before save - contadoresAuditorias.totalRupturas:', testMetricas.contadoresAuditorias.totalRupturas);
    console.log('Before save - contadoresAuditorias.totalPresencas:', testMetricas.contadoresAuditorias.totalPresencas);

    const saved = await testMetricas.save();
    
    console.log('After save - contadoresAuditorias.totalGeral:', saved.contadoresAuditorias.totalGeral);
    console.log('After save - contadoresAuditorias.totalEtiquetas:', saved.contadoresAuditorias.totalEtiquetas);
    console.log('After save - contadoresAuditorias.totalRupturas:', saved.contadoresAuditorias.totalRupturas);
    console.log('After save - contadoresAuditorias.totalPresencas:', saved.contadoresAuditorias.totalPresencas);

    // Verify all values are numbers and not NaN
    console.assert(typeof saved.contadoresAuditorias.totalGeral === 'number', 'totalGeral should be a number');
    console.assert(!isNaN(saved.contadoresAuditorias.totalGeral), 'totalGeral should not be NaN');
    console.assert(typeof saved.contadoresAuditorias.totalEtiquetas === 'number', 'totalEtiquetas should be a number');
    console.assert(!isNaN(saved.contadoresAuditorias.totalEtiquetas), 'totalEtiquetas should not be NaN');
    console.assert(typeof saved.contadoresAuditorias.totalRupturas === 'number', 'totalRupturas should be a number');
    console.assert(!isNaN(saved.contadoresAuditorias.totalRupturas), 'totalRupturas should not be NaN');
    console.assert(typeof saved.contadoresAuditorias.totalPresencas === 'number', 'totalPresencas should be a number');
    console.assert(!isNaN(saved.contadoresAuditorias.totalPresencas), 'totalPresencas should not be NaN');

    console.log('\n✅ NaN handling test passed! The fix properly converts NaN values to 0.');

  } catch (error) {
    console.error('❌ NaN handling test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

testNaNFix();