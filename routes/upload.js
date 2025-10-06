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
import UserDailyMetrics from "../models/UserDailyMetrics.js";

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

// Função para processar etiqueta
async function processarEtiqueta(file, dataAuditoria, loja) {
  try {
    console.log(
      `🏷️ Processando etiquetas para loja: ${loja.codigo} - ${loja.nome}`
    );

    // Lendo planilha

    const workbook = xlsx.readFile(file.path, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: false });

    const setoresBatch = [];
    const usuariosMap = new Map();
    let totalItensProcessados = 0;

    // Encontrar chaves das colunas
    const primeiraLinha = jsonData[0] || {};
    const todasChaves = Object.keys(primeiraLinha);

    const usuarioKey = todasChaves.find(
      (key) =>
        key.toLowerCase().includes("usuário") ||
        key.toLowerCase().includes("usuario")
    );
    const situacaoKey = todasChaves.find(
      (key) =>
        key.toLowerCase().includes("situação") ||
        key.toLowerCase().includes("situacao")
    );
    const localKey = todasChaves.find((key) =>
      key.toLowerCase().includes("local")
    );
    const produtoKey = todasChaves.find((key) =>
      key.toLowerCase().includes("produto")
    );
    const codigoKey = todasChaves.find(
      (key) =>
        key.toLowerCase().includes("código") ||
        key.toLowerCase().includes("codigo")
    );
    const estoqueKey = todasChaves.find((key) =>
      key.toLowerCase().includes("estoque")
    );
    const compraKey = todasChaves.find((key) =>
      key.toLowerCase().includes("compra")
    );
    const classeProdutoKey = todasChaves.find((key) =>
      key.toLowerCase().includes("classe") && key.toLowerCase().includes("produto")
    );
    // Buscar colunas "Auditado em" - Excel/XLSX cria "_1", "_2" etc para colunas duplicadas
    const auditadoEmDataKey = todasChaves.find((key) => {
      const keyLower = key.toLowerCase().trim();
      return (keyLower === "auditado em" ||
              (keyLower.includes("auditado") && keyLower.includes("em") && !keyLower.includes("_")));
    });

    const auditadoEmHoraKey = todasChaves.find((key) => {
      const keyLower = key.toLowerCase().trim();
      return (keyLower === "auditado em_1" ||
              keyLower.includes("auditado em_") ||
              (keyLower.includes("auditado") && keyLower.includes("em") && keyLower.includes("_")));
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
          console.log(`📅 Data encontrada (${auditadoEmDataKey}):`, auditadoDia);
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
          console.log(`⏰ Hora encontrada (${auditadoEmHoraKey}):`, horaCompleta, "→", auditadoHora);
        }
      }

      if (index === 0) {
        console.log(`✅ Resultado final - Dia: "${auditadoDia}", Hora: "${auditadoHora}"`);
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
        ClasseProduto: classeProdutoKey ? String(item[classeProdutoKey] || "").trim() : "",
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

    console.log(
      `🗑️ Dados antigos removidos para loja ${
        loja.codigo
      } na data ${dataAuditoria.toLocaleDateString()}`
    );

    // Salvar auditorias
    if (setoresBatch.length > 0) {
      await Auditoria.insertMany(setoresBatch);
      console.log(
        `💾 ${setoresBatch.length} auditorias salvos para loja ${loja.codigo}`
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
          }
        );

        console.log(`👤 Usuário processado: ${usuario.nome} (${usuario.id})`);
        const wasCreated =
          !usuario.auditorias || usuario.auditorias.length === 0;

        // Encontrar ou criar auditoria para a data atual
        const auditoriaIndex = usuario.auditorias.findIndex(
          (a) => a.data.toDateString() === dataAuditoria.toDateString()
        );

        if (auditoriaIndex === -1) {
          usuario.auditorias.push({
            data: dataAuditoria,
            contador: 0,
            detalhes: [],
          });
        }

        const auditoria =
          usuario.auditorias[
            auditoriaIndex === -1
              ? usuario.auditorias.length - 1
              : auditoriaIndex
          ];

        // Limpar detalhes existentes e processar novos itens
        auditoria.detalhes = [];
        auditoria.contador = 0;

        for (const item of itens) {
          const detalhe = {
            codigo: codigoKey ? String(item[codigoKey] || "") : "",
            produto: produtoKey ? String(item[produtoKey] || "") : "",
            local: localKey ? String(item[localKey] || "") : "",
            situacao: situacaoKey ? String(item[situacaoKey] || "") : "",
            estoque: estoqueKey ? String(item[estoqueKey] || "0") : "0",
            tipoAuditoria: "etiqueta",
            loja: loja._id,
          };

          auditoria.detalhes.push(detalhe);

          if (detalhe.situacao === "Atualizado") {
            auditoria.contador++;
          }
        }

        // Atualizar contador total
        usuario.contadorTotal = usuario.auditorias.reduce(
          (total, aud) => total + aud.contador,
          0
        );

        await usuario.save();
        console.log(
          `👤 Usuário processado: ${nome} (${auditoria.contador} itens)`
        );
      } catch (error) {
        console.error(`❌ Erro ao processar usuário ${usuarioStr}:`, error);
      }
    }

    // Calcular total de itens lidos
    const totalItensLidos = jsonData.filter(
      (item) => situacaoKey && item[situacaoKey] === "Atualizado"
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
      { upsert: true, new: true }
    );

    console.log(`✅ Planilha processada com sucesso para loja ${loja.codigo}`);

    const resultado = {
      success: true,
      totalItens: jsonData.length,
      totalProcessados: totalItensProcessados,
      totalUsuarios: usuariosMap.size,
      tipo: "etiqueta",
      loja: loja,
    };

    return resultado;
  } catch (error) {
    console.error("❌ Erro ao processar etiqueta:", error);
    return { success: false, error: error.message };
  }
}

