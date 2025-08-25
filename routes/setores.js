import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import mongoose from "mongoose";
import DadosPlanilha from "../models/DadosPlanilha.js";
import Setor from "../models/Setor.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Rota para upload de planilha específica para setores
router.post("/upload-setores", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: "Nenhum arquivo enviado." });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    // Limpar dados antigos
    await Setor.deleteMany({});

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
        ultimaCompra: compraKey
          ? String(item[compraKey] || new Date().toLocaleDateString("pt-BR"))
          : new Date().toLocaleDateString("pt-BR"),
        dataAuditoria: new Date(),
      };

      dadosProcessados.push(setorData);
    }

    // Salvar todos os dados de uma vez
    await Setor.insertMany(dadosProcessados);

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
    const dados = await Setor.find({}).lean();

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
    const estatisticas = await Setor.aggregate([
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
// routes/setores.js - ADICIONE ESTA ROTA NO FINAL DO ARQUIVO

// Rota SIMPLES para buscar dados da planilha (usa dados crus)
router.get("/dados-simples", async (req, res) => {
  try {
    console.log("Buscando dados simples da planilha...");
    // Buscar diretamente da coleção DadosPlanilha
    const dados = await DadosPlanilha.find({}).lean();
    console.log("Dados encontrados:", dados.length);
    if (!dados || dados.length === 0) {
      return res.status(404).json({ erro: "Nenhum dado encontrado" });
    }
    // Transformar para o formato esperado pelo frontend
    const dadosFormatados = dados.map((item) => {
      // Log para debug - veja a estrutura real
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
