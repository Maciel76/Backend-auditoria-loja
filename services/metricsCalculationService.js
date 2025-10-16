import MetricasUsuario from "../models/MetricasUsuario.js";
import MetricasLoja from "../models/MetricasLoja.js";
import LojaDailyMetrics from "../models/LojaDailyMetrics.js";
import MetricasAuditoria from "../models/MetricasAuditoria.js";
import MetricasGlobais from "../models/MetricasGlobais.js";
import Auditoria from "../models/Auditoria.js";
import Loja from "../models/Loja.js";
import User from "../models/User.js";

class MetricsCalculationService {
  constructor() {
    this.versaoCalculo = "1.0";
  }

  // Método principal para calcular todas as métricas
  async calcularTodasMetricas(periodo = "diario", data = new Date(), tipoAuditoria = null) {
    try {
      console.log(
        `🔄 Iniciando cálculo de métricas ${periodo} para ${data.toLocaleDateString()}`
      );

      const { dataInicio, dataFim } = this.obterPeriodo(periodo, data);

      // NOVA LÓGICA: Se é diário, não calcular MetricasUsuario (será no UserDailyMetrics)
      if (periodo === "diario") {
        console.log(`⏭️ Pulando MetricasUsuario para período diário (será processado no UserDailyMetrics)`);
        // Para diário, calcular LojaDailyMetrics ao invés de MetricasLoja
        await this.calcularLojaDailyMetrics(dataInicio, dataFim, tipoAuditoria);
        await this.calcularMetricasAuditorias(periodo, dataInicio, dataFim);
        await this.calcularMetricasGlobais(periodo, dataInicio, dataFim);
      } else {
        // Para períodos mensais ou outros, calcular MetricasUsuario como período completo
        const periodoMetricas = "periodo_completo";
        await this.calcularMetricasUsuarios(periodoMetricas, dataInicio, dataFim);
        await this.calcularMetricasLojas(periodo, dataInicio, dataFim);
        await this.calcularMetricasAuditorias(periodo, dataInicio, dataFim);
        await this.calcularMetricasGlobais(periodo, dataInicio, dataFim);
      }

      console.log(`✅ Métricas ${periodo} calculadas com sucesso`);

      return {
        success: true,
        periodo,
        dataInicio,
        dataFim,
        versaoCalculo: this.versaoCalculo,
      };
    } catch (error) {
      console.error(`❌ Erro ao calcular métricas ${periodo}:`, error);
      throw error;
    }
  }

