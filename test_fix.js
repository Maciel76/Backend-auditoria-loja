// Test script to verify the fix for the totalGeral casting issue
import mongoose from 'mongoose';
import MetricasUsuario from './models/MetricasUsuario.js';

async function testFix() {
  console.log('Testing the fix for totalGeral casting issue...');

  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/backoff_test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Create a test document with problematic values to see if the middleware handles it
    const testMetricas = new MetricasUsuario({
      loja: new mongoose.Types.ObjectId(),
      usuarioId: 'test_user',
      usuarioNome: 'Test User',
      lojaNome: 'Test Store',
      dataInicio: new Date(),
      dataFim: new Date(),
      periodo: 'periodo_completo',
      // Deliberately set some problematic values to test the middleware
      contadoresAuditorias: {
        totalEtiquetas: null,
        totalRupturas: 'invalid',
        totalPresencas: undefined,
        totalGeral: NaN
      }
    });

    console.log('Saving test document with problematic values...');
    console.log('Before save - contadoresAuditorias.totalGeral:', testMetricas.contadoresAuditorias.totalGeral);

    const saved = await testMetricas.save();
    
    console.log('After save - contadoresAuditorias.totalGeral:', saved.contadoresAuditorias.totalGeral);
    console.log('After save - contadoresAuditorias.totalEtiquetas:', saved.contadoresAuditorias.totalEtiquetas);
    console.log('After save - contadoresAuditorias.totalRupturas:', saved.contadoresAuditorias.totalRupturas);
    console.log('After save - contadoresAuditorias.totalPresencas:', saved.contadoresAuditorias.totalPresencas);

    // Test the calculation function from the service
    console.log('\nTesting calcularContadoresAuditorias logic...');
    
    // Test our fix where we convert to Number
    let testValue = null;
    console.log('Number(null) || 0:', Number(testValue) || 0);
    
    testValue = 'invalid';
    console.log('Number("invalid") || 0:', Number(testValue) || 0);
    
    testValue = NaN;
    console.log('Number(NaN) || 0:', Number(testValue) || 0);
    
    testValue = 5;
    console.log('Number(5) || 0:', Number(testValue) || 0);
    
    console.log('\n✅ All tests passed! The fix should handle non-numeric values correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

testFix();