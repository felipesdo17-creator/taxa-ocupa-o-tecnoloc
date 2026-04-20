import { Equipment, EquipmentStatus, EquipmentType, AggregateItem } from '../types';
import { STATUS_MAPPING, TYPE_PREFIXES } from '../constants';

export const normalizeString = (str: string) =>
  String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

export interface ImportIssue {
  patrimonio?: string;
  nome_bem?: string;
  reason: string;
}

// --- Funções de Categorização ---

export function categorizeTorreIluminacao(nome: string, patrimonio?: string, familia?: string): string | null {
  const n = normalizeString(nome);
  const p = normalizeString(patrimonio || '');
  const f = normalizeString(familia || '');
  const combined = `${n} ${p}`;

  // --- REGRA SUPREMA DA FAMÍLIA (TIL) ---
  // Se a coluna família existe e NÃO é TIL, então NÃO é torre.
  if (f && f !== 'TIL') return null;

  // Se a família É 'TIL', com certeza é torre.
  let isTorre = f === 'TIL';

  // Se não tem família (fallback), usa a detecção por nome
  if (!f) {
    if (combined.includes('XMT') || combined.includes('SUITCASE') || combined.includes('12VS')) return null;

    isTorre =
      combined.includes('TORRE') ||
      combined.includes('ILUMINACAO') ||
      combined.includes('ILUMIN') ||
      combined.includes('V5') ||
      combined.includes('HILIGHT') ||
      p.startsWith('AT');
  }

  if (!isTorre) return null;

  const includesAny = (keywords: string[]) => keywords.some((k) => combined.includes(k));

  if (includesAny(['V5+', 'VS+LED', 'VS+ LED', 'VS LED', 'VS-LED', 'V5 LED', 'HILIGHT V5']))
    return 'Torre de Iluminação V5+';
  
  if (includesAny(['SOLAR', 'FOTOVOLTAICO', '300W', 'MOD04', 'MOD06', 'MOD08']))
    return 'Torre de Iluminação Solar';
  
  if (includesAny(['AUT', 'AUT.', 'AUTON', 'AUTONOMA', '3TNV AUT']))
    return 'Torre de Iluminação Autônoma';
  
  if (includesAny(['LED'])) return 'Torre de Iluminação LED';

  return 'Torre de Iluminação Convencional';
}

export function categorizeGrupoGerador(nome: string, patrimonio?: string): string | null {
  const n = normalizeString(nome);
  const p = normalizeString(patrimonio || '');
  const combined = `${n} ${p}`;

  const knownMfgRegex = /\b(?:CUMMINS|GENERAC|STEMAC|ATLAS|PRAMAC|WACKER|HIMOINSA|BRANCO|GSW|VANTAGE|RANGER|SCANIA|VOLVO|MWM)\b/;

  const isGerador =
    combined.includes('GERADOR') ||
    combined.includes('KVA') ||
    p.match(/^(GG|GA|CG|GS|GH|GB|GW)/) ||
    knownMfgRegex.test(combined);

  if (!isGerador) return null;

  // --- REGRA ESPECÍFICA: 200/180 ---
  if (combined.includes('200/180') || combined.includes('200 / 180')) {
      return 'Grupo Gerador 200KVA';
  }

  const matchRegex = (r: RegExp) => r.test(combined);
  const kva = (n: number) => new RegExp(`\\b${n}(?:\\s*\\/\\s*\\d+)?\\s*KVA\\b`);
  const anyKva = (numbers: number[]) => numbers.some((x) => matchRegex(kva(x)));

  if (anyKva([19]) || combined.includes('BRANCO DIESEL 19')) return 'Grupo Gerador 19KVA';
  if (combined.includes('PRAMAC 22') || anyKva([22])) return 'Grupo Gerador 22KVA';
  if (anyKva([33])) return 'Grupo Gerador 33KVA';
  if (combined.includes('QAS 55') || anyKva([48, 52, 53, 55, 59, 60])) return 'Grupo Gerador 55KVA';
  if (anyKva([75, 80, 81])) return 'Grupo Gerador 81KVA';
  
  if (combined.includes('QAS 105') || anyKva([100, 105, 116, 120, 121, 125, 127]))
    return 'Grupo Gerador 120KVA';
  
  if (anyKva([140, 150])) return 'Grupo Gerador 150KVA';
  if (anyKva([168, 170])) return 'Grupo Gerador 170KVA';
  if (anyKva([180, 200, 212])) return 'Grupo Gerador 200KVA';
  if (anyKva([260])) return 'Grupo Gerador 260KVA';
  if (anyKva([360, 385])) return 'Grupo Gerador 360KVA';
  if (
    combined.includes('500KVA') ||
    combined.includes('500 KVA') ||
    matchRegex(/\b500(?:\s*\/\s*\d+)?\s*KVA\b/)
  )
    return 'Grupo Gerador 500KVA';

  return null;
}