  // Calcular métricas de usuários
  async calcularMetricasUsuarios(periodo, dataInicio, dataFim) {
    console.log(`📊 Calculando métricas de usuários...`);

    // CORREÇÃO: Buscar TODAS as auditorias para cálculo de período completo
    // Não filtrar por data pois é período_completo acumulativo
    const auditorias = await Auditoria.find({
      // REMOVIDO: filtro de data para buscar TODAS as auditorias
    }).populate('loja', 'codigo nome regiao');

    // Calcular totais por loja para cada tipo de auditoria
    const totaisPorLoja = {};

    for (const auditoria of auditorias) {
      const lojaId = auditoria.loja._id.toString();

      if (!totaisPorLoja[lojaId]) {
        totaisPorLoja[lojaId] = {
          etiquetas: { itensLidos: 0 },
          rupturas: { itensLidos: 0 },
          presencas: { itensLidos: 0 }
        };
      }

      // Contar itens lidos por tipo para cada loja
      if (auditoria.situacao && auditoria.situacao !== "Não lido") {
        if (auditoria.tipo === "etiqueta") {
          totaisPorLoja[lojaId].etiquetas.itensLidos++;
        } else if (auditoria.tipo === "ruptura") {
          totaisPorLoja[lojaId].rupturas.itensLidos++;
        } else if (auditoria.tipo === "presenca") {
          totaisPorLoja[lojaId].presencas.itensLidos++;
        }
      }
    }

    // Agrupar por usuário e loja
    const usuariosMap = new Map();

    for (const auditoria of auditorias) {
      const chaveUsuario = `${auditoria.usuarioId}_${auditoria.loja._id}`;

      if (!usuariosMap.has(chaveUsuario)) {
        usuariosMap.set(chaveUsuario, {
          usuarioId: auditoria.usuarioId,
          usuarioNome: auditoria.usuarioNome,
          loja: auditoria.loja,
          etiquetas: {
            totalItens: 0,
            itensLidos: 0,
            itensAtualizados: 0,
            itensDesatualizado: 0,
            itensSemEstoque: 0,
            itensNaopertence: 0,
            percentualConclusao: 0
          },
          rupturas: {
            totalItens: 0,
            itensLidos: 0,
            itensAtualizados: 0,
            custoTotal: 0,
            itensDesatualizado: 0,
            itensSemEstoque: 0,
            itensNaopertence: 0,
            percentualConclusao: 0,
            custoTotalRuptura: 0,
            custoMedioRuptura: 0
          },
          presencas: {
            totalItens: 0,
            itensLidos: 0,
            itensAtualizados: 0,
            presencasConfirmadas: 0,
            itensDesatualizado: 0,
            itensSemEstoque: 0,
            itensNaopertence: 0,
            percentualConclusao: 0,
            percentualPresenca: 0
          },
          // NOVOS CONTADORES
          ContadorClassesProduto: new Map([
            ["A CLASSIFICAR", 0],
            ["ALTO GIRO", 0],
            ["BAZAR", 0],
            ["DIVERSOS", 0],
            ["DPH", 0],
            ["FLV", 0],
            ["LATICINIOS 1", 0],
            ["LIQUIDA", 0],
            ["PERECIVEL 1", 0],
            ["PERECIVEL 2", 0],
            ["PERECIVEL 2 B", 0],
            ["PERECIVEL 3", 0],
            ["SECA DOCE", 0],
            ["SECA SALGADA", 0],
            ["SECA SALGADA 2", 0],
          ]),
          ContadorLocais: new Map([
            ["C01 - C01", 0],
            ["CS01 - CS01", 0],
            ["F01 - F01", 0],
            ["F02 - F02", 0],
            ["FLV - FLV", 0],
            ["G01A - G01A", 0],
            ["G01B - G01B", 0],
            ["G02A - G02A", 0],
            ["G02B - G02B", 0],
            ["G03A - G03A", 0],
            ["G03B - G03B", 0],
            ["G04A - G04A", 0],
            ["G04B - G04B", 0],
            ["G05A - G05A", 0],
            ["G05B - G05B", 0],
            ["G06A - G06A", 0],
            ["G06B - G06B", 0],
            ["G07A - G07A", 0],
            ["G07B - G07B", 0],
            ["G08A - G08A", 0],
            ["G08B - G08B", 0],
            ["G09A - G09A", 0],
            ["G09B - G09B", 0],
            ["G10A - G10A", 0],
            ["G10B - G10B", 0],
            ["G11A - G11A", 0],
            ["G11B - G11B", 0],
            ["G12A - G12A", 0],
            ["G12B - G12B", 0],
            ["G13A - G13A", 0],
            ["G13B - G13B", 0],
            ["G14A - G14A", 0],
            ["G14B - G14B", 0],
            ["G15A - G15A", 0],
            ["G15B - G15B", 0],
            ["G16A - G16A", 0],
            ["G16B - G16B", 0],
            ["G17A - G17A", 0],
            ["G17B - G17B", 0],
            ["G18A - G18A", 0],
            ["G18B - G18B", 0],
            ["G19A - G19A", 0],
            ["G19B - G19B", 0],
            ["G20A - G20A", 0],
            ["G20B - G20B", 0],
            ["G21A - G21A", 0],
            ["G21B - G21B", 0],
            ["G22A - G22A", 0],
            ["G22B - G22B", 0],
            ["GELO - GELO", 0],
            ["I01 - I01", 0],
            ["PA01 - PA01", 0],
            ["PAO - PAO", 0],
            ["PF01 - PF01", 0],
            ["PF02 - PF02", 0],
            ["PF03 - PF03", 0],
            ["PL01 - PL01", 0],
            ["PL02 - PL02", 0],
            ["SORVETE - SORVETE", 0]
          ])
        });
      }

      const dadosUsuario = usuariosMap.get(chaveUsuario);
      const lojaId = auditoria.loja._id.toString();

      // Processar por tipo de auditoria
      if (auditoria.tipo === "etiqueta") {
        dadosUsuario.etiquetas.totalItens++;

        if (auditoria.situacao && auditoria.situacao !== "Não lido") {
          dadosUsuario.etiquetas.itensLidos++;
        }

        switch(auditoria.situacao) {
          case "Atualizado":
            dadosUsuario.etiquetas.itensAtualizados++;
            break;
          case "Desatualizado":
            dadosUsuario.etiquetas.itensDesatualizado++;
            break;
          case "Sem estoque":
            dadosUsuario.etiquetas.itensSemEstoque++;
            break;
          case "Não pertence":
            dadosUsuario.etiquetas.itensNaopertence++;
            break;
        }

      } else if (auditoria.tipo === "ruptura") {
        dadosUsuario.rupturas.totalItens++;

        if (auditoria.situacao && auditoria.situacao !== "Não lido") {
          dadosUsuario.rupturas.itensLidos++;
        }

        switch(auditoria.situacao) {
          case "Atualizado":
            dadosUsuario.rupturas.itensAtualizados++;
            break;
          case "Desatualizado":
            dadosUsuario.rupturas.itensDesatualizado++;
            break;
          case "Sem estoque":
            dadosUsuario.rupturas.itensSemEstoque++;
            break;
          case "Não pertence":
            dadosUsuario.rupturas.itensNaopertence++;
            break;
        }

        if (auditoria.custoRuptura) {
          dadosUsuario.rupturas.custoTotal += auditoria.custoRuptura;
        }
      } else if (auditoria.tipo === "presenca") {
        dadosUsuario.presencas.totalItens++;

        if (auditoria.situacao && auditoria.situacao !== "Não lido") {
          dadosUsuario.presencas.itensLidos++;
        }

        switch(auditoria.situacao) {
          case "Atualizado":
            dadosUsuario.presencas.itensAtualizados++;
            break;
          case "Desatualizado":
            dadosUsuario.presencas.itensDesatualizado++;
            break;
          case "Sem estoque":
            dadosUsuario.presencas.itensSemEstoque++;
            break;
          case "Não pertence":
            dadosUsuario.presencas.itensNaopertence++;
            break;
        }

        if (auditoria.presenca) {
          dadosUsuario.presencas.presencasConfirmadas++;
        }
      }

      // CONTAR CLASSES DE PRODUTO - usando o novo campo ClasseProduto
      if (auditoria.ClasseProduto) {
        const classe = auditoria.ClasseProduto;
        if (dadosUsuario.ContadorClassesProduto.has(classe)) {
          dadosUsuario.ContadorClassesProduto.set(classe, dadosUsuario.ContadorClassesProduto.get(classe) + 1);
        }
      }
      // Fallback para o campo antigo se o novo não existir
      else if (auditoria.classeProdutoRaiz) {
        const classe = auditoria.classeProdutoRaiz;
        if (dadosUsuario.ContadorClassesProduto.has(classe)) {
          dadosUsuario.ContadorClassesProduto.set(classe, dadosUsuario.ContadorClassesProduto.get(classe) + 1);
        }
      }

      // CONTAR LOCAIS
      if (auditoria.local) {
        const local = auditoria.local;
        if (dadosUsuario.ContadorLocais.has(local)) {
          dadosUsuario.ContadorLocais.set(local, dadosUsuario.ContadorLocais.get(local) + 1);
        }
      }
    }

    // Calcular percentuais em relação ao total da loja e salvar métricas
    for (const [chave, dados] of usuariosMap) {
      try {
        const lojaId = dados.loja._id.toString();
        const totaisDaLoja = totaisPorLoja[lojaId] || {
          etiquetas: { itensLidos: 0 },
          rupturas: { itensLidos: 0 },
          presencas: { itensLidos: 0 }
        };

        // CALCULAR PERCENTUAIS EM RELAÇÃO AO TOTAL DA LOJA
        const etiquetas = {
          ...dados.etiquetas,
          percentualConclusao: totaisDaLoja.etiquetas.itensLidos > 0
            ? Math.round((dados.etiquetas.itensLidos / totaisDaLoja.etiquetas.itensLidos) * 100)
            : 0,
        };

        const rupturas = {
          ...dados.rupturas,
          percentualConclusao: totaisDaLoja.rupturas.itensLidos > 0
            ? Math.round((dados.rupturas.itensLidos / totaisDaLoja.rupturas.itensLidos) * 100)
            : 0,
          custoTotalRuptura: dados.rupturas.custoTotal,
          custoMedioRuptura: dados.rupturas.totalItens > 0
            ? dados.rupturas.custoTotal / dados.rupturas.totalItens
            : 0,
        };

        const presencas = {
          ...dados.presencas,
          percentualConclusao: totaisDaLoja.presencas.itensLidos > 0
            ? Math.round((dados.presencas.itensLidos / totaisDaLoja.presencas.itensLidos) * 100)
            : 0,
          percentualPresenca: dados.presencas.totalItens > 0
            ? Math.round((dados.presencas.presencasConfirmadas / dados.presencas.totalItens) * 100)
            : 0,
        };

        // Buscar ou criar métricas do usuário - PERÍODO COMPLETO
        // CORREÇÃO: Não usar dataInicio como critério pois é período completo
        let metricasUsuario = await MetricasUsuario.findOne({
          loja: dados.loja._id,
          usuarioId: dados.usuarioId,
          periodo: "periodo_completo",
        });

        if (!metricasUsuario) {
          console.log(`📝 Criando novo MetricasUsuario para ${dados.usuarioNome}`);
          console.log(`🏪 lojaNome será definido como: "${dados.loja.nome}"`);
          metricasUsuario = new MetricasUsuario({
            loja: dados.loja._id,
            usuarioId: dados.usuarioId,
            usuarioNome: dados.usuarioNome,
            lojaNome: dados.loja.nome, // Adicionar nome da loja
            periodo: "periodo_completo",
            dataInicio,
            dataFim,
            versaoCalculo: this.versaoCalculo,
          });
          console.log(`🔍 MetricasUsuario criado com lojaNome: "${metricasUsuario.lojaNome}"`);
        } else {
          console.log(`🔄 Atualizando MetricasUsuario existente ${metricasUsuario._id} para ${dados.usuarioNome}`);
          console.log(`🔍 lojaNome atual: "${metricasUsuario.lojaNome}"`);
          // Atualizar as datas para o período mais recente e nome da loja se necessário
          if (!metricasUsuario.lojaNome) {
            metricasUsuario.lojaNome = dados.loja.nome;
            console.log(`🏪 lojaNome atualizado para: "${metricasUsuario.lojaNome}"`);
          }
          metricasUsuario.dataFim = dataFim;
          if (!metricasUsuario.dataInicio || dataInicio < metricasUsuario.dataInicio) {
            metricasUsuario.dataInicio = dataInicio;
          }
          metricasUsuario.usuarioNome = dados.usuarioNome;
        }

        // Atualizar dados principais
        metricasUsuario.etiquetas = etiquetas;
        metricasUsuario.rupturas = rupturas;
        metricasUsuario.presencas = presencas;

        // Atualizar novos contadores
        metricasUsuario.ContadorClassesProduto = Object.fromEntries(dados.ContadorClassesProduto);
        metricasUsuario.ContadorLocais = Object.fromEntries(dados.ContadorLocais);

        // Calcular diasAtivos - dias únicos que o usuário fez auditoria (TODAS as datas)
        const diasUnicos = await Auditoria.aggregate([
          {
            $match: {
              loja: dados.loja._id,
              usuarioId: dados.usuarioId,
              // REMOVIDO: filtro de data para contar TODOS os dias
            },
          },
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$data" } },
            },
          },
        ]);

        const diasAtivos = diasUnicos.length;
        const mediaItensPerDia = diasAtivos > 0
          ? Math.round(dados.etiquetas.itensLidos / diasAtivos)
          : 0;

        // Calcular melhoriaPercentual - comparar com período anterior
        let melhoriaPercentual = 0;
        const periodoAnterior = await this.obterPeriodoAnteriorUsuario(
          dados.loja._id,
          dados.usuarioId,
          periodo,
          dataInicio
        );

        if (periodoAnterior && periodoAnterior.totais.percentualConclusaoGeral !== undefined) {
          const percentualAtual = dados.etiquetas.totalItens > 0
            ? Math.round((dados.etiquetas.itensAtualizados / dados.etiquetas.totalItens) * 100)
            : 0;
          melhoriaPercentual = percentualAtual - periodoAnterior.totais.percentualConclusaoGeral;
        }

        // Calcular contadores de auditorias (quantas auditorias únicas fez por tipo) - TODAS as datas
        const auditoriasPorTipo = await Auditoria.aggregate([
          {
            $match: {
              loja: dados.loja._id,
              usuarioId: dados.usuarioId,
              // REMOVIDO: filtro de data para contar TODAS as auditorias
            },
          },
          {
            $group: {
              _id: {
                tipo: "$tipo",
                data: { $dateToString: { format: "%Y-%m-%d", date: "$data" } },
              },
              count: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: "$_id.tipo",
              auditorias: { $sum: 1 }, // Conta dias únicos que fez cada tipo
            },
          },
        ]);

        // Mapear contadores
        const contadores = {
          totalEtiquetas: 0,
          totalRupturas: 0,
          totalPresencas: 0,
          totalGeral: 0,
        };

        auditoriasPorTipo.forEach((item) => {
          if (item._id === "etiqueta")
            contadores.totalEtiquetas = item.auditorias;
          if (item._id === "ruptura")
            contadores.totalRupturas = item.auditorias;
          if (item._id === "presenca")
            contadores.totalPresencas = item.auditorias;
        });

        contadores.totalGeral =
          contadores.totalEtiquetas +
          contadores.totalRupturas +
          contadores.totalPresencas;

        // Calcular totais acumulados históricos
        const metricasAnteriores = await MetricasUsuario.find({
          loja: dados.loja._id,
          usuarioId: dados.usuarioId,
          dataInicio: { $lt: dataInicio },
        }).sort({ dataInicio: -1 });

        let totaisAcumulados = {
          itensLidosEtiquetas: dados.etiquetas.itensLidos,
          itensLidosRupturas: dados.rupturas.itensLidos,
          itensLidosPresencas: dados.presencas.itensLidos,
          itensLidosTotal:
            dados.etiquetas.itensLidos +
            dados.rupturas.itensLidos +
            dados.presencas.itensLidos,
        };

        // Somar com histórico anterior
        if (metricasAnteriores.length > 0) {
          const ultima = metricasAnteriores[0];
          if (ultima.totaisAcumulados) {
            totaisAcumulados.itensLidosEtiquetas +=
              ultima.totaisAcumulados.itensLidosEtiquetas || 0;
            totaisAcumulados.itensLidosRupturas +=
              ultima.totaisAcumulados.itensLidosRupturas || 0;
            totaisAcumulados.itensLidosPresencas +=
              ultima.totaisAcumulados.itensLidosPresencas || 0;
            totaisAcumulados.itensLidosTotal +=
              ultima.totaisAcumulados.itensLidosTotal || 0;
          }
        }

        // Atualizar os novos campos
        metricasUsuario.contadoresAuditorias = contadores;
        metricasUsuario.totaisAcumulados = totaisAcumulados;

        // Calcular totais e ranking
        metricasUsuario.atualizarTotais();

        // DEBUG: Verificar campos antes de salvar
        console.log(`💾 Salvando com lojaNome: "${metricasUsuario.lojaNome}"`);
        console.log(`💾 Salvando com usuarioNome: "${metricasUsuario.usuarioNome}"`);

        await metricasUsuario.save();
        console.log(
          `✅ Métricas salvas para usuário ${dados.usuarioNome} (${dados.usuarioId}) - ID: ${metricasUsuario._id}`
        );

        // VALIDAÇÃO: Verificar se não há duplicatas
        const contarMetricas = await MetricasUsuario.countDocuments({
          loja: dados.loja._id,
          usuarioId: dados.usuarioId,
          periodo: "periodo_completo",
        });

        if (contarMetricas > 1) {
          console.warn(`⚠️ AVISO: Encontradas ${contarMetricas} métricas para o mesmo usuário ${dados.usuarioId}!`);
        }
      } catch (error) {
        console.error(
          `❌ Erro ao salvar métricas do usuário ${dados.usuarioId}:`,
          error
        );
      }
    }

    // Atualizar rankings
    await this.atualizarRankingUsuarios(periodo, dataInicio, dataFim);

    console.log(`✅ Métricas de ${usuariosMap.size} usuários calculadas`);
  }

  // Calcular métricas de lojas
  async calcularMetricasLojas(periodo, dataInicio, dataFim) {
    console.log(`🏪 Calculando métricas de lojas...`);

    // Buscar todas as lojas ativas
    const lojas = await Loja.find({ ativa: true });

    for (const loja of lojas) {
      try {
        // Para MetricasLoja, sempre usar periodo_completo como padrão
        const periodoMetricas = "periodo_completo";

        // Buscar TODAS as auditorias da loja para período completo
        const auditorias = await Auditoria.find({
          loja: loja._id,
          // REMOVIDO: filtro de data para buscar TODAS as auditorias
        });

        // Contar usuários únicos ativos na loja
        const usuariosUnicos = new Set();

        // Nova estrutura seguindo o padrão do MetricasLoja.js atualizado
        const tiposAuditoria = {
          etiqueta: {
            totalItens: 0,
            itensValidos: 0,
            itensAtualizados: 0,
            itensNaolidos: 0,
            itensLidosSemEstoque: 0,
            itensDesatualizado: 0,
            itensSemEstoque: 0,
            itensNaopertence: 0,
            percentualConclusao: 0,
            usuarios: new Set(),
          },
          ruptura: {
            totalItens: 0,
            itensValidos: 0,
            itensAtualizados: 0,
            itensNaolidos: 0,
            itensLidosSemEstoque: 0,
            itensDesatualizado: 0,
            itensSemEstoque: 0,
            itensNaopertence: 0,
            percentualConclusao: 0,
            usuarios: new Set(),
            custoTotal: 0,
            custoTotalRuptura: 0,
            custoMedioRuptura: 0,
          },
          presenca: {
            totalItens: 0,
            itensValidos: 0,
            itensAtualizados: 0,
            itensNaolidos: 0,
            itensLidosSemEstoque: 0,
            itensDesatualizado: 0,
            itensSemEstoque: 0,
            itensNaopertence: 0,
            percentualConclusao: 0,
            usuarios: new Set(),
            presencasConfirmadas: 0,
            percentualPresenca: 0,
          },
        };

        // Analisar cada auditoria
        for (const auditoria of auditorias) {
          usuariosUnicos.add(auditoria.usuarioId);

          const tipo = tiposAuditoria[auditoria.tipo];
          if (tipo) {
            tipo.totalItens++;
            tipo.usuarios.add(auditoria.usuarioId);

            // Nova lógica baseada na situação da auditoria
            switch(auditoria.situacao) {
              case "Atualizado":
                tipo.itensAtualizados++;
                break;
              case "Não lido":
                // Verificar se tem estoque para determinar se é válido
                if (auditoria.estoque && parseInt(auditoria.estoque) > 0) {
                  tipo.itensNaolidos++; // Não lidos com estoque
                } else {
                  // Não lidos sem estoque - não conta como válido
                }
                break;
              case "Desatualizado":
                tipo.itensDesatualizado++;
                break;
              case "Sem estoque":
                // Se foi lido mas sem estoque
                if (auditoria.situacao !== "Não lido") {
                  tipo.itensLidosSemEstoque++;
                }
                tipo.itensSemEstoque++;
                break;
              case "Não pertence":
                tipo.itensNaopertence++;
                break;
            }

            // Calcular itensValidos: [Atualizado] + [Não lidos com estoque] + [Lido sem estoque]
            tipo.itensValidos = tipo.itensAtualizados + tipo.itensNaolidos + tipo.itensLidosSemEstoque;

            // Específicos por tipo
            if (auditoria.tipo === "ruptura" && auditoria.custoRuptura) {
              tipo.custoTotal += auditoria.custoRuptura;
              tipo.custoTotalRuptura += auditoria.custoRuptura;
            }
            if (auditoria.tipo === "presenca" && auditoria.presenca) {
              tipo.presencasConfirmadas++;
            }
          }
        }

        // Calcular itensValidos após processar todas as auditorias
        tiposAuditoria.etiqueta.itensValidos = tiposAuditoria.etiqueta.itensAtualizados + tiposAuditoria.etiqueta.itensNaolidos + tiposAuditoria.etiqueta.itensLidosSemEstoque;
        tiposAuditoria.ruptura.itensValidos = tiposAuditoria.ruptura.itensAtualizados + tiposAuditoria.ruptura.itensNaolidos + tiposAuditoria.ruptura.itensLidosSemEstoque;
        tiposAuditoria.presenca.itensValidos = tiposAuditoria.presenca.itensAtualizados + tiposAuditoria.presenca.itensNaolidos + tiposAuditoria.presenca.itensLidosSemEstoque;

        // Calcular itensLidos (todos exceto "Não lido")
        tiposAuditoria.etiqueta.itensLidos = tiposAuditoria.etiqueta.itensAtualizados + tiposAuditoria.etiqueta.itensDesatualizado + tiposAuditoria.etiqueta.itensLidosSemEstoque + tiposAuditoria.etiqueta.itensNaopertence;
        tiposAuditoria.ruptura.itensLidos = tiposAuditoria.ruptura.itensAtualizados + tiposAuditoria.ruptura.itensDesatualizado + tiposAuditoria.ruptura.itensLidosSemEstoque + tiposAuditoria.ruptura.itensNaopertence;
        tiposAuditoria.presenca.itensLidos = tiposAuditoria.presenca.itensAtualizados + tiposAuditoria.presenca.itensDesatualizado + tiposAuditoria.presenca.itensLidosSemEstoque + tiposAuditoria.presenca.itensNaopertence;

        // Calcular métricas consolidadas
        const etiquetas = {
          totalItens: tiposAuditoria.etiqueta.totalItens,
          itensValidos: tiposAuditoria.etiqueta.itensValidos,
          itensLidos: tiposAuditoria.etiqueta.itensLidos,
          itensAtualizados: tiposAuditoria.etiqueta.itensAtualizados,
          itensNaolidos: tiposAuditoria.etiqueta.itensNaolidos,
          itensLidosSemEstoque: tiposAuditoria.etiqueta.itensLidosSemEstoque,
          itensDesatualizado: tiposAuditoria.etiqueta.itensDesatualizado,
          itensSemEstoque: tiposAuditoria.etiqueta.itensSemEstoque,
          itensNaopertence: tiposAuditoria.etiqueta.itensNaopertence,
          percentualConclusao:
            tiposAuditoria.etiqueta.itensValidos > 0
              ? Math.round(
                  (tiposAuditoria.etiqueta.itensAtualizados /
                    tiposAuditoria.etiqueta.itensValidos) *
                    100
                )
              : 0,
          usuariosAtivos: tiposAuditoria.etiqueta.usuarios.size,
        };

        const rupturas = {
          totalItens: tiposAuditoria.ruptura.totalItens,
          itensValidos: tiposAuditoria.ruptura.itensValidos,
          itensLidos: tiposAuditoria.ruptura.itensLidos,
          itensAtualizados: tiposAuditoria.ruptura.itensAtualizados,
          itensNaolidos: tiposAuditoria.ruptura.itensNaolidos,
          itensLidosSemEstoque: tiposAuditoria.ruptura.itensLidosSemEstoque,
          itensDesatualizado: tiposAuditoria.ruptura.itensDesatualizado,
          itensSemEstoque: tiposAuditoria.ruptura.itensSemEstoque,
          itensNaopertence: tiposAuditoria.ruptura.itensNaopertence,
          percentualConclusao:
            tiposAuditoria.ruptura.itensValidos > 0
              ? Math.round(
                  (tiposAuditoria.ruptura.itensAtualizados /
                    tiposAuditoria.ruptura.itensValidos) *
                    100
                )
              : 0,
          custoTotalRuptura: tiposAuditoria.ruptura.custoTotalRuptura,
          custoMedioRuptura:
            tiposAuditoria.ruptura.totalItens > 0
              ? Math.round(
                  tiposAuditoria.ruptura.custoTotalRuptura /
                    tiposAuditoria.ruptura.totalItens
                )
              : 0,
          rupturasCriticas: auditorias.filter(
            (a) => a.tipo === "ruptura" && a.custoRuptura > 100
          ).length,
          usuariosAtivos: tiposAuditoria.ruptura.usuarios.size,
        };

        const presencas = {
          totalItens: tiposAuditoria.presenca.totalItens,
          itensValidos: tiposAuditoria.presenca.itensValidos,
          itensLidos: tiposAuditoria.presenca.itensLidos,
          itensAtualizados: tiposAuditoria.presenca.itensAtualizados,
          itensNaolidos: tiposAuditoria.presenca.itensNaolidos,
          itensLidosSemEstoque: tiposAuditoria.presenca.itensLidosSemEstoque,
          itensDesatualizado: tiposAuditoria.presenca.itensDesatualizado,
          itensSemEstoque: tiposAuditoria.presenca.itensSemEstoque,
          itensNaopertence: tiposAuditoria.presenca.itensNaopertence,
          percentualConclusao:
            tiposAuditoria.presenca.itensValidos > 0
              ? Math.round(
                  (tiposAuditoria.presenca.itensAtualizados /
                    tiposAuditoria.presenca.itensValidos) *
                    100
                )
              : 0,
          presencasConfirmadas: tiposAuditoria.presenca.presencasConfirmadas,
          percentualPresenca:
            tiposAuditoria.presenca.totalItens > 0
              ? Math.round(
                  (tiposAuditoria.presenca.presencasConfirmadas /
                    tiposAuditoria.presenca.totalItens) *
                    100
                )
              : 0,
          usuariosAtivos: tiposAuditoria.presenca.usuarios.size,
        };

        // Buscar ou criar métricas da loja - SEMPRE periodo_completo
        let metricasLoja = await MetricasLoja.findOne({
          loja: loja._id,
          periodo: periodoMetricas,
        });

        if (!metricasLoja) {
          console.log(`📝 Criando novo MetricasLoja para loja ${loja.nome}`);
          metricasLoja = new MetricasLoja({
            loja: loja._id,
            lojaNome: loja.nome,
            periodo: periodoMetricas,
            dataInicio,
            dataFim,
            versaoCalculo: this.versaoCalculo,
          });
        } else {
          console.log(`🔄 Atualizando MetricasLoja existente para loja ${loja.nome}`);
          // Atualizar nome da loja se necessário
          if (!metricasLoja.lojaNome) {
            metricasLoja.lojaNome = loja.nome;
          }
          metricasLoja.dataFim = dataFim;
          if (!metricasLoja.dataInicio || dataInicio < metricasLoja.dataInicio) {
            metricasLoja.dataInicio = dataInicio;
          }
        }

        // Atualizar dados
        metricasLoja.etiquetas = etiquetas;
        metricasLoja.rupturas = rupturas;
        metricasLoja.presencas = presencas;

        // Encontrar melhor usuário da loja
        const metricasUsuarios = await MetricasUsuario.find({
          loja: loja._id,
          periodo,
          dataInicio,
        })
          .sort({ "totais.pontuacaoTotal": -1 })
          .limit(1);

        if (metricasUsuarios.length > 0) {
          const melhorUsuario = metricasUsuarios[0];
          metricasLoja.usuariosEstatisticas.melhorUsuario = {
            usuarioId: melhorUsuario.usuarioId,
            usuarioNome: melhorUsuario.usuarioNome,
            pontuacao: melhorUsuario.totais.pontuacaoTotal,
          };
        }

        // Usuário mais ativo (mais itens processados)
        const usuarioMaisAtivo = await MetricasUsuario.findOne({
          loja: loja._id,
          periodo,
          dataInicio,
        }).sort({ "totais.totalItens": -1 });

        if (usuarioMaisAtivo) {
          metricasLoja.usuariosEstatisticas.usuarioMaisAtivo = {
            usuarioId: usuarioMaisAtivo.usuarioId,
            usuarioNome: usuarioMaisAtivo.usuarioNome,
            itensProcessados: usuarioMaisAtivo.totais.totalItens,
          };
        }

        // Calcular totais e detectar alertas
        metricasLoja.atualizarTotais();
        metricasLoja.detectarAlertas();

        await metricasLoja.save();
      } catch (error) {
        console.error(
          `❌ Erro ao calcular métricas da loja ${loja.codigo}:`,
          error
        );
      }
    }

    // Atualizar rankings de lojas
    await this.atualizarRankingLojas(periodo, dataInicio, dataFim);

    console.log(`✅ Métricas de ${lojas.length} lojas calculadas`);
  }

  // Calcular métricas por tipo de auditoria
  async calcularMetricasAuditorias(periodo, dataInicio, dataFim) {
    console.log(`📋 Calculando métricas por tipo de auditoria...`);

    const tipos = ["etiqueta", "ruptura", "presenca"];

    for (const tipo of tipos) {
      try {
        // Buscar auditorias do tipo no período
        const auditorias = await Auditoria.find({
          tipo,
          data: { $gte: dataInicio, $lte: dataFim },
        }).populate("loja", "codigo nome regiao");

        // Calcular métricas gerais
        const totais = {
          totalItens: auditorias.length,
          itensLidos: auditorias.filter(
            (a) => a.situacao && a.situacao !== "Não lido"
          ).length,
          itensAtualizados: auditorias.filter(
            (a) => a.situacao === "Atualizado"
          ).length,
          percentualConclusao: 0,
          lojasTotais: new Set(auditorias.map((a) => a.loja._id.toString()))
            .size,
          lojasAtivas: new Set(
            auditorias
              .filter((a) => a.situacao === "Atualizado")
              .map((a) => a.loja._id.toString())
          ).size,
          usuariosTotais: new Set(auditorias.map((a) => a.usuarioId)).size,
          usuariosAtivos: new Set(
            auditorias
              .filter((a) => a.situacao === "Atualizado")
              .map((a) => a.usuarioId)
          ).size,
        };

        if (totais.totalItens > 0) {
          totais.percentualConclusao = Math.round(
            (totais.itensAtualizados / totais.totalItens) * 100
          );
        }

        // Métricas específicas por tipo
        const metricas = { etiquetas: {}, rupturas: {}, presencas: {} };

        if (tipo === "etiqueta") {
          metricas.etiquetas = {
            tempoMedioProcessamento: 5, // Estimativa
            itensPerUsuario:
              totais.usuariosAtivos > 0
                ? Math.round(totais.totalItens / totais.usuariosAtivos)
                : 0,
            produtividadeMedia:
              totais.usuariosAtivos > 0
                ? Math.round(totais.itensAtualizados / totais.usuariosAtivos)
                : 0,
            locaisMaisMovimentados: await this.calcularLocaisMaisMovimentados(
              auditorias
            ),
          };
        } else if (tipo === "ruptura") {
          const custosRuptura = auditorias.map((a) => a.custoRuptura || 0);
          const custoTotal = custosRuptura.reduce(
            (sum, custo) => sum + custo,
            0
          );

          metricas.rupturas = {
            custoTotalRuptura: custoTotal,
            custoMedioRuptura:
              auditorias.length > 0
                ? Math.round(custoTotal / auditorias.length)
                : 0,
            custoMedioPerLoja:
              totais.lojasAtivas > 0
                ? Math.round(custoTotal / totais.lojasAtivas)
                : 0,
            rupturasCriticas: auditorias.filter(
              (a) => (a.custoRuptura || 0) > 100
            ).length,
            diasMediosSemVenda:
              auditorias.length > 0
                ? Math.round(
                    auditorias.reduce(
                      (sum, a) => sum + (a.diasSemVenda || 0),
                      0
                    ) / auditorias.length
                  )
                : 0,
            setoresMaisAfetados: await this.calcularSetoresMaisAfetados(
              auditorias
            ),
            fornecedoresMaisAfetados:
              await this.calcularFornecedoresMaisAfetados(auditorias),
          };
        } else if (tipo === "presenca") {
          const presencasConfirmadas = auditorias.filter(
            (a) => a.presenca
          ).length;

          metricas.presencas = {
            presencasConfirmadas,
            percentualPresenca:
              auditorias.length > 0
                ? Math.round((presencasConfirmadas / auditorias.length) * 100)
                : 0,
            tempoMedioConfirmacao: 10, // Estimativa
            produtosComPresenca: presencasConfirmadas,
            produtosSemPresenca: auditorias.length - presencasConfirmadas,
            setoresComMelhorPresenca: await this.calcularSetoresMelhorPresenca(
              auditorias
            ),
          };
        }

        // Análise por loja
        const porLoja = await this.calcularMetricasPorLoja(auditorias, tipo);

        // Buscar ou criar métricas de auditoria
        let metricasAuditoria = await MetricasAuditoria.findOne({
          tipo,
          periodo,
          dataInicio,
        });

        if (!metricasAuditoria) {
          metricasAuditoria = new MetricasAuditoria({
            tipo,
            periodo,
            dataInicio,
            dataFim,
            versaoCalculo: this.versaoCalculo,
          });
        }

        // Atualizar dados
        metricasAuditoria.totais = totais;
        metricasAuditoria.metricas = metricas;
        metricasAuditoria.porLoja = porLoja;

        // Detectar padrões críticos e gerar insights
        metricasAuditoria.detectarPadroesCriticos();
        metricasAuditoria.gerarInsights();

        await metricasAuditoria.save();
      } catch (error) {
        console.error(
          `❌ Erro ao calcular métricas de auditoria ${tipo}:`,
          error
        );
      }
    }

    console.log(
      `✅ Métricas de auditorias calculadas para ${tipos.length} tipos`
    );
  }

  // Calcular métricas globais
  async calcularMetricasGlobais(periodo, dataInicio, dataFim) {
    console.log(`🌍 Calculando métricas globais...`);

    try {
      // Buscar todas as métricas calculadas
      const [metricasLojas, metricasUsuarios, metricasAuditorias] =
        await Promise.all([
          MetricasLoja.find({ periodo, dataInicio }).populate(
            "loja",
            "codigo nome regiao"
          ),
          MetricasUsuario.find({ periodo, dataInicio }).populate(
            "loja",
            "codigo nome regiao"
          ),
          MetricasAuditoria.find({ periodo, dataInicio }),
        ]);

      // Calcular resumo executivo
      const resumoExecutivo = {
        totalLojas: new Set(metricasLojas.map((m) => m.loja._id.toString()))
          .size,
        lojasAtivas: metricasLojas.filter((m) => m.totais.totalItens > 0)
          .length,
        totalUsuarios: new Set(metricasUsuarios.map((m) => m.usuarioId)).size,
        usuariosAtivos: metricasUsuarios.filter((m) => m.totais.totalItens > 0)
          .length,
        totalItensProcessados: metricasUsuarios.reduce(
          (sum, m) => sum + m.totais.totalItens,
          0
        ),
        totalItensAtualizados: metricasUsuarios.reduce(
          (sum, m) => sum + m.totais.itensAtualizados,
          0
        ),
        percentualConclusaoGeral: 0,
        planilhasProcessadas: metricasLojas.reduce(
          (sum, m) => sum + m.totais.planilhasProcessadas,
          0
        ),
      };

      if (resumoExecutivo.totalItensProcessados > 0) {
        resumoExecutivo.percentualConclusaoGeral = Math.round(
          (resumoExecutivo.totalItensAtualizados /
            resumoExecutivo.totalItensProcessados) *
            100
        );
      }

      // Métricas por tipo de auditoria
      const porTipoAuditoria = {
        etiquetas: this.consolidarMetricasTipo(
          metricasAuditorias.find((m) => m.tipo === "etiqueta")
        ),
        rupturas: this.consolidarMetricasTipo(
          metricasAuditorias.find((m) => m.tipo === "ruptura")
        ),
        presencas: this.consolidarMetricasTipo(
          metricasAuditorias.find((m) => m.tipo === "presenca")
        ),
      };

      // Rankings
      const rankings = await this.calcularRankingsGlobais(
        metricasLojas,
        metricasUsuarios
      );

      // Análise regional
      const porRegiao = await this.calcularAnaliseRegional(metricasLojas);

      // Buscar ou criar métricas globais
      let metricasGlobais = await MetricasGlobais.findOne({
        periodo,
        dataInicio,
      });

      if (!metricasGlobais) {
        metricasGlobais = new MetricasGlobais({
          periodo,
          dataInicio,
          dataFim,
          versaoCalculo: this.versaoCalculo,
        });
      }

      // Atualizar dados
      metricasGlobais.resumoExecutivo = resumoExecutivo;
      metricasGlobais.porTipoAuditoria = porTipoAuditoria;
      metricasGlobais.rankings = rankings;
      metricasGlobais.porRegiao = porRegiao;

      // Calcular indicadores de negócio
      metricasGlobais.calcularIndicadoresNegocio();

      // Detectar alertas críticos
      metricasGlobais.detectarAlertasCriticos();

      // Avaliar metas
      metricasGlobais.avaliarMetas();

      // Calcular tendências com período anterior
      const periodoAnterior = await this.obterPeriodoAnterior(
        periodo,
        dataInicio
      );
      if (periodoAnterior) {
        metricasGlobais.comparacoes.periodoAnterior = {
          totalItens: periodoAnterior.resumoExecutivo.totalItensProcessados,
          itensAtualizados:
            periodoAnterior.resumoExecutivo.totalItensAtualizados,
          percentualConclusao:
            periodoAnterior.resumoExecutivo.percentualConclusaoGeral,
          usuariosAtivos: periodoAnterior.resumoExecutivo.usuariosAtivos,
          lojasAtivas: periodoAnterior.resumoExecutivo.lojasAtivas,
        };
        metricasGlobais.calcularVariacoes(periodoAnterior);
      }

      await metricasGlobais.save();

      console.log(`✅ Métricas globais calculadas com sucesso`);
    } catch (error) {
      console.error(`❌ Erro ao calcular métricas globais:`, error);
      throw error;
    }
  }

  // Calcular métricas diárias de lojas
  async calcularLojaDailyMetrics(dataInicio, dataFim, tipoAuditoria = null) {
    console.log(`🏪📅 Calculando métricas diárias de lojas${tipoAuditoria ? ` - tipo: ${tipoAuditoria}` : ''}...`);

    // Buscar todas as lojas ativas
    const lojas = await Loja.find({ ativa: true });

    for (const loja of lojas) {
      try {
        // Se tipoAuditoria específico foi fornecido, processar apenas esse tipo
        // Senão, buscar TODAS as auditorias da loja
        let filtroAuditoria = { loja: loja._id };
        if (tipoAuditoria) {
          // Para tipo específico, buscar auditorias do dia atual desse tipo
          filtroAuditoria = {
            loja: loja._id,
            tipo: tipoAuditoria,
            data: { $gte: dataInicio, $lte: dataFim },
          };
          console.log(`🔍 Buscando auditorias específicas do tipo ${tipoAuditoria} para loja ${loja.codigo}`);
        } else {
          console.log(`🔍 Buscando TODAS as auditorias para recálculo completo da loja ${loja.codigo}`);
        }

        const auditorias = await Auditoria.find(filtroAuditoria);

        // Estrutura seguindo o padrão do LojaDailyMetrics.js
        const contadoresClasses = new Map([
          ["A CLASSIFICAR", 0],
          ["ALTO GIRO", 0],
          ["BAZAR", 0],
          ["DIVERSOS", 0],
          ["DPH", 0],
          ["FLV", 0],
          ["LATICINIOS 1", 0],
          ["LIQUIDA", 0],
          ["PERECIVEL 1", 0],
          ["PERECIVEL 2", 0],
          ["PERECIVEL 2 B", 0],
          ["PERECIVEL 3", 0],
          ["SECA DOCE", 0],
          ["SECA SALGADA", 0],
          ["SECA SALGADA 2", 0],
        ]);

        const contadoresLocais = new Map([
          ["C01 - C01", 0],
          ["CS01 - CS01", 0],
          ["F01 - F01", 0],
          ["F02 - F02", 0],
          ["FLV - FLV", 0],
          ["G01A - G01A", 0],
          ["G01B - G01B", 0],
          ["G02A - G02A", 0],
          ["G02B - G02B", 0],
          ["G03A - G03A", 0],
          ["G03B - G03B", 0],
          ["G04A - G04A", 0],
          ["G04B - G04B", 0],
          ["G05A - G05A", 0],
          ["G05B - G05B", 0],
          ["G06A - G06A", 0],
          ["G06B - G06B", 0],
          ["G07A - G07A", 0],
          ["G07B - G07B", 0],
          ["G08A - G08A", 0],
          ["G08B - G08B", 0],
          ["G09A - G09A", 0],
          ["G09B - G09B", 0],
          ["G10A - G10A", 0],
          ["G10B - G10B", 0],
          ["G11A - G11A", 0],
          ["G11B - G11B", 0],
          ["G12A - G12A", 0],
          ["G12B - G12B", 0],
          ["G13A - G13A", 0],
          ["G13B - G13B", 0],
          ["G14A - G14A", 0],
          ["G14B - G14B", 0],
          ["G15A - G15A", 0],
          ["G15B - G15B", 0],
          ["G16A - G16A", 0],
          ["G16B - G16B", 0],
          ["G17A - G17A", 0],
          ["G17B - G17B", 0],
          ["G18A - G18A", 0],
          ["G18B - G18B", 0],
          ["G19A - G19A", 0],
          ["G19B - G19B", 0],
          ["G20A - G20A", 0],
          ["G20B - G20B", 0],
          ["G21A - G21A", 0],
          ["G21B - G21B", 0],
          ["G22A - G22A", 0],
          ["G22B - G22B", 0],
          ["GELO - GELO", 0],
          ["I01 - I01", 0],
          ["PA01 - PA01", 0],
          ["PAO - PAO", 0],
          ["PF01 - PF01", 0],
          ["PF02 - PF02", 0],
          ["PF03 - PF03", 0],
          ["PL01 - PL01", 0],
          ["PL02 - PL02", 0],
          ["SORVETE - SORVETE", 0],
        ]);

        const tiposAuditoria = {
          etiquetas: {
            totalItens: 0,
            itensLidos: 0,  // Campo necessário para todos
            itensValidos: 0,
            itensAtualizados: 0,
            itensNaolidos: 0,
            itensDesatualizado: 0,
            itensNaopertence: 0,
            itensLidosemestoque: 0,
            itensNlidocomestoque: 0,
            itensSemestoque: 0,
            percentualConclusao: 0,
            percentualRestante: 0,
            usuariosAtivos: 0,
            usuarios: new Set(),
          },
          rupturas: {
            totalItens: 0,
            itensLidos: 0,  // Campo obrigatório no schema
            itensValidos: 0,
            itensAtualizados: 0,
            itensNaolidos: 0,
            itensDesatualizado: 0,
            itensNaopertence: 0,
            itensLidosemestoque: 0,
            itensNlidocomestoque: 0,
            itensSemestoque: 0,
            percentualConclusao: 0,
            percentualRestante: 0,
            custoTotalRuptura: 0,
            custoMedioRuptura: 0,
            rupturasCriticas: 0, // Campo obrigatório no schema
            usuariosAtivos: 0,
            usuarios: new Set(),
          },
          presencas: {
            totalItens: 0,
            itensLidos: 0,  // Campo obrigatório no schema
            itensValidos: 0,
            itensAtualizados: 0,
            itensNaolidos: 0,
            itensDesatualizado: 0,
            itensNaopertence: 0,
            itensLidosemestoque: 0,
            itensNlidocomestoque: 0,
            itensSemestoque: 0,
            percentualConclusao: 0,
            percentualRestante: 0,
            presencasConfirmadas: 0,
            percentualPresenca: 0,
            usuariosAtivos: 0,
            usuarios: new Set(),
          },
        };

        // Processar cada auditoria
        for (const auditoria of auditorias) {
          // Mapear o tipo corretamente: etiqueta -> etiquetas, ruptura -> rupturas, presenca -> presencas
          let tipoMapeado;
          if (auditoria.tipo === 'etiqueta') tipoMapeado = 'etiquetas';
          else if (auditoria.tipo === 'ruptura') tipoMapeado = 'rupturas';
          else if (auditoria.tipo === 'presenca') tipoMapeado = 'presencas';

          const tipo = tiposAuditoria[tipoMapeado];
          if (tipo) {
            tipo.totalItens++;
            tipo.usuarios.add(auditoria.usuarioId);

            if (auditoria.situacao && auditoria.situacao !== "Não lido") {
              tipo.itensLidos = (tipo.itensLidos || 0) + 1;
            }

            switch(auditoria.situacao) {
              case "Atualizado":
                tipo.itensAtualizados++;
                break;
              case "Desatualizado":
                tipo.itensDesatualizado++;
                break;
              case "Sem estoque":
                tipo.itensSemestoque++;
                // Se foi lido mas estava sem estoque
                if (auditoria.situacao !== "Não lido") {
                  tipo.itensLidosemestoque++;
                }
                break;
              case "Não pertence":
                tipo.itensNaopertence++;
                break;
              case "Não lido":
                // Verificar se tem estoque para determinar se é válido
                if (auditoria.estoque && parseInt(auditoria.estoque) > 0) {
                  tipo.itensNlidocomestoque++; // Não lidos com estoque
                  tipo.itensNaolidos++; // Contador para itensNaolidos
                }
                break;
            }

            // Específicos por tipo
            if (auditoria.tipo === "ruptura") {
              if (auditoria.custoRuptura) {
                tipo.custoTotalRuptura += auditoria.custoRuptura;
                // Contar rupturas críticas (custo > 100)
                if (auditoria.custoRuptura > 100) {
                  tipo.rupturasCriticas++;
                }
              }
            }
            if (auditoria.tipo === "presenca" && auditoria.presenca) {
              tipo.presencasConfirmadas++;
            }
          }

          // Contar classes de produto
          if (auditoria.ClasseProduto && contadoresClasses.has(auditoria.ClasseProduto)) {
            contadoresClasses.set(auditoria.ClasseProduto, contadoresClasses.get(auditoria.ClasseProduto) + 1);
          } else if (auditoria.classeProdutoRaiz && contadoresClasses.has(auditoria.classeProdutoRaiz)) {
            contadoresClasses.set(auditoria.classeProdutoRaiz, contadoresClasses.get(auditoria.classeProdutoRaiz) + 1);
          }

          // Contar locais
          if (auditoria.local && contadoresLocais.has(auditoria.local)) {
            contadoresLocais.set(auditoria.local, contadoresLocais.get(auditoria.local) + 1);
          }
        }

        // Calcular valores derivados e percentuais
        Object.values(tiposAuditoria).forEach(tipo => {
          // Calcular itensValidos: [Atualizado] + [Não lidos com estoque] + [Lido sem estoque]
          tipo.itensValidos = tipo.itensAtualizados + tipo.itensNaolidos + tipo.itensLidosemestoque;

          if (tipo.itensValidos > 0) {
            tipo.percentualConclusao = Math.round((tipo.itensAtualizados / tipo.itensValidos) * 100);
            tipo.percentualRestante = 100 - tipo.percentualConclusao;
          } else if (tipo.totalItens > 0) {
            tipo.percentualConclusao = Math.round((tipo.itensAtualizados / tipo.totalItens) * 100);
            tipo.percentualRestante = 100 - tipo.percentualConclusao;
          }

          if (tipo.custoTotalRuptura && tipo.totalItens > 0) {
            tipo.custoMedioRuptura = Math.round(tipo.custoTotalRuptura / tipo.totalItens);
          }

          if (tipo.presencasConfirmadas !== undefined && tipo.totalItens > 0) {
            tipo.percentualPresenca = Math.round((tipo.presencasConfirmadas / tipo.totalItens) * 100);
          }

          // Converter Set para number
          tipo.usuariosAtivos = tipo.usuarios.size;
          delete tipo.usuarios; // Remover o Set já que não vamos salvar
        });

        // Buscar ou criar LojaDailyMetrics usando findOneAndUpdate como UserDailyMetrics
        // Usar somente loja como critério único, igual ao UserDailyMetrics
        let lojaDailyMetrics = await LojaDailyMetrics.findOneAndUpdate(
          {
            loja: loja._id,
          },
          {
            $setOnInsert: {
              loja: loja._id,
              lojaNome: loja.nome,
              data: new Date(), // Data atual para registro
              dataInicio: dataInicio,
              dataFim: dataFim,
              versaoCalculo: this.versaoCalculo,
              etiquetas: {
                totalItens: 0,
                itensValidos: 0,
                itensAtualizados: 0,
                itensNaolidos: 0,
                itensDesatualizado: 0,
                itensNaopertence: 0,
                itensLidosemestoque: 0,
                itensNlidocomestoque: 0,
                itensSemestoque: 0,
                percentualConclusao: 0,
                percentualRestante: 0,
                usuariosAtivos: 0,
              },
              rupturas: {
                totalItens: 0,
                itensValidos: 0,
                itensAtualizados: 0,
                itensNaolidos: 0,
                itensDesatualizado: 0,
                itensNaopertence: 0,
                itensLidosemestoque: 0,
                itensNlidocomestoque: 0,
                itensSemestoque: 0,
                percentualConclusao: 0,
                percentualRestante: 0,
                custoTotalRuptura: 0,
                custoMedioRuptura: 0,
                usuariosAtivos: 0,
              },
              presencas: {
                totalItens: 0,
                itensValidos: 0,
                itensAtualizados: 0,
                itensNaolidos: 0,
                itensDesatualizado: 0,
                itensNaopertence: 0,
                itensLidosemestoque: 0,
                itensNlidocomestoque: 0,
                itensSemestoque: 0,
                percentualConclusao: 0,
                percentualRestante: 0,
                presencasConfirmadas: 0,
                percentualPresenca: 0,
                usuariosAtivos: 0,
              },
              ContadorClassesProduto: Object.fromEntries(contadoresClasses),
              ContadorLocais: Object.fromEntries(contadoresLocais),
            },
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );

        // Verificar se é novo documento criado
        const isNewDocument = !lojaDailyMetrics.etiquetas || lojaDailyMetrics.etiquetas.totalItens === 0;
        if (isNewDocument) {
          console.log(`📝 Criando novo LojaDailyMetrics para loja ${loja.nome}`);
        } else {
          console.log(`🔄 Atualizando LojaDailyMetrics existente ${lojaDailyMetrics._id} para loja ${loja.nome}`);
          console.log(`🔍 Dados atuais: E:${lojaDailyMetrics.etiquetas?.totalItens || 0} R:${lojaDailyMetrics.rupturas?.totalItens || 0} P:${lojaDailyMetrics.presencas?.totalItens || 0}`);
        }

        // Garantir que o nome da loja esteja atualizado
        if (!lojaDailyMetrics.lojaNome) {
          lojaDailyMetrics.lojaNome = loja.nome;
        }

        // Atualizar dataFim sempre com a data mais recente
        lojaDailyMetrics.dataFim = dataFim;

        // Função para mapear dados calculados para estrutura do schema
        const mapearParaSchema = (dados, tipoSchema) => {
          // Verificar se dados existem e não são undefined/null
          if (!dados || typeof dados !== 'object') {
            console.log(`⚠️  Dados vazios para ${tipoSchema}, retornando objeto padrão`);
            dados = {};
          }

          // Função auxiliar para calcular percentual de conclusão de forma segura
          const calcularPercentual = (numerador, denominador) => {
            if (!denominador || denominador === 0 || !numerador) return 0;
            const percentual = (numerador / denominador) * 100;
            return isNaN(percentual) ? 0 : Math.round(percentual);
          };

          if (tipoSchema === 'etiquetas') {
            // Etiquetas têm todos os campos detalhados
            return {
              totalItens: Number(dados.totalItens) || 0,
              itensValidos: Number(dados.itensValidos) || 0,
              itensAtualizados: Number(dados.itensAtualizados) || 0,
              itensNaolidos: Number(dados.itensNaolidos) || 0,
              itensDesatualizado: Number(dados.itensDesatualizado) || 0,
              itensNaopertence: Number(dados.itensNaopertence) || 0,
              itensLidosemestoque: Number(dados.itensLidosSemEstoque || dados.itensLidosemestoque) || 0,
              itensNlidocomestoque: Number(dados.itensNlidocomestoque) || 0,
              itensSemestoque: Number(dados.itensSemEstoque || dados.itensSemestoque) || 0,
              percentualConclusao: calcularPercentual(dados.itensAtualizados, dados.totalItens),
              percentualRestante: calcularPercentual(dados.totalItens - (dados.itensAtualizados || 0), dados.totalItens),
              usuariosAtivos: Number(dados.usuariosAtivos) || 0,
            };
          } else if (tipoSchema === 'rupturas') {
            // Rupturas têm apenas campos básicos
            return {
              totalItens: Number(dados.totalItens) || 0,
              itensLidos: Number(dados.itensLidos) || 0,
              itensAtualizados: Number(dados.itensAtualizados) || 0,
              percentualConclusao: calcularPercentual(dados.itensAtualizados, dados.totalItens),
              percentualRestante: calcularPercentual(dados.totalItens - (dados.itensAtualizados || 0), dados.totalItens),
              custoTotalRuptura: Number(dados.custoTotalRuptura) || 0,
              rupturasCriticas: Number(dados.rupturasCriticas) || 0,
              usuariosAtivos: Number(dados.usuariosAtivos) || 0,
            };
          } else if (tipoSchema === 'presencas') {
            // Presencas têm campos básicos + presença específicos
            return {
              totalItens: Number(dados.totalItens) || 0,
              itensLidos: Number(dados.itensLidos) || 0,
              itensAtualizados: Number(dados.itensAtualizados) || 0,
              percentualConclusao: calcularPercentual(dados.itensAtualizados, dados.totalItens),
              percentualRestante: calcularPercentual(dados.totalItens - (dados.itensAtualizados || 0), dados.totalItens),
              presencasConfirmadas: Number(dados.presencasConfirmadas) || 0,
              percentualPresenca: calcularPercentual(dados.presencasConfirmadas, dados.totalItens),
              usuariosAtivos: Number(dados.usuariosAtivos) || 0,
            };
          }
          console.log(`⚠️  Tipo de schema desconhecido: ${tipoSchema}`);
          return {};
        };

        // Usar método processarAuditorias do modelo para garantir cálculos corretos
        if (tipoAuditoria) {
          // Para tipo específico, processar apenas esse tipo
          const auditoriasFiltradas = auditorias.filter(a => a.tipo === tipoAuditoria);
          if (auditoriasFiltradas.length > 0) {
            console.log(`🔄 Processando ${auditoriasFiltradas.length} auditorias do tipo ${tipoAuditoria}`);
            lojaDailyMetrics.processarAuditorias(auditoriasFiltradas, tipoAuditoria === 'etiqueta' ? 'etiquetas' : tipoAuditoria === 'ruptura' ? 'rupturas' : 'presencas');
          }
        } else {
          // Para recálculo completo, processar todos os tipos
          console.log(`🔄 Recalculando TODOS os tipos de auditoria`);
          const etiquetasAuditorias = auditorias.filter(a => a.tipo === 'etiqueta');
          const rupturasAuditorias = auditorias.filter(a => a.tipo === 'ruptura');
          const presencasAuditorias = auditorias.filter(a => a.tipo === 'presenca');

          if (etiquetasAuditorias.length > 0) {
            lojaDailyMetrics.processarAuditorias(etiquetasAuditorias, 'etiquetas');
          }
          if (rupturasAuditorias.length > 0) {
            lojaDailyMetrics.processarAuditorias(rupturasAuditorias, 'rupturas');
          }
          if (presencasAuditorias.length > 0) {
            lojaDailyMetrics.processarAuditorias(presencasAuditorias, 'presencas');
          }

          // Para recálculo completo, calcular estatísticas dos locais com todas as auditorias
          if (auditorias.length > 0) {
            console.log(`📊 Calculando estatísticas de ${lojaDailyMetrics.locaisEstatisticas?.length || 0} locais`);
            lojaDailyMetrics.calcularLocaisEstatisticas(auditorias);
          }
        }

        // Atualizar totais usando método do schema
        lojaDailyMetrics.atualizarTotais();

        await lojaDailyMetrics.save();
        console.log(`✅ LojaDailyMetrics salvo para loja ${loja.codigo} - ID: ${lojaDailyMetrics._id}`);
        console.log(`📊 Dados salvos: E:${lojaDailyMetrics.etiquetas.totalItens} R:${lojaDailyMetrics.rupturas.totalItens} P:${lojaDailyMetrics.presencas.totalItens}`);

      } catch (error) {
        console.error(`❌ Erro ao calcular métricas diárias da loja ${loja.codigo}:`, error);
      }
    }

    console.log(`✅ Métricas diárias de ${lojas.length} lojas calculadas`);
  }

  // Métodos auxiliares

  obterPeriodo(periodo, data) {
    const dataRef = new Date(data);
    let dataInicio, dataFim;

    switch (periodo) {
      case "diario":
        dataInicio = new Date(dataRef);
        dataInicio.setHours(0, 0, 0, 0);
        dataFim = new Date(dataRef);
        dataFim.setHours(23, 59, 59, 999);
        break;

      case "semanal":
        const diaSemanaSemana = dataRef.getDay();
        dataInicio = new Date(dataRef);
        dataInicio.setDate(dataRef.getDate() - diaSemanaSemana);
        dataInicio.setHours(0, 0, 0, 0);
        dataFim = new Date(dataInicio);
        dataFim.setDate(dataInicio.getDate() + 6);
        dataFim.setHours(23, 59, 59, 999);
        break;

      case "mensal":
        dataInicio = new Date(dataRef.getFullYear(), dataRef.getMonth(), 1);
        dataFim = new Date(dataRef.getFullYear(), dataRef.getMonth() + 1, 0);
        dataFim.setHours(23, 59, 59, 999);
        break;

      default:
        throw new Error(`Período inválido: ${periodo}`);
    }

    return { dataInicio, dataFim };
  }

  // Atualizar o método de ranking
  async atualizarRankingUsuarios(periodo, dataInicio, dataFim) {
    const lojas = await Loja.find({ ativa: true });

    for (const loja of lojas) {
      const usuariosLoja = await MetricasUsuario.find({
        loja: loja._id,
        periodo,
        dataInicio,
      }).sort({ "totais.pontuacaoTotal": -1 });

      for (let i = 0; i < usuariosLoja.length; i++) {
        const posicao = i + 1;
        const usuario = usuariosLoja[i];

        usuario.ranking.posicaoLoja = posicao;

        if (posicao <= 10) {
          const campoPosicao = `posicao${posicao}`;
          if (usuario.historicoRanking[campoPosicao] !== undefined) {
            usuario.historicoRanking[campoPosicao]++;
          }
          usuario.historicoRanking.totalTop10++;
        } else {
          // NOVO: Contar vezes que ficou acima do 10º lugar
          usuario.historicoRanking.ACIMA10 = (usuario.historicoRanking.ACIMA10 || 0) + 1;
        }

        if (usuario.historicoRanking.melhorPosicao === null || posicao < usuario.historicoRanking.melhorPosicao) {
          usuario.historicoRanking.melhorPosicao = posicao;
        }

        await usuario.save();
      }
    }

    // Ranking geral
    const todosUsuarios = await MetricasUsuario.find({
      periodo,
      dataInicio,
    }).sort({ "totais.pontuacaoTotal": -1 });

    for (let i = 0; i < todosUsuarios.length; i++) {
      todosUsuarios[i].ranking.posicaoGeral = i + 1;
      await todosUsuarios[i].save();
    }
  }

  async atualizarRankingLojas(periodo, dataInicio, dataFim) {
    const lojas = await MetricasLoja.find({
      periodo,
      dataInicio,
    }).sort({ "ranking.pontuacaoTotal": -1 });

    for (let i = 0; i < lojas.length; i++) {
      lojas[i].ranking.posicaoGeral = i + 1;
      await lojas[i].save();
    }
  }

  consolidarMetricasTipo(metricasAuditoria) {
    if (!metricasAuditoria) {
      return {
        totalItens: 0,
        itensAtualizados: 0,
        percentualConclusao: 0,
        lojasParticipantes: 0,
        usuariosAtivos: 0,
      };
    }

    return {
      totalItens: metricasAuditoria.totais.totalItens,
      itensAtualizados: metricasAuditoria.totais.itensAtualizados,
      percentualConclusao: metricasAuditoria.totais.percentualConclusao,
      lojasParticipantes: metricasAuditoria.totais.lojasAtivas,
      usuariosAtivos: metricasAuditoria.totais.usuariosAtivos,
      custoTotalRuptura:
        metricasAuditoria.metricas.rupturas?.custoTotalRuptura || 0,
      custoMedioRuptura:
        metricasAuditoria.metricas.rupturas?.custoMedioRuptura || 0,
      rupturasCriticas:
        metricasAuditoria.metricas.rupturas?.rupturasCriticas || 0,
      economiaEstimada:
        (metricasAuditoria.metricas.rupturas?.custoTotalRuptura || 0) * 0.7,
      presencasConfirmadas:
        metricasAuditoria.metricas.presencas?.presencasConfirmadas || 0,
      percentualPresencaGeral:
        metricasAuditoria.metricas.presencas?.percentualPresenca || 0,
      produtividadeMedia:
        metricasAuditoria.metricas.etiquetas?.produtividadeMedia || 0,
      tempoMedioProcessamento:
        metricasAuditoria.metricas.etiquetas?.tempoMedioProcessamento || 0,
    };
  }

  async calcularRankingsGlobais(metricasLojas, metricasUsuarios) {
    // Melhor loja
    const melhorLoja = metricasLojas.reduce((melhor, atual) => {
      return atual.ranking.pontuacaoTotal >
        (melhor?.ranking.pontuacaoTotal || 0)
        ? atual
        : melhor;
    }, null);

    // Melhor usuário
    const melhorUsuario = metricasUsuarios.reduce((melhor, atual) => {
      return atual.totais.pontuacaoTotal > (melhor?.totais.pontuacaoTotal || 0)
        ? atual
        : melhor;
    }, null);

    // Top lojas (10 primeiras)
    const topLojas = metricasLojas
      .sort((a, b) => b.ranking.pontuacaoTotal - a.ranking.pontuacaoTotal)
      .slice(0, 10)
      .map((loja, index) => ({
        posicao: index + 1,
        loja: loja.loja._id,
        lojaInfo: {
          codigo: loja.loja.codigo,
          nome: loja.loja.nome,
          regiao: loja.loja.regiao,
        },
        pontuacao: loja.ranking.pontuacaoTotal,
        percentualConclusao: loja.totais.percentualConclusaoGeral,
      }));

    // Top usuários (20 primeiros)
    const topUsuarios = metricasUsuarios
      .sort((a, b) => b.totais.pontuacaoTotal - a.totais.pontuacaoTotal)
      .slice(0, 20)
      .map((usuario, index) => ({
        posicao: index + 1,
        usuarioId: usuario.usuarioId,
        usuarioNome: usuario.usuarioNome,
        loja: usuario.loja._id,
        lojaInfo: {
          codigo: usuario.loja.codigo,
          nome: usuario.loja.nome,
        },
        pontuacao: usuario.totais.pontuacaoTotal,
        itensProcessados: usuario.totais.totalItens,
      }));

    return {
      melhorLoja: melhorLoja
        ? {
            loja: melhorLoja.loja._id,
            lojaInfo: {
              codigo: melhorLoja.loja.codigo,
              nome: melhorLoja.loja.nome,
              regiao: melhorLoja.loja.regiao,
            },
            pontuacao: melhorLoja.ranking.pontuacaoTotal,
            percentualConclusao: melhorLoja.totais.percentualConclusaoGeral,
            especialidade: "geral",
          }
        : null,
      melhorUsuario: melhorUsuario
        ? {
            usuarioId: melhorUsuario.usuarioId,
            usuarioNome: melhorUsuario.usuarioNome,
            loja: melhorUsuario.loja._id,
            lojaInfo: {
              codigo: melhorUsuario.loja.codigo,
              nome: melhorUsuario.loja.nome,
            },
            pontuacao: melhorUsuario.totais.pontuacaoTotal,
            itensProcessados: melhorUsuario.totais.totalItens,
            especialidade: "geral",
          }
        : null,
      topLojas,
      topUsuarios,
    };
  }

  async calcularAnaliseRegional(metricasLojas) {
    const regioes = new Map();

    for (const metricaLoja of metricasLojas) {
      const regiao = metricaLoja.loja.regiao || "Não especificada";

      if (!regioes.has(regiao)) {
        regioes.set(regiao, {
          regiao,
          totalLojas: 0,
          lojasAtivas: 0,
          totalItens: 0,
          itensAtualizados: 0,
          percentualConclusao: 0,
          melhorLoja: null,
        });
      }

      const dadosRegiao = regioes.get(regiao);
      dadosRegiao.totalLojas++;

      if (metricaLoja.totais.totalItens > 0) {
        dadosRegiao.lojasAtivas++;
        dadosRegiao.totalItens += metricaLoja.totais.totalItens;
        dadosRegiao.itensAtualizados += metricaLoja.totais.itensAtualizados;

        // Verificar se é a melhor loja da região
        if (
          !dadosRegiao.melhorLoja ||
          metricaLoja.ranking.pontuacaoTotal > dadosRegiao.melhorLoja.percentual
        ) {
          dadosRegiao.melhorLoja = {
            codigo: metricaLoja.loja.codigo,
            nome: metricaLoja.loja.nome,
            percentual: metricaLoja.totais.percentualConclusaoGeral,
          };
        }
      }
    }

    // Calcular percentuais e ranking
    const resultadoRegioes = Array.from(regioes.values())
      .map((regiao) => ({
        ...regiao,
        percentualConclusao:
          regiao.totalItens > 0
            ? Math.round((regiao.itensAtualizados / regiao.totalItens) * 100)
            : 0,
      }))
      .sort((a, b) => b.percentualConclusao - a.percentualConclusao)
      .map((regiao, index) => ({
        ...regiao,
        posicaoRanking: index + 1,
      }));

    return resultadoRegioes;
  }

  async obterPeriodoAnterior(periodo, dataInicio) {
    let dataInicioAnterior;

    switch (periodo) {
      case "diario":
        dataInicioAnterior = new Date(dataInicio);
        dataInicioAnterior.setDate(dataInicio.getDate() - 1);
        break;
      case "semanal":
        dataInicioAnterior = new Date(dataInicio);
        dataInicioAnterior.setDate(dataInicio.getDate() - 7);
        break;
      case "mensal":
        dataInicioAnterior = new Date(dataInicio);
        dataInicioAnterior.setMonth(dataInicio.getMonth() - 1);
        break;
      default:
        return null;
    }

    return await MetricasGlobais.findOne({
      periodo,
      dataInicio: dataInicioAnterior,
    });
  }

  async obterPeriodoAnteriorUsuario(lojaId, usuarioId, periodo, dataInicio) {
    let dataInicioAnterior;

    switch (periodo) {
      case "diario":
        dataInicioAnterior = new Date(dataInicio);
        dataInicioAnterior.setDate(dataInicio.getDate() - 1);
        break;
      case "semanal":
        dataInicioAnterior = new Date(dataInicio);
        dataInicioAnterior.setDate(dataInicio.getDate() - 7);
        break;
      case "mensal":
        dataInicioAnterior = new Date(dataInicio);
        dataInicioAnterior.setMonth(dataInicio.getMonth() - 1);
        break;
      default:
        return null;
    }

    return await MetricasUsuario.findOne({
      loja: lojaId,
      usuarioId: usuarioId,
      periodo,
      dataInicio: dataInicioAnterior,
    });
  }

  // Métodos auxiliares para cálculos específicos
  async calcularLocaisMaisMovimentados(auditorias) {
    const locais = new Map();

    for (const auditoria of auditorias) {
      const local = auditoria.local || "Não especificado";
      locais.set(local, (locais.get(local) || 0) + 1);
    }

    return Array.from(locais.entries())
      .map(([local, totalItens]) => ({
        local,
        totalItens,
        percentual:
          auditorias.length > 0
            ? Math.round((totalItens / auditorias.length) * 100)
            : 0,
      }))
      .sort((a, b) => b.totalItens - a.totalItens)
      .slice(0, 10);
  }

  async calcularSetoresMaisAfetados(auditorias) {
    const setores = new Map();

    for (const auditoria of auditorias) {
      if (auditoria.setor) {
        const setor = auditoria.setor;
        if (!setores.has(setor)) {
          setores.set(setor, { totalRupturas: 0, custoTotal: 0 });
        }
        const dados = setores.get(setor);
        dados.totalRupturas++;
        dados.custoTotal += auditoria.custoRuptura || 0;
      }
    }

    return Array.from(setores.entries())
      .map(([setor, dados]) => ({
        setor,
        totalRupturas: dados.totalRupturas,
        custoTotal: dados.custoTotal,
        percentual:
          auditorias.length > 0
            ? Math.round((dados.totalRupturas / auditorias.length) * 100)
            : 0,
      }))
      .sort((a, b) => b.custoTotal - a.custoTotal)
      .slice(0, 10);
  }

  async calcularFornecedoresMaisAfetados(auditorias) {
    const fornecedores = new Map();

    for (const auditoria of auditorias) {
      if (auditoria.fornecedor) {
        const fornecedor = auditoria.fornecedor;
        if (!fornecedores.has(fornecedor)) {
          fornecedores.set(fornecedor, { totalRupturas: 0, custoTotal: 0 });
        }
        const dados = fornecedores.get(fornecedor);
        dados.totalRupturas++;
        dados.custoTotal += auditoria.custoRuptura || 0;
      }
    }

    return Array.from(fornecedores.entries())
      .map(([fornecedor, dados]) => ({
        fornecedor,
        totalRupturas: dados.totalRupturas,
        custoTotal: dados.custoTotal,
        percentual:
          auditorias.length > 0
            ? Math.round((dados.totalRupturas / auditorias.length) * 100)
            : 0,
      }))
      .sort((a, b) => b.custoTotal - a.custoTotal)
      .slice(0, 10);
  }

  async calcularSetoresMelhorPresenca(auditorias) {
    const setores = new Map();

    for (const auditoria of auditorias) {
      if (auditoria.setor) {
        const setor = auditoria.setor;
        if (!setores.has(setor)) {
          setores.set(setor, { totalItens: 0, presencasConfirmadas: 0 });
        }
        const dados = setores.get(setor);
        dados.totalItens++;
        if (auditoria.presenca) {
          dados.presencasConfirmadas++;
        }
      }
    }

    return Array.from(setores.entries())
      .map(([setor, dados]) => ({
        setor,
        totalItens: dados.totalItens,
        presencasConfirmadas: dados.presencasConfirmadas,
        percentualPresenca:
          dados.totalItens > 0
            ? Math.round((dados.presencasConfirmadas / dados.totalItens) * 100)
            : 0,
      }))
      .sort((a, b) => b.percentualPresenca - a.percentualPresenca)
      .slice(0, 10);
  }

  async calcularMetricasPorLoja(auditorias, tipo) {
    const lojas = new Map();

    for (const auditoria of auditorias) {
      const lojaId = auditoria.loja._id.toString();

      if (!lojas.has(lojaId)) {
        lojas.set(lojaId, {
          loja: auditoria.loja._id,
          lojaInfo: {
            codigo: auditoria.loja.codigo,
            nome: auditoria.loja.nome,
            regiao: auditoria.loja.regiao,
          },
          totalItens: 0,
          itensAtualizados: 0,
          percentualConclusao: 0,
          usuariosAtivos: new Set(),
          valor: 0,
        });
      }

      const dadosLoja = lojas.get(lojaId);
      dadosLoja.totalItens++;
      dadosLoja.usuariosAtivos.add(auditoria.usuarioId);

      if (auditoria.situacao === "Atualizado") {
        dadosLoja.itensAtualizados++;
      }

      if (tipo === "ruptura" && auditoria.custoRuptura) {
        dadosLoja.valor += auditoria.custoRuptura;
      }
    }

    return Array.from(lojas.values())
      .map((loja, index) => ({
        ...loja,
        percentualConclusao:
          loja.totalItens > 0
            ? Math.round((loja.itensAtualizados / loja.totalItens) * 100)
            : 0,
        usuariosAtivos: loja.usuariosAtivos.size,
        posicaoRanking: index + 1,
      }))
      .sort((a, b) => b.percentualConclusao - a.percentualConclusao)
      .map((loja, index) => ({
        ...loja,
        posicaoRanking: index + 1,
      }));
  }
  async validarConsistenciaDados(periodo, dataInicio, dataFim) {
    try {
      console.log(`🔍 Validando consistência de dados...`);

      // Buscar auditorias do período
      const auditorias = await Auditoria.find({
        data: { $gte: dataInicio, $lte: dataFim },
      });

      // Contar auditorias por usuário e tipo
      const contagemPorUsuario = {};

      for (const auditoria of auditorias) {
        const chave = `${auditoria.usuarioId}_${auditoria.loja}_${auditoria.tipo}`;

        if (!contagemPorUsuario[chave]) {
          contagemPorUsuario[chave] = {
            usuarioId: auditoria.usuarioId,
            loja: auditoria.loja,
            tipo: auditoria.tipo,
            total: 0,
            atualizados: 0,
          };
        }

        contagemPorUsuario[chave].total++;
        if (auditoria.situacao === "Atualizado") {
          contagemPorUsuario[chave].atualizados++;
        }
      }

      // Verificar usuários com possíveis dados duplicados
      const usuariosComProblemas = Object.values(contagemPorUsuario).filter(
        (item) => item.total > 1000 // Limite arbitrário para investigação
      );

      if (usuariosComProblemas.length > 0) {
        console.log(
          `⚠️ Possíveis dados duplicados encontrados:`,
          usuariosComProblemas
        );
      }

      return {
        totalAuditorias: auditorias.length,
        usuariosUnicos: Object.keys(contagemPorUsuario).length,
        usuariosComProblemas: usuariosComProblemas.length,
        detalhes: usuariosComProblemas,
      };
    } catch (error) {
      console.error(`❌ Erro na validação de consistência:`, error);
      return { error: error.message };
    }
  }
}

const metricsCalculationService = new MetricsCalculationService();
export default metricsCalculationService;
