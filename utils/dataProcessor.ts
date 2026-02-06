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

/**
 * Categoriza TORRES DE ILUMINAÇÃO conforme classes comerciais oficiais.
 * Retornos possíveis:
 * - "Torre de Iluminação V5+"
 * - "Torre de Iluminação Solar"
 * - "Torre de Iluminação Autônoma"
 * - "Torre de Iluminação LED"
 * - "Torre de Iluminação Convencional"
 *
 * ORDEM (obrigatória): V5+ -> Solar -> Autônoma -> LED -> Convencional (fallback)
 */
export function categorizeTorreIluminacao(nome: string, patrimonio?: string): string | null {
  const n = normalizeString(nome);
  const p = normalizeString(patrimonio || '');
  const combined = `${n} ${p}`;

  const isTorre =
    combined.includes('TORRE') ||
    combined.includes('ILUMINACAO') ||
    combined.includes('ILUMIN') ||
    combined.includes('V5') ||
    combined.includes('VS') ||
    p.startsWith('AT');

  if (!isTorre) return null;

  const includesAny = (keywords: string[]) => keywords.some((k) => combined.includes(k));

  const v5Keywords = [
    // padrão oficial
    'V5+',
    // variações comuns de cadastro (ex.: "VS+LED", "VS LED ATLAS")
    'VS+LED',
    'VS+ LED',
    'VS LED',
    'VS-LED',
    'V5 LED',
    'V5-LED',
    'V5+LED',
    // nomes comerciais vistos na frota
    'HILIGHT V5',
    'V5+LED ATLAS',
    'VS LED ATLAS',
    'VS+LED ATLAS',
  ];

  const solarKeywords = ['SOLAR', 'FOTOVOLTAICO', '300W', 'MOD04', 'MOD06', 'MOD08'];

  const autonomaKeywords = ['AUT', 'AUT.', 'AUTON', 'AUTONOMA', '3TNV AUT'];

  const ledKeywords = ['LED'];

  // 1) V5+
  if (includesAny(v5Keywords)) return 'Torre de Iluminação V5+';
  // 2) Solar
  if (includesAny(solarKeywords)) return 'Torre de Iluminação Solar';
  // 3) Autônoma
  if (includesAny(autonomaKeywords)) return 'Torre de Iluminação Autônoma';
  // 4) LED (somente se não cair nas anteriores)
  if (includesAny(ledKeywords)) return 'Torre de Iluminação LED';
  // 5) Convencional (fallback)
  return 'Torre de Iluminação Convencional';
}

/**
 * Categoriza equipamento GRUPO GERADOR conforme classes comerciais oficiais.
 * REGRA: não considerar apenas potência exata; seguir as categorias abaixo.
 * Retorna exatamente "Grupo Gerador XXKVA" ou null se não for gerador.
 */
