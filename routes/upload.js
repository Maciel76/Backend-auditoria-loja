// routes/upload.js - VERSÃO CORRIGIDA COM LOJA OBRIGATÓRIA - COMPLETA
import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import User from "../models/User.js";
import Planilha from "../models/Planilha.js";
import Auditoria from "../models/Auditoria.js";
import { verificarLojaObrigatoria, getFiltroLoja } from "../middleware/loja.js";
import { processarParaAuditoria } from "../services/processador-auditoria.js";
import metricsCalculationService from "../services/metricsCalculationService.js";
import metricasUsuariosService from "../services/metricasUsuariosService.js";
import UserDailyMetrics from "../models/UserDailyMetrics.js";
import MetricasUsuario from "../models/MetricasUsuario.js";
import Loja from "../models/Loja.js";
import achievementRulesService from "../services/achievementRulesService.js";
import AuditProductsService from "../services/auditProductsService.js";
import {
  lerPlanilha,
  encontrarColunaUsuario,
  erroColunaUsuarioAusente,
  normalizarSituacaoAtual,
  insertManyTolerante,
} from "../services/upload/parser.service.js";

// Helper function to access obterPeriodo
const obterPeriodo = (periodo, data) => {
  const dataRef = new Date(data);
  let dataInicio, dataFim;

  switch (periodo) {
    case "diario":
      dataInicio = new Date(dataRef);
      dataInicio.setHours(0, 0, 0, 0);
      dataFim = new Date(dataRef);
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
};

// Importações condicionais dos helpers
let processarValorEstoque,
  normalizarSituacao,
  extrairDataDaPlanilha,
  combinarDataHoraBrasileira;
try {
  const helpers = await import("../utils/planilhaHelpers.js");
  processarValorEstoque = helpers.processarValorEstoque;
  normalizarSituacao = helpers.normalizarSituacao;
  extrairDataDaPlanilha = helpers.extrairDataDaPlanilha;
  combinarDataHoraBrasileira = helpers.combinarDataHoraBrasileira;
} catch (error) {
  console.log("Helpers não encontrados, usando funções padrão");
  // Funções fallback
  processarValorEstoque = (valor) => String(valor || "0");
  normalizarSituacao = (situacao) => String(situacao || "");
  extrairDataDaPlanilha = () => null;
  combinarDataHoraBrasileira = () => null;
}

const upload = multer({ dest: "uploads/" });
const router = express.Router();

// Função auxiliar para limpeza de arquivos temporários
function limparArquivoTemporario(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Arquivo temporário removido: ${filePath}`);
    }
  } catch (error) {
    console.error(`Erro ao remover arquivo temporário: ${error.message}`);
  }
}

// Helpers de leitura/normalização/insert tolerante foram movidos para
// backend/services/upload/parser.service.js (ver imports no topo).
// Mantidos aqui apenas via imports nomeados.

// Função para processar etiqueta
async function processarEtiqueta(file, dataAuditoria, loja) {
  try {
    console.log(
      `🏷️ Processando etiquetas para loja: ${loja.codigo} - ${loja.nome}`,
    );

    // Lendo planilha (defval:'' + união de chaves — fix BUG A)
    const { jsonData, todasChaves } = lerPlanilha(file.path);

    const setoresBatch = [];
    const usuariosMap = new Map();
    let totalItensProcessados = 0;

    // Encontrar chaves das colunas
    const usuarioKey = encontrarColunaUsuario(todasChaves);

    if (!usuarioKey) {
      throw erroColunaUsuarioAusente();
    }

    const situacaoKey = todasChaves.find(
      (key) =>
        key.toLowerCase().includes("situação") ||
        key.toLowerCase().includes("situacao"),
    );
    const localKey = todasChaves.find((key) =>
      key.toLowerCase().includes("local"),
    );
    const produtoKey = todasChaves.find((key) =>
      key.toLowerCase().includes("produto"),
    );
    const codigoKey = todasChaves.find(
      (key) =>
        key.toLowerCase().includes("código") ||
        key.toLowerCase().includes("codigo"),
    );
    const estoqueKey = todasChaves.find((key) =>
      key.toLowerCase().includes("estoque"),
    );
    const compraKey = todasChaves.find((key) =>
      key.toLowerCase().includes("compra"),
    );
    const classeProdutoKey = todasChaves.find(
      (key) =>
        key.toLowerCase().includes("classe") &&
        key.toLowerCase().includes("produto"),
    );
    // Buscar colunas "Auditado em" - Excel/XLSX cria "_1", "_2" etc para colunas duplicadas
    const auditadoEmDataKey = todasChaves.find((key) => {
      const keyLower = key.toLowerCase().trim();
      return (
        keyLower === "auditado em" ||
        (keyLower.includes("auditado") &&
          keyLower.includes("em") &&
          !keyLower.includes("_"))
      );
    });

    const auditadoEmHoraKey = todasChaves.find((key) => {
      const keyLower = key.toLowerCase().trim();
      return (
        keyLower === "auditado em_1" ||
        keyLower.includes("auditado em_") ||
        (keyLower.includes("auditado") &&
          keyLower.includes("em") &&
          keyLower.includes("_"))
      );
    });

    // Processando dados

    // Processar cada item da planilha
    for (let index = 0; index < jsonData.length; index++) {
      const item = jsonData[index];

      const usuarioStr = usuarioKey
        ? String(item[usuarioKey] || "Produto não auditado")
        : "Produto não auditado";

      // Processar campos "Auditado em" separadamente (data e hora)
      let auditadoDia = "";
      let auditadoHora = "";

      if (index === 0) {
        console.log("🔍 Debug - Coluna data encontrada:", auditadoEmDataKey);
        console.log("🔍 Debug - Coluna hora encontrada:", auditadoEmHoraKey);
        console.log("🔍 Debug - Todas as chaves disponíveis:", todasChaves);
      }

      // Processar coluna de data
      if (auditadoEmDataKey && item[auditadoEmDataKey]) {
        auditadoDia = String(item[auditadoEmDataKey]).trim();
        if (index === 0) {
          console.log(
            `📅 Data encontrada (${auditadoEmDataKey}):`,
            auditadoDia,
          );
        }
      }

      // Processar coluna de hora
      if (auditadoEmHoraKey && item[auditadoEmHoraKey]) {
        const horaCompleta = String(item[auditadoEmHoraKey]).trim();
        // Se tem formato HH:MM:SS, converter para HH:MM
        if (horaCompleta.includes(":")) {
          const partesHora = horaCompleta.split(":");
          auditadoHora = `${partesHora[0]}:${partesHora[1]}`;
        } else {
          auditadoHora = horaCompleta;
        }
        if (index === 0) {
          console.log(
            `⏰ Hora encontrada (${auditadoEmHoraKey}):`,
            horaCompleta,
            "→",
            auditadoHora,
          );
        }
      }

      if (index === 0) {
        console.log(
          `✅ Resultado final - Dia: "${auditadoDia}", Hora: "${auditadoHora}"`,
        );
      }

      // Adicionar ao batch de auditorias - COM LOJA OBRIGATÓRIA
      setoresBatch.push({
        loja: loja._id,
        nomeLoja: loja.nome,
        usuarioId: usuarioStr.match(/^(\d+)/)?.[1] || usuarioStr,
        usuarioNome: usuarioStr.includes("(")
          ? usuarioStr.match(/\((.*)\)/)?.[1] || usuarioStr
          : usuarioStr,
        tipo: "etiqueta",
        data: dataAuditoria,
        codigo: codigoKey ? String(item[codigoKey] || "") : "",
        produto: produtoKey ? String(item[produtoKey] || "") : "",
        ClasseProduto: classeProdutoKey
          ? String(item[classeProdutoKey] || "").trim()
          : "",
        local: localKey
          ? String(item[localKey] || "Não especificado")
          : "Não especificado",
        situacao: situacaoKey
          ? String(item[situacaoKey] || "Não lido")
          : "Não lido",
        estoque: estoqueKey ? String(item[estoqueKey] || "0") : "0",
        ultimaCompra: compraKey
          ? String(item[compraKey] || new Date().toLocaleDateString("pt-BR"))
          : new Date().toLocaleDateString("pt-BR"),
        AuditadoDia: auditadoDia,
        AuditadoHora: auditadoHora,
      });

      // Mapear usuários
      if (usuarioStr && usuarioStr !== "Produto não auditado") {
        if (!usuariosMap.has(usuarioStr)) {
          usuariosMap.set(usuarioStr, []);
        }
        usuariosMap.get(usuarioStr).push(item);
        totalItensProcessados++;
      }
    }

    // Salvando no banco

    // Limpar dados antigos APENAS DESTA LOJA para esta data
    const inicioDia = new Date(dataAuditoria);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataAuditoria);
    fimDia.setHours(23, 59, 59, 999);

    await Auditoria.deleteMany({
      data: { $gte: inicioDia, $lte: fimDia },
      loja: loja._id,
      tipo: "etiqueta",
    });

    // Limpar produtos de auditoria para este tipo e loja
    await AuditProductsService.limparProdutosPorLojaELojaTipo(
      loja._id,
      "etiqueta",
    );

    console.log(
      `🗑️ Dados antigos removidos para loja ${
        loja.codigo
      } na data ${dataAuditoria.toLocaleDateString()}`,
    );

    // Salvar auditorias e capturar IDs (com tolerância a falhas por linha — fix BUG B)
    let auditoriasInseridas = [];
    let ignoradosEtiqueta = 0;
    let errosLinhaEtiqueta = [];
    if (setoresBatch.length > 0) {
      const r = await insertManyTolerante(
        Auditoria,
        setoresBatch,
        `etiqueta loja ${loja.codigo}`,
      );
      auditoriasInseridas = r.inseridos;
      ignoradosEtiqueta = r.ignorados;
      errosLinhaEtiqueta = r.erros;
      console.log(
        `💾 ${auditoriasInseridas.length}/${setoresBatch.length} auditorias salvas para loja ${loja.codigo}`,
      );
    }

    // Processar usuários
    for (const [usuarioStr, itens] of usuariosMap.entries()) {
      try {
        const match = usuarioStr.match(/^(\d+)\s*\((.*)\)$/);
        const id = match ? match[1].trim() : usuarioStr;
        const nome = match ? match[2].trim() : usuarioStr;

        // Buscar ou criar usuário com upsert para evitar duplicatas
        let usuario = await User.findOneAndUpdate(
          {
            $or: [
              { id, loja: loja._id },
              { nome, loja: loja._id },
            ],
          },
          {
            $setOnInsert: {
              id,
              nome,
              contadorTotal: 0,
              auditorias: [],
              loja: loja._id,
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          },
        );

        console.log(`👤 Usuário processado: ${usuario.nome} (${usuario.id})`);
        const wasCreated = usuario.contadorTotal === 0;

        // Calcular contador total baseado nos itens processados
        let itensAtualizados = 0;
        for (const item of itens) {
          const situacao = situacaoKey ? String(item[situacaoKey] || "") : "";
          // Contar apenas itens "Atualizado" (case-insensitive)
          if (situacao === "Atualizado") {
            itensAtualizados++;
          }
        }

        // Atualizar contador total do usuário
        usuario.contadorTotal += itensAtualizados;

        await usuario.save();
        console.log(
          `👤 Usuário processado: ${nome} (${itensAtualizados} itens)`,
        );
      } catch (error) {
        console.error(`❌ Erro ao processar usuário ${usuarioStr}:`, error);
      }
    }

    // Calcular total de itens lidos
    const totalItensLidos = jsonData.filter(
      (item) => situacaoKey && item[situacaoKey] === "Atualizado",
    ).length;

    // Salvar informações da planilha - COM LOJA
    await Planilha.findOneAndUpdate(
      {
        dataAuditoria: { $gte: inicioDia, $lte: fimDia },
        tipoAuditoria: "etiqueta",
        loja: loja._id,
      },
      {
        nomeArquivo: file.originalname,
        dataAuditoria,
        tipoAuditoria: "etiqueta",
        loja: loja._id,
        totalItens: jsonData.length,
        totalItensLidos,
        usuariosEnvolvidos: Array.from(usuariosMap.keys()),
        dataUpload: new Date(),
        metadata: {
          tamanhoArquivo: file.size,
          formato: file.originalname.split(".").pop(),
          totalLinhas: jsonData.length,
          processamentoCompleto: true,
        },
      },
      { upsert: true, new: true },
    );

    console.log(`✅ Planilha processada com sucesso para loja ${loja.codigo}`);

    // Processar e armazenar produtos de auditoria
    try {
      await AuditProductsService.processarNovaPlanilha(
        loja._id,
        loja.nome,
        "etiqueta",
        setoresBatch,
      );
    } catch (error) {
      console.error(
        `❌ Erro ao processar produtos de auditoria para etiqueta:`,
        error,
      );
    }

    const resultado = {
      success: true,
      totalItens: jsonData.length,
      totalProcessados: totalItensProcessados,
      totalUsuarios: usuariosMap.size,
      usuariosEnvolvidos: Array.from(usuariosMap.keys()),
      tipo: "etiqueta",
      loja: loja,
      dataAuditoria: dataAuditoria,
      auditoriasIds: auditoriasInseridas.map((a) => a._id), // IDs para cálculo incremental
      ignorados: ignoradosEtiqueta,
      errosLinha: errosLinhaEtiqueta,
    };

    return resultado;
  } catch (error) {
    console.error("❌ Erro ao processar etiqueta:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
      status: error.status,
    };
  }
}

// Função para processar ruptura
async function processarRuptura(file, dataAuditoria, loja) {
  try {
    console.log(
      `💔 Processando rupturas para loja: ${loja.codigo} - ${loja.nome}`,
    );

    // Lendo planilha (defval:'' + união de chaves — fix BUG A)
    const { jsonData, todasChaves } = lerPlanilha(file.path);

    // Validar presença da coluna Usuário no cabeçalho (mesmo se vazia em todas as linhas)
    if (!encontrarColunaUsuario(todasChaves)) {
      throw erroColunaUsuarioAusente();
    }

    // Para garantir consistência e evitar acúmulo indevido,
    // usaremos a data de auditoria padrão (data do upload) em vez da data extraída da planilha
    // Isso garante que uploads múltiplos no mesmo dia substituam-se corretamente
    const dataAuditoriaFinal = dataAuditoria;

    const dadosProcessados = [];
    const usuariosMap = new Map();

    for (let index = 0; index < jsonData.length; index++) {
      const item = jsonData[index];

      const codigo = String(item["Código"] || "").trim();
      const produto = String(
        item["Produto"] || "Produto não especificado",
      ).trim();

      if (!codigo && !produto) {
        continue;
      }

      const local = String(item["Local"] || "Não especificado").trim();
      const usuario = String(
        item["Usuário"] || "Usuário não identificado",
      ).trim();
      const situacao = String(item["Situação"] || "Não lido").trim();

      const dadosItem = {
        codigo,
        produto,
        local,
        usuario,
        situacao: normalizarSituacao(situacao),
        classeProdutoRaiz: String(item["Classe de Produto Raiz"] || "").trim(),
        classeProduto: String(item["Classe de Produto"] || "").trim(),
        setor: String(item["Setor"] || "").trim(),
        situacaoAuditoria: String(
          item["Situação atual da auditoria"] || "",
        ).trim(),
        auditadoEm: combinarDataHoraBrasileira(
          item["Auditado em"],
          item["Auditado em_1"],
        ),
        estoqueAtual: processarValorEstoque(item["Estoque atual"] || "0"),
        presencaConfirmada: String(item["Presença confirmada"] || "").trim(),
        presencaConfirmadaEm: combinarDataHoraBrasileira(
          item["Presença confirmada"],
          item["Presença confirmada_1"],
        ),
        estoqueLeitura: processarValorEstoque(item["Estoque Leitura"] || "0"),
        residuo: String(item["Resíduo"] || "").trim(),
        fornecedor: String(item["Fornecedor"] || "").trim(),
        ultimaCompra: String(item["Última compra"] || "").trim(),
        ultimaCompraEm: combinarDataHoraBrasileira(
          item["Última compra"],
          item["Última compra_1"],
        ),
        diasSemVenda: parseInt(item["Dias sem venda"] || 0),
        custoRuptura: parseFloat(
          String(item["Custo Ruptura"] || "0")
            .replaceAll(".", "")
            .replace(",", "."),
        ),
        dataAuditoria: dataAuditoriaFinal,
        tipo: "ruptura",
        loja: loja._id,
        metadata: {
          nomeArquivo: file.originalname,
          dataUpload: new Date(),
          linhaPlanilha: index + 2,
        },
      };

      dadosProcessados.push(dadosItem);

      // Log para debug - verificar se classe está sendo capturada
      if (index < 3) {
        console.log(
          `📋 [RUPTURA] Exemplo de item processado (linha ${index + 2}):`,
          {
            codigo: dadosItem.codigo,
            produto: dadosItem.produto,
            classeProdutoRaiz: dadosItem.classeProdutoRaiz,
            classeProduto: dadosItem.classeProduto,
            local: dadosItem.local,
            setor: dadosItem.setor,
          },
        );
      }

      // Mapear usuários
      if (usuario && usuario !== "Usuário não identificado") {
        if (!usuariosMap.has(usuario)) {
          usuariosMap.set(usuario, []);
        }
        usuariosMap.get(usuario).push(item);
      }
    }

    // Limpar dados antigos
    const inicioDia = new Date(dataAuditoriaFinal);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataAuditoriaFinal);
    fimDia.setHours(23, 59, 59, 999);

    await Auditoria.deleteMany({
      data: { $gte: inicioDia, $lte: fimDia },
      loja: loja._id,
      tipo: "ruptura",
    });

    // Limpar produtos de auditoria para este tipo e loja
    await AuditProductsService.limparProdutosPorLojaELojaTipo(
      loja._id,
      "ruptura",
    );

    console.log(`🗑️ Rupturas antigas removidas para loja ${loja.codigo}`);

    // Salvar rupturas na coleção Auditoria
    if (dadosProcessados.length > 0) {
      const auditoriasBatch = dadosProcessados.map((item) => ({
        loja: loja._id,
        nomeLoja: loja.nome,
        usuarioId: item.usuario.match(/^(\d+)/)?.[1] || item.usuario,
        usuarioNome: item.usuario.includes("(")
          ? item.usuario.match(/\((.*)\)/)?.[1] || item.usuario
          : item.usuario,
        tipo: "ruptura",
        data: dataAuditoriaFinal,
        codigo: item.codigo,
        produto: item.produto,
        ClasseProduto: item.classeProdutoRaiz
          ? String(item.classeProdutoRaiz).trim()
          : "",
        local: item.local,
        situacao: item.situacao,
        situacaoAtual: normalizarSituacaoAtual(item.situacaoAuditoria),
        estoque: item.estoqueAtual,
        classeProdutoRaiz: item.classeProdutoRaiz,
        classeProduto: item.classeProduto,
        setor: item.setor,
        situacaoAuditoria: item.situacaoAuditoria,
        estoqueAtual: item.estoqueAtual,
        estoqueLeitura: item.estoqueLeitura,
        residuo: item.residuo,
        fornecedor: item.fornecedor,
        diasSemVenda: item.diasSemVenda,
        custoRuptura: item.custoRuptura,
        AuditadoDia: item.auditadoEm
          ? item.auditadoEm.toLocaleDateString("pt-BR")
          : "",
        AuditadoHora: item.auditadoEm
          ? item.auditadoEm.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        metadata: item.metadata,
      }));

      const rRup = await insertManyTolerante(
        Auditoria,
        auditoriasBatch,
        `ruptura loja ${loja.codigo}`,
      );
      const auditoriasInseridas = rRup.inseridos;
      var ignoradosRuptura = rRup.ignorados;
      var errosLinhaRuptura = rRup.erros;
      console.log(
        `💾 ${auditoriasInseridas.length}/${auditoriasBatch.length} rupturas salvas para loja ${loja.codigo}`,
      );

      // Verificar se as classes foram salvas corretamente
      const classesEncontradas = new Set();
      const locaisEncontrados = new Set();
      auditoriasBatch.forEach((aud) => {
        if (aud.ClasseProduto) classesEncontradas.add(aud.ClasseProduto);
        if (aud.local) locaisEncontrados.add(aud.local);
      });
      console.log(
        `📊 [RUPTURA] Classes encontradas: ${Array.from(
          classesEncontradas,
        ).join(", ")}`,
      );
      console.log(
        `📍 [RUPTURA] Locais encontrados: ${Array.from(locaisEncontrados).join(
          ", ",
        )}`,
      );

      // Salvar IDs para retorno
      var auditoriasIdsRuptura = auditoriasInseridas.map((a) => a._id);
    } else {
      var auditoriasIdsRuptura = [];
    }

    // Processar usuários no modelo User unificado
    for (const [usuarioStr, itens] of usuariosMap.entries()) {
      try {
        const match = usuarioStr.match(/^(\d+)\s*\((.*)\)$/);
        const userId = match ? match[1].trim() : usuarioStr;
        const nome = match ? match[2].trim() : usuarioStr;

        // Buscar ou criar usuário com upsert para evitar duplicatas
        let usuario = await User.findOneAndUpdate(
          {
            $or: [
              { id: userId, loja: loja._id },
              { nome, loja: loja._id },
            ],
          },
          {
            $setOnInsert: {
              id: userId,
              nome,
              contadorTotal: 0,
              auditorias: [],
              loja: loja._id,
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          },
        );

        console.log(`👤 Usuário processado: ${usuario.nome} (${usuario.id})`);

        // Calcular contador total baseado nos itens processados
        let itensAtualizados = 0;
        for (const item of itens) {
          const situacao = String(item["Situação"] || "");
          if (situacao === "Atualizado") {
            itensAtualizados++;
          }
        }

        // Atualizar contador total do usuário
        usuario.contadorTotal += itensAtualizados;

        await usuario.save();
      } catch (userError) {
        console.error(`❌ Erro ao processar usuário ${usuarioStr}:`, userError);
      }
    }

    // Salvar informações da planilha
    await Planilha.findOneAndUpdate(
      {
        dataAuditoria: { $gte: inicioDia, $lte: fimDia },
        tipoAuditoria: "ruptura",
        loja: loja._id,
      },
      {
        nomeArquivo: file.originalname,
        dataAuditoria: dataAuditoriaFinal,
        tipoAuditoria: "ruptura",
        loja: loja._id,
        totalItens: jsonData.length,
        totalItensLidos: dadosProcessados.filter(
          (item) => item.situacao === "Atualizado",
        ).length,
        usuariosEnvolvidos: Array.from(usuariosMap.keys()),
        dataUpload: new Date(),
        metadata: {
          tamanhoArquivo: file.size,
          formato: file.originalname.split(".").pop(),
          totalLinhas: dadosProcessados.length,
          processamentoCompleto: true,
        },
      },
      { upsert: true, new: true },
    );

    console.log(`✅ Ruptura processada com sucesso para loja ${loja.codigo}`);

    // Processar e armazenar produtos de auditoria
    try {
      await AuditProductsService.processarNovaPlanilha(
        loja._id,
        loja.nome,
        "ruptura",
        dadosProcessados,
      );
    } catch (error) {
      console.error(
        `❌ Erro ao processar produtos de auditoria para ruptura:`,
        error,
      );
    }

    return {
      success: true,
      totalItens: jsonData.length,
      totalProcessados: dadosProcessados.length,
      totalUsuarios: usuariosMap.size,
      usuariosEnvolvidos: Array.from(usuariosMap.keys()),
      tipo: "ruptura",
      loja: loja,
      dataAuditoria: dataAuditoriaFinal,
      auditoriasIds: auditoriasIdsRuptura, // IDs para cálculo incremental
      ignorados: typeof ignoradosRuptura !== "undefined" ? ignoradosRuptura : 0,
      errosLinha:
        typeof errosLinhaRuptura !== "undefined" ? errosLinhaRuptura : [],
    };
  } catch (error) {
    console.error("❌ Erro ao processar ruptura:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
      status: error.status,
    };
  } finally {
    // Limpar arquivo temporário
    limparArquivoTemporario(file.path);
  }
}

// Função para processar presença
async function processarPresenca(file, dataAuditoria, loja) {
  try {
    console.log(
      `👥 Processando presenças para loja: ${loja.codigo} - ${loja.nome}`,
    );

    // Lendo planilha (defval:'' + união de chaves — fix BUG A)
    const { jsonData, todasChaves } = lerPlanilha(file.path);

    // Validar presença da coluna Usuário no cabeçalho (mesmo se vazia em todas as linhas)
    if (!encontrarColunaUsuario(todasChaves)) {
      throw erroColunaUsuarioAusente();
    }

    // Para garantir consistência e evitar acúmulo indevido,
    // usaremos a data de auditoria padrão (data do upload) em vez da data extraída da planilha
    // Isso garante que uploads múltiplos no mesmo dia substituam-se corretamente
    const dataAuditoriaFinal = dataAuditoria;

    const dadosProcessados = [];
    const usuariosMap = new Map();

    for (let index = 0; index < jsonData.length; index++) {
      const item = jsonData[index];

      const codigo = String(item["Código"] || "").trim();
      const produto = String(
        item["Produto"] || "Produto não especificado",
      ).trim();

      if (!codigo && !produto) {
        continue;
      }

      const local = String(item["Local"] || "Não especificado").trim();
      const usuario = String(
        item["Usuário"] || "Usuário não identificado",
      ).trim();
      const situacao = String(item["Situação"] || "Não lido").trim();

      // Processar presença baseado na coluna situação
      const situacaoStr = item["Situação"] || "";
      const presenca = String(situacaoStr)
        .toLowerCase()
        .includes("com presença");

      const dadosItem = {
        codigo,
        produto,
        local,
        usuario,
        situacao: normalizarSituacao(situacao),
        estoque: processarValorEstoque(item["Estoque atual"] || "0"),
        presenca,
        presencaConfirmada: String(item["Presença confirmada"] || "").trim(),
        auditadoEm: combinarDataHoraBrasileira(
          item["Auditado em"],
          item["Auditado em_1"],
        ),
        presencaConfirmadaEm: combinarDataHoraBrasileira(
          item["Presença confirmada"],
          item["Presença confirmada_1"],
        ),
        classeProdutoRaiz: String(item["Classe de Produto Raiz"] || "").trim(),
        classeProduto: String(item["Classe de Produto"] || "").trim(),
        setor: String(item["Setor"] || "").trim(),
        situacaoAuditoria: String(
          item["Situação atual da auditoria"] || "",
        ).trim(),
        estoqueLeitura: processarValorEstoque(item["Estoque Leitura"] || "0"),
        residuo: String(item["Resíduo"] || "").trim(),
        fornecedor: String(item["Fornecedor"] || "").trim(),
        ultimaCompra: String(item["Última compra"] || "").trim(),
        diasSemVenda: parseInt(item["Dias sem venda"] || 0),
        custoRuptura: parseFloat(
          String(item["Custo Ruptura"] || "0")
            .replaceAll(".", "")
            .replace(",", "."),
        ),
        dataAuditoria: dataAuditoriaFinal,
        tipo: "presenca",
        loja: loja._id,
        metadata: {
          nomeArquivo: file.originalname,
          dataUpload: new Date(),
          linhaPlanilha: index + 2,
        },
      };

      dadosProcessados.push(dadosItem);

      // Mapear usuários
      if (usuario && usuario !== "Usuário não identificado") {
        if (!usuariosMap.has(usuario)) {
          usuariosMap.set(usuario, []);
        }
        usuariosMap.get(usuario).push(item);
      }
    }

    // Limpar dados antigos
    const inicioDia = new Date(dataAuditoriaFinal);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataAuditoriaFinal);
    fimDia.setHours(23, 59, 59, 999);

    await Auditoria.deleteMany({
      data: { $gte: inicioDia, $lte: fimDia },
      loja: loja._id,
      tipo: "presenca",
    });

    // Limpar produtos de auditoria para este tipo e loja
    await AuditProductsService.limparProdutosPorLojaELojaTipo(
      loja._id,
      "presenca",
    );

    console.log(`🗑️ Presenças antigas removidas para loja ${loja.codigo}`);

    // Salvar presenças na coleção Auditoria
    if (dadosProcessados.length > 0) {
      const auditoriasBatch = dadosProcessados.map((item) => ({
        loja: loja._id,
        nomeLoja: loja.nome,
        usuarioId: item.usuario.match(/^(\d+)/)?.[1] || item.usuario,
        usuarioNome: item.usuario.includes("(")
          ? item.usuario.match(/\((.*)\)/)?.[1] || item.usuario
          : item.usuario,
        tipo: "presenca",
        data: dataAuditoriaFinal,
        codigo: item.codigo,
        produto: item.produto,
        ClasseProduto: item.classeProdutoRaiz
          ? String(item.classeProdutoRaiz).trim()
          : "",
        local: item.local,
        situacao: item.situacao,
        situacaoAtual: normalizarSituacaoAtual(item.situacaoAuditoria),
        estoque: item.estoque,
        presenca: item.presenca,
        presencaConfirmada: item.presencaConfirmada,
        auditadoEm: item.auditadoEm,
        presencaConfirmadaEm: item.presencaConfirmadaEm,
        classeProdutoRaiz: item.classeProdutoRaiz,
        classeProduto: item.classeProduto,
        setor: item.setor,
        situacaoAuditoria: item.situacaoAuditoria,
        estoqueLeitura: item.estoqueLeitura,
        residuo: item.residuo,
        fornecedor: item.fornecedor,
        diasSemVenda: item.diasSemVenda,
        custoRuptura: item.custoRuptura,
        AuditadoDia: item.auditadoEm
          ? item.auditadoEm.toLocaleDateString("pt-BR")
          : "",
        AuditadoHora: item.auditadoEm
          ? item.auditadoEm.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        metadata: item.metadata,
      }));

      const rPres = await insertManyTolerante(
        Auditoria,
        auditoriasBatch,
        `presença loja ${loja.codigo}`,
      );
      const auditoriasInseridas = rPres.inseridos;
      var ignoradosPresenca = rPres.ignorados;
      var errosLinhaPresenca = rPres.erros;
      console.log(
        `💾 ${auditoriasInseridas.length}/${auditoriasBatch.length} presenças salvas para loja ${loja.codigo}`,
      );

      // Salvar IDs para retorno
      var auditoriasIdsPresenca = auditoriasInseridas.map((a) => a._id);
    } else {
      var auditoriasIdsPresenca = [];
    }

    // Processar usuários no modelo User unificado
    for (const [usuarioStr, itens] of usuariosMap.entries()) {
      try {
        const match = usuarioStr.match(/^(\d+)\s*\((.*)\)$/);
        const userId = match ? match[1].trim() : usuarioStr;
        const nome = match ? match[2].trim() : usuarioStr;

        // Buscar ou criar usuário com upsert para evitar duplicatas
        let usuario = await User.findOneAndUpdate(
          {
            $or: [
              { id: userId, loja: loja._id },
              { nome, loja: loja._id },
            ],
          },
          {
            $setOnInsert: {
              id: userId,
              nome,
              contadorTotal: 0,
              auditorias: [],
              loja: loja._id,
            },
          },
          {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          },
        );

        console.log(
          `👤 Usuário processado para presença: ${usuario.nome} (${usuario.id})`,
        );

        // Calcular contador total baseado nos itens processados
        let itensAtualizados = 0;
        for (const item of itens) {
          const situacao = String(item["Situação"] || "");
          if (situacao === "Atualizado") {
            itensAtualizados++;
          }
        }

        // Atualizar contador total do usuário
        usuario.contadorTotal += itensAtualizados;

        await usuario.save();
      } catch (userError) {
        console.error(`❌ Erro ao processar usuário ${usuarioStr}:`, userError);
      }
    }

    // Salvar informações da planilha
    await Planilha.findOneAndUpdate(
      {
        dataAuditoria: { $gte: inicioDia, $lte: fimDia },
        tipoAuditoria: "presenca",
        loja: loja._id,
      },
      {
        nomeArquivo: file.originalname,
        dataAuditoria: dataAuditoriaFinal,
        tipoAuditoria: "presenca",
        loja: loja._id,
        totalItens: jsonData.length,
        totalItensLidos: dadosProcessados.filter(
          (item) => item.situacao === "Atualizado",
        ).length,
        usuariosEnvolvidos: Array.from(usuariosMap.keys()),
        dataUpload: new Date(),
        metadata: {
          tamanhoArquivo: file.size,
          formato: file.originalname.split(".").pop(),
          totalLinhas: dadosProcessados.length,
          processamentoCompleto: true,
        },
      },
      { upsert: true, new: true },
    );

    console.log(`✅ Presença processada com sucesso para loja ${loja.codigo}`);

    // Processar e armazenar produtos de auditoria
    try {
      await AuditProductsService.processarNovaPlanilha(
        loja._id,
        loja.nome,
        "presenca",
        dadosProcessados,
      );
    } catch (error) {
      console.error(
        `❌ Erro ao processar produtos de auditoria para presenca:`,
        error,
      );
    }

    return {
      success: true,
      totalItens: jsonData.length,
      totalProcessados: dadosProcessados.length,
      totalUsuarios: usuariosMap.size,
      usuariosEnvolvidos: Array.from(usuariosMap.keys()),
      tipo: "presenca",
      loja: loja,
      dataAuditoria: dataAuditoriaFinal,
      auditoriasIds: auditoriasIdsPresenca, // IDs para cálculo incremental
      ignorados: typeof ignoradosPresenca !== "undefined" ? ignoradosPresenca : 0,
      errosLinha:
        typeof errosLinhaPresenca !== "undefined" ? errosLinhaPresenca : [],
    };
  } catch (error) {
    console.error("❌ Erro ao processar presença:", error);
    return {
      success: false,
      error: error.message,
      code: error.code,
      status: error.status,
    };
  } finally {
    // Limpar arquivo temporário
    limparArquivoTemporario(file.path);
  }
}

// Rota principal de upload - ATUALIZADA
router.post(
  "/upload",
  verificarLojaObrigatoria,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ erro: "Nenhum arquivo enviado." });
      }

      const { tipoAuditoria = "etiqueta" } = req.body;
      const dataAuditoria = new Date();
      const loja = req.loja;

      console.log(
        `📤 Iniciando upload de ${tipoAuditoria} para loja ${loja.codigo}`,
      );

      // Iniciando upload

      let resultado;

      switch (tipoAuditoria) {
        case "etiqueta":
          resultado = await processarEtiqueta(req.file, dataAuditoria, loja);
          break;
        case "ruptura":
          resultado = await processarRuptura(req.file, dataAuditoria, loja);
          break;
        case "presenca":
          resultado = await processarPresenca(req.file, dataAuditoria, loja);
          break;
        default:
          return res.status(400).json({ erro: "Tipo de auditoria inválido" });
      }

      if (!resultado.success) {
        const status = resultado.status || 500;
        return res.status(status).json({
          erro: resultado.code || "Falha no processamento",
          mensagem: resultado.error,
          detalhes: resultado.error,
        });
      }

      // Processamento secundário para auditoria (apenas para etiqueta)
      // if (tipoAuditoria === "etiqueta") {
      //   try {
      //     const workbook = xlsx.readFile(req.file.path, { cellDates: true });
      //     const sheetName = workbook.SheetNames[0];
      //     const sheet = workbook.Sheets[sheetName];
      //     const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: false });

      //     processarParaAuditoria({
      //       jsonData,
      //       nomeArquivo: req.file.originalname,
      //       dataAuditoria,
      //       loja: loja._id,
      //     }).then((resultadoSecundario) => {
      //       if (resultadoSecundario.success) {
      //         console.log(
      //           "✅ Dados processados para Auditoria:",
      //           resultadoSecundario.totalProcessados
      //         );
      //       } else {
      //         console.log(
      //           "⚠️ Processamento secundário falhou:",
      //           resultadoSecundario.error
      //         );
      //       }
      //     });
      //   } catch (secondaryError) {
      //     console.error("⚠️ Erro no processamento secundário:", secondaryError);
      //   }
      // }

      // Etapa 4: Calcular métricas automaticamente após o processamento bem-sucedido

      let metricsStarted = false;
      let metricsStatus = {
        initiated: false,
        diario: { attempted: false, success: false, error: null },
        mensal: { attempted: false, success: false, error: null },
      };

      try {
        console.log(
          `📊 Iniciando cálculo automático de métricas para loja ${loja.codigo}...`,
        );
        console.log(
          `📊 Service disponível:`,
          typeof metricsCalculationService.calcularTodasMetricas,
        );

        // Verificar se o serviço está disponível
        if (
          !metricsCalculationService ||
          typeof metricsCalculationService.calcularTodasMetricas !== "function"
        ) {
          throw new Error(
            "MetricsCalculationService não está disponível ou não possui o método calcularTodasMetricas",
          );
        }

        const dataMetricas = resultado.dataAuditoria || dataAuditoria;
        metricsStarted = true;
        metricsStatus.initiated = true;

        console.log(
          `📊 Calculando métricas para data: ${dataMetricas.toISOString()}`,
        );

        // Calcular métricas diárias
        metricsStatus.diario.attempted = true;
        const resultadoDiario =
          await metricsCalculationService.calcularTodasMetricas(
            "diario",
            dataMetricas,
            tipoAuditoria,
          );
        metricsStatus.diario.success = resultadoDiario.success;
        console.log(
          `📅 Métricas diárias calculadas:`,
          resultadoDiario.success ? "✅ Sucesso" : "❌ Falha",
        );

        // Atualizar UserDailyMetrics se métricas diárias foram calculadas com sucesso
        if (resultadoDiario.success) {
          try {
            console.log(
              `📊 Atualizando UserDailyMetrics para loja ${loja.codigo}...`,
            );
            await atualizarUserDailyMetrics(loja, dataMetricas, tipoAuditoria);
            console.log(`✅ UserDailyMetrics atualizado com sucesso`);
          } catch (errorDailyMetrics) {
            console.error(
              `❌ Erro ao atualizar UserDailyMetrics:`,
              errorDailyMetrics.message,
            );
          }
        }

        // ⚡ CÁLCULO INCREMENTAL: Atualizar apenas as novas métricas
        metricsStatus.mensal.attempted = true;
        try {
          // Para evitar acumulação indevida quando os dados são substituídos (mesmo dia),
          // recalculamos as métricas dos usuários afetados para o dia específico
          console.log(
            `🔄 Recalculando métricas CUMULATIVAS para os usuários afetados...`,
          );

          // Recalcula as métricas CUMULATIVAS para os usuários afetados
          const usuariosAfetados = [
            ...new Set(
              resultado.usuariosEnvolvidos.map((usuarioStr) => {
                const match = usuarioStr.match(/^(\d+)\s*\((.*)\)$/);
                return match ? match[1].trim() : usuarioStr;
              }),
            ),
          ];

          for (const userId of usuariosAfetados) {
            if (
              userId &&
              userId !== "Produto não auditado" &&
              userId !== "Usuário não identificado"
            ) {
              try {
                // Recalcula as métricas CUMULATIVAS do usuário (busca TODAS as auditorias)
                await metricasUsuariosService.recalcularMetricasUsuario(
                  loja._id,
                  userId,
                  resultado.dataAuditoria || dataAuditoria,
                );
                console.log(
                  `✅ Métricas cumulativas recalculadas para usuário ${userId}`,
                );
              } catch (errorRecalc) {
                console.error(
                  `❌ Erro ao recalcular métricas para usuário ${userId}:`,
                  errorRecalc.message,
                );
              }
            }
          }

          // CORREÇÃO: Removido atualizarMetricasIncrementalmente pois recalcularMetricasUsuario
          // agora faz recalculo completo cumulativo, evitando contagem dupla
          metricsStatus.mensal.success = true;
          console.log(
            `✅ MetricasUsuario recalculado com sucesso para ${usuariosAfetados.length} usuários`,
          );

          // 🏪 ATUALIZAR MÉTRICAS DE LOJA (Período Completo)
          console.log(`🏪 ============================================`);
          console.log(`🏪 Atualizando MetricasLoja (período completo)...`);
          console.log(`🏪 Loja: ${loja.codigo} - ${loja.nome}`);
          console.log(`🏪 ============================================`);
          try {
            const resultadoMetricasLoja =
              await metricsCalculationService.calcularMetricasLojas(
                "periodo_completo",
                new Date("2020-01-01"),
                new Date(),
              );
            console.log(`✅ MetricasLoja atualizado com sucesso`);
            console.log(`📊 Resultado:`, resultadoMetricasLoja);
          } catch (errorMetricasLoja) {
            console.error(
              `❌ Erro ao atualizar MetricasLoja:`,
              errorMetricasLoja.message,
            );
            console.error(`📋 Stack:`, errorMetricasLoja.stack);
          }
        } catch (errorIncremental) {
          console.error(
            `❌ Erro no cálculo incremental:`,
            errorIncremental.message,
          );
          metricsStatus.mensal.error = errorIncremental.message;
          metricsStatus.mensal.success = false;
        }

        console.log(
          `✅ Processamento de métricas concluído para loja ${loja.codigo}`,
        );
        console.log(
          `🔍 Verificar resultados: GET /api/debug/verificar-metricas com header x-loja: ${loja.codigo}`,
        );
      } catch (errorMetricas) {
        console.error(`❌ ERRO DETALHADO ao calcular métricas:`, {
          erro: errorMetricas.message,
          stack: errorMetricas.stack,
          loja: loja.codigo,
          serviceType: typeof metricsCalculationService,
          serviceMethod:
            typeof metricsCalculationService?.calcularTodasMetricas,
        });

        metricsStatus.diario.error = errorMetricas.message;
        metricsStatus.mensal.error = errorMetricas.message;

        console.log(
          `🔍 Para debug detalhado: GET /api/debug/verificar-metricas com header x-loja: ${loja.codigo}`,
        );
        console.log(
          `🔄 Para tentar novamente: POST /api/debug/calcular-agora com header x-loja: ${loja.codigo}`,
        );
      }

      // Finalizar progresso
      const finalResult = {
        mensagem: `Planilha de ${tipoAuditoria} processada com sucesso!`,
        totalItens: resultado.totalItens,
        totalProcessados: resultado.totalProcessados || resultado.totalItens,
        totalUsuarios: resultado.totalUsuarios || 0,
        ignorados: resultado.ignorados || 0,
        errosLinha: resultado.errosLinha || [],
        tipo: tipoAuditoria,
        loja: {
          codigo: loja.codigo,
          nome: loja.nome,
        },
        dataAuditoria: resultado.dataAuditoria || dataAuditoria,
        metricas: {
          processamentoIniciado: metricsStarted,
          status: metricsStatus,
          message: metricsStarted
            ? "Métricas processadas - verificar resultados"
            : "Erro ao iniciar processamento de métricas",
          debugUrl: `/api/debug/verificar-metricas (header x-loja: ${loja.codigo})`,
        },
      };

      // Atualizar conquistas para os usuários envolvidos na planilha
      try {
        console.log(
          `🏆 Atualizando conquistas para ${resultado.totalUsuarios} usuários após upload da loja ${loja.codigo}`,
        );

        // Obter os IDs dos usuários envolvidos na planilha processada
        const usuariosIds = resultado.usuariosEnvolvidos || [];

        for (const usuarioId of usuariosIds) {
          try {
            const achievementResult =
              await achievementRulesService.evaluateUserAchievements(
                usuarioId,
                loja.codigo,
                resultado.dataAuditoria || dataAuditoria,
              );
            console.log(
              `✅ Conquistas atualizadas para usuário ${usuarioId} na loja ${loja.codigo}`,
            );

            // Atualizar também o modelo MetricasUsuario com os dados de conquistas
            try {
              const { UserAchievement } =
                await import("../models/UserAchievement.js");
              const userAchievementDoc = await UserAchievement.findOne({
                userId: usuarioId,
                loja: loja.codigo,
              });
              if (userAchievementDoc) {
                // Encontrar e atualizar o documento correspondente em MetricasUsuario
                const metricaUsuario = await MetricasUsuario.findOne({
                  usuarioId: usuarioId,
                  loja: loja._id,
                  periodo: "periodo_completo",
                });

                if (metricaUsuario) {
                  metricaUsuario.atualizarAchievements(userAchievementDoc);
                  await metricaUsuario.save();
                  console.log(
                    `✅ Métricas de usuário ${usuarioId} atualizadas com conquistas`,
                  );
                }
              }
            } catch (errorMetricas) {
              console.error(
                `❌ Erro ao atualizar MetricasUsuario com conquistas para usuário ${usuarioId}:`,
                errorMetricas.message,
              );
            }
          } catch (error) {
            console.error(
              `❌ Erro ao atualizar conquistas para usuário ${usuarioId}:`,
              error.message,
            );
          }
        }

        console.log(
          `🏆 Conquistas atualizadas para ${usuariosIds.length} usuários após upload da loja ${loja.codigo}`,
        );
      } catch (errorAchievements) {
        console.error(
          `❌ Erro no processamento de conquistas após upload:`,
          errorAchievements.message,
        );
      }

      res.json(finalResult);
    } catch (error) {
      console.error("❌ Erro no upload:", error);

      res.status(500).json({
        erro: "Falha no processamento",
        detalhes: error.message,
      });
    }
  },
);

// Rotas para frontend - TODAS COM FILTRO DE LOJA
router.get("/usuarios", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { todos } = req.query;
    let filtro = {};

    // Se não solicitar todos os usuários, filtrar pela loja atual
    if (todos !== "true") {
      filtro.loja = req.loja._id;
    }

    const usuarios = await User.find(filtro).populate("loja", "codigo nome");

    res.json(
      usuarios.map((u) => ({
        id: u.id,
        nome: u.nome,
        foto: u.foto,
        contador: u.contadorTotal,
        iniciais: u.nome
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2),
        loja: u.loja?.codigo || req.loja.codigo,
        lojaCompleta: u.loja?.nome || req.loja.nome,
        totalAuditorias: 0, // Não mais rastreado no modelo
        ultimaAuditoria: null, // Não mais rastreado no modelo
      })),
    );
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res
      .status(500)
      .json({ erro: "Falha ao buscar usuários", detalhes: error.message });
  }
});

router.get("/datas-auditoria", verificarLojaObrigatoria, async (req, res) => {
  try {
    const datas = await Planilha.distinct("dataAuditoria", {
      loja: req.loja._id,
    });

    // Formatar datas para o frontend
    const datasFormatadas = datas.map((data) => ({
      data: data,
      timestamp: new Date(data).getTime(),
      dataFormatada: new Date(data).toLocaleDateString("pt-BR"),
    }));

    res.json(
      datasFormatadas.sort((a, b) => new Date(b.data) - new Date(a.data)),
    );
  } catch (error) {
    console.error("Erro ao buscar datas:", error);
    res
      .status(500)
      .json({ erro: "Falha ao buscar datas", detalhes: error.message });
  }
});

router.get("/dados-planilha", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { tipoAuditoria } = req.query;
    const planilhaRecente = await Planilha.findOne({
      loja: req.loja._id,
      ...(tipoAuditoria && { tipoAuditoria }),
    }).sort({ dataUpload: -1 });

    if (!planilhaRecente) {
      return res.status(404).json({
        erro: "Nenhuma planilha encontrada para esta loja",
        loja: req.loja.codigo,
      });
    }

    let dadosPlanilha = [];

    // Buscar dados baseado no tipo de auditoria
    switch (planilhaRecente.tipoAuditoria) {
      case "etiqueta":
        // Dados não mais armazenados em usuario.auditorias
        // Esta funcionalidade foi descontinuada com a remoção do campo auditorias
        // Os detalhes estão agora armazenados na coleção Auditoria
        break;

      case "ruptura":
        const rupturas = await Ruptura.find({
          dataAuditoria: {
            $gte: new Date(planilhaRecente.dataAuditoria).setHours(0, 0, 0, 0),
            $lte: new Date(planilhaRecente.dataAuditoria).setHours(
              23,
              59,
              59,
              999,
            ),
          },
          loja: req.loja._id,
        });

        dadosPlanilha = rupturas.map((ruptura) => ({
          Código: ruptura.codigo,
          Produto: ruptura.produto,
          Local: ruptura.local,
          Usuario: ruptura.usuario,
          Situacao: ruptura.situacao,
          "Estoque Atual": ruptura.estoqueAtual,
          "Presença Confirmada": ruptura.presencaConfirmada,
          "Auditado Em": ruptura.auditadoEm?.toLocaleString("pt-BR") || "",
          "Dias Sem Venda": ruptura.diasSemVenda,
          "Custo Ruptura":
            ruptura.custoRuptura?.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            }) || "",
          Fornecedor: ruptura.fornecedor,
          Loja: req.loja.codigo,
          "Data Auditoria": ruptura.dataAuditoria.toLocaleDateString("pt-BR"),
        }));
        break;

      case "presenca":
        const presencas = await Auditoria.find({
          data: {
            $gte: new Date(planilhaRecente.dataAuditoria).setHours(0, 0, 0, 0),
            $lte: new Date(planilhaRecente.dataAuditoria).setHours(
              23,
              59,
              59,
              999,
            ),
          },
          loja: req.loja._id,
          tipo: "presenca",
        });

        dadosPlanilha = presencas.map((presenca) => ({
          Código: presenca.codigo,
          Produto: presenca.produto,
          Local: presenca.local,
          Usuario: `${presenca.usuarioId} (${presenca.usuarioNome})`,
          Situacao: presenca.situacao,
          "Estoque Atual": presenca.estoque,
          "Tem Presença": presenca.presenca ? "Sim" : "Não",
          "Presença Confirmada": presenca.presencaConfirmada,
          "Auditado Em": presenca.auditadoEm?.toLocaleString("pt-BR") || "",
          "Classe Produto": presenca.classeProduto,
          Setor: presenca.setor,
          Fornecedor: presenca.fornecedor,
          Loja: req.loja.codigo,
          "Data Auditoria": presenca.data.toLocaleDateString("pt-BR"),
        }));
        break;
    }

    res.json({
      dados: dadosPlanilha,
      planilha: {
        nome: planilhaRecente.nomeArquivo,
        dataAuditoria: planilhaRecente.dataAuditoria,
        tipoAuditoria: planilhaRecente.tipoAuditoria,
        totalItens: planilhaRecente.totalItens,
        totalItensLidos: planilhaRecente.totalItensLidos,
        usuariosEnvolvidos: planilhaRecente.usuariosEnvolvidos?.length || 0,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar dados da planilha:", error);
    res.status(500).json({
      erro: "Falha ao buscar dados",
      detalhes: error.message,
    });
  }
});

// Rotas específicas para cada tipo de auditoria
router.get("/dados-ruptura", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { dataAuditoria, page = 1, limit = 1000 } = req.query;
    let filtro = { loja: req.loja._id };

    if (dataAuditoria) {
      const dataEspecifica = new Date(dataAuditoria);
      const inicioDia = new Date(dataEspecifica);
      inicioDia.setHours(0, 0, 0, 0);
      const fimDia = new Date(dataEspecifica);
      fimDia.setHours(23, 59, 59, 999);
      filtro.data = { $gte: inicioDia, $lte: fimDia };
    }

    const rupturas = await Auditoria.find({ ...filtro, tipo: "ruptura" })
      .sort({ codigo: 1, produto: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalRupturas = await Auditoria.countDocuments({
      ...filtro,
      tipo: "ruptura",
    });

    const dadosFormatados = rupturas.map((ruptura) => ({
      Código: ruptura.codigo,
      Produto: ruptura.produto,
      Local: ruptura.local,
      Usuario: `${ruptura.usuarioId} (${ruptura.usuarioNome})`,
      Situacao: ruptura.situacao,
      "Estoque Atual": ruptura.estoqueAtual,
      "Presença Confirmada": ruptura.presencaConfirmada,
      "Auditado Em": ruptura.auditadoEm?.toLocaleString("pt-BR") || "",
      "Dias Sem Venda": ruptura.diasSemVenda,
      "Custo Ruptura":
        ruptura.custoRuptura?.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }) || "",
      Fornecedor: ruptura.fornecedor,
      Loja: req.loja.codigo,
      "Data Auditoria": ruptura.data.toLocaleDateString("pt-BR"),
    }));

    res.json({
      dados: dadosFormatados,
      paginacao: {
        paginaAtual: parseInt(page),
        totalPaginas: Math.ceil(totalRupturas / parseInt(limit)),
        totalItens: totalRupturas,
        itensPorPagina: parseInt(limit),
      },
      tipo: "ruptura",
      loja: {
        codigo: req.loja.codigo,
        nome: req.loja.nome,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar dados de ruptura:", error);
    res.status(500).json({
      erro: "Falha ao buscar dados de ruptura",
      detalhes: error.message,
    });
  }
});

router.get("/dados-presenca", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { dataAuditoria, page = 1, limit = 1000 } = req.query;
    let filtro = { loja: req.loja._id };

    if (dataAuditoria) {
      const dataEspecifica = new Date(dataAuditoria);
      const inicioDia = new Date(dataEspecifica);
      inicioDia.setHours(0, 0, 0, 0);
      const fimDia = new Date(dataEspecifica);
      fimDia.setHours(23, 59, 59, 999);
      filtro.data = { $gte: inicioDia, $lte: fimDia };
    }

    const presencas = await Auditoria.find({ ...filtro, tipo: "presenca" })
      .sort({ codigo: 1, produto: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalPresencas = await Auditoria.countDocuments({
      ...filtro,
      tipo: "presenca",
    });

    const dadosFormatados = presencas.map((presenca) => ({
      Código: presenca.codigo,
      Produto: presenca.produto,
      Local: presenca.local,
      Usuario: `${presenca.usuarioId} (${presenca.usuarioNome})`,
      Situacao: presenca.situacao,
      "Estoque Atual": presenca.estoque,
      "Tem Presença": presenca.presenca ? "Sim" : "Não",
      "Presença Confirmada": presenca.presencaConfirmada,
      "Auditado Em": presenca.auditadoEm?.toLocaleString("pt-BR") || "",
      "Classe Produto": presenca.classeProduto,
      Setor: presenca.setor,
      Fornecedor: presenca.fornecedor,
      Loja: req.loja.codigo,
      "Data Auditoria": presenca.data.toLocaleDateString("pt-BR"),
    }));

    res.json({
      dados: dadosFormatados,
      paginacao: {
        paginaAtual: parseInt(page),
        totalPaginas: Math.ceil(totalPresencas / parseInt(limit)),
        totalItens: totalPresencas,
        itensPorPagina: parseInt(limit),
      },
      tipo: "presenca",
      loja: {
        codigo: req.loja.codigo,
        nome: req.loja.nome,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar dados de presença:", error);
    res.status(500).json({
      erro: "Falha ao buscar dados de presença",
      detalhes: error.message,
    });
  }
});

// Rota para estatísticas gerais
router.get("/estatisticas", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { dataInicio, dataFim } = req.query;
    let filtroData = {};

    if (dataInicio || dataFim) {
      filtroData.dataAuditoria = {};
      if (dataInicio) filtroData.dataAuditoria.$gte = new Date(dataInicio);
      if (dataFim) filtroData.dataAuditoria.$lte = new Date(dataFim);
    }

    const filtro = { loja: req.loja._id, ...filtroData };

    const [
      totalPlanilhas,
      totalUsuarios,
      totalEtiquetas,
      totalRupturas,
      totalPresencas,
      planilhaRecente,
    ] = await Promise.all([
      Planilha.countDocuments(filtro),
      User.countDocuments({ loja: req.loja._id }),
      Auditoria.countDocuments({
        ...filtroData,
        loja: req.loja._id,
        tipo: "etiqueta",
      }),
      Auditoria.countDocuments({
        ...filtroData,
        loja: req.loja._id,
        tipo: "ruptura",
      }),
      Auditoria.countDocuments({
        ...filtroData,
        loja: req.loja._id,
        tipo: "presenca",
      }),
      Planilha.findOne({ loja: req.loja._id }).sort({ dataUpload: -1 }),
    ]);

    res.json({
      estatisticas: {
        totalPlanilhas,
        totalUsuarios,
        totalEtiquetas,
        totalRupturas,
        totalPresencas,
        ultimaAtualizacao: planilhaRecente?.dataUpload || null,
      },
      loja: {
        codigo: req.loja.codigo,
        nome: req.loja.nome,
      },
      periodo: {
        dataInicio: dataInicio || null,
        dataFim: dataFim || null,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({
      erro: "Falha ao buscar estatísticas",
      detalhes: error.message,
    });
  }
});

// Rota para ranking de usuários
router.get("/ranking-usuarios", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { dataInicio, dataFim, limite = 10 } = req.query;
    let filtroData = {};

    if (dataInicio || dataFim) {
      filtroData = {};
      if (dataInicio) filtroData.$gte = new Date(dataInicio);
      if (dataFim) filtroData.$lte = new Date(dataFim);
    }

    const usuarios = await User.find({ loja: req.loja._id })
      .sort({ contadorTotal: -1 })
      .limit(parseInt(limite));

    const ranking = usuarios.map((usuario, index) => {
      let contadorPeriodo = usuario.contadorTotal;
      let auditoriasNoPeriodo = 0; // Não mais rastreado

      if (dataInicio || dataFim) {
        // Não temos mais histórico por data, então usamos o contador total
        contadorPeriodo = usuario.contadorTotal;
      } else {
        contadorPeriodo = usuario.contadorTotal;
      }

      return {
        posicao: index + 1,
        id: usuario.id,
        nome: usuario.nome,
        contadorPeriodo,
        contadorTotal: usuario.contadorTotal,
        auditoriasNoPeriodo: 0, // Não mais rastreado
        totalAuditorias: 0, // Não mais rastreado
        iniciais: usuario.nome
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase(),
        ultimaAuditoria: null, // Não mais rastreado
      };
    });

    res.json({
      ranking,
      filtros: {
        dataInicio: dataInicio || null,
        dataFim: dataFim || null,
        limite: parseInt(limite),
      },
      loja: {
        codigo: req.loja.codigo,
        nome: req.loja.nome,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar ranking:", error);
    res.status(500).json({
      erro: "Falha ao buscar ranking",
      detalhes: error.message,
    });
  }
});

// Rota para buscar dados específicos de um usuário
router.get("/usuarios/:id", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { id } = req.params;
    const { todos } = req.query;

    let filtro = { id };

    // Se não solicitar todos os usuários, filtrar pela loja atual
    if (todos !== "true") {
      filtro.loja = req.loja._id;
    }

    const usuario = await User.findOne(filtro).populate("loja", "codigo nome");

    if (!usuario) {
      return res.status(404).json({
        erro: "Usuário não encontrado",
        id,
        loja: req.loja.codigo,
      });
    }

    res.json({
      id: usuario.id,
      nome: usuario.nome,
      contador: usuario.contadorTotal,
      iniciais: usuario.nome
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2),
      loja: usuario.loja?.codigo || req.loja.codigo,
      lojaCompleta: usuario.loja?.nome || req.loja.nome,
      totalAuditorias: 0, // Não mais rastreado no modelo
      ultimaAuditoria: null, // Não mais rastreado no modelo
      auditorias: [], // Não mais rastreado no modelo
      foto: usuario.foto,
    });
  } catch (error) {
    console.error("Erro ao buscar usuário específico:", error);
    res
      .status(500)
      .json({ erro: "Falha ao buscar usuário", detalhes: error.message });
  }
});

// Rota para buscar auditorias detalhadas de um usuário
router.get(
  "/usuarios/:id/auditorias",
  verificarLojaObrigatoria,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { todos } = req.query;

      let filtro = { usuarioId: id };

      // Se não solicitar todos os usuários, filtrar pela loja atual
      if (todos !== "true") {
        filtro.loja = req.loja._id;
      }

      const auditorias = await Auditoria.find(filtro)
        .populate("loja", "codigo nome")
        .sort({ data: -1 })
        .limit(100); // Limitar para evitar sobrecarga

      const dadosFormatados = auditorias.map((auditoria) => ({
        Código: auditoria.codigo,
        Produto: auditoria.produto,
        Local: auditoria.local,
        Usuario: `${auditoria.usuarioId} (${auditoria.usuarioNome})`,
        Situacao: auditoria.situacao,
        "Estoque atual": auditoria.estoque,
        "Data Auditoria": auditoria.data,
        Loja: auditoria.loja?.codigo || req.loja.codigo,
        tipo: auditoria.tipo,
      }));

      res.json(dadosFormatados);
    } catch (error) {
      console.error("Erro ao buscar auditorias do usuário:", error);
      res
        .status(500)
        .json({ erro: "Falha ao buscar auditorias", detalhes: error.message });
    }
  },
);
// upload.js - NOVA ROTA PARA DEBUG
router.get(
  "/debug-metricas-usuario/:usuarioId",
  verificarLojaObrigatoria,
  async (req, res) => {
    try {
      const { usuarioId } = req.params;
      const { periodo = "diario", data } = req.query;

      const dataRef = data ? new Date(data) : new Date();
      const { dataInicio, dataFim } = obterPeriodo(periodo, dataRef);

      const metricas = await MetricasUsuario.findOne({
        loja: req.loja._id,
        usuarioId: usuarioId,
        periodo: periodo,
        dataInicio: dataInicio,
      });

      if (!metricas) {
        return res.status(404).json({
          erro: "Métricas não encontradas",
          usuarioId,
          periodo,
          dataInicio: dataInicio.toISOString(),
        });
      }

      res.json({
        usuario: {
          id: metricas.usuarioId,
          nome: metricas.usuarioNome,
        },
        periodo: {
          tipo: metricas.periodo,
          inicio: metricas.dataInicio,
          fim: metricas.dataFim,
        },
        metricas: {
          etiquetas: metricas.etiquetas,
          rupturas: metricas.rupturas,
          presencas: metricas.presencas,
        },
        totais: metricas.totais,
        contadoresAuditorias: metricas.contadoresAuditorias,
        totaisAcumulados: metricas.totaisAcumulados,
      });
    } catch (error) {
      console.error("Erro ao buscar métricas debug:", error);
      res
        .status(500)
        .json({ erro: "Falha ao buscar métricas", detalhes: error.message });
    }
  },
);

// Endpoint para RankingColaboradores - UserDailyMetrics
// Endpoint para RankingColaboradores - UserDailyMetrics - VERSÃO CORRIGIDA
router.get(
  "/ranking-colaboradores",
  verificarLojaObrigatoria,
  async (req, res) => {
    try {
      const loja = req.loja;
      const { tipo } = req.query;

      console.log(
        `🏆 Buscando ranking para loja ${loja.codigo}, tipo: ${tipo || "todos"}`,
      );

      // Buscar todos os UserDailyMetrics da loja
      const usuarios = await UserDailyMetrics.find({ loja: loja._id });

      // Buscar os dados de foto para todos os usuários de uma vez para melhorar performance
      const idsUsuarios = [...new Set(usuarios.map((u) => u.usuarioId))];
      const usuariosDocs = await User.find({ id: { $in: idsUsuarios } });
      const usuariosMap = new Map(usuariosDocs.map((u) => [u.id, u]));

      const ranking = [];

      for (const usuario of usuarios) {
        if (!usuario.metricas) continue;

        // Usar a nova estrutura com objeto único
        const metricas = usuario.metricas;

        let contador = 0;

        // LÓGICA CORRETA: Pegar dados específicos do tipo solicitado
        if (!tipo || tipo === "todos") {
          // Para "todos": somar todos os tipos
          contador =
            (metricas.etiquetas?.itensAtualizados || 0) +
            (metricas.rupturas?.itensAtualizados || 0) +
            (metricas.presencas?.itensAtualizados || 0);
        } else if (tipo === "etiqueta") {
          contador = metricas.etiquetas?.itensAtualizados || 0;
        } else if (tipo === "ruptura") {
          contador = metricas.rupturas?.itensAtualizados || 0;
        } else if (tipo === "presenca") {
          contador = metricas.presencas?.itensAtualizados || 0;
        }

        // Filtrar usuários inválidos
        const isValidUser =
          contador > 0 &&
          usuario.usuarioNome &&
          !usuario.usuarioNome.toLowerCase().includes("produto não auditado") &&
          !usuario.usuarioNome
            .toLowerCase()
            .includes("usuário não identificado") &&
          usuario.usuarioId &&
          !usuario.usuarioId.toLowerCase().includes("produto não auditado") &&
          !usuario.usuarioId.toLowerCase().includes("usuário não identificado");

        if (isValidUser) {
          const usuarioDoc = usuariosMap.get(usuario.usuarioId);

          ranking.push({
            id: usuario.usuarioId,
            nome: usuario.usuarioNome,
            foto: usuarioDoc?.foto || null,
            contador: contador,
            loja: usuario.lojaNome,
            metricas: metricas,
            eficiencia: metricas.totais?.percentualConclusaoGeral || 0,
            pontuacao: metricas.totais?.pontuacaoTotal || 0,
            posicaoLoja: 0,
          });
        }
      }

      // Ordenar por contador
      ranking.sort((a, b) => b.contador - a.contador);

      console.log(
        `✅ Ranking gerado: ${ranking.length} colaboradores - Tipo: ${
          tipo || "todos"
        }`,
      );

      res.json(ranking);
    } catch (error) {
      console.error("❌ Erro ao buscar ranking colaboradores:", error);
      res.status(500).json({
        erro: "Falha ao buscar ranking colaboradores",
        detalhes: error.message,
      });
    }
  },
);

// Endpoint para RankingColaboradores - MetricasUsuario (período completo)
router.get(
  "/ranking-colaboradores-completo",
  verificarLojaObrigatoria,
  async (req, res) => {
    try {
      const loja = req.loja;
      const { tipo } = req.query;

      console.log(
        `🏆 Buscando ranking completo para loja ${loja.codigo}, tipo: ${
          tipo || "todos"
        }`,
      );

      // Buscar todos os MetricasUsuario da loja (período completo)
      const usuarios = await MetricasUsuario.find({
        loja: loja._id,
        periodo: "periodo_completo",
      });

      // Buscar os dados de foto para todos os usuários de uma vez para melhorar performance
      const idsUsuarios = [...new Set(usuarios.map((u) => u.usuarioId))];
      const usuariosDocs = await User.find({ id: { $in: idsUsuarios } });
      const usuariosMap = new Map(usuariosDocs.map((u) => [u.id, u]));

      const ranking = [];

      for (const usuario of usuarios) {
        let contador = 0;

        // LÓGICA CORRETA: Pegar dados específicos do tipo solicitado
        if (!tipo || tipo === "todos") {
          // Para "todos": somar todos os tipos
          contador =
            (usuario.etiquetas?.itensAtualizados || 0) +
            (usuario.rupturas?.itensAtualizados || 0) +
            (usuario.presencas?.itensAtualizados || 0);
        } else if (tipo === "etiqueta") {
          contador = usuario.etiquetas?.itensAtualizados || 0;
        } else if (tipo === "ruptura") {
          contador = usuario.rupturas?.itensAtualizados || 0;
        } else if (tipo === "presenca") {
          contador = usuario.presencas?.itensAtualizados || 0;
        }

        // Filtrar usuários inválidos
        const isValidUser =
          contador > 0 &&
          usuario.usuarioNome &&
          !usuario.usuarioNome.toLowerCase().includes("produto não auditado") &&
          !usuario.usuarioNome
            .toLowerCase()
            .includes("usuário não identificado") &&
          usuario.usuarioId &&
          !usuario.usuarioId.toLowerCase().includes("produto não auditado") &&
          !usuario.usuarioId.toLowerCase().includes("usuário não identificado");

        if (isValidUser) {
          const usuarioDoc = usuariosMap.get(usuario.usuarioId);

          ranking.push({
            id: usuario.usuarioId,
            nome: usuario.usuarioNome,
            foto: usuarioDoc?.foto || null,
            contador: contador,
            loja: usuario.lojaNome,
            metricas: {
              data: usuario.dataInicio, // Adicionando a data do período
              totais: usuario.totais,
              etiquetas: usuario.etiquetas,
              rupturas: usuario.rupturas,
              presencas: usuario.presencas,
            },
            eficiencia: usuario.totais?.percentualConclusaoGeral || 0,
            pontuacao: usuario.totais?.pontuacaoTotal || 0,
            totalAuditorias: usuario.contadoresAuditorias?.totalGeral || 0,
          });
        }
      }

      // Ordenar por contador (itens atualizados)
      ranking.sort((a, b) => b.contador - a.contador);

      console.log(
        `✅ Ranking completo gerado: ${ranking.length} colaboradores - Tipo: ${
          tipo || "todos"
        }`,
      );

      res.json(ranking);
    } catch (error) {
      console.error("❌ Erro ao buscar ranking colaboradores completo:", error);
      res.status(500).json({
        erro: "Falha ao buscar ranking colaboradores completo",
        detalhes: error.message,
      });
    }
  },
);

// Endpoint para obter datas de auditoria disponíveis - UserDailyMetrics
router.get(
  "/datas-auditoria-colaboradores",
  verificarLojaObrigatoria,
  async (req, res) => {
    try {
      const loja = req.loja;

      // Buscar todos os UserDailyMetrics da loja
      const usuarios = await UserDailyMetrics.find({ loja: loja._id });

      // Coletar todas as datas únicas
      const datasSet = new Set();

      usuarios.forEach((usuario) => {
        if (usuario.metricas && usuario.metricas.data) {
          datasSet.add(usuario.metricas.data.toDateString());
        }
      });

      // Converter para array e ordenar
      const datas = Array.from(datasSet)
        .map((dataString) => new Date(dataString))
        .sort((a, b) => b - a) // Mais recente primeiro
        .map((data) => ({
          data: data.toISOString().split("T")[0],
          dataFormatada: data.toLocaleDateString("pt-BR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          timestamp: data.getTime(),
        }));

      console.log(
        `📅 Encontradas ${datas.length} datas de auditoria disponíveis`,
      );

      res.json(datas);
    } catch (error) {
      console.error("❌ Erro ao buscar datas de auditoria:", error);
      res.status(500).json({
        erro: "Falha ao buscar datas de auditoria",
        detalhes: error.message,
      });
    }
  },
);

// Endpoint para testar UserDailyMetrics - DEBUG
router.get(
  "/test-daily-metrics",
  verificarLojaObrigatoria,
  async (req, res) => {
    try {
      const loja = req.loja;
      const UserDailyMetrics = (await import("../models/UserDailyMetrics.js"))
        .default;

      // Buscar todos os UserDailyMetrics da loja
      const usuarios = await UserDailyMetrics.find({ loja: loja._id })
        .populate("loja", "nome codigo")
        .sort({ ultimaAtualizacao: -1 });

      const resultado = {
        loja: {
          codigo: loja.codigo,
          nome: loja.nome,
        },
        totalUsuarios: usuarios.length,
        usuarios: usuarios.map((usuario) => ({
          usuarioId: usuario.usuarioId,
          usuarioNome: usuario.usuarioNome,
          lojaNome: usuario.lojaNome,
          totalDias: usuario.metricasDiarias.length,
          ultimaAtualizacao: usuario.ultimaAtualizacao,
          ultimoDia:
            usuario.metricasDiarias.length > 0
              ? {
                  data: usuario.metricasDiarias[
                    usuario.metricasDiarias.length - 1
                  ].data,
                  totais:
                    usuario.metricasDiarias[usuario.metricasDiarias.length - 1]
                      .totais,
                  etiquetas:
                    usuario.metricasDiarias[usuario.metricasDiarias.length - 1]
                      .etiquetas,
                  rupturas:
                    usuario.metricasDiarias[usuario.metricasDiarias.length - 1]
                      .rupturas,
                  presencas:
                    usuario.metricasDiarias[usuario.metricasDiarias.length - 1]
                      .presencas,
                }
              : null,
        })),
      };

      res.json(resultado);
    } catch (error) {
      console.error("❌ Erro ao buscar UserDailyMetrics:", error);
      res.status(500).json({
        erro: "Falha ao buscar UserDailyMetrics",
        detalhes: error.message,
      });
    }
  },
);

// Função auxiliar para calcular métricas por classe de produto
function calcularMetricasPorClasse(auditorias) {
  // Inicializar objeto para armazenar métricas por classe
  const metricasPorClasse = {
    "A CLASSIFICAR": { total: 0, lidos: 0 },
    "ALTO GIRO": { total: 0, lidos: 0 },
    BAZAR: { total: 0, lidos: 0 },
    DIVERSOS: { total: 0, lidos: 0 },
    DPH: { total: 0, lidos: 0 },
    FLV: { total: 0, lidos: 0 },
    "LATICINIOS 1": { total: 0, lidos: 0 },
    LIQUIDA: { total: 0, lidos: 0 },
    "PERECIVEL 1": { total: 0, lidos: 0 },
    "PERECIVEL 2": { total: 0, lidos: 0 },
    "PERECIVEL 2 B": { total: 0, lidos: 0 },
    "PERECIVEL 3": { total: 0, lidos: 0 },
    "SECA DOCE": { total: 0, lidos: 0 },
    "SECA SALGADA": { total: 0, lidos: 0 },
    "SECA SALGADA 2": { total: 0, lidos: 0 },
  };

  // Processar cada auditoria
  for (const auditoria of auditorias) {
    // Determinar classe do produto
    const classe = auditoria.ClasseProduto || auditoria.classeProdutoRaiz;
    if (!classe) continue; // Pular se não tiver classe definida

    // Verificar se a classe está no objeto de métricas
    if (metricasPorClasse.hasOwnProperty(classe)) {
      // Incrementar total
      metricasPorClasse[classe].total++;

      // Verificar se o item foi lido (qualquer situação exceto "Não lido")
      if (auditoria.situacao && auditoria.situacao !== "Não lido") {
        // Considerar como "lido" se for uma das situações de leitura
        // Atualizado, Desatualizado, Não pertence são situações onde o item foi lido
        if (
          auditoria.situacao === "Atualizado" ||
          auditoria.situacao === "Desatualizado" ||
          auditoria.situacao === "Não pertence"
        ) {
          metricasPorClasse[classe].lidos++;
        }
      }
    }
  }

  // Calcular percentuais e retornar o objeto final
  const classesLeitura = {};
  for (const [classe, valores] of Object.entries(metricasPorClasse)) {
    classesLeitura[classe] = {
      total: valores.total,
      lidos: valores.lidos,
      percentual: valores.total > 0 ? (valores.lidos / valores.total) * 100 : 0,
    };
  }

  return classesLeitura;
}

// Função para atualizar UserDailyMetrics seguindo o padrão do User.js
// Função para atualizar UserDailyMetrics - NOVA VERSÃO COM CONTADORES
async function atualizarUserDailyMetrics(loja, dataMetricas, tipoAuditoria) {
  try {
    console.log(
      `📊 Atualizando UserDailyMetrics para loja ${loja.codigo}, tipo: ${tipoAuditoria}`,
    );

    // CORREÇÃO: Buscar apenas auditorias DO DIA para métricas diárias
    const inicioDia = new Date(dataMetricas);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataMetricas);
    fimDia.setHours(23, 59, 59, 999);

    const auditorias = await Auditoria.find({
      loja: loja._id,
      data: { $gte: inicioDia, $lte: fimDia },
    });

    console.log(
      `📊 Encontradas ${auditorias.length} auditorias para processar`,
    );

    // Agrupar por usuário
    const usuariosMap = new Map();

    for (const auditoria of auditorias) {
      const chaveUsuario = auditoria.usuarioId;

      if (!usuariosMap.has(chaveUsuario)) {
        usuariosMap.set(chaveUsuario, {
          usuarioId: auditoria.usuarioId,
          usuarioNome: auditoria.usuarioNome,
          auditorias: [],
          etiquetas: {
            totalItens: 0,
            itensLidos: 0,
            itensAtualizados: 0,
            itensDesatualizado: 0,
            itensSemEstoque: 0,
            itensNaopertence: 0,
          },
          rupturas: {
            totalItens: 0,
            itensLidos: 0,
            itensAtualizados: 0,
            itensDesatualizado: 0,
            itensSemEstoque: 0,
            itensNaopertence: 0,
            custoTotalRuptura: 0,
            custoMedioRuptura: 0,
          },
          presencas: {
            totalItens: 0,
            itensLidos: 0,
            itensAtualizados: 0,
            itensDesatualizado: 0,
            itensSemEstoque: 0,
            itensNaopertence: 0,
            presencasConfirmadas: 0,
            percentualPresenca: 0,
          },
        });
      }

      const dadosUsuario = usuariosMap.get(chaveUsuario);
      dadosUsuario.auditorias.push(auditoria);

      // Calcular métricas básicas por tipo
      if (auditoria.tipo === "etiqueta") {
        dadosUsuario.etiquetas.totalItens++;
        if (auditoria.situacao && auditoria.situacao !== "Não lido") {
          dadosUsuario.etiquetas.itensLidos++;
        }
        if (auditoria.situacao === "Atualizado")
          dadosUsuario.etiquetas.itensAtualizados++;
        else if (auditoria.situacao === "Desatualizado")
          dadosUsuario.etiquetas.itensDesatualizado++;
        else if (auditoria.situacao === "Sem estoque")
          dadosUsuario.etiquetas.itensSemEstoque++;
        else if (auditoria.situacao === "Não pertence")
          dadosUsuario.etiquetas.itensNaopertence++;
      } else if (auditoria.tipo === "ruptura") {
        dadosUsuario.rupturas.totalItens++;
        if (auditoria.situacao && auditoria.situacao !== "Não lido") {
          dadosUsuario.rupturas.itensLidos++;
        }
        if (auditoria.situacao === "Atualizado")
          dadosUsuario.rupturas.itensAtualizados++;
        else if (auditoria.situacao === "Desatualizado")
          dadosUsuario.rupturas.itensDesatualizado++;
        else if (auditoria.situacao === "Sem estoque")
          dadosUsuario.rupturas.itensSemEstoque++;
        else if (auditoria.situacao === "Não pertence")
          dadosUsuario.rupturas.itensNaopertence++;

        if (auditoria.custoRuptura) {
          dadosUsuario.rupturas.custoTotalRuptura += auditoria.custoRuptura;
        }
      } else if (auditoria.tipo === "presenca") {
        dadosUsuario.presencas.totalItens++;
        if (auditoria.situacao && auditoria.situacao !== "Não lido") {
          dadosUsuario.presencas.itensLidos++;
        }
        if (auditoria.situacao === "Atualizado")
          dadosUsuario.presencas.itensAtualizados++;
        else if (auditoria.situacao === "Desatualizado")
          dadosUsuario.presencas.itensDesatualizado++;
        else if (auditoria.situacao === "Sem estoque")
          dadosUsuario.presencas.itensSemEstoque++;
        else if (auditoria.situacao === "Não pertence")
          dadosUsuario.presencas.itensNaopertence++;

        if (auditoria.presenca) {
          dadosUsuario.presencas.presencasConfirmadas++;
        }
      }
    }

    // Processar cada usuário
    for (const [usuarioId, dados] of usuariosMap) {
      try {
        // Buscar ou criar usuário - UserDailyMetrics já estava funcionando bem
        let userDailyMetrics = await UserDailyMetrics.findOneAndUpdate(
          {
            usuarioId: dados.usuarioId,
            loja: loja._id,
          },
          {
            $setOnInsert: {
              usuarioId: dados.usuarioId,
              usuarioNome: dados.usuarioNome,
              loja: loja._id,
              lojaNome: loja.nome,
              metricas: {
                data: dataMetricas,
                etiquetas: {},
                rupturas: {},
                presencas: {},
                totais: {},
                ultimaAtualizacao: new Date(),
              },
              versaoCalculo: "2.0",
            },
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          },
        );

        // Calcular percentuais (SEM ARREDONDAMENTO)
        dados.etiquetas.percentualConclusao =
          dados.etiquetas.totalItens > 0
            ? (dados.etiquetas.itensAtualizados / dados.etiquetas.totalItens) *
              100
            : 0;
        dados.etiquetas.percentualDesatualizado =
          dados.etiquetas.totalItens > 0
            ? (dados.etiquetas.itensDesatualizado /
                dados.etiquetas.totalItens) *
              100
            : 0;
        // Inicializar classesLeitura para etiquetas
        dados.etiquetas.classesLeitura = {
          "A CLASSIFICAR": { total: 0, lidos: 0, percentual: 0 },
          "ALTO GIRO": { total: 0, lidos: 0, percentual: 0 },
          BAZAR: { total: 0, lidos: 0, percentual: 0 },
          DIVERSOS: { total: 0, lidos: 0, percentual: 0 },
          DPH: { total: 0, lidos: 0, percentual: 0 },
          FLV: { total: 0, lidos: 0, percentual: 0 },
          "LATICINIOS 1": { total: 0, lidos: 0, percentual: 0 },
          LIQUIDA: { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 1": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 2": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 2 B": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 3": { total: 0, lidos: 0, percentual: 0 },
          "SECA DOCE": { total: 0, lidos: 0, percentual: 0 },
          "SECA SALGADA": { total: 0, lidos: 0, percentual: 0 },
          "SECA SALGADA 2": { total: 0, lidos: 0, percentual: 0 },
        };

        dados.rupturas.percentualConclusao =
          dados.rupturas.totalItens > 0
            ? (dados.rupturas.itensAtualizados / dados.rupturas.totalItens) *
              100
            : 0;
        dados.rupturas.percentualDesatualizado =
          dados.rupturas.totalItens > 0
            ? (dados.rupturas.itensDesatualizado / dados.rupturas.totalItens) *
              100
            : 0;
        // Inicializar classesLeitura para rupturas
        dados.rupturas.classesLeitura = {
          "A CLASSIFICAR": { total: 0, lidos: 0, percentual: 0 },
          "ALTO GIRO": { total: 0, lidos: 0, percentual: 0 },
          BAZAR: { total: 0, lidos: 0, percentual: 0 },
          DIVERSOS: { total: 0, lidos: 0, percentual: 0 },
          DPH: { total: 0, lidos: 0, percentual: 0 },
          FLV: { total: 0, lidos: 0, percentual: 0 },
          "LATICINIOS 1": { total: 0, lidos: 0, percentual: 0 },
          LIQUIDA: { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 1": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 2": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 2 B": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 3": { total: 0, lidos: 0, percentual: 0 },
          "SECA DOCE": { total: 0, lidos: 0, percentual: 0 },
          "SECA SALGADA": { total: 0, lidos: 0, percentual: 0 },
          "SECA SALGADA 2": { total: 0, lidos: 0, percentual: 0 },
        };

        dados.rupturas.custoMedioRuptura =
          dados.rupturas.totalItens > 0
            ? dados.rupturas.custoTotalRuptura / dados.rupturas.totalItens
            : 0;
        dados.presencas.percentualConclusao =
          dados.presencas.totalItens > 0
            ? (dados.presencas.itensAtualizados / dados.presencas.totalItens) *
              100
            : 0;
        dados.presencas.percentualDesatualizado =
          dados.presencas.totalItens > 0
            ? (dados.presencas.itensDesatualizado /
                dados.presencas.totalItens) *
              100
            : 0;
        // Inicializar classesLeitura para presencas
        dados.presencas.classesLeitura = {
          "A CLASSIFICAR": { total: 0, lidos: 0, percentual: 0 },
          "ALTO GIRO": { total: 0, lidos: 0, percentual: 0 },
          BAZAR: { total: 0, lidos: 0, percentual: 0 },
          DIVERSOS: { total: 0, lidos: 0, percentual: 0 },
          DPH: { total: 0, lidos: 0, percentual: 0 },
          FLV: { total: 0, lidos: 0, percentual: 0 },
          "LATICINIOS 1": { total: 0, lidos: 0, percentual: 0 },
          LIQUIDA: { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 1": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 2": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 2 B": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 3": { total: 0, lidos: 0, percentual: 0 },
          "SECA DOCE": { total: 0, lidos: 0, percentual: 0 },
          "SECA SALGADA": { total: 0, lidos: 0, percentual: 0 },
          "SECA SALGADA 2": { total: 0, lidos: 0, percentual: 0 },
        };

        dados.presencas.percentualPresenca =
          dados.presencas.totalItens > 0
            ? (dados.presencas.presencasConfirmadas /
                dados.presencas.totalItens) *
              100
            : 0;

        // Buscar auditorias DO DIA do usuário para calcular contadores (já filtrado por data)
        const todasAuditorias = auditorias.filter(
          (aud) => aud.usuarioId === dados.usuarioId,
        );

        // Garantir que as métricas existam
        if (!userDailyMetrics.metricas) {
          userDailyMetrics.metricas = {
            data: dataMetricas,
            etiquetas: {},
            rupturas: {},
            presencas: {},
            totais: {},
            ultimaAtualizacao: new Date(),
          };
        }

        // CORREÇÃO COMPLETA: Recalcular TODOS os tipos baseados em TODAS as auditorias
        // Calcular métricas de todos os tipos baseado nas auditorias completas do usuário
        const metricasCompletas = {
          etiquetas: {
            totalItens: 0,
            itensLidos: 0,
            itensAtualizados: 0,
            itensDesatualizado: 0,
            itensSemEstoque: 0,
            itensNaopertence: 0,
          },
          rupturas: {
            totalItens: 0,
            itensLidos: 0,
            itensAtualizados: 0,
            itensDesatualizado: 0,
            itensSemEstoque: 0,
            itensNaopertence: 0,
            custoTotalRuptura: 0,
            custoMedioRuptura: 0,
          },
          presencas: {
            totalItens: 0,
            itensLidos: 0,
            itensAtualizados: 0,
            itensDesatualizado: 0,
            itensSemEstoque: 0,
            itensNaopertence: 0,
            presencasConfirmadas: 0,
            percentualPresenca: 0,
          },
        };

        // Processar TODAS as auditorias do usuário para calcular métricas completas
        for (const auditoria of todasAuditorias) {
          if (auditoria.tipo === "etiqueta") {
            metricasCompletas.etiquetas.totalItens++;
            if (auditoria.situacao && auditoria.situacao !== "Não lido")
              metricasCompletas.etiquetas.itensLidos++;
            if (auditoria.situacao === "Atualizado")
              metricasCompletas.etiquetas.itensAtualizados++;
            else if (auditoria.situacao === "Desatualizado")
              metricasCompletas.etiquetas.itensDesatualizado++;
            else if (auditoria.situacao === "Sem estoque")
              metricasCompletas.etiquetas.itensSemEstoque++;
            else if (auditoria.situacao === "Não pertence")
              metricasCompletas.etiquetas.itensNaopertence++;
          } else if (auditoria.tipo === "ruptura") {
            metricasCompletas.rupturas.totalItens++;
            if (auditoria.situacao && auditoria.situacao !== "Não lido")
              metricasCompletas.rupturas.itensLidos++;
            if (auditoria.situacao === "Atualizado")
              metricasCompletas.rupturas.itensAtualizados++;
            else if (auditoria.situacao === "Desatualizado")
              metricasCompletas.rupturas.itensDesatualizado++;
            else if (auditoria.situacao === "Sem estoque")
              metricasCompletas.rupturas.itensSemEstoque++;
            else if (auditoria.situacao === "Não pertence")
              metricasCompletas.rupturas.itensNaopertence++;
            if (auditoria.custoRuptura)
              metricasCompletas.rupturas.custoTotalRuptura +=
                auditoria.custoRuptura;
          } else if (auditoria.tipo === "presenca") {
            metricasCompletas.presencas.totalItens++;
            if (auditoria.situacao && auditoria.situacao !== "Não lido")
              metricasCompletas.presencas.itensLidos++;
            if (auditoria.situacao === "Atualizado")
              metricasCompletas.presencas.itensAtualizados++;
            else if (auditoria.situacao === "Desatualizado")
              metricasCompletas.presencas.itensDesatualizado++;
            else if (auditoria.situacao === "Sem estoque")
              metricasCompletas.presencas.itensSemEstoque++;
            else if (auditoria.situacao === "Não pertence")
              metricasCompletas.presencas.itensNaopertence++;
            if (auditoria.presenca)
              metricasCompletas.presencas.presencasConfirmadas++;
          }
        }

        // Calcular percentuais finais (SEM ARREDONDAMENTO)
        metricasCompletas.etiquetas.percentualConclusao =
          metricasCompletas.etiquetas.totalItens > 0
            ? (metricasCompletas.etiquetas.itensAtualizados /
                metricasCompletas.etiquetas.totalItens) *
              100
            : 0;
        metricasCompletas.etiquetas.percentualDesatualizado =
          metricasCompletas.etiquetas.totalItens > 0
            ? (metricasCompletas.etiquetas.itensDesatualizado /
                metricasCompletas.etiquetas.totalItens) *
              100
            : 0;
        // Inicializar classesLeitura para etiquetas
        metricasCompletas.etiquetas.classesLeitura = {
          "A CLASSIFICAR": { total: 0, lidos: 0, percentual: 0 },
          "ALTO GIRO": { total: 0, lidos: 0, percentual: 0 },
          BAZAR: { total: 0, lidos: 0, percentual: 0 },
          DIVERSOS: { total: 0, lidos: 0, percentual: 0 },
          DPH: { total: 0, lidos: 0, percentual: 0 },
          FLV: { total: 0, lidos: 0, percentual: 0 },
          "LATICINIOS 1": { total: 0, lidos: 0, percentual: 0 },
          LIQUIDA: { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 1": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 2": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 2 B": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 3": { total: 0, lidos: 0, percentual: 0 },
          "SECA DOCE": { total: 0, lidos: 0, percentual: 0 },
          "SECA SALGADA": { total: 0, lidos: 0, percentual: 0 },
          "SECA SALGADA 2": { total: 0, lidos: 0, percentual: 0 },
        };

        metricasCompletas.rupturas.percentualConclusao =
          metricasCompletas.rupturas.totalItens > 0
            ? (metricasCompletas.rupturas.itensAtualizados /
                metricasCompletas.rupturas.totalItens) *
              100
            : 0;
        metricasCompletas.rupturas.percentualDesatualizado =
          metricasCompletas.rupturas.totalItens > 0
            ? (metricasCompletas.rupturas.itensDesatualizado /
                metricasCompletas.rupturas.totalItens) *
              100
            : 0;
        // Inicializar classesLeitura para rupturas
        metricasCompletas.rupturas.classesLeitura = {
          "A CLASSIFICAR": { total: 0, lidos: 0, percentual: 0 },
          "ALTO GIRO": { total: 0, lidos: 0, percentual: 0 },
          BAZAR: { total: 0, lidos: 0, percentual: 0 },
          DIVERSOS: { total: 0, lidos: 0, percentual: 0 },
          DPH: { total: 0, lidos: 0, percentual: 0 },
          FLV: { total: 0, lidos: 0, percentual: 0 },
          "LATICINIOS 1": { total: 0, lidos: 0, percentual: 0 },
          LIQUIDA: { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 1": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 2": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 2 B": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 3": { total: 0, lidos: 0, percentual: 0 },
          "SECA DOCE": { total: 0, lidos: 0, percentual: 0 },
          "SECA SALGADA": { total: 0, lidos: 0, percentual: 0 },
          "SECA SALGADA 2": { total: 0, lidos: 0, percentual: 0 },
        };

        metricasCompletas.rupturas.custoMedioRuptura =
          metricasCompletas.rupturas.totalItens > 0
            ? metricasCompletas.rupturas.custoTotalRuptura /
              metricasCompletas.rupturas.totalItens
            : 0;
        metricasCompletas.presencas.percentualConclusao =
          metricasCompletas.presencas.totalItens > 0
            ? (metricasCompletas.presencas.itensAtualizados /
                metricasCompletas.presencas.totalItens) *
              100
            : 0;
        metricasCompletas.presencas.percentualDesatualizado =
          metricasCompletas.presencas.totalItens > 0
            ? (metricasCompletas.presencas.itensDesatualizado /
                metricasCompletas.presencas.totalItens) *
              100
            : 0;
        // Inicializar classesLeitura para presencas
        metricasCompletas.presencas.classesLeitura = {
          "A CLASSIFICAR": { total: 0, lidos: 0, percentual: 0 },
          "ALTO GIRO": { total: 0, lidos: 0, percentual: 0 },
          BAZAR: { total: 0, lidos: 0, percentual: 0 },
          DIVERSOS: { total: 0, lidos: 0, percentual: 0 },
          DPH: { total: 0, lidos: 0, percentual: 0 },
          FLV: { total: 0, lidos: 0, percentual: 0 },
          "LATICINIOS 1": { total: 0, lidos: 0, percentual: 0 },
          LIQUIDA: { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 1": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 2": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 2 B": { total: 0, lidos: 0, percentual: 0 },
          "PERECIVEL 3": { total: 0, lidos: 0, percentual: 0 },
          "SECA DOCE": { total: 0, lidos: 0, percentual: 0 },
          "SECA SALGADA": { total: 0, lidos: 0, percentual: 0 },
          "SECA SALGADA 2": { total: 0, lidos: 0, percentual: 0 },
        };

        metricasCompletas.presencas.percentualPresenca =
          metricasCompletas.presencas.totalItens > 0
            ? (metricasCompletas.presencas.presencasConfirmadas /
                metricasCompletas.presencas.totalItens) *
              100
            : 0;

        // Calcular métricas por classe para cada tipo de auditoria
        const etiquetasAuditorias = todasAuditorias.filter(
          (a) => a.tipo === "etiqueta",
        );
        const rupturasAuditorias = todasAuditorias.filter(
          (a) => a.tipo === "ruptura",
        );
        const presencasAuditorias = todasAuditorias.filter(
          (a) => a.tipo === "presenca",
        );

        const classesLeituraEtiquetas =
          calcularMetricasPorClasse(etiquetasAuditorias);
        const classesLeituraRupturas =
          calcularMetricasPorClasse(rupturasAuditorias);
        const classesLeituraPresencas =
          calcularMetricasPorClasse(presencasAuditorias);

        // Calcular contadores específicos por tipo de auditoria
        const contadorClassesEtiquetas =
          userDailyMetrics.calcularContadorClassesProduto(etiquetasAuditorias);
        const contadorLocaisEtiquetas =
          userDailyMetrics.calcularContadorLocais(etiquetasAuditorias);

        const contadorClassesRupturas =
          userDailyMetrics.calcularContadorClassesProduto(rupturasAuditorias);
        const contadorLocaisRupturas =
          userDailyMetrics.calcularContadorLocais(rupturasAuditorias);

        const contadorClassesPresencas =
          userDailyMetrics.calcularContadorClassesProduto(presencasAuditorias);
        const contadorLocaisPresencas =
          userDailyMetrics.calcularContadorLocais(presencasAuditorias);

        // Agora SEMPRE atualizar todos os tipos com métricas completas + contadores
        userDailyMetrics.metricas.etiquetas = {
          ...metricasCompletas.etiquetas,
          classesLeitura: classesLeituraEtiquetas,
          contadorClasses: contadorClassesEtiquetas,
          contadorLocais: contadorLocaisEtiquetas,
        };
        userDailyMetrics.metricas.rupturas = {
          ...metricasCompletas.rupturas,
          classesLeitura: classesLeituraRupturas,
          contadorClasses: contadorClassesRupturas,
          contadorLocais: contadorLocaisRupturas,
        };
        userDailyMetrics.metricas.presencas = {
          ...metricasCompletas.presencas,
          classesLeitura: classesLeituraPresencas,
          contadorClasses: contadorClassesPresencas,
          contadorLocais: contadorLocaisPresencas,
        };

        // Atualizar data das métricas
        userDailyMetrics.metricas.data = dataMetricas;
        userDailyMetrics.metricas.ultimaAtualizacao = new Date();

        // Atualizar totais gerais usando os métodos do schema
        userDailyMetrics.atualizarTotais();

        await userDailyMetrics.save();
        console.log(
          `✅ UserDailyMetrics atualizado para ${dados.usuarioNome} - Tipo: ${
            tipoAuditoria || "todos"
          }`,
        );
      } catch (error) {
        console.error(
          `❌ Erro ao atualizar usuário ${dados.usuarioNome}:`,
          error.message,
        );
      }
    }

    console.log(
      `✅ UserDailyMetrics atualizado para ${usuariosMap.size} usuários`,
    );
  } catch (error) {
    console.error(
      `❌ Erro geral ao atualizar UserDailyMetrics:`,
      error.message,
    );
  }
}

// Rota para métricas de usuários (consumida pelo frontend)
router.get("/metricas-usuarios", verificarLojaObrigatoria, async (req, res) => {
  try {
    const loja = req.loja;
    const { data, ativo, todasLojas, lojaEspecifica } = req.query;

    let query = {};

    // Filtro por loja
    if (todasLojas === "true") {
      // Buscar todas as lojas - sem filtro de loja
    } else if (lojaEspecifica) {
      // Buscar loja específica pelo código
      const lojaEspecificaObj = await Loja.findOne({ codigo: lojaEspecifica });
      if (lojaEspecificaObj) {
        query.loja = lojaEspecificaObj._id;
      } else {
        query.loja = loja._id; // Fallback para loja atual
      }
    } else {
      // Padrão: loja atual
      query.loja = loja._id;
    }

    if (data) {
      const dataFiltro = new Date(data);
      if (!isNaN(dataFiltro.getTime())) {
        query.dataInicio = { $lte: dataFiltro };
        query.dataFim = { $gte: dataFiltro };
      }
    }

    if (ativo !== undefined) {
      query.ativo = ativo === "true";
    }

    const metricas = await MetricasUsuario.find(query)
      .populate("loja", "nome codigo endereco")
      .sort({ "totaisAcumulados.itensLidosTotal": -1 });

    // Filtrar apenas usuários válidos com dados úteis
    const usuariosValidos = metricas.filter((metrica) => {
      const isValid =
        metrica.usuarioNome &&
        metrica.usuarioId &&
        !metrica.usuarioNome.toLowerCase().includes("produto não auditado") &&
        !metrica.usuarioNome
          .toLowerCase()
          .includes("usuário não identificado") &&
        !metrica.usuarioId.toLowerCase().includes("produto não auditado") &&
        !metrica.usuarioId.toLowerCase().includes("usuário não identificado") &&
        metrica.totaisAcumulados?.itensLidosTotal > 0;

      return isValid;
    });

    console.log(
      `📊 MetricasUsuario - Loja: ${loja.codigo}, Total: ${metricas.length}, Válidos: ${usuariosValidos.length}`,
    );

    const usuarios = usuariosValidos.map((metrica) => {
      // Gerar iniciais a partir do usuarioNome
      const iniciais = metrica.usuarioNome
        ? metrica.usuarioNome
            .split(" ")
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .substring(0, 2)
        : "??";

      return {
        id: metrica.usuarioId,
        nome: metrica.usuarioNome,
        iniciais: iniciais,
        contador: metrica.totaisAcumulados?.itensLidosTotal || 0,
        auditorias: metrica.contadoresAuditorias?.totalGeral || 0,
        loja: metrica.loja,
        lojaNome: metrica.lojaNome || metrica.loja?.nome, // Campo direto do modelo ou populate fallback
        metricas: {
          ContadorClassesProduto: metrica.ContadorClassesProduto,
          ContadorLocais: metrica.ContadorLocais,
          etiquetas: metrica.etiquetas,
          rupturas: metrica.rupturas,
          presencas: metrica.presencas,
          totais: metrica.totais,
          totaisAcumulados: metrica.totaisAcumulados,
          contadoresAuditorias: metrica.contadoresAuditorias,
          dataInicio: metrica.dataInicio,
          dataFim: metrica.dataFim,
          ultimaAtualizacao: metrica.ultimaAtualizacao,
        },
      };
    });

    const totalColaboradores = usuarios.length;
    const totalLojas = await Loja.countDocuments();
    const mediaColaboradoresPorLoja =
      totalLojas > 0 ? (totalColaboradores / totalLojas).toFixed(1) : 0;

    const estatisticas = {
      totalColaboradores,
      totalLojas,
      mediaColaboradoresPorLoja: parseFloat(mediaColaboradoresPorLoja),
    };

    res.json({
      usuarios,
      estatisticas,
      total: usuarios.length,
    });
  } catch (error) {
    console.error("Erro ao buscar métricas de usuários:", error);
    res.status(500).json({
      erro: "Erro interno do servidor",
      detalhes: error.message,
    });
  }
});

// Endpoint temporário para atualizar registros existentes com lojaNome
router.post(
  "/atualizar-loja-nome",
  verificarLojaObrigatoria,
  async (req, res) => {
    try {
      const metricas = await MetricasUsuario.find({}).populate(
        "loja",
        "nome codigo",
      );

      let atualizados = 0;

      for (const metrica of metricas) {
        if (!metrica.lojaNome && metrica.loja?.nome) {
          metrica.lojaNome = metrica.loja.nome;
          await metrica.save();
          atualizados++;
        }
      }

      res.json({
        sucesso: true,
        totalRegistros: metricas.length,
        atualizados: atualizados,
        mensagem: `${atualizados} registros atualizados com lojaNome`,
      });
    } catch (error) {
      res.status(500).json({ erro: error.message });
    }
  },
);

// Rota para atualizar o cover da loja
router.post("/atualizar-cover", verificarLojaObrigatoria, async (req, res) => {
  try {
    const loja = req.loja;
    const { coverId } = req.body;

    if (!coverId || coverId.trim() === "") {
      return res.status(400).json({ erro: "Cover ID é obrigatório" });
    }

    // Lista de covers válidos
    const coversValidos = [
      "gradient-1",
      "gradient-2",
      "gradient-3",
      "gradient-4",
      "gradient-5",
      "gradient-6",
      "gradient-7",
      "gradient-8",
      "gradient-9",
      "gradient-10",
      "gradient-11",
      "gradient-12",
    ];

    if (!coversValidos.includes(coverId)) {
      return res.status(400).json({ erro: "Cover ID inválido" });
    }

    loja.coverId = coverId;
    await loja.save();

    console.log(`✅ Cover da loja ${loja.codigo} atualizado para: ${coverId}`);

    res.json({
      mensagem: "Cover da loja atualizado com sucesso",
      loja: {
        codigo: loja.codigo,
        nome: loja.nome,
        coverId: loja.coverId,
      },
    });
  } catch (error) {
    console.error("Erro ao atualizar cover da loja:", error);
    res.status(500).json({
      erro: "Erro ao atualizar cover da loja",
      detalhes: error.message,
    });
  }
});

export default router;
