// Script temporário para atualizar tipo de sugestão para voting
import mongoose from 'mongoose';
import Sugestao from './models/Sugestao.js';

async function updateToVoting() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect('mongodb://localhost:27017/auditoria_melhorada');
    console.log('✅ Conectado ao MongoDB');

    // Atualizar a sugestão recém-criada para tipo voting
    const result = await Sugestao.updateOne(
      { _id: '68f0986d98cc104e9999c154' },
      { $set: { tipo: 'voting' } },
      { runValidators: false } // Pular validação temporariamente
    );

    console.log('✅ Resultado da atualização:', result);

    // Criar mais algumas sugestões de voting
    const votingSuggestions = [
      {
        sugestao: "App Mobile para Auditorias\n\nDesenvolver um aplicativo móvel dedicado para realizar auditorias em campo, com sincronização offline e interface otimizada para tablets.",
        tipo: 'voting',
        status: 'pendente'
      },
      {
        sugestao: "Dashboard de Analytics Avançado\n\nImplementar um dashboard com métricas avançadas, gráficos interativos e relatórios personalizáveis para análise de tendências.",
        tipo: 'voting',
        status: 'analisando'
      },
      {
        sugestao: "Sistema de Gamificação\n\nAdicionar badges, pontuação e ranking para incentivar a participação dos usuários nas auditorias e feedback.",
        tipo: 'voting',
        status: 'pendente'
      }
    ];

    for (const suggestion of votingSuggestions) {
      const newSuggestion = new Sugestao(suggestion);
      // Desabilitar validação temporariamente
      await newSuggestion.save({ validateBeforeSave: false });
      console.log(`✅ Sugestão de votação criada: ${suggestion.sugestao.split('\n')[0]}`);
    }

    console.log('✅ Todas as sugestões de votação foram criadas!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Desconectado do MongoDB');
  }
}

updateToVoting();