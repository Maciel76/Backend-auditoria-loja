import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import User from "../models/User.js";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

// Função para limpar e converter valores de estoque
function processarValorEstoque(valor) {
  if (!valor) return "0";

  // Se for número, converter para string
  if (typeof valor === "number") {
    return valor.toString();
  }

  // Se for string, remover texto e tratar vírgulas
  const valorString = valor.toString().trim();

  // Remover unidades de medida (KG, UN, etc.)
  let valorLimpo = valorString.replace(/[^\d,.-]/g, "");

  // Substituir vírgula por ponto para decimal
  valorLimpo = valorLimpo.replace(",", ".");

  // Se não tiver números, retornar 0
  if (!valorLimpo || isNaN(parseFloat(valorLimpo))) {
    return "0";
  }

  return valorLimpo;
}

// Rota GET para buscar usuários
router.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await User.find({});

    const usuariosFormatados = usuarios.map((usuario) => ({
      id: usuario.id || usuario.nome,
      nome: usuario.nome,
      contador: usuario.contadorTotal || 0,
      iniciais: obterIniciais(usuario.nome),
      email: usuario.email || "",
      telefone: usuario.telefone || "",
      cargo: usuario.cargo || "",
    }));

    res.json(usuariosFormatados);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({
      erro: "Falha ao buscar usuários",
      detalhes: error.message,
    });
  }
});

// Rota POST para upload de planilha
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: "Nenhum arquivo enviado." });
    }

    // Ler a planilha
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(sheet);

    console.log("Total de itens na planilha:", jsonData.length);

    const dataAuditoria = new Date();
    let totalItensProcessados = 0;
    const usuariosMap = new Map(); // Para agrupar por usuário

    // Primeiro passe: agrupar itens por usuário
    for (const item of jsonData) {
      try {
        // Encontrar a coluna de usuário
        const usuarioKey = Object.keys(item).find(
          (key) =>
            key.toLowerCase().includes("usuário") ||
            key.toLowerCase().includes("usuario")
        );

        if (!usuarioKey || !item[usuarioKey]) {
          console.log(
            "Item sem usuário, pulando:",
            item.Código || item.Codigo || "Sem código"
          );
          continue;
        }

        const usuarioStr = item[usuarioKey].toString().trim();

        if (!usuariosMap.has(usuarioStr)) {
          usuariosMap.set(usuarioStr, []);
        }

        usuariosMap.get(usuarioStr).push(item);
        totalItensProcessados++;
      } catch (error) {
        console.error("Erro ao processar item:", item, error);
      }
    }

    console.log("Usuários encontrados:", usuariosMap.size);
    console.log("Itens processados:", totalItensProcessados);

    // Segundo passe: processar cada usuário
    for (const [usuarioStr, itens] of usuariosMap.entries()) {
      try {
        // Extrair nome e ID do usuário
        const match = usuarioStr.match(/^(\d+)\s*\((.*)\)$/);
        let id, nome;

        if (match && match[1] && match[2]) {
          id = match[1].trim();
          nome = match[2].trim();
        } else {
          id = usuarioStr;
          nome = usuarioStr;
        }

        console.log(`Processando usuário: ${nome} com ${itens.length} itens`);

        // Buscar ou criar usuário
        let usuario = await User.findOne({ nome });

        if (!usuario) {
          usuario = new User({
            id,
            nome,
            contadorTotal: 0,
          });
        }

        // Verificar se já existe auditoria para esta data
        const auditoriaIndex = usuario.auditorias.findIndex(
          (aud) => aud.data.toDateString() === dataAuditoria.toDateString()
        );

        if (auditoriaIndex === -1) {
          // Nova auditoria para esta data
          usuario.auditorias.push({
            data: dataAuditoria,
            contador: 0,
            detalhes: [],
          });
        }

        const currentAudit =
          usuario.auditorias[
            auditoriaIndex === -1
              ? usuario.auditorias.length - 1
              : auditoriaIndex
          ];

        // Limpar detalhes existentes para esta data (evitar duplicatas)
        currentAudit.detalhes = [];
        currentAudit.contador = 0;

        // Processar cada item do usuário
        for (const item of itens) {
          const estoqueKey = Object.keys(item).find((key) =>
            key.toLowerCase().includes("estoque")
          );

          const situacaoKey = Object.keys(item).find(
            (key) =>
              key.toLowerCase().includes("situação") ||
              key.toLowerCase().includes("situacao")
          );

          const codigoKey = Object.keys(item).find(
            (key) =>
              key.toLowerCase().includes("código") ||
              key.toLowerCase().includes("codigo")
          );

          const produtoKey = Object.keys(item).find((key) =>
            key.toLowerCase().includes("produto")
          );

          const localKey = Object.keys(item).find((key) =>
            key.toLowerCase().includes("local")
          );

          const situacao = situacaoKey ? item[situacaoKey] : "";
          const isAtualizado = situacao === "Atualizado";

          const detalhe = {
            codigo: codigoKey ? item[codigoKey] : "",
            produto: produtoKey ? item[produtoKey] : "",
            local: localKey ? item[localKey] : "",
            situacao: situacao,
            estoque: estoqueKey ? processarValorEstoque(item[estoqueKey]) : "0",
          };

          currentAudit.detalhes.push(detalhe);

          if (isAtualizado) {
            currentAudit.contador++;
          }
        }

        // Atualizar contador total
        const contadorAntes = usuario.contadorTotal;
        usuario.contadorTotal = usuario.auditorias.reduce(
          (total, aud) => total + aud.contador,
          0
        );

        console.log(
          `Usuário ${nome}: ${contadorAntes} -> ${usuario.contadorTotal} itens`
        );

        await usuario.save();
      } catch (error) {
        console.error(`Erro ao processar usuário ${usuarioStr}:`, error);
      }
    }

    // Buscar estatísticas finais
    const totalUsuarios = await User.countDocuments();
    const totalItensGeral = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$contadorTotal" } } },
    ]);

    res.json({
      mensagem: "Planilha processada com sucesso!",
      totalItensPlanilha: jsonData.length,
      totalItensProcessados: totalItensProcessados,
      totalUsuariosAfetados: usuariosMap.size,
      totalItensGeral: totalItensGeral[0]?.total || 0,
      preview: jsonData.slice(0, 5), // Apenas 5 itens para preview
    });
  } catch (error) {
    console.error("Erro ao processar planilha:", error);
    res.status(500).json({
      erro: "Falha ao processar planilha",
      detalhes: error.message,
    });
  }
});

