import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import User from "../models/User.js";
import Planilha from "../models/Planilha.js";
import Setor from "../models/Setor.js";
import Ruptura from "../models/Ruptura.js";
import Presenca from "../models/Presenca.js";
import { processarParaAuditoria } from "../services/processador-auditoria.js";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

// Função para processar valor de estoque
function processarValorEstoque(valor) {
  if (!valor) return "0";
  if (typeof valor === "number") return valor.toString();

  const valorString = valor.toString().trim();
  let valorLimpo = valorString.replace(/[^\d,.-]/g, "");
  valorLimpo = valorLimpo.replace(",", ".");

  return valorLimpo || "0";
}

// Função para processar data brasileira (DD/MM/AAAA)
function processarDataBrasileira(dataString) {
  if (!dataString) return new Date();

  try {
    const partes = dataString.toString().split("/");
    if (partes.length === 3) {
      return new Date(partes[2], partes[1] - 1, partes[0]);
    }
    return new Date(dataString);
  } catch (error) {
    return new Date();
  }
}

// Função para processar ruptura
async function processarRuptura(file, dataAuditoria) {
  try {
   const workbook = xlsx.readFile(req.file.path, { cellDates: true });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];


    const dadosProcessados = jsonData.map((item) => {
      // Encontrar chaves dinamicamente (case insensitive)
      const findKey = (patterns) => {
        return Object.keys(item).find((key) =>
          patterns.some(
            (pattern) =>
              key && key.toLowerCase().includes(pattern.toLowerCase())
          )
        );
      };

      return {
        codigo: item[findKey(["código", "codigo"])] || "",
        produto: item[findKey(["produto"])] || "",
        classeProdutoRaiz:
          item[findKey(["classe de produto raiz", "classe produto raiz"])] ||
          "",
        classeProduto:
          item[findKey(["classe de produto", "classe produto"])] || "",
        setor: item[findKey(["setor"])] || "",
        local: item[findKey(["local"])] || "Não especificado",
        usuario:
          item[findKey(["usuário", "usuario"])] || "Usuário não identificado",
        situacao: item[findKey(["situação", "situacao"])] || "Não lido",
        situacaoAuditoria:
          item[
            findKey(["situação atual da auditoria", "situacao atual auditoria"])
          ] || "",
        auditadoEm: processarDataBrasileira(item[findKey(["auditado em"])]),
        estoqueAtual: processarValorEstoque(item[findKey(["estoque atual"])]),
        presencaConfirmada:
          item[findKey(["presença confirmada", "presenca confirmada"])] || "",
        diasSemVenda: parseInt(item[findKey(["dias sem venda"])]) || 0,
        custoRuptura: parseFloat(item[findKey(["custo ruptura"])]) || 0,
        dataAuditoria: dataAuditoria,
        tipo: "ruptura",
      };
    });

    // Limpar dados antigos da mesma data
    await Ruptura.deleteMany({
      dataAuditoria: {
        $gte: new Date(dataAuditoria.setHours(0, 0, 0, 0)),
        $lte: new Date(dataAuditoria.setHours(23, 59, 59, 999)),
      },
    });

    if (dadosProcessados.length > 0) {
      await Ruptura.insertMany(dadosProcessados);
    }

    return {
      success: true,
      totalItens: dadosProcessados.length,
      tipo: "ruptura",
    };
  } catch (error) {
    console.error("Erro ao processar ruptura:", error);
    return { success: false, error: error.message };
  }
}

