// popular-metricas.js - Script para popular o banco de dados com métricas de teste
import mongoose from 'mongoose';
import LojaDailyMetrics from './models/LojaDailyMetrics.js';
import Loja from './models/Loja.js';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/auditoria';

async function popularMetricas() {
  try {
    console.log('🔄 Conectando ao MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado ao MongoDB');

    // Buscar loja 056
    const loja = await Loja.findOne({ codigo: '056' });
    if (!loja) {
      console.error('❌ Loja 056 não encontrada! Execute primeiro o script popular-lojas.js');
      process.exit(1);
    }

    console.log(`✅ Loja encontrada: ${loja.nome}`);

    // Limpar métricas existentes da loja 056
    console.log('🔄 Limpando métricas existentes da loja 056...');
    await LojaDailyMetrics.deleteMany({ loja: loja._id });
    console.log('✅ Métricas existentes removidas');

    // Dados de teste para as classes
    const classesEtiquetas = {
      "A CLASSIFICAR": {
        total: 15,
        itensValidos: 12,
        lidos: 10,
        percentual: 83.33,
        itensAtualizados: 8,
        itensDesatualizado: 2,
        usuarios: { "João Silva": 6, "Maria Santos": 4 }
      },
      "ALTO GIRO": {
        total: 120,
        itensValidos: 108,
        lidos: 95,
        percentual: 87.96,
        itensAtualizados: 85,
        itensDesatualizado: 10,
        usuarios: { "Carlos Lima": 50, "Ana Oliveira": 45 }
      },
      "BAZAR": {
        total: 180,
        itensValidos: 150,
        lidos: 130,
        percentual: 86.67,
        itensAtualizados: 115,
        itensDesatualizado: 15,
        usuarios: { "Pedro Costa": 70, "Fernanda Rocha": 60 }
      },
      "DIVERSOS": {
        total: 50,
        itensValidos: 45,
        lidos: 40,
        percentual: 88.89,
        itensAtualizados: 38,
        itensDesatualizado: 2,
        usuarios: { "Ricardo Alves": 40 }
      },
      "DPH": {
        total: 200,
        itensValidos: 180,
        lidos: 160,
        percentual: 88.89,
        itensAtualizados: 145,
        itensDesatualizado: 15,
        usuarios: { "Patrícia Nunes": 90, "Roberto Santos": 70 }
      },
      "FLV": {
        total: 80,
        itensValidos: 70,
        lidos: 55,
        percentual: 78.57,
        itensAtualizados: 50,
        itensDesatualizado: 5,
        usuarios: { "Juliana Costa": 30, "Marcos Oliveira": 25 }
      },
      "LATICINIOS 1": {
        total: 100,
        itensValidos: 85,
        lidos: 70,
        percentual: 82.35,
        itensAtualizados: 65,
        itensDesatualizado: 5,
        usuarios: { "Carla Silva": 40, "Paulo Rodrigues": 30 }
      },
      "LIQUIDA": {
        total: 150,
        itensValidos: 130,
        lidos: 110,
        percentual: 84.62,
        itensAtualizados: 100,
        itensDesatualizado: 10,
        usuarios: { "Amanda Lima": 60, "Diego Souza": 50 }
      },
      "PERECIVEL 1": {
        total: 90,
        itensValidos: 80,
        lidos: 65,
        percentual: 81.25,
        itensAtualizados: 60,
        itensDesatualizado: 5,
        usuarios: { "Camila Rocha": 35, "Lucas Almeida": 30 }
      },
      "PERECIVEL 2": {
        total: 85,
        itensValidos: 75,
        lidos: 60,
        percentual: 80.00,
        itensAtualizados: 55,
        itensDesatualizado: 5,
        usuarios: { "Tatiane Pereira": 30, "Gabriel Santos": 30 }
      },
      "PERECIVEL 2 B": {
        total: 60,
        itensValidos: 50,
        lidos: 40,
        percentual: 80.00,
        itensAtualizados: 38,
        itensDesatualizado: 2,
        usuarios: { "Renata Oliveira": 40 }
      },
      "PERECIVEL 3": {
        total: 70,
        itensValidos: 60,
        lidos: 50,
        percentual: 83.33,
        itensAtualizados: 48,
        itensDesatualizado: 2,
        usuarios: { "Felipe Costa": 50 }
      },
      "SECA DOCE": {
        total: 200,
        itensValidos: 180,
        lidos: 165,
        percentual: 91.67,
        itensAtualizados: 155,
        itensDesatualizado: 10,
        usuarios: { "João Silva": 85, "Maria Santos": 80 }
      },
      "SECA SALGADA": {
        total: 150,
        itensValidos: 130,
        lidos: 115,
        percentual: 88.46,
        itensAtualizados: 105,
        itensDesatualizado: 10,
        usuarios: { "Carlos Lima": 60, "Ana Oliveira": 55 }
      },
      "SECA SALGADA 2": {
        total: 50,
        itensValidos: 45,
        lidos: 40,
        percentual: 88.89,
        itensAtualizados: 38,
        itensDesatualizado: 2,
        usuarios: { "Pedro Costa": 40 }
      }
    };

    const classesRupturas = {
      "A CLASSIFICAR": {
        total: 15,
        itensValidos: 12,
        lidos: 10,
        percentual: 83.33,
        custoRuptura: 125.50,
        usuarios: { "João Silva": 6, "Maria Santos": 4 }
      },
      "ALTO GIRO": {
        total: 120,
        itensValidos: 108,
        lidos: 90,
        percentual: 83.33,
        custoRuptura: 1850.75,
        usuarios: { "Carlos Lima": 50, "Ana Oliveira": 40 }
      },
      "BAZAR": {
        total: 180,
        itensValidos: 150,
        lidos: 120,
        percentual: 80.00,
        custoRuptura: 2200.00,
        usuarios: { "Pedro Costa": 65, "Fernanda Rocha": 55 }
      },
      "DIVERSOS": {
        total: 50,
        itensValidos: 45,
        lidos: 38,
        percentual: 84.44,
        custoRuptura: 450.25,
        usuarios: { "Ricardo Alves": 38 }
      },
      "DPH": {
        total: 200,
        itensValidos: 180,
        lidos: 150,
        percentual: 83.33,
        custoRuptura: 2850.00,
        usuarios: { "Patrícia Nunes": 80, "Roberto Santos": 70 }
      },
      "FLV": {
        total: 80,
        itensValidos: 70,
        lidos: 52,
        percentual: 74.29,
        custoRuptura: 980.50,
        usuarios: { "Juliana Costa": 28, "Marcos Oliveira": 24 }
      },
      "LATICINIOS 1": {
        total: 100,
        itensValidos: 85,
        lidos: 68,
        percentual: 80.00,
        custoRuptura: 1250.00,
        usuarios: { "Carla Silva": 38, "Paulo Rodrigues": 30 }
      },
      "LIQUIDA": {
        total: 150,
        itensValidos: 130,
        lidos: 105,
        percentual: 80.77,
        custoRuptura: 1800.00,
        usuarios: { "Amanda Lima": 55, "Diego Souza": 50 }
      },
      "PERECIVEL 1": {
        total: 90,
        itensValidos: 80,
        lidos: 62,
        percentual: 77.50,
        custoRuptura: 1150.00,
        usuarios: { "Camila Rocha": 32, "Lucas Almeida": 30 }
      },
      "PERECIVEL 2": {
        total: 85,
        itensValidos: 75,
        lidos: 58,
        percentual: 77.33,
        custoRuptura: 950.00,
        usuarios: { "Tatiane Pereira": 28, "Gabriel Santos": 30 }
      },
      "PERECIVEL 2 B": {
        total: 60,
        itensValidos: 50,
        lidos: 38,
        percentual: 76.00,
        custoRuptura: 580.00,
        usuarios: { "Renata Oliveira": 38 }
      },
      "PERECIVEL 3": {
        total: 70,
        itensValidos: 60,
        lidos: 48,
        percentual: 80.00,
        custoRuptura: 720.00,
        usuarios: { "Felipe Costa": 48 }
      },
      "SECA DOCE": {
        total: 200,
        itensValidos: 180,
        lidos: 160,
        percentual: 88.89,
        custoRuptura: 2400.00,
        usuarios: { "João Silva": 82, "Maria Santos": 78 }
      },
      "SECA SALGADA": {
        total: 150,
        itensValidos: 130,
        lidos: 110,
        percentual: 84.62,
        custoRuptura: 1650.00,
        usuarios: { "Carlos Lima": 58, "Ana Oliveira": 52 }
      },
      "SECA SALGADA 2": {
        total: 50,
        itensValidos: 45,
        lidos: 38,
        percentual: 84.44,
        custoRuptura: 570.00,
        usuarios: { "Pedro Costa": 38 }
      }
    };

    const classesPresencas = {
      "A CLASSIFICAR": {
        total: 15,
        itensValidos: 12,
        lidos: 11,
        percentual: 91.67,
        presencasConfirmadas: 11,
        usuarios: { "João Silva": 6, "Maria Santos": 5 }
      },
      "ALTO GIRO": {
        total: 120,
        itensValidos: 108,
        lidos: 100,
        percentual: 92.59,
        presencasConfirmadas: 100,
        usuarios: { "Carlos Lima": 52, "Ana Oliveira": 48 }
      },
      "BAZAR": {
        total: 180,
        itensValidos: 150,
        lidos: 135,
        percentual: 90.00,
        presencasConfirmadas: 135,
        usuarios: { "Pedro Costa": 72, "Fernanda Rocha": 63 }
      },
      "DIVERSOS": {
        total: 50,
        itensValidos: 45,
        lidos: 42,
        percentual: 93.33,
        presencasConfirmadas: 42,
        usuarios: { "Ricardo Alves": 42 }
      },
      "DPH": {
        total: 200,
        itensValidos: 180,
        lidos: 165,
        percentual: 91.67,
        presencasConfirmadas: 165,
        usuarios: { "Patrícia Nunes": 88, "Roberto Santos": 77 }
      },
      "FLV": {
        total: 80,
        itensValidos: 70,
        lidos: 58,
        percentual: 82.86,
        presencasConfirmadas: 58,
        usuarios: { "Juliana Costa": 32, "Marcos Oliveira": 26 }
      },
      "LATICINIOS 1": {
        total: 100,
        itensValidos: 85,
        lidos: 72,
        percentual: 84.71,
        presencasConfirmadas: 72,
        usuarios: { "Carla Silva": 42, "Paulo Rodrigues": 30 }
      },
      "LIQUIDA": {
        total: 150,
        itensValidos: 130,
        lidos: 112,
        percentual: 86.15,
        presencasConfirmadas: 112,
        usuarios: { "Amanda Lima": 62, "Diego Souza": 50 }
      },
      "PERECIVEL 1": {
        total: 90,
        itensValidos: 80,
        lidos: 67,
        percentual: 83.75,
        presencasConfirmadas: 67,
        usuarios: { "Camila Rocha": 37, "Lucas Almeida": 30 }
      },
      "PERECIVEL 2": {
        total: 85,
        itensValidos: 75,
        lidos: 62,
        percentual: 82.67,
        presencasConfirmadas: 62,
        usuarios: { "Tatiane Pereira": 32, "Gabriel Santos": 30 }
      },
      "PERECIVEL 2 B": {
        total: 60,
        itensValidos: 50,
        lidos: 42,
        percentual: 84.00,
        presencasConfirmadas: 42,
        usuarios: { "Renata Oliveira": 42 }
      },
      "PERECIVEL 3": {
        total: 70,
        itensValidos: 60,
        lidos: 52,
        percentual: 86.67,
        presencasConfirmadas: 52,
        usuarios: { "Felipe Costa": 52 }
      },
      "SECA DOCE": {
        total: 200,
        itensValidos: 180,
        lidos: 168,
        percentual: 93.33,
        presencasConfirmadas: 168,
        usuarios: { "João Silva": 88, "Maria Santos": 80 }
      },
      "SECA SALGADA": {
        total: 150,
        itensValidos: 130,
        lidos: 118,
        percentual: 90.77,
        presencasConfirmadas: 118,
        usuarios: { "Carlos Lima": 62, "Ana Oliveira": 56 }
      },
      "SECA SALGADA 2": {
        total: 50,
        itensValidos: 45,
        lidos: 42,
        percentual: 93.33,
        presencasConfirmadas: 42,
        usuarios: { "Pedro Costa": 42 }
      }
    };

    // Criar documento de métricas
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const fimDia = new Date(hoje);
    fimDia.setHours(23, 59, 59, 999);

    const metricasDoc = new LojaDailyMetrics({
      loja: loja._id,
      lojaNome: loja.nome,
      data: hoje,
      dataInicio: hoje,
      dataFim: fimDia,

      etiquetas: {
        totalItens: 1500,
        itensValidos: 1200,
        itensAtualizados: 850,
        itensNaolidos: 220,
        itensDesatualizado: 130,
        itensNaopertence: 0,
        itensLidosemestoque: 0,
        itensNlidocomestoque: 220,
        itensSemestoque: 300,
        percentualConclusao: 81.67,
        percentualRestante: 18.33,
        percentualDesatualizado: 10.83,
        usuariosAtivos: 10,
        classesLeitura: classesEtiquetas,
        locaisLeitura: {},
        contadorClasses: {}
      },

      rupturas: {
        totalItens: 1200,
        itensLidos: 950,
        itensNaoLidos: 250,
        percentualConclusao: 79.17,
        percentualRestante: 20.83,
        custoTotalRuptura: 15750.50,
        usuariosAtivos: 10,
        classesLeitura: classesRupturas,
        locaisLeitura: {},
        contadorClasses: {}
      },

      presencas: {
        totalItens: 1400,
        itensValidos: 1200,
        itensNaoLidos: 150,
        itensAtualizados: 1050,
        percentualConclusao: 87.50,
        percentualRestante: 12.50,
        custoRuptura: 0,
        rupturaSemPresenca: 0,
        presencasConfirmadas: 1050,
        usuariosAtivos: 10,
        classesLeitura: classesPresencas,
        locaisLeitura: {},
        contadorClasses: {}
      },

      totais: {
        totalItens: 4100,
        itensLidos: 3200,
        itensAtualizados: 1900,
        percentualConclusaoGeral: 78.05,
        usuariosTotais: 10,
        usuariosAtivos: 10,
        planilhasProcessadas: 3
      }
    });

    // Salvar no banco
    console.log('🔄 Inserindo métricas no banco...');
    await metricasDoc.save();
    console.log('✅ Métricas inseridas com sucesso!');

    console.log('\n📊 Resumo das métricas criadas:');
    console.log(`   - Loja: ${loja.nome}`);
    console.log(`   - Data: ${hoje.toLocaleDateString('pt-BR')}`);
    console.log(`   - Etiquetas: ${metricasDoc.etiquetas.totalItens} itens (${metricasDoc.etiquetas.percentualConclusao.toFixed(2)}%)`);
    console.log(`   - Rupturas: ${metricasDoc.rupturas.totalItens} itens (${metricasDoc.rupturas.percentualConclusao.toFixed(2)}%) - R$ ${metricasDoc.rupturas.custoTotalRuptura.toFixed(2)}`);
    console.log(`   - Presenças: ${metricasDoc.presencas.totalItens} itens (${metricasDoc.presencas.percentualConclusao.toFixed(2)}%)`);
    console.log(`   - Classes de Etiquetas: ${Object.keys(classesEtiquetas).length}`);
    console.log(`   - Classes de Rupturas: ${Object.keys(classesRupturas).length}`);
    console.log(`   - Classes de Presenças: ${Object.keys(classesPresencas).length}`);

    console.log('\n🎉 Banco de dados populado com métricas de teste com sucesso!');
    console.log('\n📝 Agora você pode testar o componente MetricasSetor.vue com dados reais!');

  } catch (error) {
    console.error('❌ Erro ao popular métricas:', error);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
  }
}

popularMetricas();
