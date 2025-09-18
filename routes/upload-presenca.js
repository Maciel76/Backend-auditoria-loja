import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import Presenca from "../models/Presenca.js";
import Planilha from "../models/Planilha.js";
import UserAudit from "../models/UserAudit.js";
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

// Função para processar presença - AGORA COM PARÂMETRO LOJA
async function processarPresenca(file, dataAuditoriaParam, loja) {
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

    const usuariosMap = new Map();
    const dadosProcessados = jsonData
      .map((item, index) => {
        try {
          // Usar os nomes EXATOS das colunas da planilha
          const codigo = item["Código"] || "";
          const produto = item["Produto"] || "Produto não especificado";
          const local = item["Local"] || "Não especificado";
          const usuario = item["Usuário"] || "Usuário não identificado";
          const situacao = item["Situação"] || "Não lido";

          // Processar presença baseado na coluna correta
          const situacaoStr = item["Situação"] || "";
          const presenca = situacaoStr.toLowerCase().includes("com presença");

          // CONVERSÃO CORRETA DE DATAS BRASILEIRAS
          const auditadoEm = combinarDataHoraBrasileira(
            item["Auditado em"],
            item["Auditado em_1"]
          );
          const presencaConfirmadaEm = combinarDataHoraBrasileira(
            item["Presença confirmada"],
            item["Presença confirmada_1"]
          );

          // Mapear usuários para processamento posterior (igual à função processarEtiqueta)
          if (usuario && usuario !== "Usuário não identificado") {
            if (!usuariosMap.has(usuario)) {
              usuariosMap.set(usuario, []);
            }
            usuariosMap.get(usuario).push(item);
          }

          return {
            codigo: codigo,
            produto: produto,
            local: local,
            usuario: usuario,
            situacao: normalizarSituacao(situacao),
            estoque: processarValorEstoque(item["Estoque atual"] || "0"),
            presenca: presenca,
            presencaConfirmada: item["Presença confirmada"] || "",
            auditadoEm: auditadoEm,
            presencaConfirmadaEm: presencaConfirmadaEm,

            // Dados adicionais
            classeProdutoRaiz: item["Classe de Produto Raiz"] || "",
            classeProduto: item["Classe de Produto"] || "",
            setor: item["Setor"] || "",
            situacaoAuditoria: item["Situação atual da auditoria"] || "",
            estoqueLeitura: processarValorEstoque(
              item["Estoque Leitura"] || "0"
            ),
            residuo: item["Resíduo"] || "",
            fornecedor: item["Fornecedor"] || "",
            ultimaCompra: item["Última compra"] || "",
            diasSemVenda: parseInt(item["Dias sem venda"] || 0),
            custoRuptura: parseFloat(
              (item["Custo Ruptura"] || "0").replace(".", "").replace(",", ".")
            ),

            dataAuditoria: dataAuditoria,
            tipo: "presenca",
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

    await Presenca.deleteMany({
      dataAuditoria: { $gte: inicioDia, $lte: fimDia },
      loja: loja, // ← FILTRAR POR LOJA
    });

    if (dadosProcessados.length > 0) {
      await Presenca.insertMany(dadosProcessados);
    }

    // Salvar registro da planilha - COM LOJA
    await Planilha.findOneAndUpdate(
      { dataAuditoria, tipoAuditoria: "presenca", loja: loja },
      {
        nomeArquivo: file.originalname,
        dataAuditoria,
        tipoAuditoria: "presenca",
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
    console.log(`🔄 Processando dados para coleção Presenca...`);
    console.log(`📊 Total de linhas na planilha: ${jsonData.length}`);
    console.log(`📁 Arquivo: ${file.originalname}`);
    console.log(`🏪 Loja: ${loja}`);
    console.log(`📅 Data de auditoria detectada: ${dataAuditoria}`);
    console.log(`🗑️ Dados antigos de Presenca removidos para a data e loja`);
    console.log(`💾 Presenças salvas: ${dadosProcessados.length}`);
    console.log(
      `✅ Dados processados para Presenca: ${dadosProcessados.length} itens`
    );

    // Processar e salvar usuários no mesmo formato que processarEtiqueta, mas na coleção UserAudit
    for (const [usuarioStr, itens] of usuariosMap.entries()) {
      try {
        // Extrair ID e nome do usuário (formato esperado: "123 (Nome Completo)")
        const match = usuarioStr.match(/^(\d+)\s*\((.*)\)$/);
        const id = match ? match[1].trim() : usuarioStr;
        const nome = match ? match[2].trim() : usuarioStr;

        // Buscar usuário existente ou criar novo NA COLEÇÃO UserAudit
        let usuario =
          (await UserAudit.findOne({ id })) ||
          (await UserAudit.findOne({ nome }));

        if (!usuario) {
          usuario = new UserAudit({
            id,
            nome,
            contadorTotal: 0,
            auditorias: [],
          });
        }

        // Encontrar ou criar auditoria para la data atual
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
            codigo: item["Código"] || "",
            produto: item["Produto"] || "",
            local: item["Local"] || "",
            situacao: normalizarSituacao(item["Situação"] || ""),
            estoque: processarValorEstoque(item["Estoque atual"] || "0"),
            tipoAuditoria: "presenca",
            loja: loja, // ← LOJA AGORA DEFINIDA (não mais undefined)
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

        // SALVAR o usuário NA COLEÇÃO UserAudit
        await usuario.save();
      } catch (error) {
        console.error(`Erro ao processar usuário ${usuarioStr}:`, error);
      }
    }

    return {
      success: true,
      totalItens: dadosProcessados.length,
      dataAuditoria: dataAuditoria,
      loja: loja,
    };
  } catch (error) {
    console.error("Erro ao processar presença:", error);
    return { success: false, error: error.message };
  }
}

// Rota principal - AGORA COM VERIFICAÇÃO DE LOJA
router.post("/upload-presenca", upload.single("file"), async (req, res) => {
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

    const resultado = await processarPresenca(req.file, new Date(), loja);

    if (!resultado.success) {
      return res.status(500).json({
        erro: "Falha no processamento",
        detalhes: resultado.error,
      });
    }

    res.json({
      mensagem: "Planilha de presença processada com sucesso!",
      totalItens: resultado.totalItens,
      dataAuditoria: resultado.dataAuditoria,
      loja: resultado.loja,
      tipo: "presenca",
    });
  } catch (error) {
    res.status(500).json({
      erro: "Falha no processamento",
      detalhes: error.message,
    });
  }
});

export default router;
