import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import User from "../models/User.js";
import Planilha from "../models/Planilha.js";
import Setor from "../models/Setor.js";

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

// Rota principal de upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: "Nenhum arquivo enviado." });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    const dataAuditoria = new Date();
    let totalItensProcessados = 0;
    const usuariosMap = new Map();

    // Processar cada item da planilha
    const setoresBatch = [];
    for (const item of jsonData) {
      const usuarioKey = Object.keys(item).find(
        (key) =>
          key.toLowerCase().includes("usuário") ||
          key.toLowerCase().includes("usuario")
      );

      if (usuarioKey && item[usuarioKey]) {
        const usuarioStr = item[usuarioKey].toString().trim();
        if (!usuariosMap.has(usuarioStr)) {
          usuariosMap.set(usuarioStr, []);
        }
        usuariosMap.get(usuarioStr).push(item);
        totalItensProcessados++;

        // Salvar também em Setor
        const situacaoKey = Object.keys(item).find(
          (key) =>
            key.toLowerCase().includes("situação") ||
            key.toLowerCase().includes("situacao")
        );
        const localKey = Object.keys(item).find((key) =>
          key.toLowerCase().includes("local")
        );
        const produtoKey = Object.keys(item).find((key) =>
          key.toLowerCase().includes("produto")
        );
        const codigoKey = Object.keys(item).find(
          (key) =>
            key.toLowerCase().includes("código") ||
            key.toLowerCase().includes("codigo")
        );
        const estoqueKey = Object.keys(item).find((key) =>
          key.toLowerCase().includes("estoque")
        );
        const compraKey = Object.keys(item).find((key) =>
          key.toLowerCase().includes("compra")
        );

        setoresBatch.push({
          codigo: codigoKey ? String(item[codigoKey] || "") : "",
          produto: produtoKey ? String(item[produtoKey] || "") : "",
          local: localKey
            ? String(item[localKey] || "Não especificado")
            : "Não especificado",
          usuario: usuarioStr,
          situacao: situacaoKey
            ? String(item[situacaoKey] || "Não lido")
            : "Não lido",
          estoque: estoqueKey ? String(item[estoqueKey] || "0") : "0",
          ultimaCompra: compraKey
            ? String(item[compraKey] || new Date().toLocaleDateString("pt-BR"))
            : new Date().toLocaleDateString("pt-BR"),
          dataAuditoria,
        });
      }
    }

    // Limpar dados antigos da mesma data de auditoria
    await Setor.deleteMany({
      dataAuditoria: { $gte: new Date(dataAuditoria.setHours(0, 0, 0, 0)) },
    });
    // Salvar todos os setores de uma vez
    if (setoresBatch.length > 0) {
      await Setor.insertMany(setoresBatch);
    }

    // Processar cada usuário
    for (const [usuarioStr, itens] of usuariosMap.entries()) {
      const match = usuarioStr.match(/^(\d+)\s*\((.*)\)$/);
      const id = match ? match[1].trim() : usuarioStr;
      const nome = match ? match[2].trim() : usuarioStr;

      let usuario =
        (await User.findOne({ nome })) ||
        new User({ id, nome, contadorTotal: 0 });

      // Buscar ou criar auditoria do dia
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

      // Processar itens do usuário
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

    // Salvar metadados da planilha
    await new Planilha({
      nomeArquivo: req.file.originalname,
      dataAuditoria,
      totalItens: jsonData.length,
      totalItensLidos: jsonData.filter(
        (item) =>
          item.Situação === "Atualizado" || item.Situacao === "Atualizado"
      ).length,
      usuariosEnvolvidos: Array.from(usuariosMap.keys()),
    }).save();

    res.json({
      mensagem: "Planilha processada com sucesso!",
      totalItens: jsonData.length,
      totalProcessados: totalItensProcessados,
      totalUsuarios: usuariosMap.size,
    });
  } catch (error) {
    console.error("Erro:", error);
    res
      .status(500)
      .json({ erro: "Falha no processamento", detalhes: error.message });
  }
});

// Rotas para frontend
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

// Rota para buscar dados da planilha
router.get("/dados-planilha", async (req, res) => {
  try {
    // Buscar a planilha mais recente
    const planilhaRecente = await Planilha.findOne().sort({ dataUpload: -1 });

    if (!planilhaRecente) {
      return res.status(404).json({ erro: "Nenhuma planilha encontrada" });
    }

    // Buscar todos os usuários com suas auditorias
    const usuarios = await User.find({
      "auditorias.data": planilhaRecente.dataAuditoria,
    });

    // Transformar os dados no formato esperado pelo frontend
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
