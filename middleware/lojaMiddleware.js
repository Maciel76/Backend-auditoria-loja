// routes/upload.js - VERSÃO MELHORADA
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

const upload = multer({ dest: "uploads/" });
const router = express.Router();

// Função auxiliar para limpeza de arquivos temporários
function limparArquivoTemporario(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🗑️ Arquivo temporário removido: ${filePath}`);
    }
  } catch (error) {
    console.error(`⚠️ Erro ao remover arquivo temporário: ${error.message}`);
  }
}

// Função para validar estrutura da planilha
function validarEstruturaPlanilha(jsonData) {
  if (!jsonData || jsonData.length === 0) {
    throw new Error("Planilha está vazia ou não pôde ser lida");
  }

  const primeiraLinha = jsonData[0] || {};
  const todasChaves = Object.keys(primeiraLinha);

  if (todasChaves.length === 0) {
    throw new Error("Nenhuma coluna encontrada na planilha");
  }

  return todasChaves;
}

// Função para processar etiqueta - VERSÃO MELHORADA
async function processarEtiqueta(file, dataAuditoria, loja) {
  let workbook = null;

  try {
    console.log(
      `🏷️ Processando etiquetas para loja: ${loja.codigo} - ${loja.nome}`
    );

    // Validar se o arquivo existe
    if (!fs.existsSync(file.path)) {
      throw new Error("Arquivo temporário não encontrado");
    }

    workbook = xlsx.readFile(file.path, {
      cellDates: true,
      cellNF: false,
      cellHTML: false,
    });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error("Planilha não contém abas válidas");
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet, {
      raw: false,
      defval: "", // Valor padrão para células vazias
    });

    // Validar estrutura
    const todasChaves = validarEstruturaPlanilha(jsonData);

    const setoresBatch = [];
    const usuariosMap = new Map();
    let totalItensProcessados = 0;
    let errosProcessamento = [];

    // Encontrar chaves das colunas - Busca mais flexível
    const usuarioKey = todasChaves.find((key) => {
      const keyLower = key.toLowerCase();
      return (
        keyLower.includes("usuário") ||
        keyLower.includes("usuario") ||
        keyLower.includes("user")
      );
    });

    const situacaoKey = todasChaves.find((key) => {
      const keyLower = key.toLowerCase();
      return (
        keyLower.includes("situação") ||
        keyLower.includes("situacao") ||
        keyLower.includes("status") ||
        keyLower.includes("estado")
      );
    });

    const localKey = todasChaves.find((key) => {
      const keyLower = key.toLowerCase();
      return (
        keyLower.includes("local") ||
        keyLower.includes("setor") ||
        keyLower.includes("área") ||
        keyLower.includes("area")
      );
    });

    const produtoKey = todasChaves.find((key) => {
      const keyLower = key.toLowerCase();
      return (
        keyLower.includes("produto") ||
        keyLower.includes("item") ||
        keyLower.includes("descrição") ||
        keyLower.includes("descricao")
      );
    });

    const codigoKey = todasChaves.find((key) => {
      const keyLower = key.toLowerCase();
      return (
        keyLower.includes("código") ||
        keyLower.includes("codigo") ||
        keyLower.includes("cod") ||
        keyLower.includes("ean") ||
        keyLower.includes("barcode")
      );
    });

    const estoqueKey = todasChaves.find((key) => {
      const keyLower = key.toLowerCase();
      return (
        keyLower.includes("estoque") ||
        keyLower.includes("quantidade") ||
        keyLower.includes("qtd") ||
        keyLower.includes("saldo")
      );
    });

    const compraKey = todasChaves.find((key) => {
      const keyLower = key.toLowerCase();
      return (
        keyLower.includes("compra") ||
        keyLower.includes("última") ||
        keyLower.includes("ultima") ||
        keyLower.includes("data")
      );
    });

    console.log(`📋 Colunas identificadas:`, {
      usuario: usuarioKey,
      situacao: situacaoKey,
      local: localKey,
      produto: produtoKey,
      codigo: codigoKey,
      estoque: estoqueKey,
      compra: compraKey,
    });

    // Processar cada item da planilha com validação
    for (let index = 0; index < jsonData.length; index++) {
      const item = jsonData[index];

      try {
        // Validações básicas
        const codigo = codigoKey ? String(item[codigoKey] || "").trim() : "";
        const produto = produtoKey ? String(item[produtoKey] || "").trim() : "";

        // Pular linha se não tiver código nem produto
        if (!codigo && !produto) {
          console.log(`⚠️ Linha ${index + 1} pulada: sem código nem produto`);
          continue;
        }

        const usuarioStr = usuarioKey
          ? String(item[usuarioKey] || "Produto não auditado").trim()
          : "Produto não auditado";

        // Adicionar ao batch de setores - COM LOJA OBRIGATÓRIA
        const setorItem = {
          codigo,
          produto,
          local: localKey
            ? String(item[localKey] || "Não especificado").trim()
            : "Não especificado",
          usuario: usuarioStr,
          situacao: situacaoKey
            ? String(item[situacaoKey] || "Não lido").trim()
            : "Não lido",
          estoque: estoqueKey ? String(item[estoqueKey] || "0").trim() : "0",
          ultimaCompra: compraKey
            ? String(
                item[compraKey] || new Date().toLocaleDateString("pt-BR")
              ).trim()
            : new Date().toLocaleDateString("pt-BR"),
          dataAuditoria,
          loja: loja._id,
          linhaOriginal: index + 1, // Para rastreamento
        };

        setoresBatch.push(setorItem);

        // Mapear usuários (apenas se não for "Produto não auditado")
        if (usuarioStr && usuarioStr !== "Produto não auditado") {
          if (!usuariosMap.has(usuarioStr)) {
            usuariosMap.set(usuarioStr, []);
          }
          usuariosMap
            .get(usuarioStr)
            .push({ ...item, _linhaOriginal: index + 1 });
          totalItensProcessados++;
        }
      } catch (itemError) {
        errosProcessamento.push({
          linha: index + 1,
          erro: itemError.message,
          item: item,
        });
        console.error(`❌ Erro na linha ${index + 1}:`, itemError.message);
      }
    }

    // Log de erros se houver
    if (errosProcessamento.length > 0) {
      console.log(
        `⚠️ ${errosProcessamento.length} erros durante o processamento:`,
        errosProcessamento
      );
    }

    // Limpar dados antigos APENAS DESTA LOJA para esta data
    const inicioDia = new Date(dataAuditoria);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataAuditoria);
    fimDia.setHours(23, 59, 59, 999);

    const dadosRemovidos = await Setor.deleteMany({
      dataAuditoria: { $gte: inicioDia, $lte: fimDia },
      loja: loja._id,
    });

    console.log(
      `🗑️ ${
        dadosRemovidos.deletedCount
      } registros antigos removidos para loja ${
        loja.codigo
      } na data ${dataAuditoria.toLocaleDateString()}`
    );

    // Salvar setores em lotes para melhor performance
    let setoresSalvos = 0;
    if (setoresBatch.length > 0) {
      const batchSize = 1000; // Processar em lotes de 1000

      for (let i = 0; i < setoresBatch.length; i += batchSize) {
        const lote = setoresBatch.slice(i, i + batchSize);
        await Setor.insertMany(lote, { ordered: false }); // Continue mesmo se houver erro em um item
        setoresSalvos += lote.length;
        console.log(
          `💾 Lote ${Math.floor(i / batchSize) + 1}: ${
            lote.length
          } setores salvos`
        );
      }

      console.log(
        `✅ Total: ${setoresSalvos} setores salvos para loja ${loja.codigo}`
      );
    }

    // Processar usuários com melhor tratamento de erros
    let usuariosProcessados = 0;
    for (const [usuarioStr, itens] of usuariosMap.entries()) {
      try {
        const match = usuarioStr.match(/^(\d+)\s*\((.*)\)$/);
        const id = match ? match[1].trim() : usuarioStr.substring(0, 50); // Limitar tamanho do ID
        const nome = match ? match[2].trim() : usuarioStr;

        // Buscar usuário existente
        let usuario = await User.findOne({
          $or: [{ id }, { nome }],
          loja: loja._id,
        });

        if (!usuario) {
          usuario = new User({
            id,
            nome,
            contadorTotal: 0,
            auditorias: [],
            loja: loja._id,
          });
        }

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
            codigo: codigoKey ? String(item[codigoKey] || "").trim() : "",
            produto: produtoKey ? String(item[produtoKey] || "").trim() : "",
            local: localKey ? String(item[localKey] || "").trim() : "",
            situacao: situacaoKey ? String(item[situacaoKey] || "").trim() : "",
            estoque: estoqueKey ? String(item[estoqueKey] || "0").trim() : "0",
            tipoAuditoria: "etiqueta",
            loja: loja._id,
            linhaOriginal: item._linhaOriginal,
          };

          auditoria.detalhes.push(detalhe);

          // Contar apenas itens "Atualizado" (case-insensitive)
          if (detalhe.situacao.toLowerCase() === "atualizado") {
            auditoria.contador++;
          }
        }

        // Atualizar contador total
        usuario.contadorTotal = usuario.auditorias.reduce(
          (total, aud) => total + aud.contador,
          0
        );

        await usuario.save();
        usuariosProcessados++;
        console.log(
          `👤 Usuário processado: ${nome} (${auditoria.contador} itens atualizados de ${itens.length} total)`
        );
      } catch (userError) {
        console.error(`❌ Erro ao processar usuário ${usuarioStr}:`, userError);
        errosProcessamento.push({
          usuario: usuarioStr,
          erro: userError.message,
        });
      }
    }

    // Calcular total de itens lidos (case-insensitive)
    const totalItensLidos = jsonData.filter(
      (item) =>
        situacaoKey &&
        String(item[situacaoKey] || "").toLowerCase() === "atualizado"
    ).length;

    // Salvar informações da planilha - COM LOJA
    const planilhaSalva = await Planilha.findOneAndUpdate(
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
          errosProcessamento: errosProcessamento.length,
          usuariosProcessados,
          setoresSalvos,
          colunasIdentificadas: {
            usuario: usuarioKey,
            situacao: situacaoKey,
            local: localKey,
            produto: produtoKey,
            codigo: codigoKey,
            estoque: estoqueKey,
            compra: compraKey,
          },
        },
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Planilha processada com sucesso para loja ${loja.codigo}`);

    return {
      success: true,
      totalItens: jsonData.length,
      totalProcessados: totalItensProcessados,
      totalUsuarios: usuariosMap.size,
      totalItensLidos,
      usuariosProcessados,
      setoresSalvos,
      errosProcessamento: errosProcessamento.length,
      tipo: "etiqueta",
      loja: loja,
      planilhaId: planilhaSalva._id,
    };
  } catch (error) {
    console.error("❌ Erro ao processar etiqueta:", error);
    return {
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    };
  } finally {
    // Limpar arquivo temporário
    if (file && file.path) {
      limparArquivoTemporario(file.path);
    }
  }
}

