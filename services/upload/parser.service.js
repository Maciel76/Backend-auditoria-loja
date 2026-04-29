/**
 * SERVICE: parser.service
 *
 * Helpers de leitura e validação de planilhas usados em routes/upload.js.
 * Extraídos para isolar a lógica do parser do roteamento HTTP.
 *
 * Cobre:
 *   - leitura de .xlsx com `xlsx` tolerante a células vazias (fix BUG A);
 *   - detecção da coluna "Usuário" e lançamento de erro 400 explícito;
 *   - normalização de `situacaoAtual` contra o enum de Auditoria (fix BUG B);
 *   - `insertMany` tolerante a falhas por linha (fix BUG B).
 *
 * Ver: Supermemoria/09-FluxosDoSistema/fluxo-upload-planilha.md
 *      Supermemoria/13-Bugs-e-Insights/bugs-conhecidos.md
 */
import xlsx from "xlsx";

// ─────────────────────────────────────────────────────────────────────────────
// Leitura de planilha (fix BUG A)
//
// `xlsx.utils.sheet_to_json(sheet, { raw: false })` SEM `defval` omite a chave
// quando a célula está ausente (Excel/Google Sheets não serializam vazias).
// Garantimos:
//   1) `defval: ""` → toda linha tem todas as chaves;
//   2) `todasChaves` é a UNIÃO dos `Object.keys` de TODAS as linhas — defesa
//      em profundidade.
// ─────────────────────────────────────────────────────────────────────────────
export function lerPlanilha(filePath) {
  const workbook = xlsx.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(sheet, {
    raw: false,
    defval: "",
  });
  const todasChaves = Array.from(
    new Set(jsonData.flatMap((row) => Object.keys(row || {}))),
  );
  return { jsonData, todasChaves };
}

export function encontrarColunaUsuario(todasChaves) {
  return todasChaves.find((key) => {
    const k = String(key).toLowerCase();
    return k.includes("usuário") || k.includes("usuario");
  });
}

export function erroColunaUsuarioAusente() {
  const err = new Error(
    "Coluna 'Usuário' não encontrada na planilha. Verifique se o cabeçalho da planilha está presente e nomeado corretamente (ex.: 'Usuário').",
  );
  err.code = "COLUNA_USUARIO_NAO_ENCONTRADA";
  err.status = 400;
  return err;
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalização de situacaoAtual (fix BUG B)
//
// Antes do fix, valores fora do enum derrubavam o batch inteiro de
// `Auditoria.insertMany`. Agora normalizamos para a forma canônica do enum
// (case-insensitive) ou para "" caso o valor seja desconhecido.
// ─────────────────────────────────────────────────────────────────────────────
export const SITUACAO_ATUAL_VALIDAS = [
  "Ativo",
  "Encerrada",
  "Pendente",
  "Cancelada",
];

export function normalizarSituacaoAtual(valor) {
  const v = String(valor || "").trim();
  if (!v) return "";
  const match = SITUACAO_ATUAL_VALIDAS.find(
    (s) => s.toLowerCase() === v.toLowerCase(),
  );
  return match || "";
}

// ─────────────────────────────────────────────────────────────────────────────
// insertMany tolerante (fix BUG B)
//
// `Model.insertMany(batch, { ordered: false })` continua inserindo o restante
// mesmo quando documentos individuais falham na validação. Aqui capturamos o
// `BulkWriteError`, contamos quantos foram ignorados e devolvemos detalhes por
// linha para o frontend exibir.
// ─────────────────────────────────────────────────────────────────────────────
export async function insertManyTolerante(Model, batch, contexto = "auditoria") {
  if (!Array.isArray(batch) || batch.length === 0) {
    return { inseridos: [], ignorados: 0, erros: [] };
  }
  try {
    const inseridos = await Model.insertMany(batch, { ordered: false });
    return { inseridos, ignorados: 0, erros: [] };
  } catch (err) {
    const writeErrors =
      err?.writeErrors || err?.result?.result?.writeErrors || [];
    const inseridos = err?.insertedDocs || [];
    const erros = writeErrors.map((we) => ({
      indice: we.index ?? we.err?.index,
      motivo: we.errmsg || we.err?.errmsg || we.message || String(we),
    }));
    console.warn(
      `⚠️ ${contexto}: ${inseridos.length}/${batch.length} inseridos, ${erros.length} ignorados.`,
    );
    if (erros.length > 0 && erros.length <= 3) {
      erros.forEach((e) =>
        console.warn(`   linha ${e.indice}: ${e.motivo}`),
      );
    }
    return { inseridos, ignorados: erros.length, erros };
  }
}