// Função para processar presença
async function processarPresenca(file, dataAuditoria) {
  try {
    const workbook = xlsx.readFile(req.file.path, { cellDates: true });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

    const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: false });

    const dadosProcessados = jsonData.map((item) => {
      const findKey = (patterns) => {
        return Object.keys(item).find((key) =>
          patterns.some(
            (pattern) =>
              key && key.toLowerCase().includes(pattern.toLowerCase())
          )
        );
      };

      return {
        codigo: item[findKey(["código", "codigo"])] || "",
        produto: item[findKey(["produto"])] || "",
        local: item[findKey(["local"])] || "Não especificado",
        usuario:
          item[findKey(["usuário", "usuario"])] || "Usuário não identificado",
        situacao: item[findKey(["situação", "situacao"])] || "Não lido",
        auditadoEm: processarDataBrasileira(item[findKey(["auditado em"])]),
        estoque: processarValorEstoque(item[findKey(["estoque"])]),
        presenca:
          item[findKey(["presença", "presenca"])] === "Sim" ||
          item[findKey(["presença", "presenca"])] === true,
        dataAuditoria: dataAuditoria,
        tipo: "presenca",
      };
    });

    await Presenca.deleteMany({
      dataAuditoria: {
        $gte: new Date(dataAuditoria.setHours(0, 0, 0, 0)),
        $lte: new Date(dataAuditoria.setHours(23, 59, 59, 999)),
      },
    });

    if (dadosProcessados.length > 0) {
      await Presenca.insertMany(dadosProcessados);
    }

    return {
      success: true,
      totalItens: dadosProcessados.length,
      tipo: "presenca",
    };
  } catch (error) {
    console.error("Erro ao processar presença:", error);
    return { success: false, error: error.message };
  }
}

// Função para processar etiqueta (mantida igual para compatibilidade)
async function processarEtiqueta(file, dataAuditoria) {
  const workbook = xlsx.readFile(file.path, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: false });

  const setoresBatch = [];
  const usuariosMap = new Map();
  let totalItensProcessados = 0;

  for (const item of jsonData) {
  const usuarioKey = Object.keys(item).find(
    (key) => key.toLowerCase().includes("usuário") || key.toLowerCase().includes("usuario")
  );
  const situacaoKey = Object.keys(item).find(
    (key) => key.toLowerCase().includes("situação") || key.toLowerCase().includes("situacao")
  );
  const localKey = Object.keys(item).find((key) => key.toLowerCase().includes("local"));
  const produtoKey = Object.keys(item).find((key) => key.toLowerCase().includes("produto"));
  const codigoKey = Object.keys(item).find(
    (key) => key.toLowerCase().includes("código") || key.toLowerCase().includes("codigo")
  );
  const estoqueKey = Object.keys(item).find((key) => key.toLowerCase().includes("estoque"));
  const compraKey = Object.keys(item).find((key) => key.toLowerCase().includes("compra"));

  const usuarioStr = usuarioKey ? String(item[usuarioKey]) : "Produto não auditado";

  setoresBatch.push({
    codigo: codigoKey ? String(item[codigoKey] || "") : "",
    produto: produtoKey ? String(item[produtoKey] || "") : "",
    local: localKey ? String(item[localKey] || "Não especificado") : "Não especificado",
    usuario: usuarioStr,
    situacao: situacaoKey ? String(item[situacaoKey] || "Não lido") : "Não lido",
    estoque: estoqueKey ? String(item[estoqueKey] || "0") : "0",
    ultimaCompra: compraKey
      ? String(item[compraKey] || new Date().toLocaleDateString("pt-BR"))
      : new Date().toLocaleDateString("pt-BR"),
    dataAuditoria,
    });
  }

  await Setor.deleteMany({
    dataAuditoria: { $gte: new Date(dataAuditoria.setHours(0, 0, 0, 0)) },
  });

  if (setoresBatch.length > 0) {
    await Setor.insertMany(setoresBatch);
  }

  for (const [usuarioStr, itens] of usuariosMap.entries()) {
    const match = usuarioStr.match(/^(\d+)\s*\((.*)\)$/);
    const id = match ? match[1].trim() : usuarioStr;
    const nome = match ? match[2].trim() : usuarioStr;

    let usuario =
      (await User.findOne({ nome })) ||
      new User({ id, nome, contadorTotal: 0 });

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
        auditoriaIndex === -1 ? usuario.auditorias.length - 1 : auditoriaIndex
      ];
    auditoria.detalhes = [];
    auditoria.contador = 0;

    for (const item of itens) {
      const situacaoKey = Object.keys(item).find(
        (key) =>
          key.toLowerCase().includes("situação") ||
          key.toLowerCase().includes("situacao")
      );

      const detalhe = {
        codigo: item.Código || item.Codigo || "",
        produto: item.Produto || "",
        local: item.Local || "",
        situacao: situacaoKey ? item[situacaoKey] : "",
        estoque: processarValorEstoque(item["Estoque atual"]),
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
  }

  const totalItensLidos = jsonData.filter(
    (item) => item.Situação === "Atualizado" || item.Situacao === "Atualizado"
  ).length;

  await Planilha.findOneAndUpdate(
    { dataAuditoria },
    {
      nomeArquivo: file.originalname,
      dataAuditoria,
      totalItens: jsonData.length,
      totalItensLidos,
      usuariosEnvolvidos: Array.from(usuariosMap.keys()),
      dataUpload: new Date(),
    },
    { upsert: true, new: true }
  );

  return {
    success: true,
    totalItens: jsonData.length,
    totalProcessados: totalItensProcessados,
    totalUsuarios: usuariosMap.size,
    tipo: "etiqueta",
  };
}

