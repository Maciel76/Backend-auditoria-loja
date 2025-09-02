import mongoose from "mongoose";

// Mapeamento de colunas com nomes repetidos
const COLUMN_ALIASES = {
  "Auditado em": ["dataAuditoria", "horaAuditoria"],
  "Presença confirmada": ["presencaConfirmada", "horaPresencaConfirmada"],
  "Última compra": ["dataUltimaCompra", "horaUltimaCompra"],
};

// Função para mapear colunas repetidas
export function mapearColunasRepetidas(headers) {
  const colunasMapeadas = {};
  const contadores = {};

  headers.forEach((header, index) => {
    if (!header) return;

    const headerNormalizado = header.trim();

    if (COLUMN_ALIASES[headerNormalizado]) {
      if (!contadores[headerNormalizado]) {
        contadores[headerNormalizado] = 0;
      }

      const aliasIndex = contadores[headerNormalizado];
      if (aliasIndex < COLUMN_ALIASES[headerNormalizado].length) {
        colunasMapeadas[COLUMN_ALIASES[headerNormalizado][aliasIndex]] = index;
      }

      contadores[headerNormalizado]++;
    } else {
      colunasMapeadas[headerNormalizado] = index;
    }
  });

  return colunasMapeadas;
}

// Função para extrair valor mapeado
export function extrairValorMapeado(row, mapeamento, coluna) {
  if (
    mapeamento[coluna] !== undefined &&
    row[mapeamento[coluna]] !== undefined
  ) {
    return row[mapeamento[coluna]];
  }
  return null;
}

// Função para processar valor de estoque
export function processarValorEstoque(valor) {
  if (!valor) return "0";
  if (typeof valor === "number") return valor.toString();

  const valorString = valor.toString().trim();
  let valorLimpo = valorString.replace(/[^\d,.-]/g, "");
  valorLimpo = valorLimpo.replace(",", ".");

  return valorLimpo || "0";
}

// Função para normalizar situação
export function normalizarSituacao(situacao) {
  if (!situacao) return "Não lido";

  const situacaoLower = situacao.toLowerCase().trim();
  const mapeamento = {
    atualizado: "Atualizado",
    atualizada: "Atualizado",
    ok: "Atualizado",
    "não lido": "Não lido",
    "nao lido": "Não lido",
    pendente: "Não lido",
    "lido sem estoque": "Lido sem estoque",
    "sem estoque": "Lido sem estoque",
    "com problema": "Com problema",
    problema: "Com problema",
    "com presença e com estoque": "Atualizado",
    "sem presença e com estoque": "Com problema",
    "com presença": "Atualizado",
    "sem presença": "Com problema",
  };

  return mapeamento[situacaoLower] || situacao;
}