export const identifyModel = (nome: string, patrimonio: string, familia?: string, tipoModelo?: string): string => {
  const n = normalizeString(nome);
  const p = normalizeString(patrimonio);
  const tm = normalizeString(tipoModelo || ''); // Normaliza o código do modelo (MSM...)
  const combined = `${n} ${p}`;

  // 1. Tenta Categorizar Torres (Usa Família TIL)
  const torreCategoria = categorizeTorreIluminacao(nome, patrimonio, familia);
  if (torreCategoria) return torreCategoria;

  // 2. Tenta Categorizar Geradores
  const isGerador =
    combined.includes('GERADOR') ||
    combined.includes('KVA') ||
    p.match(/^(GG|GA|CG|GS|GH|GB|GW)/);

  if (isGerador) {
    const categoria = categorizeGrupoGerador(nome, patrimonio);
    if (categoria) return categoria;
    
    // Fallback numérico
    const kvaMatch = combined.match(/(\d+)\s?KVA/);
    if (kvaMatch) {
      const v = parseInt(kvaMatch[1]);
      if (v >= 19 && v <= 21) return 'Grupo Gerador 19KVA';
      if (v >= 22 && v <= 25) return 'Grupo Gerador 22KVA';
      if (v >= 30 && v <= 35) return 'Grupo Gerador 33KVA';
      if (v >= 48 && v <= 65) return 'Grupo Gerador 55KVA';
      if (v >= 75 && v <= 85) return 'Grupo Gerador 81KVA';
      if (v >= 100 && v <= 127) return 'Grupo Gerador 120KVA';
      if (v >= 140 && v <= 160) return 'Grupo Gerador 150KVA';
      if (v >= 168 && v <= 175) return 'Grupo Gerador 170KVA';
      if (v >= 180 && v <= 230) return 'Grupo Gerador 200KVA';
      if (v >= 240 && v <= 280) return 'Grupo Gerador 260KVA';
      if (v >= 300 && v <= 400) return 'Grupo Gerador 360KVA';
      if (v >= 450 && v <= 550) return 'Grupo Gerador 500KVA';
    }
  }

  // --- FILTRO DE ACESSÓRIOS ---
  if (
    combined.includes('CONTROLE') ||
    combined.includes('REMOTO') ||
    combined.includes('CARREGADOR')
  ) {
    return 'Acessórios';
  }

  // --- REGRAS PELO "TIPO MODELO" (PRIORIDADE ALTA) ---
  
  // Regra: X-TREME (MSM006 e MSM007)
  if (tm === 'MSM006' || tm === 'MSM007') {
    return 'X-Treme';
  }

  // Regra: 12RC (MSM008 e MSM009)
  if (tm === 'MSM008' || tm === 'MSM009') {
    return '12RC';
  }

  // --- LISTA ESTRITA DE SOLDA E OUTROS (POR NOME) ---

  // X-Treme (Fallback por nome se não tiver código)
  if (combined.includes('X-TREME') || combined.includes('SUITCASE') || combined.includes('12VS')) return 'X-Treme';

  // 12RC (Fallback por nome)
  if (combined.includes('12RC')) return '12RC';

  if (combined.includes('LN25')) return 'LN25';
  if (combined.includes('CST')) return 'CST';
  if (combined.includes('V275')) return 'V275';
  if (combined.includes('XMT')) return 'XMT';
  if (combined.includes('V350')) return 'V350';

  if (combined.includes('FLEXTEC')) {
    if (combined.includes('450')) return 'Flextec 450';
    if (combined.includes('650')) return 'Flextec 650';
    return 'Flextec 450';
  }

  if (combined.includes('DC600') || combined.includes('DC-600') || combined.includes('IDEALARC 600')) return 'DC600';
  if (combined.includes('DC1000') || combined.includes('DC-1000') || combined.includes('IDEALARC 1000')) return 'DC1000';
  if (combined.includes('CV400') || combined.includes('CV-400')) return 'CV400';
  if (combined.includes('TRAILBLAZER')) return 'Trailblazer';
  if (combined.includes('RANGER')) return 'Ranger';

  // Rolo Compactador
  if (
    combined.includes('RT56') || 
    combined.includes('RT82') || 
    combined.includes('RTL-X-SC3') || 
    combined.includes('RTX-SC2') || 
    combined.includes('ROLO') ||
    combined.includes('COMPACTADOR') ||
    combined.includes('CAMPACTADOR')
  ) {
    return 'Rolo compactador';
  }

  return 'Outros';
};

