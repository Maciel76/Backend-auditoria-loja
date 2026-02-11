import Auditoria from "../models/Auditoria.js";

// Função para detectar tipo de auditoria baseado no nome do arquivo
function detectarTipoAuditoria(nomeArquivo) {
  const nome = nomeArquivo.toLowerCase();
  if (nome.includes("etiqueta")) return "etiqueta";
  if (nome.includes("presenca") || nome.includes("presença")) return "presenca";
  if (nome.includes("ruptura")) return "ruptura";
  return "etiqueta";
}

// Função para extrair ID e nome do usuário
function extrairUsuario(usuarioStr) {
  if (!usuarioStr) return { id: "unknown", nome: "Usuário Desconhecido" };

  const match = usuarioStr.match(/^(\d+)\s*\((.*)\)$/);
  if (match) {
    return {
      id: match[1].trim(),
      nome: match[2].trim(),
    };
  }

  if (usuarioStr.includes("(") && usuarioStr.includes(")")) {
    const partes = usuarioStr.split("(");
    if (partes.length >= 2) {
      const id = partes[0].trim();
      const nome = partes[1].replace(")", "").trim();
      return { id, nome };
    }
  }

  return {
    id: usuarioStr.replace(/\s+/g, "_").toLowerCase(),
    nome: usuarioStr,
  };
}

// Função para processar valor de estoque
function processarValorEstoque(valor) {
  if (!valor) return "0";
  if (typeof valor === "number") return valor.toString();

  const valorString = valor.toString().trim();
  let valorLimpo = valorString.replace(/[^\d,.-]/g, "");
  valorLimpo = valorLimpo.replace(",", ".");

  return valorLimpo || "0";
}

// FUNÇÃO NOVA: Normalizar valores de situação
function normalizarSituacao(situacao) {
  if (!situacao) return "Não lido";

  const situacaoLower = situacao.toLowerCase().trim();

  const mapeamento = {
    // Atualizado
    atualizado: "Atualizado",
    atualizada: "Atualizado",
    ok: "Atualizado",
    concluído: "Atualizado",
    concluida: "Atualizado",
    concluido: "Atualizado",
    completo: "Atualizado",

    // Não lido
    "não lido": "Não lido",
    "nao lido": "Não lido",
    pendente: "Não lido",
    "não processado": "Não lido",

    // Desatualizado
    desatualizado: "Desatualizado",
    desatualizada: "Desatualizado",
    "precisa atualizar": "Desatualizado",
    "atualização necessária": "Desatualizado",

    // Sem estoque / Lido sem estoque (etiquetas)
    "sem estoque": "Lido sem estoque",
    "estoque zerado": "Lido sem estoque",
    "zero estoque": "Lido sem estoque",
    "lido sem estoque": "Lido sem estoque",

    // Não pertence (etiquetas genérico)
    "não pertence": "Não pertence",
    "nao pertence": "Não pertence",
    "local errado": "Não pertence",
    "setor incorreto": "Não pertence",

    // Presenças - situações específicas
    "com presença e com estoque": "Atualizado",
    "com presença e sem estoque": "Com Presença e sem Estoque",
    "sem presença e com estoque": "Com problema",
    "sem presença e sem estoque": "Com problema",
    "com presença": "Atualizado",
    "sem presença": "Com problema",
    "lido não pertence": "Lido não pertence",
    "lido nao pertence": "Lido não pertence",

    // Com problema
    "com problema": "Com problema",
    problema: "Com problema",
    erro: "Com problema",
    divergente: "Com problema",
    inválido: "Com problema",
  };

  return mapeamento[situacaoLower] || situacao;
}