// Função para extrair hora de string datetime
export function extrairHora(datetimeString) {
  if (!datetimeString) return null;
  try {
    if (typeof datetimeString === "string") {
      // Para formato "2025-08-05 00:00:00"
      if (datetimeString.includes(" ")) {
        return datetimeString.split(" ")[1];
      }
      // Para formato "11:17:39"
      if (datetimeString.includes(":")) {
        return datetimeString;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Função para converter data brasileira (DD/MM/AAAA) para Date object
export function converterDataBrasileiraParaDate(dataString) {
  if (!dataString || typeof dataString !== "string") return null;

  try {
    // Formato brasileiro: "20/08/2025"
    if (dataString.includes("/")) {
      const partes = dataString.split("/");
      if (partes.length === 3) {
        const dia = parseInt(partes[0]);
        const mes = parseInt(partes[1]) - 1; // Mês é 0-based no JavaScript
        const ano = parseInt(partes[2]);

        return new Date(ano, mes, dia);
      }
    }

    // Se já for Date object ou formato ISO
    return new Date(dataString);
  } catch (error) {
    console.error("Erro ao converter data brasileira:", error);
    return null;
  }
}

// Função para combinar data e hora brasileiras
export function combinarDataHoraBrasileira(dataStr, horaStr) {
  if (!dataStr || !horaStr) return null;

  try {
    const data = converterDataBrasileiraParaDate(dataStr);
    if (!data) return null;

    // Processar hora: "07:30:00" ou "07:30"
    const partesHora = horaStr.toString().split(":");
    if (partesHora.length >= 2) {
      const horas = parseInt(partesHora[0]);
      const minutos = parseInt(partesHora[1]);
      const segundos = partesHora.length > 2 ? parseInt(partesHora[2]) : 0;

      data.setHours(horas, minutos, segundos);
    }

    return data;
  } catch (error) {
    console.error("Erro ao combinar data e hora brasileiras:", error);
    return null;
  }
}

// Função para detectar automaticamente o formato da data
export function detectarEConverterData(dataString) {
  if (!dataString) return new Date();

  try {
    // Se já é Date object
    if (dataString instanceof Date) return dataString;

    // Formato ISO: "2025-08-05T00:00:00.000Z"
    if (dataString.includes("T") && dataString.includes("Z")) {
      return new Date(dataString);
    }

    // Formato brasileiro: "05/08/2025"
    if (dataString.includes("/")) {
      const partes = dataString.split("/");
      if (partes.length === 3) {
        return new Date(partes[2], partes[1] - 1, partes[0]);
      }
    }

    // Formato ISO sem timezone: "2025-08-05 00:00:00"
    if (dataString.includes("-") && dataString.includes(" ")) {
      return new Date(dataString.replace(" ", "T"));
    }

    // Fallback
    return new Date(dataString);
  } catch (error) {
    return new Date();
  }
}

// Função para combinar data e hora
export function combinarDataHora(dataStr, horaStr) {
  if (!dataStr || !horaStr) return null;

  try {
    // Tentar parsear formato brasileiro (DD/MM/AAAA)
    if (dataStr.includes("/")) {
      const partesData = dataStr.split("/");
      if (partesData.length === 3) {
        const dia = parseInt(partesData[0]);
        const mes = parseInt(partesData[1]) - 1;
        const ano = parseInt(partesData[2]);

        const partesHora = horaStr.toString().split(":");
        if (partesHora.length >= 2) {
          const horas = parseInt(partesHora[0]);
          const minutos = parseInt(partesHora[1]);
          const segundos = partesHora.length > 2 ? parseInt(partesHora[2]) : 0;

          return new Date(ano, mes, dia, horas, minutos, segundos);
        }
      }
    }

    // Fallback para Date nativo
    return new Date(`${dataStr} ${horaStr}`);
  } catch (error) {
    console.log("Erro ao combinar data e hora:", error);
    return null;
  }
}

// Função para extrair data da planilha
export function extrairDataDaPlanilha(jsonData, nomeArquivo) {
  // 1. Tentar encontrar data na primeira linha válida (pular cabeçalhos vazios)
  if (jsonData && jsonData.length > 0) {
    for (const item of jsonData) {
      const camposData = [
        "dataAuditoria",
        "Auditado em",
        "data",
        "Data",
        "DATA",
      ];

      for (const campo of camposData) {
        if (item[campo]) {
          const data = detectarEConverterData(item[campo]);
          if (!isNaN(data.getTime())) {
            return data;
          }
        }
      }
    }
  }

  // 2. Tentar extrair do nome do arquivo (mais confiável)
  const regexData =
    /(\d{4}[-_]\d{2}[-_]\d{2})|(\d{2}[-_]\d{2}[-_]\d{4})|(\d{2}\/\d{2}\/\d{4})/;
  const match = nomeArquivo.match(regexData);

  if (match) {
    try {
      let dataString = match[0];
      // Converter para formato ISO
      if (dataString.includes("/")) {
        const partes = dataString.split("/");
        dataString = `${partes[2]}-${partes[1]}-${partes[0]}`;
      } else if (dataString.includes("_") || dataString.includes("-")) {
        dataString = dataString.replace(/[_]/g, "-");
      }
      return new Date(dataString);
    } catch (error) {
      console.log("Erro ao extrair data do nome:", error);
    }
  }

  // 3. Fallback: usar data atual
  return new Date();
}
