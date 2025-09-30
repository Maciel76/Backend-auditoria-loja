import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import mongoose from "mongoose";
import Planilha from "../models/Planilha.js";
import Auditoria from "../models/Auditoria.js";
import { verificarLojaObrigatoria } from "../middleware/loja.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Rota para upload de planilha específica para setores
router.post("/upload-setores", verificarLojaObrigatoria, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: "Nenhum arquivo enviado." });
    }

    // Forçar leitura de datas como datas reais
    const workbook = xlsx.readFile(req.file.path, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Converter para JSON mas formatando as datas automaticamente
    const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: false });

    // Limpar dados antigos
    await Auditoria.deleteMany({});

    const dadosProcessados = [];

    for (const item of jsonData) {
      // Encontrar chaves dinamicamente (case insensitive)
      const usuarioKey = Object.keys(item).find(
        (key) =>
          key &&
          (key.toLowerCase().includes("usuário") ||
            key.toLowerCase().includes("usuario"))
      );

      const situacaoKey = Object.keys(item).find(
        (key) =>
          key &&
          (key.toLowerCase().includes("situação") ||
            key.toLowerCase().includes("situacao"))
      );

      const localKey = Object.keys(item).find(
        (key) => key && key.toLowerCase().includes("local")
      );

      const produtoKey = Object.keys(item).find(
        (key) => key && key.toLowerCase().includes("produto")
      );

      const codigoKey = Object.keys(item).find(
        (key) =>
          key &&
          (key.toLowerCase().includes("código") ||
            key.toLowerCase().includes("codigo"))
      );

      const estoqueKey = Object.keys(item).find(
        (key) => key && key.toLowerCase().includes("estoque")
      );

      const compraKey = Object.keys(item).find(
        (key) => key && key.toLowerCase().includes("compra")
      );

      // --- Agora jsonData já traz a data formatada como string dd/mm/yyyy ---
      let ultimaCompra = "";
      if (compraKey && item[compraKey] != null) {
        ultimaCompra = String(item[compraKey]);
      } else {
        ultimaCompra = new Date().toLocaleDateString("pt-BR");
      }

      const setorData = {
        codigo: codigoKey ? String(item[codigoKey] || "") : "",
        produto: produtoKey ? String(item[produtoKey] || "") : "",
        local: localKey
          ? String(item[localKey] || "Não especificado")
          : "Não especificado",
        usuario: usuarioKey
          ? String(item[usuarioKey] || "Usuário não identificado")
          : "Usuário não identificado",
        situacao: situacaoKey
          ? String(item[situacaoKey] || "Não lido")
          : "Não lido",
        estoque: estoqueKey ? String(item[estoqueKey] || "0") : "0",
        ultimaCompra,
        dataAuditoria: new Date(),
      };

      dadosProcessados.push(setorData);
    }

    // Salvar todos os dados de uma vez
    await Auditoria.insertMany(dadosProcessados);

    res.json({
      mensagem: "Dados de setores processados com sucesso!",
      totalItens: dadosProcessados.length,
      totalSalvos: dadosProcessados.length,
    });
  } catch (error) {
    console.error("Erro no processamento:", error);
    res
      .status(500)
      .json({ erro: "Falha no processamento", detalhes: error.message });
  }
});

// Rota para obter dados de setores
router.get("/dados-setores", async (req, res) => {
  try {
    const dados = await Auditoria.find({}).lean();

    // Converter para o formato que o frontend espera
    const dadosFormatados = dados.map((item) => ({
      Código: item.codigo,
      Produto: item.produto,
      Local: item.local,
      Usuario: item.usuario,
      Situacao: item.situacao,
      "Estoque atual": item.estoque,
      "Última compra": item.ultimaCompra,
    }));

    res.json(dadosFormatados);
  } catch (error) {
    console.error("Erro ao buscar dados:", error);
    res
      .status(500)
      .json({ erro: "Falha ao buscar dados", detalhes: error.message });
  }
});

// Rota para estatísticas dos setores
router.get("/estatisticas-setores", async (req, res) => {
  try {
    const estatisticas = await Auditoria.aggregate([
      {
        $group: {
          _id: "$local",
          totalItens: { $sum: 1 },
          itensLidos: {
            $sum: { $cond: [{ $eq: ["$situacao", "Atualizado"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          local: "$_id",
          totalItens: 1,
          itensLidos: 1,
          percentualLidos: {
            $round: [
              { $multiply: [{ $divide: ["$itensLidos", "$totalItens"] }, 100] },
              2,
            ],
          },
        },
      },
      { $sort: { local: 1 } },
    ]);

    res.json(estatisticas);
  } catch (error) {
    console.error("Erro ao calcular estatísticas:", error);
    res.status(500).json({
      erro: "Falha ao calcular estatísticas",
      detalhes: error.message,
    });
  }
});

// Rota SIMPLES para buscar dados da planilha (usa dados crus)
router.get("/dados-simples", async (req, res) => {
  try {
    console.log("Buscando dados simples da planilha...");
    // Buscar diretamente da coleção Planilha
    const dados = await Planilha.find({}).lean();
    console.log("Dados encontrados:", dados.length);
    if (!dados || dados.length === 0) {
      return res.status(404).json({ erro: "Nenhum dado encontrado" });
    }
    // Transformar para o formato esperado pelo frontend
    const dadosFormatados = dados.map((item) => {
      console.log("Item keys:", Object.keys(item));
      return {
        Código: item.Código || item.Codigo || "",
        Produto: item.Produto || "",
        Local: item.Local || "Não especificado",
        Usuario: item.Usuário || item.Usuario || "Usuário não identificado",
        Situacao: item.Situação || item.Situacao || "Não lido",
        "Estoque atual": item["Estoque atual"] || item.Estoque || "0",
        "Última compra":
          item["Última compra"] || new Date().toLocaleDateString("pt-BR"),
      };
    });
    res.json(dadosFormatados);
  } catch (error) {
    console.error("Erro ao buscar dados simples:", error);
    res
      .status(500)
      .json({ erro: "Falha ao buscar dados", detalhes: error.message });
  }
});

export default router;