// Rota principal de upload - COM VALIDAÇÕES MELHORADAS
router.post(
  "/upload",
  verificarLojaObrigatoria,
  upload.single("file"),
  async (req, res) => {
    try {
      // Validações de entrada
      if (!req.file) {
        return res.status(400).json({
          erro: "Nenhum arquivo enviado.",
          codigo: "FILE_MISSING",
        });
      }

      // Validar tipo de arquivo
      const extensoesPermitidas = [".xlsx", ".xls", ".csv"];
      const extensaoArquivo = path.extname(req.file.originalname).toLowerCase();

      if (!extensoesPermitidas.includes(extensaoArquivo)) {
        limparArquivoTemporario(req.file.path);
        return res.status(400).json({
          erro: `Tipo de arquivo não permitido. Use: ${extensoesPermitidas.join(
            ", "
          )}`,
          codigo: "INVALID_FILE_TYPE",
        });
      }

      // Validar tamanho do arquivo (máximo 50MB)
      const tamanhoMaximo = 50 * 1024 * 1024; // 50MB
      if (req.file.size > tamanhoMaximo) {
        limparArquivoTemporario(req.file.path);
        return res.status(400).json({
          erro: "Arquivo muito grande. Máximo permitido: 50MB",
          codigo: "FILE_TOO_LARGE",
        });
      }

      const { tipoAuditoria = "etiqueta" } = req.body;
      const dataAuditoria = new Date();
      const loja = req.loja;

      console.log(
        `📤 Iniciando upload de ${tipoAuditoria} para loja ${loja.codigo} (${req.file.originalname})`
      );

      let resultado;

      switch (tipoAuditoria.toLowerCase()) {
        case "etiqueta":
          resultado = await processarEtiqueta(req.file, dataAuditoria, loja);
          break;
        case "ruptura":
          limparArquivoTemporario(req.file.path);
          return res.status(501).json({
            erro: "Tipo ruptura ainda não implementado nesta versão",
            codigo: "NOT_IMPLEMENTED",
          });
        case "presenca":
          limparArquivoTemporario(req.file.path);
          return res.status(501).json({
            erro: "Tipo presença ainda não implementado nesta versão",
            codigo: "NOT_IMPLEMENTED",
          });
        default:
          limparArquivoTemporario(req.file.path);
          return res.status(400).json({
            erro: "Tipo de auditoria inválido. Use: etiqueta, ruptura ou presenca",
            codigo: "INVALID_AUDIT_TYPE",
          });
      }

      if (!resultado.success) {
        return res.status(500).json({
          erro: "Falha no processamento",
          detalhes: resultado.error,
          codigo: "PROCESSING_ERROR",
          stack: resultado.stack,
        });
      }

      // Processamento secundário para auditoria (não bloquear resposta)
      if (tipoAuditoria === "etiqueta") {
        try {
          const workbook = xlsx.readFile(req.file.path, { cellDates: true });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: false });

          // Processar em background
          setImmediate(() => {
            processarParaAuditoria({
              jsonData,
              nomeArquivo: req.file.originalname,
              dataAuditoria,
              loja: loja._id,
            })
              .then((resultadoSecundario) => {
                if (resultadoSecundario.success) {
                  console.log(
                    "✅ Dados processados para Auditoria:",
                    resultadoSecundario.totalProcessados
                  );
                } else {
                  console.log(
                    "⚠️ Processamento secundário falhou:",
                    resultadoSecundario.error
                  );
                }
              })
              .catch((error) => {
                console.error("❌ Erro no processamento secundário:", error);
              });
          });
        } catch (secondaryError) {
          console.error("⚠️ Erro no processamento secundário:", secondaryError);
        }
      }

      // Resposta de sucesso melhorada
      const resposta = {
        mensagem: `Planilha de ${tipoAuditoria} processada com sucesso!`,
        dados: {
          totalItens: resultado.totalItens,
          totalProcessados: resultado.totalProcessados || resultado.totalItens,
          totalUsuarios: resultado.totalUsuarios || 0,
          totalItensLidos: resultado.totalItensLidos || 0,
          usuariosProcessados: resultado.usuariosProcessados || 0,
          setoresSalvos: resultado.setoresSalvos || 0,
          errosProcessamento: resultado.errosProcessamento || 0,
        },
        arquivo: {
          nome: req.file.originalname,
          tamanho: req.file.size,
          tipo: tipoAuditoria,
        },
        loja: {
          codigo: loja.codigo,
          nome: loja.nome,
        },
        processamento: {
          dataHora: new Date().toLocaleString("pt-BR"),
          planilhaId: resultado.planilhaId,
          temErros: (resultado.errosProcessamento || 0) > 0,
        },
      };

      res.json(resposta);
    } catch (error) {
      console.error("❌ Erro no upload:", error);

      // Limpar arquivo em caso de erro
      if (req.file && req.file.path) {
        limparArquivoTemporario(req.file.path);
      }

      res.status(500).json({
        erro: "Falha no processamento",
        detalhes: error.message,
        codigo: "UNEXPECTED_ERROR",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
    }
  }
);