// Serviço principal para processar dados para a coleção Auditoria
export async function processarParaAuditoria(planilhaData) {
  try {
    const { jsonData, nomeArquivo, dataAuditoria, loja } = planilhaData;

    console.log("🔄 Processando dados para coleção Auditoria...");
    console.log("📊 Total de linhas:", jsonData.length);
    console.log("📁 Arquivo:", nomeArquivo);

    const tipoAuditoria = detectarTipoAuditoria(nomeArquivo);
    const auditoriasBatch = [];

    // Processar cada linha da planilha
    for (const [index, item] of jsonData.entries()) {
      try {
        const usuarioKey = Object.keys(item).find(
          (key) =>
            key &&
            (key.toLowerCase().includes("usuário") ||
              key.toLowerCase().includes("usuario")),
        );

        if (!usuarioKey || !item[usuarioKey]) {
          continue;
        }

        const usuarioStr = item[usuarioKey].toString().trim();
        const { id: usuarioId, nome: usuarioNome } = extrairUsuario(usuarioStr);

        // Encontrar outras colunas
        const situacaoKey = Object.keys(item).find(
          (key) =>
            key &&
            (key.toLowerCase().includes("situação") ||
              key.toLowerCase().includes("situacao")),
        );
        const situacaoAtualKey = Object.keys(item).find(
          (key) =>
            key &&
            key.toLowerCase().includes("situação") &&
            key.toLowerCase().includes("atual") &&
            key.toLowerCase().includes("auditoria"),
        );
        const localKey = Object.keys(item).find(
          (key) => key && key.toLowerCase().includes("local"),
        );
        const produtoKey = Object.keys(item).find(
          (key) => key && key.toLowerCase().includes("produto"),
        );
        const codigoKey = Object.keys(item).find(
          (key) =>
            key &&
            (key.toLowerCase().includes("código") ||
              key.toLowerCase().includes("codigo")),
        );
        const estoqueKey = Object.keys(item).find(
          (key) => key && key.toLowerCase().includes("estoque"),
        );
        const classeProdutoKey = Object.keys(item).find(
          (key) =>
            key &&
            key.toLowerCase().includes("classe") &&
            key.toLowerCase().includes("produto"),
        );
        const auditadoEmKey = Object.keys(item).find(
          (key) =>
            key &&
            key.toLowerCase().includes("auditado") &&
            key.toLowerCase().includes("em"),
        );

        // Valores com fallback e normalização
        const local =
          localKey && item[localKey]
            ? String(item[localKey])
            : "Não especificado";
        const situacaoRaw =
          situacaoKey && item[situacaoKey]
            ? String(item[situacaoKey])
            : "Não lido";
        const situacao = normalizarSituacao(situacaoRaw);
        const situacaoAtual =
          situacaoAtualKey && item[situacaoAtualKey]
            ? String(item[situacaoAtualKey])
            : "";
        const codigo =
          codigoKey && item[codigoKey] ? String(item[codigoKey]) : "";
        const produto =
          produtoKey && item[produtoKey] ? String(item[produtoKey]) : "";
        const ClasseProduto =
          classeProdutoKey && item[classeProdutoKey]
            ? String(item[classeProdutoKey]).trim()
            : "";
        const estoque =
          estoqueKey && item[estoqueKey]
            ? processarValorEstoque(item[estoqueKey])
            : "0";

        // Processar campo "Auditado em" para extrair data e hora separadamente
        let auditadoDia = "";
        let auditadoHora = "";
        if (auditadoEmKey && item[auditadoEmKey]) {
          const auditadoEm = String(item[auditadoEmKey]);
          // Se contém espaço, assumir formato "DD/MM/AAAA HH:MM"
          if (auditadoEm.includes(" ")) {
            const partes = auditadoEm.split(" ");
            auditadoDia = partes[0] || "";
            auditadoHora = partes[1] || "";
          } else if (auditadoEm.includes("/")) {
            // Se só contém data "DD/MM/AAAA"
            auditadoDia = auditadoEm;
          } else if (auditadoEm.includes(":")) {
            // Se só contém hora "HH:MM"
            auditadoHora = auditadoEm;
          }
        }

        // Adicionar ao batch
        auditoriasBatch.push({
          loja,
          usuarioId,
          usuarioNome,
          data: dataAuditoria,
          tipo: tipoAuditoria,
          local,
          codigo,
          produto,
          ClasseProduto,
          situacao,
          situacaoAtual,
          estoque,
          AuditadoDia: auditadoDia,
          AuditadoHora: auditadoHora,
          contador: situacao === "Atualizado" ? 1 : 0,
          metadata: {
            planilhaOrigem: nomeArquivo,
            dataUpload: new Date(),
            linhaPlanilha: index + 2,
          },
        });
      } catch (error) {
        console.error(`❌ Erro processando linha ${index + 2}:`, error.message);
      }
    }

    // Limpar e salvar dados
    if (auditoriasBatch.length > 0) {
      const inicioDia = new Date(dataAuditoria);
      inicioDia.setHours(0, 0, 0, 0);

      const fimDia = new Date(dataAuditoria);
      fimDia.setHours(23, 59, 59, 999);

      await Auditoria.deleteMany({
        loja,
        data: { $gte: inicioDia, $lte: fimDia },
        "metadata.planilhaOrigem": nomeArquivo,
      });

      console.log("🗑️ Dados antigos de Auditoria removidos");

      await Auditoria.insertMany(auditoriasBatch);
      console.log("💾 Auditorias salvas:", auditoriasBatch.length);
    }

    return {
      success: true,
      totalProcessados: auditoriasBatch.length,
      tipoAuditoria,
    };
  } catch (error) {
    console.error("💥 ERRO no processador de auditoria:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Serviço para sincronizar dados do Auditoria para Auditoria
export async function sincronizarAuditoriaesParaAuditoria() {
  try {
    console.log("🔄 Sincronizando dados de Auditoria para Auditoria...");

    const seteDiasAtras = new Date();
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

    const setores = await Auditoria.find({
      dataAuditoria: { $gte: seteDiasAtras },
    });

    console.log(
      "📋 Auditoriaes encontrados para sincronização:",
      setores.length,
    );

    for (const setor of setores) {
      try {
        const {
          usuario,
          dataAuditoria,
          local,
          codigo,
          produto,
          situacao,
          estoque,
        } = setor;

        const { id: usuarioId, nome: usuarioNome } = extrairUsuario(usuario);
        const situacaoNormalizada = normalizarSituacao(situacao);
        const tipoAuditoria = "etiqueta";

        const existe = await Auditoria.findOne({
          usuarioId,
          data: dataAuditoria,
          local,
          codigo,
          produto,
          "metadata.planilhaOrigem": "Sincronizado do Auditoria",
        });

        if (!existe) {
          await Auditoria.create({
            usuarioId,
            usuarioNome,
            data: dataAuditoria,
            tipo: tipoAuditoria,
            local,
            codigo,
            produto,
            situacao: situacaoNormalizada,
            estoque,
            contador: situacaoNormalizada === "Atualizado" ? 1 : 0,
            metadata: {
              planilhaOrigem: "Sincronizado do Auditoria",
              dataUpload: new Date(),
              sincronizado: true,
            },
          });
        }
      } catch (error) {
        console.error("❌ Erro sincronizando setor:", error.message);
      }
    }

    console.log("✅ Sincronização concluída");
    return { success: true, totalAuditoriaes: setores.length };
  } catch (error) {
    console.error("💥 ERRO na sincronização:", error);
    return { success: false, error: error.message };
  }
}
