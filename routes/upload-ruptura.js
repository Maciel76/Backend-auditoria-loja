import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import Ruptura from "../models/Ruptura.js";
import Planilha from "../models/Planilha.js";
import User from "../models/User.js";
import UserAudit from "../models/userRuptura.js";
import {
  mapearColunasRepetidas,
  extrairValorMapeado,
  processarValorEstoque,
  normalizarSituacao,
  combinarDataHora,
  extrairDataDaPlanilha,
  extrairHora,
  converterDataBrasileiraParaDate,
  combinarDataHoraBrasileira,
} from "../utils/planilhaHelpers.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Função para processar ruptura - AGORA COM PARÂMETRO LOJA
async function processarRuptura(file, dataAuditoriaParam, loja) {
  try {
    const workbook = xlsx.readFile(file.path, { cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Extrair headers
    const headers = xlsx.utils.sheet_to_json(sheet, { header: 1 })[0];
    const jsonData = xlsx.utils.sheet_to_json(sheet, { raw: false });

    // Mapear colunas repetidas
    const mapeamentoColunas = mapearColunasRepetidas(headers);

    // Extrair data real da planilha
    let dataAuditoria = extrairDataDaPlanilha(jsonData, file.originalname);
    if (!dataAuditoria || isNaN(dataAuditoria.getTime())) {
      dataAuditoria = dataAuditoriaParam;
    }

    const dadosProcessados = jsonData
      .map((item, index) => {
        try {
          // Usar os nomes EXATOS das colunas da planilha
          const codigo = item["Código"] || "";
          const produto = item["Produto"] || "Produto não especificado";
          const local = item["Local"] || "Não especificado";
          const usuario = item["Usuário"] || "Usuário não identificado";
          const situacao = item["Situação"] || "Não lido";

          // CONVERSÃO CORRETA OF DATAS BRASILEIRAS
          const auditadoEm = combinarDataHoraBrasileira(
            item["Auditado em"],
            item["Auditado em_1"]
          );
          const presencaConfirmadaEm = combinarDataHoraBrasileira(
            item["Presença confirmada"],
            item["Presença confirmada_1"]
          );
          const ultimaCompraEm = combinarDataHoraBrasileira(
            item["Última compra"],
            item["Última compra_1"]
          );

          return {
            codigo: codigo,
            produto: produto,
            local: local,
            usuario: usuario,
            situacao: normalizarSituacao(situacao),
            situacaoAuditoria: item["Situação atual da auditoria"] || "",
            auditadoEm: auditadoEm,
            estoqueAtual: processarValorEstoque(item["Estoque atual"] || "0"),
            presencaConfirmada: item["Presença confirmada"] || "",
            presencaConfirmadaEm: presencaConfirmadaEm,
            estoqueLeitura: processarValorEstoque(
              item["Estoque Leitura"] || "0"
            ),
            residuo: item["Resíduo"] || "",
            fornecedor: item["Fornecedor"] || "",
            ultimaCompra: item["Última compra"] || "",
            ultimaCompraEm: ultimaCompraEm,
            diasSemVenda: parseInt(item["Dias sem venda"] || 0),
            custoRuptura: parseFloat(
              (item["Custo Ruptura"] || "0").replace(".", "").replace(",", ".")
            ),
            dataAuditoria: dataAuditoria,
            tipo: "ruptura",
            loja: loja, // ← LOJA ADICIONADA AQUI
            metadata: {
              nomeArquivo: file.originalname,
              dataUpload: new Date(),
              linhaPlanilha: index + 2,
            },
          };
        } catch (error) {
          console.error(`Erro processando linha ${index + 1}:`, error);
          return null;
        }
      })
      .filter((item) => item !== null);

    // Limpar dados antigos da mesma data E MESMA LOJA
    const inicioDia = new Date(dataAuditoria);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataAuditoria);
    fimDia.setHours(23, 59, 59, 999);

    await Ruptura.deleteMany({
      dataAuditoria: { $gte: inicioDia, $lte: fimDia },
      loja: loja, // ← FILTRAR POR LOJA
    });

    if (dadosProcessados.length > 0) {
      await Ruptura.insertMany(dadosProcessados);
    }

    // Salvar registro da planilha - COM LOJA
    await Planilha.findOneAndUpdate(
      { dataAuditoria, tipoAuditoria: "ruptura", loja: loja },
      {
        nomeArquivo: file.originalname,
        dataAuditoria,
        tipoAuditoria: "ruptura",
        loja: loja, // ← LOJA ADICIONADA
        totalItens: dadosProcessados.length,
        totalItensLidos: dadosProcessados.filter(
          (item) => item.situacao === "Atualizado"
        ).length,
        usuariosEnvolvidos: [
          ...new Set(dadosProcessados.map((item) => item.usuario)),
        ],
        metadata: {
          tamanhoArquivo: file.size,
          formato: file.originalname.split(".").pop(),
          totalLinhas: dadosProcessados.length,
          processamentoCompleto: true,
        },
      },
      { upsert: true, new: true }
    );

    // Logs detalhados
    console.log(`🔄 Processando dados para coleção Ruptura...`);
    console.log(`📊 Total de linha na planilha: ${jsonData.length}`);
    console.log(`📁 Arquivo: ${file.originalname}`);
    console.log(`🏪 Loja: ${loja}`);
    console.log(`📅 Data de auditoria detectada: ${dataAuditoria}`);
    console.log(`🗑️ Dados antigos de Ruptura removidos para a data e loja`);
    console.log(`💾 Rupturas salvas: ${dadosProcessados.length}`);
    console.log(
      `✅ Dados processados para Ruptura: ${dadosProcessados.length} itens`
    );

    // Processar usuários também (mantido para compatibilidade)
    const totalUsuarios = await processarUsuarios(
      dadosProcessados,
      dataAuditoria,
      "ruptura",
      loja // ← PASSE A LOJA
    );

    // Processar e salvar usuários no modelo UserAudit
    const totalUsuariosAudit = await processarUsuariosAudit(
      dadosProcessados,
      dataAuditoria,
      "ruptura",
      loja // ← PASSE A LOJA
    );

    return {
      success: true,
      totalItens: dadosProcessados.length,
      dataAuditoria: dataAuditoria,
      loja: loja,
    };
  } catch (error) {
    console.error("Erro ao processar ruptura:", error);
    return { success: false, error: error.message };
  }
}

// Função para processar e salvar usuários - AGORA COM LOJA
async function processarUsuarios(
  dadosProcessados,
  dataAuditoria,
  tipoAuditoria,
  loja
) {
  try {
    console.log(`👥 Processando usuários para ${tipoAuditoria}...`);

    const usuariosMap = new Map();

    // Agrupar itens por usuário
    for (const item of dadosProcessados) {
      if (item.usuario && item.usuario !== "Usuário não identificado") {
        if (!usuariosMap.has(item.usuario)) {
          usuariosMap.set(item.usuario, []);
        }
        usuariosMap.get(item.usuario).push(item);
      }
    }

    console.log(`📊 ${usuariosMap.size} usuários únicos encontrados`);

    // Processar cada usuário
    for (const [usuarioStr, itens] of usuariosMap.entries()) {
      // Extrair ID e nome do formato "3284972 (LAIZA RODRIGUES DE OLIVEIRA)"
      const match = usuarioStr.match(/^(\d+)\s*\((.*)\)$/);
      const id = match ? match[1].trim() : usuarioStr;
      const nome = match ? match[2].trim() : usuarioStr;

      let usuario = await User.findOne({
        $or: [{ id: id }, { nome: nome }],
      });

      if (!usuario) {
        // Criar novo usuário se não existir
        usuario = new User({
          id: id,
          nome: nome,
          contadorTotal: 0,
          auditorias: [],
        });
        console.log(`➕ Novo usuário criado: ${nome}`);
      }

      // Verificar se já existe auditoria nesta data
      const auditoriaIndex = usuario.auditorias.findIndex(
        (a) => a.data.toDateString() === dataAuditoria.toDateString()
      );

      if (auditoriaIndex === -1) {
        // Criar nova auditoria
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

      // Adicionar detalhes da auditoria - COM LOJA
      for (const item of itens) {
        // Usar estoque correto baseado no tipo de auditoria
        const estoque =
          tipoAuditoria === "ruptura" ? item.estoqueAtual : item.estoque;

        auditoria.detalhes.push({
          codigo: item.codigo,
          produto: item.produto,
          local: item.local,
          situacao: item.situacao,
          estoque: estoque || "0",
          tipoAuditoria: tipoAuditoria,
          loja: loja, // ← LOJA ADICIONADA
        });

        if (item.situacao === "Atualizado") {
          auditoria.contador++;
        }
      }

      // Atualizar contador total
      usuario.contadorTotal = usuario.auditorias.reduce(
        (total, aud) => total + aud.contador,
        0
      );

      await usuario.save();
    }

    console.log(`✅ Usuários processados com sucesso`);
    return usuariosMap.size;
  } catch (error) {
    console.error("❌ Erro ao processar usuários:", error);
    return 0;
  }
}

// Função para salvar usuários no modelo UserAudit - AGORA COM LOJA
async function processarUsuariosAudit(
  dadosProcessados,
  dataAuditoria,
  tipoAuditoria,
  loja
) {
  try {
    console.log(
      `👥 Processando usuários para ${tipoAuditoria} no modelo UserAudit...`
    );

    const usuariosMap = new Map();

    // Agrupar itens por usuário
    for (const item of dadosProcessados) {
      if (item.usuario && item.usuario !== "Usuário não identificado") {
        if (!usuariosMap.has(item.usuario)) {
          usuariosMap.set(item.usuario, []);
        }
        usuariosMap.get(item.usuario).push(item);
      }
    }

    console.log(
      `📊 ${usuariosMap.size} Novos Usuarios encontrados para coleção usuarios ruptura`
    );

    // Processar cada usuário
    for (const [usuarioStr, itens] of usuariosMap.entries()) {
      // Extrair ID e nome do formato "3284972 (LAIZA RODRIGUES DE OLIVEIRA)"
      const match = usuarioStr.match(/^(\d+)\s*\((.*)\)$/);
      const userId = match ? match[1].trim() : usuarioStr;
      const nome = match ? match[2].trim() : usuarioStr;

      // Buscar no novo modelo UserAudit
      let userAudit = await UserAudit.findOne({ userId: userId });

      if (!userAudit) {
        // Criar novo registro se não existir
        userAudit = new UserAudit({
          userId: userId,
          nome: nome,
          contadorTotal: 0,
          auditorias: [],
        });
        console.log(
          `➕ Novo registro de auditoria criado para usuário: ${nome}`
        );
      }

      // Verificar se já existe auditoria nesta data
      const auditoriaIndex = userAudit.auditorias.findIndex(
        (a) => a.data.toDateString() === dataAuditoria.toDateString()
      );

      if (auditoriaIndex === -1) {
        // Criar nova auditoria
        userAudit.auditorias.push({
          data: dataAuditoria,
          contador: 0,
          detalhes: [],
        });
      }

      const auditoria =
        userAudit.auditorias[
          auditoriaIndex === -1
            ? userAudit.auditorias.length - 1
            : auditoriaIndex
        ];

      // Adicionar detalhes da auditoria - COM LOJA
      for (const item of itens) {
        // Usar estoque correto baseado no tipo de auditoria
        const estoque =
          tipoAuditoria === "ruptura" ? item.estoqueAtual : item.estoque;

        auditoria.detalhes.push({
          codigo: item.codigo,
          produto: item.produto,
          local: item.local,
          situacao: item.situacao,
          estoque: estoque || "0",
          tipoAuditoria: tipoAuditoria,
          loja: loja, // ← LOJA ADICIONADA (agora definida)
        });

        if (item.situacao === "Atualizado") {
          auditoria.contador++;
        }
      }

      // Atualizar contador total
      userAudit.contadorTotal = userAudit.auditorias.reduce(
        (total, aud) => total + aud.contador,
        0
      );

      await userAudit.save();
    }

    console.log(`✅ Usuários processados com sucesso no modelo UserAudit`);
    return usuariosMap.size;
  } catch (error) {
    console.error("❌ Erro ao processar usuários no UserAudit:", error);
    return 0;
  }
}

// Rota principal - AGORA COM VERIFICAÇÃO DE LOJA
router.post("/upload-ruptura", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ erro: "Nenhum arquivo enviado." });
    }

    // Obter a loja da sessão, header ou body
    const loja =
      req.headers["x-loja"] || req.body.loja || req.session.loja || "000";

    if (!loja) {
      return res.status(400).json({
        erro: "Loja não selecionada. Por favor, selecione uma loja primeiro.",
      });
    }

    const resultado = await processarRuptura(req.file, new Date(), loja);

    if (!resultado.success) {
      return res.status(500).json({
        erro: "Falha no processamento",
        detalhes: resultado.error,
      });
    }

    res.json({
      mensagem: "Planilha de ruptura processada com sucesso!",
      totalItens: resultado.totalItens,
      dataAuditoria: resultado.dataAuditoria,
      loja: resultado.loja,
      tipo: "ruptura",
    });
  } catch (error) {
    res.status(500).json({
      erro: "Falha no processamento",
      detalhes: error.message,
    });
  }
});

export default router;
