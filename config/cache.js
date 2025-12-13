// config/cache.js - Configuração do sistema de cache
import NodeCache from 'node-cache';

// Criar instância do cache com TTL padrão de 10 minutos e check period de 60 segundos
const cache = new NodeCache({ stdTTL: 600, checkperiod: 60 });

// Função para gerar chaves de cache
const cacheKeys = {
  userMetrics: (lojaId, usuarioId) => `user_metrics:${lojaId}:${usuarioId}`,
  rankingLoja: (lojaId) => `ranking_loja:${lojaId}`,
  rankingGeral: () => 'ranking_geral',
};

export { cache, cacheKeys };