// Função para processar ruptura
async function processarRuptura(file, dataAuditoria, loja) {
  try {
    console.log(
      `💔 Processando rupturas para loja: ${loja.codigo} - ${loja.nome}`
    );

    const workbook = xlsx.readFile(file.path, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: false });

    // Extrair data real da planilha
    let dataAuditoriaFinal = extrairDataDaPlanilha(jsonData, file.originalname);
    if (!dataAuditoriaFinal || isNaN(dataAuditoriaFinal.getTime())) {
      dataAuditoriaFinal = dataAuditoria;
    }

    const dadosProcessados = [];
    const usuariosMap = new Map();

    for (let index = 0; index < jsonData.length; index++) {
      const item = jsonData[index];

      const codigo = String(item["Código"] || "").trim();
      const produto = String(
        item["Produto"] || "Produto não especificado"
      ).trim();

      if (!codigo && !produto) {
        continue;
      }

      const local = String(item["Local"] || "Não especificado").trim();
      const usuario = String(
        item["Usuário"] || "Usuário não identificado"
      ).trim();
      const situacao = String(item["Situação"] || "Não lido").trim();

      const dadosItem = {
        codigo,
        produto,
        local,
        usuario,
        situacao: normalizarSituacao(situacao),
        situacaoAuditoria: String(
          item["Situação atual da auditoria"] || ""
        ).trim(),
        auditadoEm: combinarDataHoraBrasileira(
          item["Auditado em"],
          item["Auditado em_1"]
        ),
        estoqueAtual: processarValorEstoque(item["Estoque atual"] || "0"),
        presencaConfirmada: String(item["Presença confirmada"] || "").trim(),
        presencaConfirmadaEm: combinarDataHoraBrasileira(
          item["Presença confirmada"],
          item["Presença confirmada_1"]
        ),
        estoqueLeitura: processarValorEstoque(item["Estoque Leitura"] || "0"),
        residuo: String(item["Resíduo"] || "").trim(),
        fornecedor: String(item["Fornecedor"] || "").trim(),
        ultimaCompra: String(item["Última compra"] || "").trim(),
        ultimaCompraEm: combinarDataHoraBrasileira(
          item["Última compra"],
          item["Última compra_1"]
        ),
        diasSemVenda: parseInt(item["Dias sem venda"] || 0),
        custoRuptura: parseFloat(
          String(item["Custo Ruptura"] || "0")
            .replace(".", "")
            .replace(",", ".")
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
        ClasseProduto: item.classeProdutoRaiz ? String(item.classeProdutoRaiz).trim() : "",
        local: item.local,
        situacao: item.situacao,
        situacaoAtual: item.situacaoAuditoria || "",
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
        AuditadoDia: item.auditadoEm ? item.auditadoEm.toLocaleDateString("pt-BR") : "",
        AuditadoHora: item.auditadoEm ? item.auditadoEm.toLocaleTimeString("pt-BR", {hour: '2-digit', minute: '2-digit'}) : "",
        metadata: item.metadata,
      }));

      await Auditoria.insertMany(auditoriasBatch);
      console.log(
        `💾 ${dadosProcessados.length} rupturas salvas para loja ${loja.codigo}`
      );
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
          }
        );

        console.log(`👤 Usuário processado: ${usuario.nome} (${usuario.id})`);

        const auditoriaIndex = usuario.auditorias.findIndex(
          (a) => a.data.toDateString() === dataAuditoriaFinal.toDateString()
        );

        if (auditoriaIndex === -1) {
          usuario.auditorias.push({
            data: dataAuditoriaFinal,
            contador: 0,
            detalhes: [],
          });
        }

        const auditoria =
          usuario.auditorias[
            auditoriaIndex === -1
              ? usuario.auditorias.length - 1
              : auditoriaIndex
          ];

        auditoria.detalhes = [];
        auditoria.contador = 0;

        for (const item of itens) {
          const detalhe = {
            codigo: String(item["Código"] || ""),
            produto: String(item["Produto"] || ""),
            local: String(item["Local"] || ""),
            situacao: String(item["Situação"] || ""),
            estoque: String(item["Estoque atual"] || "0"),
            tipoAuditoria: "ruptura",
            loja: loja._id,
          };

          auditoria.detalhes.push(detalhe);

          if (detalhe.situacao === "Atualizado") {
            auditoria.contador++;
          }
        }

        usuario.contadorTotal = usuario.auditorias.reduce(
          (total, aud) => total + aud.contador,
          0
        );

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
          (item) => item.situacao === "Atualizado"
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
      { upsert: true, new: true }
    );

    console.log(`✅ Ruptura processada com sucesso para loja ${loja.codigo}`);

    return {
      success: true,
      totalItens: jsonData.length,
      totalProcessados: dadosProcessados.length,
      totalUsuarios: usuariosMap.size,
      tipo: "ruptura",
      loja: loja,
      dataAuditoria: dataAuditoriaFinal,
    };
  } catch (error) {
    console.error("❌ Erro ao processar ruptura:", error);
    return { success: false, error: error.message };
  } finally {
    // Limpar arquivo temporário
    limparArquivoTemporario(file.path);
  }
}