export function categorizeGrupoGerador(nome: string, patrimonio?: string): string | null {
  const n = normalizeString(nome);
  const p = normalizeString(patrimonio || '');
  const combined = `${n} ${p}`;

  const knownMfgRegex = /\b(?:CUMMINS|GENERAC|STEMAC|ATLAS|PRAMAC|WACKER|HIMOINSA|BRANCO|GSW|VANTAGE|RANGER)\b/;
  const isGerador =
    combined.includes('GERADOR') ||
    combined.includes('KVA') ||
    p.match(/^(GG|GA|CG|GS|GH|GB|GW)/) ||
    knownMfgRegex.test(combined);

  if (!isGerador) return null;

  // helper: regex builders and matcher
  const matchRegex = (r: RegExp) => r.test(combined);
  const kva = (n: number) => new RegExp(`\\b${n}(?:\\s*\\/\\s*\\d+)?\\s*KVA\\b`);
  const anyKva = (numbers: number[]) => numbers.some((x) => matchRegex(kva(x)));

  // 1) Grupo Gerador 19KVA — ex: BRANCO DIESEL 19 KVA, BRANCO DIESEL 19 KVA 127/2
  if (anyKva([19]) || combined.includes('BRANCO DIESEL 19')) return 'Grupo Gerador 19KVA';

  // 2) Grupo Gerador 22KVA — ex: PRAMAC 22 KVA
  if (combined.includes('PRAMAC 22') || anyKva([22])) return 'Grupo Gerador 22KVA';

  // 3) Grupo Gerador 33KVA — ex: BRANCO DIESEL 33 KVA
  if (anyKva([33])) return 'Grupo Gerador 33KVA';

  // 4) Grupo Gerador 55KVA — faixa ~48–60 KVA + regra comercial
  if (
    combined.includes('ATLAS COPCO QAS 55') ||
    combined.includes('QAS 55') ||
    combined.includes('C40D6') ||
    combined.includes('BRANCO 48') ||
    combined.includes('STEMAC 55/50') ||
    combined.includes('WACKER NEUSON 52') ||
    anyKva([48, 52, 53, 55, 59, 60])
  )
    return 'Grupo Gerador 55KVA';

  // 5) Grupo Gerador 81KVA — ~75–81 KVA
  if (
    combined.includes('STEMAC 81/78') ||
    combined.includes('WACKER NEUSON 75') ||
    anyKva([75, 80, 81])
  )
    return 'Grupo Gerador 81KVA';

  // 6) Grupo Gerador 120KVA — ~105–127 KVA
  if (
    combined.includes('ATLAS QAS 105') ||
    combined.includes('QAS 105') ||
    combined.includes('HIMOINSA 125') ||
    combined.includes('WACKER NEUSON 121') ||
    anyKva([105, 116, 120, 121, 125, 127])
  )
    return 'Grupo Gerador 120KVA';

  // 7) Grupo Gerador 150KVA — ~140–150 KVA
  if (
    combined.includes('STEMAC 150/141') ||
    combined.includes('WACKER NEUSON 150') ||
    anyKva([140, 150])
  )
    return 'Grupo Gerador 150KVA';

  // 8) Grupo Gerador 170KVA
  if (combined.includes('CUMMINS 170') || combined.includes('STEMAC 180/168') || anyKva([168, 170, 180]))
    return 'Grupo Gerador 170KVA';

  // 9) Grupo Gerador 200KVA
  if (combined.includes('STEMAC 200/180') || combined.includes('CUMMINS 212') || anyKva([200, 212]))
    return 'Grupo Gerador 200KVA';

  // 10) Grupo Gerador 260KVA
  if (combined.includes('CUMMINS 260') || combined.includes('STEMAC 260/240') || anyKva([260]))
    return 'Grupo Gerador 260KVA';

  // 11) Grupo Gerador 360KVA
  if (combined.includes('CUMMINS 385') || combined.includes('STEMAC 360/325') || anyKva([360, 385]))
    return 'Grupo Gerador 360KVA';

  // 12) Grupo Gerador 500KVA — aceitar variantes como "500KVA", "500 KVA", "500/455 KVA", e menções do fabricante
  if (
    combined.includes('CUMMINS 500') ||
    combined.includes('GENERAC 500') ||
    combined.includes('STEMAC 500/455') ||
    matchRegex(/\b500(?:\s*\/\s*\d+)?\s*KVA\b/)
  )
    return 'Grupo Gerador 500KVA';

  return null;
}

