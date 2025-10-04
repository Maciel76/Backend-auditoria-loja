import express from "express";

const router = express.Router();

// Lista completa de todos os endpoints disponíveis
router.get("/", (req, res) => {
  const endpoints = {
    timestamp: new Date(),
    servidor: "Backend de Auditorias com Sistema de Métricas",
    versao: "2.0.0",

    // ===== ENDPOINTS PRINCIPAIS =====
    upload_e_processamento: {
      descricao: "Endpoints para upload e processamento de planilhas",
      rotas: {
        "POST /upload": {
          descricao: "🆕 Upload de planilhas com progresso em tempo real",
          parametros: "file (multipart), tipoAuditoria (etiqueta|ruptura|presenca)",
          headers_obrigatorios: "x-loja: CODIGO_LOJA",
          resposta: "Dados processados + sessionId para tracking de progresso + URLs para acompanhar",
          progress_tracking: {
            sessionId: "ID único para acompanhar o progresso",
            streamUrl: "/api/progress/stream/{sessionId} - Server-Sent Events",
            statusUrl: "/api/progress/status/{sessionId} - HTTP polling"
          },
          exemplo: "curl -X POST -H 'x-loja: 001' -F 'file=@planilha.xlsx' -F 'tipoAuditoria=etiqueta' http://localhost:3000/upload"
        },
        "GET /usuarios": {
          descricao: "Lista usuários da loja",
          headers_obrigatorios: "x-loja: CODIGO_LOJA",
          parametros: "todos=true (para ver todos os usuários)",
        },
        "GET /usuarios/:id": {
          descricao: "Dados específicos de um usuário",
          headers_obrigatorios: "x-loja: CODIGO_LOJA",
        },
        "GET /dados-planilha": {
          descricao: "Dados da última planilha processada",
          headers_obrigatorios: "x-loja: CODIGO_LOJA",
          parametros: "tipoAuditoria (opcional)",
        },
      }
    },

    // ===== SISTEMA DE PROGRESSO =====
    progress_tracking: {
      descricao: "🆕 Sistema de acompanhamento de progresso em tempo real para uploads",
      rotas: {
        "POST /api/progress/session": {
          descricao: "Criar nova sessão de upload",
          resposta: "sessionId + URLs para acompanhar progresso"
        },
        "GET /api/progress/stream/:sessionId": {
          descricao: "🔴 LIVE - Server-Sent Events para progresso em tempo real",
          resposta: "Stream contínuo de eventos de progresso (0-100%)",
          como_usar: "EventSource('/api/progress/stream/SESSION_ID') no JavaScript"
        },
        "GET /api/progress/status/:sessionId": {
          descricao: "📊 Status atual do upload via HTTP",
          resposta: "Snapshot do progresso atual (para polling)"
        },
        "GET /api/progress/active": {
          descricao: "Lista todos os uploads ativos no momento",
          resposta: "Todos os uploads em andamento"
        }
      }
    },

    // ===== SISTEMA DE MÉTRICAS =====
    metricas_consolidadas: {
      descricao: "Sistema avançado de métricas para dashboards rápidos",
      rotas: {
        "GET /api/metricas/usuarios/:usuarioId": {
          descricao: "Métricas detalhadas de um usuário específico",
          headers_obrigatorios: "x-loja: CODIGO_LOJA",
          parametros: "periodo=diario|semanal|mensal, data=YYYY-MM-DD, limite=12",
          resposta: "Histórico de performance, rankings, tendências",
          exemplo: "/api/metricas/usuarios/12345?periodo=mensal&limite=6"
        },
        "GET /api/metricas/usuarios/ranking": {
          descricao: "Ranking de usuários da loja",
          headers_obrigatorios: "x-loja: CODIGO_LOJA",
          parametros: "periodo=mensal, data=YYYY-MM-DD, limite=50",
          resposta: "Lista ordenada por pontuação com posições"
        },
        "GET /api/metricas/loja": {
          descricao: "Métricas consolidadas da loja atual",
          headers_obrigatorios: "x-loja: CODIGO_LOJA",
          parametros: "periodo=mensal, data=YYYY-MM-DD, limite=12",
          resposta: "Performance da loja, tendências, comparações"
        },
        "GET /api/metricas/lojas/ranking": {
          descricao: "Ranking geral de todas as lojas",
          parametros: "periodo=mensal, data=YYYY-MM-DD, limite=50, regiao=REGIAO",
          resposta: "Ranking inter-lojas com pontuações e métricas"
        },
        "POST /api/metricas/lojas/comparar": {
          descricao: "Comparar múltiplas lojas",
          body: "{ lojasCodigos: ['001', '002', '003'], periodo: 'mensal', data: '2024-01-01' }",
          resposta: "Comparação lado a lado das lojas selecionadas"
        },
        "GET /api/metricas/auditorias/:tipo": {
          descricao: "Métricas por tipo de auditoria (etiqueta|ruptura|presenca)",
          parametros: "periodo=mensal, data=YYYY-MM-DD, limite=12",
          resposta: "Análise específica do tipo de auditoria"
        },
        "GET /api/metricas/auditorias/comparacao": {
          descricao: "Comparação entre tipos de auditoria",
          parametros: "periodo=mensal, data=YYYY-MM-DD",
          resposta: "Performance comparativa entre etiquetas, rupturas e presenças"
        },
        "GET /api/metricas/dashboard": {
          descricao: "Dashboard executivo completo",
          parametros: "periodo=mensal, data=YYYY-MM-DD",
          resposta: "Visão executiva: KPIs, rankings, alertas, insights estratégicos"
        },
        "GET /api/metricas/tendencias": {
          descricao: "Análises históricas e tendências",
          parametros: "periodo=mensal, limite=12",
          resposta: "Dados temporais para gráficos e projeções"
        },
        "POST /api/metricas/recalcular": {
          descricao: "Forçar recálculo manual de métricas",
          body: "{ periodo: 'mensal', data: '2024-01-01' }",
          resposta: "Confirmação do recálculo"
        },
        "GET /api/metricas/status": {
          descricao: "Status do sistema de métricas",
          resposta: "Estado atual dos cálculos por período"
        },
      }
    },

    // ===== ROTAS DE DEBUG =====
    debug_e_monitoramento: {
      descricao: "Ferramentas para verificar se as métricas estão funcionando",
      rotas: {
        "GET /api/debug/testar-servico": {
          descricao: "🧪 PRIMEIRO - Testar se o serviço de métricas está funcionando",
          resposta: "Status do serviço de cálculo de métricas",
          recomendacao: "⭐ Use ANTES de fazer upload para verificar se está tudo OK!"
        },
        "GET /api/debug/verificar-metricas": {
          descricao: "🔍 PRINCIPAL - Verificar se métricas estão sendo salvas",
          headers_obrigatorios: "x-loja: CODIGO_LOJA",
          resposta: "Status detalhado de todas as coleções de métricas",
          recomendacao: "⭐ Use este endpoint após cada upload para verificar!"
        },
        "POST /api/debug/calcular-agora": {
          descricao: "Forçar cálculo imediato para debug",
          headers_obrigatorios: "x-loja: CODIGO_LOJA",
          body: "{ periodo: 'mensal', data: '2024-01-01' }",
          resposta: "Resultado detalhado do cálculo + métricas criadas"
        },
        "GET /api/debug/estatisticas-detalhadas": {
          descricao: "Estatísticas completas por coleção",
          headers_obrigatorios: "x-loja: CODIGO_LOJA",
          resposta: "Análise profunda dos dados raw vs métricas consolidadas"
        },
        "GET /api/debug/testar-conexoes": {
          descricao: "Testar conectividade com todas as coleções MongoDB",
          resposta: "Status de conexão com cada coleção"
        },
        "GET /api/debug/testar-novos-campos": {
          descricao: "🆕 Testar novos campos de métricas de usuário",
          headers_obrigatorios: "x-loja: CODIGO_LOJA",
          resposta: "Exemplo dos novos campos: contadores de auditorias, totais acumulados e histórico de ranking",
          recomendacao: "⭐ Use após upload para ver os novos campos em ação!"
        },
        "DELETE /api/debug/limpar-metricas": {
          descricao: "⚠️ CUIDADO - Limpar todas as métricas",
          body: "{ confirmar: 'SIM_LIMPAR_TUDO' }",
          resposta: "Quantidade de registros removidos"
        },
      }
    },

    // ===== ROTAS LEGADAS =====
    rotas_existentes: {
      descricao: "Endpoints já existentes do sistema",
      rotas: {
        "GET /test": "Teste básico do servidor",
        "GET /relatorios/*": "Relatórios do sistema antigo",
        "GET /ranking*": "Rankings do sistema antigo",
        "GET /setores*": "Gestão de setores",
        "GET /estatisticas*": "Estatísticas básicas",
        "POST /upload-ruptura": "Upload específico de rupturas",
        "POST /upload-presenca": "Upload específico de presenças",
        "GET /api/avancado/*": "Relatórios avançados",
      }
    },

    // ===== GUIA DE USO =====
    guia_de_uso: {
      "1_primeiro_upload": {
        descricao: "🆕 Como fazer upload com progresso em tempo real",
        passos: [
          "0. GET /api/debug/testar-servico - Verificar se serviço está OK",
          "1. POST /upload com header 'x-loja: 001' e arquivo Excel",
          "2. Na resposta, pegar 'progress.sessionId' e 'progress.streamUrl'",
          "3. Conectar no stream: new EventSource(streamUrl) para ver progresso",
          "4. Aguardar progresso: reading → processing → saving → metrics → completed",
          "5. GET /api/debug/verificar-metricas com header 'x-loja: 001'",
          "6. GET /api/metricas/dashboard para ver dashboard executivo"
        ],
        exemplo_frontend: {
          javascript: "const eventSource = new EventSource('/api/progress/stream/SESSION_ID'); eventSource.onmessage = (event) => { const progress = JSON.parse(event.data); updateProgressBar(progress.percentage); };"
        }
      },
      "0_debug_problemas": {
        descricao: "Se as métricas não estão sendo salvas",
        passos: [
          "1. GET /api/debug/testar-servico - Ver se serviço está funcionando",
          "2. GET /api/debug/testar-conexoes - Ver se MongoDB está OK",
          "3. POST /api/debug/calcular-agora - Forçar cálculo manual",
          "4. GET /api/debug/verificar-metricas - Ver resultado",
          "5. Verificar logs do servidor para erros detalhados"
        ]
      },
      "2_monitoramento_diario": {
        descricao: "Rotina diária de monitoramento",
        passos: [
          "1. GET /api/metricas/dashboard - Visão geral",
          "2. GET /api/metricas/usuarios/ranking - Top colaboradores",
          "3. GET /api/debug/verificar-metricas - Health check",
          "4. POST /api/metricas/recalcular se necessário"
        ]
      },
      "3_comparacoes": {
        descricao: "Como fazer comparações",
        passos: [
          "1. POST /api/metricas/lojas/comparar - Comparar lojas",
          "2. GET /api/metricas/auditorias/comparacao - Comparar tipos",
          "3. GET /api/metricas/tendencias - Ver evolução histórica"
        ]
      }
    },

    // ===== HEADERS IMPORTANTES =====
    headers_importantes: {
      "x-loja": "OBRIGATÓRIO para endpoints que filtram por loja (ex: '001', '002')",
      "Content-Type": "multipart/form-data para uploads, application/json para APIs"
    },

    // ===== BENEFÍCIOS DO SISTEMA =====
    beneficios: {
      performance: "Consultas 100x mais rápidas que agregações em tempo real",
      escalabilidade: "Suporta milhões de auditorias sem degradação",
      insights: "Detecção automática de padrões e alertas",
      rankings: "Comparações dinâmicas entre usuários/lojas/regiões",
      historico: "Tendências temporais para tomada de decisão"
    }
  };

  res.json(endpoints);
});

export default router;