// Função para processar presença
async function processarPresenca(file, dataAuditoria, loja) {
  try {
    console.log(
      `👥 Processando presenças para loja: ${loja.codigo} - ${loja.nome}`
    );

    const workbook = xlsx.readFile(file.path, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: false });

    // Extrair data real da planilha
    let dataAuditoriaFinal = extrairDataDaPlanilha(jsonData, file.originalname);
    if (!dataAuditoriaFinal || isNaN(dataAuditoriaFinal.getTime())) {
      dataAuditoriaFinal = dataAuditoria;
    }

    const dadosProcessados = [];
    const usuariosMap = new Map();

    for (let index = 0; index < jsonData.length; index++) {
      const item = jsonData[index];

      const codigo = String(item["Código"] || "").trim();
      const produto = String(
        item["Produto"] || "Produto não especificado"
      ).trim();

      if (!codigo && !produto) {
        continue;
      }

      const local = String(item["Local"] || "Não especificado").trim();
      const usuario = String(
        item["Usuário"] || "Usuário não identificado"
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
          item["Auditado em_1"]
        ),
        presencaConfirmadaEm: combinarDataHoraBrasileira(
          item["Presença confirmada"],
          item["Presença confirmada_1"]
        ),
        classeProdutoRaiz: String(item["Classe de Produto Raiz"] || "").trim(),
        classeProduto: String(item["Classe de Produto"] || "").trim(),
        setor: String(item["Setor"] || "").trim(),
        situacaoAuditoria: String(
          item["Situação atual da auditoria"] || ""
        ).trim(),
        estoqueLeitura: processarValorEstoque(item["Estoque Leitura"] || "0"),
        residuo: String(item["Resíduo"] || "").trim(),
        fornecedor: String(item["Fornecedor"] || "").trim(),
        ultimaCompra: String(item["Última compra"] || "").trim(),
        diasSemVenda: parseInt(item["Dias sem venda"] || 0),
        custoRuptura: parseFloat(
          String(item["Custo Ruptura"] || "0")
            .replace(".", "")
            .replace(",", ".")
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
        ClasseProduto: item.classeProdutoRaiz ? String(item.classeProdutoRaiz).trim() : "",
        local: item.local,
        situacao: item.situacao,
        situacaoAtual: item.situacaoAuditoria || "",
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
        AuditadoDia: item.auditadoEm ? item.auditadoEm.toLocaleDateString("pt-BR") : "",
        AuditadoHora: item.auditadoEm ? item.auditadoEm.toLocaleTimeString("pt-BR", {hour: '2-digit', minute: '2-digit'}) : "",
        metadata: item.metadata,
      }));

      await Auditoria.insertMany(auditoriasBatch);
      console.log(
        `💾 ${dadosProcessados.length} presenças salvas para loja ${loja.codigo}`
      );
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
          }
        );

        console.log(
          `👤 Usuário processado para presença: ${usuario.nome} (${usuario.id})`
        );

        const auditoriaIndex = usuario.auditorias.findIndex(
          (a) => a.data.toDateString() === dataAuditoriaFinal.toDateString()
        );

        if (auditoriaIndex === -1) {
          usuario.auditorias.push({
            data: dataAuditoriaFinal,
            contador: 0,
            detalhes: [],
          });
        }

        const auditoria =
          usuario.auditorias[
            auditoriaIndex === -1
              ? usuario.auditorias.length - 1
              : auditoriaIndex
          ];

        auditoria.detalhes = [];
        auditoria.contador = 0;

        for (const item of itens) {
          const detalhe = {
            codigo: String(item["Código"] || ""),
            produto: String(item["Produto"] || ""),
            local: String(item["Local"] || ""),
            situacao: String(item["Situação"] || ""),
            estoque: String(item["Estoque atual"] || "0"),
            tipoAuditoria: "presenca",
            loja: loja._id,
          };

          auditoria.detalhes.push(detalhe);

          if (detalhe.situacao === "Atualizado") {
            auditoria.contador++;
          }
        }

        usuario.contadorTotal = usuario.auditorias.reduce(
          (total, aud) => total + aud.contador,
          0
        );

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
          (item) => item.situacao === "Atualizado"
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
      { upsert: true, new: true }
    );

    console.log(`✅ Presença processada com sucesso para loja ${loja.codigo}`);

    return {
      success: true,
      totalItens: jsonData.length,
      totalProcessados: dadosProcessados.length,
      totalUsuarios: usuariosMap.size,
      tipo: "presenca",
      loja: loja,
      dataAuditoria: dataAuditoriaFinal,
    };
  } catch (error) {
    console.error("❌ Erro ao processar presença:", error);
    return { success: false, error: error.message };
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
        `📤 Iniciando upload de ${tipoAuditoria} para loja ${loja.codigo}`
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
        return res.status(500).json({
          erro: "Falha no processamento",
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
          `📊 Iniciando cálculo automático de métricas para loja ${loja.codigo}...`
        );
        console.log(
          `📊 Service disponível:`,
          typeof metricsCalculationService.calcularTodasMetricas
        );

        // Verificar se o serviço está disponível
        if (
          !metricsCalculationService ||
          typeof metricsCalculationService.calcularTodasMetricas !== "function"
        ) {
          throw new Error(
            "MetricsCalculationService não está disponível ou não possui o método calcularTodasMetricas"
          );
        }

        const dataMetricas = resultado.dataAuditoria || dataAuditoria;
        metricsStarted = true;
        metricsStatus.initiated = true;

        console.log(
          `📊 Calculando métricas para data: ${dataMetricas.toISOString()}`
        );

        // Calcular métricas diárias
        metricsStatus.diario.attempted = true;
        const resultadoDiario =
          await metricsCalculationService.calcularTodasMetricas(
            "diario",
            dataMetricas
          );
        metricsStatus.diario.success = resultadoDiario.success;
        console.log(
          `📅 Métricas diárias calculadas:`,
          resultadoDiario.success ? "✅ Sucesso" : "❌ Falha"
        );

        // Atualizar UserDailyMetrics se métricas diárias foram calculadas com sucesso
        if (resultadoDiario.success) {
          try {
            console.log(`📊 Atualizando UserDailyMetrics para loja ${loja.codigo}...`);
            await atualizarUserDailyMetrics(loja, dataMetricas);
            console.log(`✅ UserDailyMetrics atualizado com sucesso`);
          } catch (errorDailyMetrics) {
            console.error(`❌ Erro ao atualizar UserDailyMetrics:`, errorDailyMetrics.message);
          }
        }

        // Calcular métricas mensais
        metricsStatus.mensal.attempted = true;
        const resultadoMensal =
          await metricsCalculationService.calcularTodasMetricas(
            "mensal",
            dataMetricas
          );
        metricsStatus.mensal.success = resultadoMensal.success;
        console.log(
          `📊 Métricas mensais calculadas:`,
          resultadoMensal.success ? "✅ Sucesso" : "❌ Falha"
        );

        console.log(
          `✅ Processamento de métricas concluído para loja ${loja.codigo}`
        );
        console.log(
          `🔍 Verificar resultados: GET /api/debug/verificar-metricas com header x-loja: ${loja.codigo}`
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
          `🔍 Para debug detalhado: GET /api/debug/verificar-metricas com header x-loja: ${loja.codigo}`
        );
        console.log(
          `🔄 Para tentar novamente: POST /api/debug/calcular-agora com header x-loja: ${loja.codigo}`
        );
      }

      // Finalizar progresso
      const finalResult = {
        mensagem: `Planilha de ${tipoAuditoria} processada com sucesso!`,
        totalItens: resultado.totalItens,
        totalProcessados: resultado.totalProcessados || resultado.totalItens,
        totalUsuarios: resultado.totalUsuarios || 0,
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

      res.json(finalResult);
    } catch (error) {
      console.error("❌ Erro no upload:", error);

      res.status(500).json({
        erro: "Falha no processamento",
        detalhes: error.message,
      });
    }
  }
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
        contador: u.contadorTotal,
        iniciais: u.nome
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2),
        loja: u.loja?.codigo || req.loja.codigo,
        lojaCompleta: u.loja?.nome || req.loja.nome,
        totalAuditorias: u.auditorias?.length || 0,
        ultimaAuditoria:
          u.auditorias?.length > 0
            ? u.auditorias[u.auditorias.length - 1].data
            : null,
      }))
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
      datasFormatadas.sort((a, b) => new Date(b.data) - new Date(a.data))
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
        const usuarios = await User.find({
          "auditorias.data": planilhaRecente.dataAuditoria,
          loja: req.loja._id,
        });

        usuarios.forEach((usuario) => {
          usuario.auditorias.forEach((auditoria) => {
            if (
              auditoria.data.toDateString() ===
              planilhaRecente.dataAuditoria.toDateString()
            ) {
              auditoria.detalhes.forEach((detalhe) => {
                dadosPlanilha.push({
                  Código: detalhe.codigo,
                  Produto: detalhe.produto,
                  Local: detalhe.local,
                  Usuario: `${usuario.id} (${usuario.nome})`,
                  Situacao: detalhe.situacao,
                  "Estoque atual": detalhe.estoque,
                  "Última compra": new Date().toLocaleDateString("pt-BR"),
                  Loja: req.loja.codigo,
                });
              });
            }
          });
        });
        break;

      case "ruptura":
        const rupturas = await Ruptura.find({
          dataAuditoria: {
            $gte: new Date(planilhaRecente.dataAuditoria).setHours(0, 0, 0, 0),
            $lte: new Date(planilhaRecente.dataAuditoria).setHours(
              23,
              59,
              59,
              999
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
              999
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
      let auditoriasNoPeriodo = usuario.auditorias.length;

      if (dataInicio || dataFim) {
        const auditoriasFiltradas = usuario.auditorias.filter((aud) => {
          if (dataInicio && aud.data < new Date(dataInicio)) return false;
          if (dataFim && aud.data > new Date(dataFim)) return false;
          return true;
        });

        contadorPeriodo = auditoriasFiltradas.reduce(
          (sum, aud) => sum + aud.contador,
          0
        );
        auditoriasNoPeriodo = auditoriasFiltradas.length;
      }

      return {
        posicao: index + 1,
        id: usuario.id,
        nome: usuario.nome,
        contadorPeriodo,
        contadorTotal: usuario.contadorTotal,
        auditoriasNoPeriodo,
        totalAuditorias: usuario.auditorias.length,
        iniciais: usuario.nome
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase(),
        ultimaAuditoria:
          usuario.auditorias.length > 0
            ? usuario.auditorias[usuario.auditorias.length - 1].data
            : null,
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
      totalAuditorias: usuario.auditorias?.length || 0,
      ultimaAuditoria:
        usuario.auditorias?.length > 0
          ? usuario.auditorias[usuario.auditorias.length - 1].data
          : null,
      auditorias: usuario.auditorias || [],
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
  }
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
  }
);

// Endpoint para testar UserDailyMetrics - DEBUG
router.get("/test-daily-metrics", verificarLojaObrigatoria, async (req, res) => {
  try {
    const loja = req.loja;
    const UserDailyMetrics = (await import("../models/UserDailyMetrics.js")).default;

    // Buscar todos os UserDailyMetrics da loja
    const usuarios = await UserDailyMetrics.find({ loja: loja._id })
      .populate('loja', 'nome codigo')
      .sort({ ultimaAtualizacao: -1 });

    const resultado = {
      loja: {
        codigo: loja.codigo,
        nome: loja.nome,
      },
      totalUsuarios: usuarios.length,
      usuarios: usuarios.map(usuario => ({
        usuarioId: usuario.usuarioId,
        usuarioNome: usuario.usuarioNome,
        lojaNome: usuario.lojaNome,
        totalDias: usuario.metricasDiarias.length,
        ultimaAtualizacao: usuario.ultimaAtualizacao,
        ultimoDia: usuario.metricasDiarias.length > 0 ? {
          data: usuario.metricasDiarias[usuario.metricasDiarias.length - 1].data,
          totais: usuario.metricasDiarias[usuario.metricasDiarias.length - 1].totais,
          etiquetas: usuario.metricasDiarias[usuario.metricasDiarias.length - 1].etiquetas,
          rupturas: usuario.metricasDiarias[usuario.metricasDiarias.length - 1].rupturas,
          presencas: usuario.metricasDiarias[usuario.metricasDiarias.length - 1].presencas,
        } : null
      }))
    };

    res.json(resultado);
  } catch (error) {
    console.error("❌ Erro ao buscar UserDailyMetrics:", error);
    res.status(500).json({
      erro: "Falha ao buscar UserDailyMetrics",
      detalhes: error.message
    });
  }
});

// Função para atualizar UserDailyMetrics seguindo o padrão do User.js
async function atualizarUserDailyMetrics(loja, dataMetricas) {
  const MetricasUsuario = (await import("../models/MetricasUsuario.js")).default;

  console.log(`📊 Buscando métricas diárias para loja ${loja.codigo} na data ${dataMetricas.toISOString()}`);

  // Buscar todas as métricas de usuários para a data específica
  const metricasUsuarios = await MetricasUsuario.find({
    loja: loja._id,
    periodo: "diario",
    dataInicio: {
      $gte: new Date(dataMetricas.toDateString()),
      $lt: new Date(new Date(dataMetricas.toDateString()).getTime() + 24 * 60 * 60 * 1000),
    },
  });

  console.log(`📊 Encontradas ${metricasUsuarios.length} métricas de usuários para atualizar`);

  // Processar cada usuário seguindo o padrão do User.js
  for (const metricaUsuario of metricasUsuarios) {
    try {
      // Buscar ou criar usuário com upsert (IGUAL ao User.js)
      let userDailyMetrics = await UserDailyMetrics.findOneAndUpdate(
        {
          $or: [
            { usuarioId: metricaUsuario.usuarioId, loja: loja._id },
            { usuarioNome: metricaUsuario.usuarioNome, loja: loja._id },
          ],
        },
        {
          $setOnInsert: {
            usuarioId: metricaUsuario.usuarioId,
            usuarioNome: metricaUsuario.usuarioNome,
            loja: loja._id,
            lojaNome: loja.nome,
            metricasDiarias: [],
            versaoCalculo: "1.0",
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );

      console.log(`👤 Usuário processado: ${userDailyMetrics.usuarioNome} (${userDailyMetrics.usuarioId})`);

      // Encontrar ou criar métricas para a data atual (IGUAL ao User.js)
      const metricasIndex = userDailyMetrics.metricasDiarias.findIndex(
        (m) => m.data.toDateString() === dataMetricas.toDateString()
      );

      if (metricasIndex === -1) {
        userDailyMetrics.metricasDiarias.push({
          data: dataMetricas,
          etiquetas: {},
          rupturas: {},
          presencas: {},
          contadorClasses: {},
          contadorLocais: {},
          totais: {},
          contadoresAuditorias: {},
          ranking: {},
          tendencias: {},
          ultimaAtualizacao: new Date(),
        });
      }

      const metricasDia = userDailyMetrics.metricasDiarias[
        metricasIndex === -1
          ? userDailyMetrics.metricasDiarias.length - 1
          : metricasIndex
      ];

      // Limpar e atualizar dados (IGUAL ao User.js: auditoria.detalhes = [])
      // Etiquetas
      metricasDia.etiquetas = {
        totalItens: metricaUsuario.etiquetas?.totalItens || 0,
        itensLidos: metricaUsuario.etiquetas?.itensLidos || 0,
        itensAtualizados: metricaUsuario.etiquetas?.itensAtualizados || 0,
        itensDesatualizado: metricaUsuario.etiquetas?.itensDesatualizado || 0,
        itensSemEstoque: metricaUsuario.etiquetas?.itensSemEstoque || 0,
        itensNaopertence: metricaUsuario.etiquetas?.itensNaopertence || 0,
        percentualConclusao: metricaUsuario.etiquetas?.percentualConclusao || 0,
      };

      // Rupturas
      metricasDia.rupturas = {
        totalItens: metricaUsuario.rupturas?.totalItens || 0,
        itensLidos: metricaUsuario.rupturas?.itensLidos || 0,
        itensAtualizados: metricaUsuario.rupturas?.itensAtualizados || 0,
        itensDesatualizado: metricaUsuario.rupturas?.itensDesatualizado || 0,
        itensSemEstoque: metricaUsuario.rupturas?.itensSemEstoque || 0,
        itensNaopertence: metricaUsuario.rupturas?.itensNaopertence || 0,
        percentualConclusao: metricaUsuario.rupturas?.percentualConclusao || 0,
        custoTotalRuptura: metricaUsuario.rupturas?.custoTotalRuptura || 0,
        custoMedioRuptura: metricaUsuario.rupturas?.custoMedioRuptura || 0,
      };

      // Presenças
      metricasDia.presencas = {
        totalItens: metricaUsuario.presencas?.totalItens || 0,
        itensLidos: metricaUsuario.presencas?.itensLidos || 0,
        itensAtualizados: metricaUsuario.presencas?.itensAtualizados || 0,
        itensDesatualizado: metricaUsuario.presencas?.itensDesatualizado || 0,
        itensSemEstoque: metricaUsuario.presencas?.itensSemEstoque || 0,
        itensNaopertence: metricaUsuario.presencas?.itensNaopertence || 0,
        percentualConclusao: metricaUsuario.presencas?.percentualConclusao || 0,
        presencasConfirmadas: metricaUsuario.presencas?.presencasConfirmadas || 0,
        percentualPresenca: metricaUsuario.presencas?.percentualPresenca || 0,
      };

      // Contadores
      metricasDia.contadorClasses = metricaUsuario.ContadorClassesProduto ?
        Object.fromEntries(metricaUsuario.ContadorClassesProduto) : {};
      metricasDia.contadorLocais = metricaUsuario.ContadorLocais ?
        Object.fromEntries(metricaUsuario.ContadorLocais) : {};

      // Totais
      metricasDia.totais = {
        totalItens: metricaUsuario.totais?.totalItens || 0,
        itensLidos: metricaUsuario.totais?.itensLidos || 0,
        itensAtualizados: metricaUsuario.totais?.itensAtualizados || 0,
        percentualConclusaoGeral: metricaUsuario.totais?.percentualConclusaoGeral || 0,
        pontuacaoTotal: metricaUsuario.totais?.pontuacaoTotal || 0,
      };

      // Contadores de auditorias
      metricasDia.contadoresAuditorias = {
        totalEtiquetas: metricaUsuario.contadoresAuditorias?.totalEtiquetas || 0,
        totalRupturas: metricaUsuario.contadoresAuditorias?.totalRupturas || 0,
        totalPresencas: metricaUsuario.contadoresAuditorias?.totalPresencas || 0,
        totalGeral: metricaUsuario.contadoresAuditorias?.totalGeral || 0,
      };

      // Ranking
      metricasDia.ranking = {
        posicaoLoja: metricaUsuario.ranking?.posicaoLoja || 0,
        posicaoGeral: metricaUsuario.ranking?.posicaoGeral || 0,
        pontosPorItem: metricaUsuario.ranking?.pontosPorItem || 0,
      };

      // Tendências
      metricasDia.tendencias = {
        diasAtivos: metricaUsuario.tendencias?.diasAtivos || 0,
        mediaItensPerDia: metricaUsuario.tendencias?.mediaItensPerDia || 0,
        melhoriaPercentual: metricaUsuario.tendencias?.melhoriaPercentual || 0,
      };

      metricasDia.ultimaAtualizacao = new Date();
      userDailyMetrics.ultimaAtualizacao = new Date();

      // Salvar no MongoDB (IGUAL ao User.js)
      await userDailyMetrics.save();

      console.log(`✅ UserDailyMetrics atualizado para usuário: ${metricaUsuario.usuarioNome} (${metricaUsuario.usuarioId})`);
    } catch (error) {
      console.error(`❌ Erro ao atualizar UserDailyMetrics para usuário ${metricaUsuario.usuarioNome}:`, error.message);
    }
  }

  console.log(`✅ Processamento UserDailyMetrics concluído para ${metricasUsuarios.length} usuários`);
}

export default router;