export const identifyModel = (nome: string, patrimonio: string): string => {
  const n = normalizeString(nome);
  const p = normalizeString(patrimonio);
  const combined = `${n} ${p}`;

  // Torres
  const torreCategoria = categorizeTorreIluminacao(nome, patrimonio);
  if (torreCategoria) return torreCategoria;

  // Geradores - CLASSES COMERCIAIS OFICIAIS (não usar apenas potência exata do nome)
  const isGerador =
    combined.includes('GERADOR') ||
    combined.includes('KVA') ||
    p.match(/^(GG|GA|CG|GS|GH|GB|GW)/);

  if (isGerador) {
    const categoria = categorizeGrupoGerador(nome, patrimonio);
    if (categoria) return categoria;

    // Fallback numérico por faixa (só quando não houver match por nome/modelo)
    const kvaMatch = combined.match(/(\d+)\s?KVA/);
    if (kvaMatch) {
      const v = parseInt(kvaMatch[1]);

      if (v >= 19 && v <= 21) return 'Grupo Gerador 19KVA';
      if (v >= 22 && v <= 25) return 'Grupo Gerador 22KVA';
      if (v >= 30 && v <= 35) return 'Grupo Gerador 33KVA';
      if (v >= 48 && v <= 65) return 'Grupo Gerador 55KVA';
      if (v >= 75 && v <= 85) return 'Grupo Gerador 81KVA';
      if (v >= 105 && v <= 127) return 'Grupo Gerador 120KVA';
      if (v >= 140 && v <= 160) return 'Grupo Gerador 150KVA';
      if (v >= 168 && v <= 185) return 'Grupo Gerador 170KVA';
      if (v >= 200 && v <= 230) return 'Grupo Gerador 200KVA';
      if (v >= 240 && v <= 280) return 'Grupo Gerador 260KVA';
      if (v >= 300 && v <= 400) return 'Grupo Gerador 360KVA';
      if (v >= 450 && v <= 550) return 'Grupo Gerador 500KVA';
    }
  }

  // Solda & Outros
  if (combined.includes('PIPEPRO')) return 'Solda PipePro';
  if (combined.includes('PIPEWORX')) return 'Solda PipeWorx';
  if (combined.includes('RANGER') || combined.includes('VANTAGE')) return 'Moto Soldadora';
  if (combined.includes('MEGAFORCE')) return 'Megaforce 300i';
  if (combined.includes('LHI')) return 'Solda LHI ESAB';
  if (combined.includes('CST') || combined.includes('CST280')) return 'Inversora CST';
  if (combined.includes('FLEXTEC')) return 'Flextec 450/650';
  if (combined.includes('XMT') || combined.includes('XMT350')) return 'Solda XMT Miller';
  if (combined.includes('CV400') || combined.includes('CV-400I')) return 'Fonte CV400';
  if (combined.includes('LN25') || combined.includes('LN7') || combined.includes('LF72'))
    return 'Alimentador de Arame';
  if (combined.includes('X-TREME') || combined.includes('12VS') || combined.includes('SUITCASE'))
    return 'Suitcase X-Treme';
  if (combined.includes('ROBO') || combined.includes('BURRO') || p.startsWith('ET'))
    return 'Robo Burro XL';
  if (combined.includes('RT56') || combined.includes('RT82') || combined.includes('ROLO'))
    return 'Rolo compactador';

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

export const processRawData = (data: any[], issues?: ImportIssue[]): Partial<Equipment>[] => {
  const seen = new Set<string>();
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
  };

  for (const row of data) {
    const normalizedRow: any = {};
    Object.keys(row).forEach((key) => {
      const normalizedKey = normalizeString(key).toLowerCase();
      const targetFieldKey = Object.keys(fieldMap).find(
        (fk) => normalizedKey === fk.toLowerCase() || normalizedKey.includes(fk.toLowerCase())
      );

      if (targetFieldKey) normalizedRow[fieldMap[targetFieldKey]] = row[key];
    });

    const pat = String(normalizedRow.patrimonio || '').trim();
    const nomeBem = String(normalizedRow.nome_bem || '').trim();

    // Linha ignorada: patrimônio vazio ou cabeçalho
    if (!pat || pat === 'Patrimônio' || pat.toLowerCase() === 'patrimonio') {
      issues?.push({
        patrimonio: pat || undefined,
        nome_bem: nomeBem || undefined,
        reason: 'Linha ignorada: patrimônio vazio ou cabeçalho da planilha.',
      });
      continue;
    }

    // ALTERAÇÃO: Verificação de duplicidade baseada APENAS em Patrimônio e Nome (ignorando Nº Série)
    const uniqueKey = `${pat}-${nomeBem}`;
    
    if (seen.has(uniqueKey)) {
      issues?.push({
        patrimonio: pat,
        nome_bem: nomeBem || undefined,
        reason: 'Linha ignorada: patrimônio + nome duplicados na planilha.',
      });
      continue;
    }
    seen.add(uniqueKey);

    processed.push({
      patrimonio: pat,
      nome_bem: normalizedRow.nome_bem || 'N/A',
      modelo: identifyModel(normalizedRow.nome_bem || '', pat),
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
    if (e.status === EquipmentStatus.INATIVO || e.status === EquipmentStatus.VENDIDO) return;

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