export const normalizeType = (patrimonio: string): EquipmentType => {
  const cleanPat = normalizeString(patrimonio).toUpperCase();
  const prefix = Object.keys(TYPE_PREFIXES).find((p) => cleanPat.startsWith(p));
  return prefix ? TYPE_PREFIXES[prefix] : 'Outros';
};

export const normalizeStatus = (statusValue: any): EquipmentStatus => {
  if (statusValue === undefined || statusValue === null || statusValue === '') {
    return EquipmentStatus.INATIVO;
  }
  let code = String(statusValue).trim();
  if (!isNaN(Number(code))) {
    code = String(Math.floor(Number(code)));
  }
  return STATUS_MAPPING[code] || EquipmentStatus.INATIVO;
};

const parseNumericValue = (val: any): number => {
  if (typeof val === 'number') return val;
  const cleaned = String(val || '0')
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const detectState = (centro: string): 'MG' | 'PA' | 'Outro' => {
  const c = normalizeString(centro);
  if (c.includes('MG') || c.includes('CONTAGEM') || c.includes('BELO HORIZONTE')) return 'MG';
  if (c.includes('PA') || c.includes('PARAUAPEBAS') || c.includes('CANAA')) return 'PA';
  return 'Outro';
};

// --- PROCESSAMENTO PRINCIPAL ---
export const processRawData = (data: any[], issues?: ImportIssue[]): Partial<Equipment>[] => {
  const processed: Partial<Equipment>[] = [];

  const fieldMap: Record<string, string> = {
    patrimonio: 'patrimonio',
    'nome do bem': 'nome_bem',
    'status bem': 'status',
    'centro trab': 'centro_trab',
    serie: 'numero_serie',
    'pos.contador': 'pos_contador',
    'cont. acum.': 'contador_acumulado',
    'ult. acomp.': 'ultima_atualizacao',
    'ano fabric.': 'ano_fabricacao',
    'familia': 'familia',
    'tipo modelo': 'tipo_modelo' // NOVA COLUNA MAPEADA
  };

  for (const row of data) {
    const normalizedRow: any = {};
    Object.keys(row).forEach((key) => {
      const normalizedKey = normalizeString(key).toLowerCase();
      // Procura correspondência parcial
      const targetFieldKey = Object.keys(fieldMap).find(
        (fk) => normalizedKey === fk.toLowerCase() || normalizedKey.includes(fk.toLowerCase())
      );

      if (targetFieldKey) normalizedRow[fieldMap[targetFieldKey]] = row[key];
    });

    const pat = String(normalizedRow.patrimonio || '').trim();
    const nomeBem = String(normalizedRow.nome_bem || '').trim();
    const familia = normalizedRow.familia ? String(normalizedRow.familia).trim() : undefined;
    const tipoModelo = normalizedRow.tipo_modelo ? String(normalizedRow.tipo_modelo).trim() : undefined;

    if (!pat || pat === 'Patrimônio' || pat.toLowerCase() === 'patrimonio') {
      issues?.push({
        patrimonio: pat || undefined,
        nome_bem: nomeBem || undefined,
        reason: 'Linha ignorada: patrimônio vazio ou cabeçalho.',
      });
      continue;
    }

    processed.push({
      patrimonio: pat,
      nome_bem: normalizedRow.nome_bem || 'N/A',
      // Passa a FAMILIA e TIPO MODELO para a função de identificação
      modelo: identifyModel(normalizedRow.nome_bem || '', pat, familia, tipoModelo),
      tipo: normalizeType(pat),
      status: normalizeStatus(normalizedRow.status),
      centro_trab: normalizedRow.centro_trab || 'Geral',
      estado: detectState(normalizedRow.centro_trab || ''),
      numero_serie: String(normalizedRow.numero_serie || 'S/N'),
      pos_contador: parseNumericValue(normalizedRow.pos_contador),
      contador_acumulado: parseNumericValue(normalizedRow.contador_acumulado),
      ano_fabricacao: String(normalizedRow.ano_fabricacao || '-'),
      ultima_atualizacao: normalizedRow.ultima_atualizacao || new Date().toLocaleDateString(),
    });
  }

  return processed;
};

// --- CÁLCULOS DO DASHBOARD ---

export const calculateTO = (equipments: Equipment[]) => {
  const active = equipments.filter(
    (e) => e.status !== EquipmentStatus.INATIVO && e.status !== EquipmentStatus.VENDIDO
  );

  const total = active.length;
  const rented = active.filter((e) => e.status === EquipmentStatus.LOCADO).length;

  return {
    rate: total > 0 ? (rented / total) * 100 : 0,
    total: total,
    rented: rented,
    maintenance: active.filter((e) => e.status === EquipmentStatus.EM_MANUTENCAO).length,
  };
};

export const getAggregates = (equipments: Equipment[]): Record<string, AggregateItem> => {
  const byModel: Record<string, AggregateItem> = {};

  equipments.forEach((e) => {
    // Ignora INATIVO, VENDIDO e ACESSÓRIOS
    if (e.status === EquipmentStatus.INATIVO || e.status === EquipmentStatus.VENDIDO) return;
    if (e.modelo === 'Acessórios') return;

    if (!byModel[e.modelo]) {
      byModel[e.modelo] = {
        name: e.modelo,
        tipo: e.tipo,
        liberado: 0,
        manutencao: 0,
        locado: 0,
        total: 0,
        to: 0,
      };
    }

    if (e.status === EquipmentStatus.LOCADO) {
      byModel[e.modelo].locado++;
    } else if (e.status === EquipmentStatus.EM_MANUTENCAO) {
      byModel[e.modelo].manutencao++;
    } else if (e.status === EquipmentStatus.LIBERADO || e.status === EquipmentStatus.DEVOLUCAO) {
      byModel[e.modelo].liberado++;
    }

    byModel[e.modelo].total++;
  });

  Object.keys(byModel).forEach((m) => {
    const item = byModel[m];
    item.to = item.total > 0 ? (item.locado / item.total) * 100 : 0;
  });

  return byModel;
};