// Função auxiliar para obter iniciais
function obterIniciais(nome) {
  if (!nome) return "??";
  return nome
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
}
// Rota para buscar usuários com filtro por data
router.get("/usuarios-com-auditoria", async (req, res) => {
  try {
    const { data } = req.query;
    let filtro = {};

    if (data) {
      const dataObj = new Date(data);
      const inicioDia = new Date(dataObj.setHours(0, 0, 0, 0));
      const fimDia = new Date(dataObj.setHours(23, 59, 59, 999));

      filtro = {
        "auditorias.data": {
          $gte: inicioDia,
          $lte: fimDia,
        },
      };
    }

    const usuarios = await User.find(filtro);

    // Formatar resposta
    const usuariosFormatados = usuarios.map((usuario) => {
      const usuarioObj = usuario.toObject();

      if (data) {
        // Filtrar auditorias pela data especificada
        usuarioObj.auditorias = usuarioObj.auditorias.filter((aud) => {
          const audData = new Date(aud.data);
          const filtroData = new Date(data);
          return audData.toDateString() === filtroData.toDateString();
        });

        // Calcular contador do dia
        usuarioObj.contadorDia = usuarioObj.auditorias.reduce(
          (total, aud) => total + aud.contador,
          0
        );
      }

      return {
        id: usuarioObj.id || usuarioObj.nome,
        nome: usuarioObj.nome,
        contador: data ? usuarioObj.contadorDia : usuarioObj.contadorTotal,
        contadorTotal: usuarioObj.contadorTotal,
        iniciais: obterIniciais(usuarioObj.nome),
        auditorias: usuarioObj.auditorias,
      };
    });

    res.json(usuariosFormatados);
  } catch (error) {
    console.error("Erro ao buscar usuários com auditoria:", error);
    res.status(500).json({
      erro: "Falha ao buscar usuários",
      detalhes: error.message,
    });
  }
});

// Rota para buscar datas disponíveis de auditoria
router.get("/datas-auditoria", async (req, res) => {
  try {
    const usuarios = await User.find({});
    const datas = new Set();

    usuarios.forEach((usuario) => {
      usuario.auditorias.forEach((auditoria) => {
        if (auditoria.data) {
          datas.add(auditoria.data.toISOString().split("T")[0]);
        }
      });
    });

    res.json(Array.from(datas).sort().reverse());
  } catch (error) {
    console.error("Erro ao buscar datas de auditoria:", error);
    res.status(500).json({
      erro: "Falha ao buscar datas",
      detalhes: error.message,
    });
  }
});

// Rota para estatísticas do sistema
router.get("/estatisticas", async (req, res) => {
  try {
    const totalUsuarios = await User.countDocuments();

    const estatisticas = await User.aggregate([
      {
        $group: {
          _id: null,
          totalItens: { $sum: "$contadorTotal" },
          mediaItens: { $avg: "$contadorTotal" },
          maxItens: { $max: "$contadorTotal" },
          minItens: { $min: "$contadorTotal" },
        },
      },
    ]);

    const usuariosTop = await User.find({})
      .sort({ contadorTotal: -1 })
      .limit(10)
      .select("nome contadorTotal");

    res.json({
      totalUsuarios,
      estatisticas: estatisticas[0] || {},
      topUsuarios: usuariosTop,
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    res.status(500).json({
      erro: "Falha ao buscar estatísticas",
      detalhes: error.message,
    });
  }
});

export default router;
