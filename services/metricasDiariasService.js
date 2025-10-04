// services/metricasDiariasService.js
import MetricasDiarias from "../models/MetricasDiarias.js";
import Auditoria from "../models/Auditoria.js";

class MetricasDiariasService {
  constructor() {
    this.versaoCalculo = "1.0";
  }

  /**
   * Processa e atualiza as métricas diárias baseado em uma nova planilha
   * SUBSTITUI os valores anteriores para o mesmo tipo de auditoria
   */
  async processarMetricasDiarias(
    auditorias,
    tipoAuditoria,
    dataAuditoria,
    loja,
    nomeArquivo
  ) {
    try {
      console.log(
        `🔄 Processando métricas diárias para ${tipoAuditoria} - ${dataAuditoria.toLocaleDateString()}`
      );
      console.log(`📊 DEBUG: Recebidas ${auditorias.length} auditorias`);

      if (auditorias.length > 0) {
        console.log(`🔍 DEBUG: Primeira auditoria:`, JSON.stringify(auditorias[0], null, 2));
      }

      // Agrupar auditorias por usuário
      const auditoriasPorUsuario = this.agruparPorUsuario(auditorias, loja);

      // Calcular totais da loja para percentuais
      const totaisLoja = this.calcularTotaisLoja(auditorias, tipoAuditoria);

      // Processar cada usuário
      for (const [usuarioId, dadosUsuario] of auditoriasPorUsuario) {
        await this.atualizarMetricasUsuario(
          usuarioId,
          dadosUsuario,
          tipoAuditoria,
          dataAuditoria,
          loja,
          totaisLoja,
          nomeArquivo
        );
      }

      console.log(
        `✅ Métricas diárias atualizadas para ${auditoriasPorUsuario.size} usuários`
      );
      return { success: true, totalUsuarios: auditoriasPorUsuario.size };
    } catch (error) {
      console.error("❌ Erro ao processar métricas diárias:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Agrupa auditorias por usuário
   */
  agruparPorUsuario(auditorias, loja) {
    const usuariosMap = new Map();

    console.log(`🔍 DEBUG: Agrupando ${auditorias.length} auditorias por usuário`);

    for (const auditoria of auditorias) {
      const usuarioId = auditoria.usuarioId;

      if (!usuariosMap.has(usuarioId)) {
        usuariosMap.set(usuarioId, {
          usuarioId: usuarioId,
          usuarioNome: auditoria.usuarioNome,
          loja: loja,
          auditorias: [],
          ContadorClassesProduto: new Map(),
          ContadorLocais: new Map(),
        });
        console.log(`👤 DEBUG: Novo usuário encontrado: ${usuarioId} - ${auditoria.usuarioNome}`);
      }

      const dadosUsuario = usuariosMap.get(usuarioId);
      dadosUsuario.auditorias.push(auditoria);

      // Contar classes de produto - CORRIGIDO: usar ClasseProduto em vez de classeProdutoRaiz
      if (auditoria.ClasseProduto) {
        const classe = auditoria.ClasseProduto.toUpperCase().trim();
        dadosUsuario.ContadorClassesProduto.set(
          classe,
          (dadosUsuario.ContadorClassesProduto.get(classe) || 0) + 1
        );
        console.log(`🏷️ DEBUG: Classe produto adicionada: ${classe}`);
      } else {
        console.log(`⚠️ DEBUG: Auditoria sem ClasseProduto:`, auditoria.usuarioNome);
      }

      // Contar locais
      if (auditoria.local) {
        const local = auditoria.local.trim();
        dadosUsuario.ContadorLocais.set(
          local,
          (dadosUsuario.ContadorLocais.get(local) || 0) + 1
        );
      }
    }

    console.log(`📊 DEBUG: Total de usuários agrupados: ${usuariosMap.size}`);
    for (const [userId, dados] of usuariosMap) {
      console.log(`👤 DEBUG: ${dados.usuarioNome} (${userId}): ${dados.auditorias.length} auditorias`);
    }

    return usuariosMap;
  }

  /**
   * Calcula totais da loja para cálculo de percentuais - SIMPLIFICADO
   */
  calcularTotaisLoja(auditorias, tipoAuditoria) {
    // Contar total de itens lidos da loja (para calcular percentuais individuais)
    const totalItensLidosLoja = auditorias.filter(
      (a) => a.situacao && a.situacao !== "Não lido"
    ).length;

    return {
      totalItensLidos: totalItensLidosLoja || 1, // Evitar divisão por zero
      tipo: tipoAuditoria,
    };
  }

  /**
   * Atualiza métricas de um usuário específico
   */
  async atualizarMetricasUsuario(
    usuarioId,
    dadosUsuario,
    tipoAuditoria,
    dataAuditoria,
    loja,
    totaisLoja,
    nomeArquivo
  ) {
    try {
      // 🔥 LÓGICA IGUAL AO USER: Buscar ou criar registro único para usuário/data/tipo
      let metricasDiarias = await MetricasDiarias.findOne({
        loja: loja._id,
        usuarioId: usuarioId,
        dataAuditoria: dataAuditoria,
        tipoAuditoria: tipoAuditoria,
      });

      if (!metricasDiarias) {
        metricasDiarias = new MetricasDiarias({
          loja: loja._id,
          usuarioId: usuarioId,
          usuarioNome: dadosUsuario.usuarioNome,
          dataAuditoria: dataAuditoria,
          tipoAuditoria: tipoAuditoria,
          nomeArquivo: nomeArquivo,
          versaoCalculo: this.versaoCalculo,
        });
      }

      // 🔥 CONTAR DADOS NOVOS DA PLANILHA ATUAL (igual User) - SEM RESET DUPLO
      const metricasCalculadas = this.calcularMetricasTipo(
        dadosUsuario.auditorias,
        tipoAuditoria,
        totaisLoja
      );

      console.log(`🔄 DEBUG: Métricas calculadas para ${dadosUsuario.usuarioNome}:`, metricasCalculadas);

      // 🔥 ATRIBUIR VALORES CALCULADOS DIRETAMENTE (sem reset duplo)
      metricasDiarias[tipoAuditoria] = metricasCalculadas;

      // Atualizar contadores de locais e classes (resetar também)
      metricasDiarias.ContadorClassesProduto = Object.fromEntries(
        dadosUsuario.ContadorClassesProduto
      );
      metricasDiarias.ContadorLocais = Object.fromEntries(
        dadosUsuario.ContadorLocais
      );
      metricasDiarias.nomeArquivo = nomeArquivo;

      // Atualizar totais consolidados
      metricasDiarias.atualizarTotais();

      console.log(`💾 DEBUG: Antes de salvar - ${dadosUsuario.usuarioNome}:`, {
        tipoAuditoria: tipoAuditoria,
        etiquetas: metricasDiarias.etiquetas,
        totais: metricasDiarias.totais
      });

      await metricasDiarias.save();

      console.log(
        `✅ ${dadosUsuario.usuarioNome}: ${metricasCalculadas.itensLidos} ${tipoAuditoria} lidos`
      );
    } catch (error) {
      console.error(`❌ Erro ao atualizar métricas de ${usuarioId}:`, error);
      throw error;
    }
  }

  /**
   * Calcula métricas específicas para um tipo de auditoria - SIMPLIFICADO
   * Agora apenas conta os dados da planilha atual (igual ao modelo User)
   */
  calcularMetricasTipo(auditorias, tipoAuditoria, totaisLoja) {
    console.log(`🔢 DEBUG: calcularMetricasTipo para ${auditorias.length} auditorias do tipo ${tipoAuditoria}`);

    const metricas = {
      totalItens: auditorias.length,
      itensLidos: 0,
      itensAtualizados: 0,
      itensDesatualizado: 0,
      itensSemEstoque: 0,
      itensNaopertence: 0,
      percentualConclusao: 0,
    };

    // Contagem simples e direta (igual ao User)
    console.log(`🔍 DEBUG: Vou processar ${auditorias.length} auditorias`);

    for (let i = 0; i < auditorias.length; i++) {
      const auditoria = auditorias[i];

      // Log detalhado apenas para as primeiras 3 auditorias para não poluir
      if (i < 3) {
        console.log(`🔍 DEBUG: Auditoria ${i+1} - situacao: "${auditoria.situacao}" | local: "${auditoria.local}" | usuario: "${auditoria.usuarioNome}"`);
      }

      // Contar itens lidos (qualquer situação diferente de "Não lido")
      if (auditoria.situacao && auditoria.situacao !== "Não lido") {
        metricas.itensLidos++;
        if (i < 3) console.log(`✅ DEBUG: Item ${i+1} contado como lido`);
      } else {
        if (i < 3) console.log(`❌ DEBUG: Item ${i+1} NÃO contado (situacao: "${auditoria.situacao}")`);
      }

      // Contar por situação específica
      switch (auditoria.situacao) {
        case "Atualizado":
          metricas.itensAtualizados++;
          if (i < 3) console.log(`🔄 DEBUG: Item ${i+1} contado como ATUALIZADO`);
          break;
        case "Desatualizado":
          metricas.itensDesatualizado++;
          if (i < 3) console.log(`🔄 DEBUG: Item ${i+1} contado como DESATUALIZADO`);
          break;
        case "Sem estoque":
          metricas.itensSemEstoque++;
          if (i < 3) console.log(`🔄 DEBUG: Item ${i+1} contado como SEM ESTOQUE`);
          break;
        case "Não pertence":
          metricas.itensNaopertence++;
          if (i < 3) console.log(`🔄 DEBUG: Item ${i+1} contado como NÃO PERTENCE`);
          break;
        default:
          if (i < 3) console.log(`⚠️ DEBUG: Item ${i+1} com situacao não reconhecida: "${auditoria.situacao}"`);
      }
    }

    console.log(`📊 DEBUG: Métricas calculadas:`, metricas);

    // Calcular percentual em relação à loja
    if (totaisLoja.totalItensLidos > 0) {
      metricas.percentualConclusao = Math.round(
        (metricas.itensLidos / totaisLoja.totalItensLidos) * 100
      );
    }

    // Adicionar campos específicos por tipo
    if (tipoAuditoria === "ruptura") {
      const custoTotal = auditorias.reduce(
        (total, aud) => total + (aud.custoRuptura || 0),
        0
      );
      metricas.custoTotalRuptura = custoTotal;
      metricas.custoMedioRuptura =
        auditorias.length > 0 ? custoTotal / auditorias.length : 0;
    }

    if (tipoAuditoria === "presenca") {
      const presencasConfirmadas = auditorias.filter((a) => a.presenca).length;
      metricas.presencasConfirmadas = presencasConfirmadas;
      metricas.percentualPresenca =
        auditorias.length > 0
          ? Math.round((presencasConfirmadas / auditorias.length) * 100)
          : 0;
    }

    return metricas;
  }

  /**
   * Busca métricas diárias de um usuário - SIMPLIFICADO
   * Retorna todas as métricas do usuário para a data (etiqueta, ruptura, presença)
   */
  async obterMetricasUsuario(lojaId, usuarioId, dataAuditoria) {
    try {
      const metricas = await MetricasDiarias.find({
        loja: lojaId,
        usuarioId: usuarioId,
        dataAuditoria: dataAuditoria,
      }).sort({ tipoAuditoria: 1 });

      if (metricas.length === 0) {
        return null;
      }

      // Retornar métricas simples organizadas por tipo
      const resultado = {
        etiquetas: null,
        rupturas: null,
        presencas: null,
        ContadorClassesProduto: {},
        ContadorLocais: {},
        usuarioInfo: {
          id: usuarioId,
          nome: metricas[0].usuarioNome,
        },
        dataAuditoria: dataAuditoria,
      };

      // Organizar por tipo de auditoria
      for (const metrica of metricas) {
        resultado[metrica.tipoAuditoria] = metrica[metrica.tipoAuditoria];

        // Mesclar contadores (últimos dados prevalecem)
        Object.assign(resultado.ContadorClassesProduto, metrica.ContadorClassesProduto);
        Object.assign(resultado.ContadorLocais, metrica.ContadorLocais);
      }

      return resultado;
    } catch (error) {
      console.error("❌ Erro ao buscar métricas diárias:", error);
      throw error;
    }
  }
}

const metricasDiariasService = new MetricasDiariasService();
export default metricasDiariasService;