// Rotas para frontend - TODAS COM FILTRO DE LOJA E MELHORADAS

router.get("/usuarios", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;

    let filtro = { loja: req.loja._id };

    if (search) {
      filtro.$or = [
        { nome: { $regex: search, $options: "i" } },
        { id: { $regex: search, $options: "i" } },
      ];
    }

    const usuarios = await User.find(filtro)
      .sort({ contadorTotal: -1, nome: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(filtro);

    res.json({
      usuarios: usuarios.map((u) => ({
        id: u.id,
        nome: u.nome,
        contador: u.contadorTotal,
        iniciais: u.nome
          .split(" ")
          .map((n) => n[0])
          .join("")
          .substring(0, 2)
          .toUpperCase(),
        loja: req.loja.codigo,
        ultimaAuditoria:
          u.auditorias.length > 0
            ? u.auditorias[u.auditorias.length - 1].data
            : null,
        totalAuditorias: u.auditorias.length,
      })),
      paginacao: {
        paginaAtual: parseInt(page),
        totalPaginas: Math.ceil(total / limit),
        totalItens: total,
        itensPorPagina: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({
      erro: "Falha ao buscar usuários",
      detalhes: error.message,
    });
  }
});

router.get("/datas-auditoria", verificarLojaObrigatoria, async (req, res) => {
  try {
    const datas = await Planilha.distinct("dataAuditoria", {
      loja: req.loja._id,
    });

    const datasFormatadas = datas
      .sort((a, b) => new Date(b) - new Date(a))
      .map((data) => ({
        data: data,
        dataFormatada: new Date(data).toLocaleDateString("pt-BR"),
        timestamp: new Date(data).getTime(),
      }));

    res.json(datasFormatadas);
  } catch (error) {
    console.error("Erro ao buscar datas:", error);
    res.status(500).json({
      erro: "Falha ao buscar datas",
      detalhes: error.message,
    });
  }
});

router.get("/dados-planilha", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { dataAuditoria, page = 1, limit = 1000 } = req.query;

    let filtro = { loja: req.loja._id };

    if (dataAuditoria) {
      const dataEspecifica = new Date(dataAuditoria);
      const inicioDia = new Date(dataEspecifica);
      inicioDia.setHours(0, 0, 0, 0);
      const fimDia = new Date(dataEspecifica);
      fimDia.setHours(23, 59, 59, 999);

      filtro.dataAuditoria = { $gte: inicioDia, $lte: fimDia };
    }

    const planilhaRecente = await Planilha.findOne(filtro).sort({
      dataUpload: -1,
    });

    if (!planilhaRecente) {
      return res.status(404).json({
        erro: "Nenhuma planilha encontrada para esta loja",
        loja: req.loja.codigo,
        filtro: dataAuditoria ? `data: ${dataAuditoria}` : "todas as datas",
      });
    }

    // Buscar dados dos setores diretamente (mais eficiente)
    const setoresFiltro = {
      loja: req.loja._id,
      dataAuditoria: {
        $gte: new Date(planilhaRecente.dataAuditoria).setHours(0, 0, 0, 0),
        $lte: new Date(planilhaRecente.dataAuditoria).setHours(23, 59, 59, 999),
      },
    };

    const setores = await Setor.find(setoresFiltro)
      .sort({ codigo: 1, produto: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalSetores = await Setor.countDocuments(setoresFiltro);

    const dadosPlanilha = setores.map((setor) => ({
      Código: setor.codigo,
      Produto: setor.produto,
      Local: setor.local,
      Usuario: setor.usuario,
      Situacao: setor.situacao,
      "Estoque atual": setor.estoque,
      "Última compra": setor.ultimaCompra,
      Loja: req.loja.codigo,
      "Data Auditoria": setor.dataAuditoria.toLocaleDateString("pt-BR"),
    }));

    res.json({
      dados: dadosPlanilha,
      planilha: {
        nome: planilhaRecente.nomeArquivo,
        dataAuditoria: planilhaRecente.dataAuditoria,
        totalItens: planilhaRecente.totalItens,
        totalItensLidos: planilhaRecente.totalItensLidos,
        usuariosEnvolvidos: planilhaRecente.usuariosEnvolvidos?.length || 0,
      },
      paginacao: {
        paginaAtual: parseInt(page),
        totalPaginas: Math.ceil(totalSetores / parseInt(limit)),
        totalItens: totalSetores,
        itensPorPagina: parseInt(limit),
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

// Nova rota para estatísticas
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

    const [totalPlanilhas, totalUsuarios, totalSetores, planilhaRecente] =
      await Promise.all([
        Planilha.countDocuments(filtro),
        User.countDocuments({ loja: req.loja._id }),
        Setor.countDocuments(filtro),
        Planilha.findOne({ loja: req.loja._id }).sort({ dataUpload: -1 }),
      ]);

    res.json({
      estatisticas: {
        totalPlanilhas,
        totalUsuarios,
        totalSetores,
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

// Nova rota para detalhes de uma planilha específica
router.get("/planilha/:id", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { id } = req.params;

    const planilha = await Planilha.findOne({
      _id: id,
      loja: req.loja._id,
    });

    if (!planilha) {
      return res.status(404).json({
        erro: "Planilha não encontrada",
        codigo: "PLANILHA_NOT_FOUND",
      });
    }

    // Buscar usuários envolvidos nesta planilha
    const usuarios = await User.find({
      loja: req.loja._id,
      "auditorias.data": {
        $gte: new Date(planilha.dataAuditoria).setHours(0, 0, 0, 0),
        $lte: new Date(planilha.dataAuditoria).setHours(23, 59, 59, 999),
      },
    }).select("id nome auditorias");

    // Calcular estatísticas dos usuários para esta data
    const usuariosEstatisticas = usuarios
      .map((usuario) => {
        const auditoriaDoDia = usuario.auditorias.find(
          (aud) =>
            aud.data.toDateString() === planilha.dataAuditoria.toDateString()
        );

        return {
          id: usuario.id,
          nome: usuario.nome,
          itensAuditados: auditoriaDoDia?.detalhes.length || 0,
          itensAtualizados: auditoriaDoDia?.contador || 0,
          percentualAtualizacao: auditoriaDoDia?.detalhes.length
            ? Math.round(
                (auditoriaDoDia.contador / auditoriaDoDia.detalhes.length) * 100
              )
            : 0,
        };
      })
      .sort((a, b) => b.itensAtualizados - a.itensAtualizados);

    res.json({
      planilha: {
        id: planilha._id,
        nome: planilha.nomeArquivo,
        dataAuditoria: planilha.dataAuditoria,
        dataUpload: planilha.dataUpload,
        tipoAuditoria: planilha.tipoAuditoria,
        totalItens: planilha.totalItens,
        totalItensLidos: planilha.totalItensLidos,
        percentualLeitura: planilha.totalItens
          ? Math.round((planilha.totalItensLidos / planilha.totalItens) * 100)
          : 0,
        usuariosEnvolvidos: planilha.usuariosEnvolvidos || [],
        metadata: planilha.metadata,
      },
      usuarios: usuariosEstatisticas,
      resumo: {
        totalUsuarios: usuariosEstatisticas.length,
        totalItensAuditados: usuariosEstatisticas.reduce(
          (sum, u) => sum + u.itensAuditados,
          0
        ),
        totalItensAtualizados: usuariosEstatisticas.reduce(
          (sum, u) => sum + u.itensAtualizados,
          0
        ),
        usuarioMaisAtivo: usuariosEstatisticas[0] || null,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar detalhes da planilha:", error);
    res.status(500).json({
      erro: "Falha ao buscar detalhes da planilha",
      detalhes: error.message,
    });
  }
});

// Nova rota para ranking de usuários
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

      // Se há filtro de data, calcular apenas para o período
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

// Rota para limpeza de dados antigos (apenas para administradores)
router.delete("/limpeza", verificarLojaObrigatoria, async (req, res) => {
  try {
    const { diasRetencao = 90, confirmar = false } = req.body;

    if (!confirmar) {
      return res.status(400).json({
        erro: "Operação não confirmada",
        codigo: "CONFIRMATION_REQUIRED",
        mensagem:
          "Adicione 'confirmar: true' no body da requisição para confirmar a operação",
      });
    }

    const dataCorte = new Date();
    dataCorte.setDate(dataCorte.getDate() - parseInt(diasRetencao));

    // Contar registros que serão removidos
    const [setoresAntigos, planilhasAntigas] = await Promise.all([
      Setor.countDocuments({
        loja: req.loja._id,
        dataAuditoria: { $lt: dataCorte },
      }),
      Planilha.countDocuments({
        loja: req.loja._id,
        dataAuditoria: { $lt: dataCorte },
      }),
    ]);

    // Remover dados antigos
    const [resultadoSetores, resultadoPlanilhas] = await Promise.all([
      Setor.deleteMany({
        loja: req.loja._id,
        dataAuditoria: { $lt: dataCorte },
      }),
      Planilha.deleteMany({
        loja: req.loja._id,
        dataAuditoria: { $lt: dataCorte },
      }),
    ]);

    // Limpar auditorias antigas dos usuários
    const usuarios = await User.find({ loja: req.loja._id });
    let auditoriasRemovidasCount = 0;

    for (const usuario of usuarios) {
      const auditoriasAntigas = usuario.auditorias.filter(
        (aud) => aud.data < dataCorte
      );
      auditoriasRemovidasCount += auditoriasAntigas.length;

      usuario.auditorias = usuario.auditorias.filter(
        (aud) => aud.data >= dataCorte
      );

      // Recalcular contador total
      usuario.contadorTotal = usuario.auditorias.reduce(
        (total, aud) => total + aud.contador,
        0
      );

      await usuario.save();
    }

    console.log(`🧹 Limpeza realizada para loja ${req.loja.codigo}:`, {
      setoresRemovidos: resultadoSetores.deletedCount,
      planilhasRemovidas: resultadoPlanilhas.deletedCount,
      auditoriasRemovidas: auditoriasRemovidasCount,
      dataCorte: dataCorte.toLocaleDateString("pt-BR"),
    });

    res.json({
      mensagem: "Limpeza realizada com sucesso",
      resultados: {
        setoresRemovidos: resultadoSetores.deletedCount,
        planilhasRemovidas: resultadoPlanilhas.deletedCount,
        auditoriasRemovidas: auditoriasRemovidasCount,
        dataCorte: dataCorte.toLocaleDateString("pt-BR"),
        diasRetencao: parseInt(diasRetencao),
      },
      loja: {
        codigo: req.loja.codigo,
        nome: req.loja.nome,
      },
    });
  } catch (error) {
    console.error("Erro na limpeza:", error);
    res.status(500).json({
      erro: "Falha na limpeza",
      detalhes: error.message,
    });
  }
});

export default router;