// Rota principal de upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: "Nenhum arquivo enviado." });
    }

    const { tipoAuditoria = "etiqueta" } = req.body;
    const dataAuditoria = new Date();

    let resultado;

    switch (tipoAuditoria) {
      case "ruptura":
        resultado = await processarRuptura(req.file, dataAuditoria);
        break;
      case "presenca":
        resultado = await processarPresenca(req.file, dataAuditoria);
        break;
      case "etiqueta":
      default:
        resultado = await processarEtiqueta(req.file, dataAuditoria);
        break;
    }

    if (!resultado.success) {
      return res.status(500).json({
        erro: "Falha no processamento",
        detalhes: resultado.error,
      });
    }

    // Processamento secundário para auditoria (mantido para compatibilidade)
    if (tipoAuditoria === "etiqueta") {
       const workbook = xlsx.readFile(req.file.path, { cellDates: true });

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

      const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: false });

      processarParaAuditoria({
        jsonData,
        nomeArquivo: req.file.originalname,
        dataAuditoria,
      }).then((resultadoSecundario) => {
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
      });
    }

    res.json({
      mensagem: `Planilha de ${tipoAuditoria} processada com sucesso!`,
      totalItens: resultado.totalItens,
      totalProcessados: resultado.totalProcessados || resultado.totalItens,
      totalUsuarios: resultado.totalUsuarios || 0,
      tipo: tipoAuditoria,
    });
  } catch (error) {
    console.error("Erro:", error);
    res.status(500).json({
      erro: "Falha no processamento",
      detalhes: error.message,
    });
  }
});

// Rotas para frontend (mantidas iguais para compatibilidade)
router.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await User.find({});
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
      }))
    );
  } catch (error) {
    res.status(500).json({ erro: "Falha ao buscar usuários" });
  }
});

router.get("/datas-auditoria", async (req, res) => {
  try {
    const datas = await Planilha.distinct("dataAuditoria");
    res.json(datas.sort((a, b) => new Date(b) - new Date(a)));
  } catch (error) {
    res.status(500).json({ erro: "Falha ao buscar datas" });
  }
});

router.get("/dados-planilha", async (req, res) => {
  try {
    const planilhaRecente = await Planilha.findOne().sort({ dataUpload: -1 });

    if (!planilhaRecente) {
      return res.status(404).json({ erro: "Nenhuma planilha encontrada" });
    }

    const usuarios = await User.find({
      "auditorias.data": planilhaRecente.dataAuditoria,
    });

    const dadosPlanilha = [];

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
            });
          });
        }
      });
    });

    res.json(dadosPlanilha);
  } catch (error) {
    console.error("Erro ao buscar dados da planilha:", error);
    res.status(500).json({
      erro: "Falha ao buscar dados",
      detalhes: error.message,
    });
  }
});

export default router;
