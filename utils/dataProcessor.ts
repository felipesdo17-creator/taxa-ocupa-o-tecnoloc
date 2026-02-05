import { Equipment, EquipmentStatus, EquipmentType, AggregateItem } from '../types';
import { STATUS_MAPPING, TYPE_PREFIXES } from '../constants';

export const normalizeString = (str: string) =>
  String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

const identifyModel = (nome: string, patrimonio: string): string => {
  const n = normalizeString(nome);
  const p = normalizeString(patrimonio);
  const combined = `${n} ${p}`;

  // Torres
  if (
    combined.includes('SOLAR') ||
    combined.includes('300W') ||
    combined.includes('MOD04') ||
    combined.includes('MOD06') ||
    combined.includes('MOD08')
  )
    return 'Torre Solar';
  if (combined.includes('AUT') || combined.includes('AUTONOMA') || combined.includes('3TNV AUT'))
    return 'Torre Autônoma';
  if (combined.includes('V5+') || combined.includes('HILIGHT V5')) return 'V5+ LED';
  if (combined.includes('LED')) return 'Torre LED';
  if (
    combined.includes('ALLMAND') ||
    combined.includes('WACKER') ||
    combined.includes('TEREX') ||
    combined.includes('RL 4000') ||
    combined.includes('QLT M20')
  )
    return 'Torre Convencional';

  // Geradores - Novas Regras de Classes Comerciais
  const isGerador =
    combined.includes('GERADOR') || combined.includes('KVA') || p.match(/^(GG|GA|CG|GS|GH|GB|GW)/);
  if (isGerador) {
    // 1) Grupo Gerador 19KVA
    if (combined.includes('19 KVA') || combined.includes('19KVA')) return 'Grupo Gerador 19KVA';

    // 2) Grupo Gerador 22KVA
    if (combined.includes('PRAMAC 22') || combined.includes('22 KVA')) return 'Grupo Gerador 22KVA';

    // 3) Grupo Gerador 33KVA
    if (combined.includes('33 KVA') || combined.includes('33KVA')) return 'Grupo Gerador 33KVA';

    // 4) Grupo Gerador 55KVA (Faixa 48 a 60 KVA e Regras Especiais)
    if (
      combined.includes('QAS 55') ||
      combined.includes('C40D6') ||
      combined.includes('53 KVA') ||
      combined.includes('STEMAC 55/50') ||
      combined.includes('WACKER 52') ||
      combined.includes('PRAMAC 60') ||
      combined.includes('GENERAC 59') ||
      combined.includes('BRANCO 48') ||
      combined.includes('55 KVA') ||
      combined.includes('60 KVA')
    ) {
      return 'Grupo Gerador 55KVA';
    }

    // 5) Grupo Gerador 81KVA (Faixa 75 a 81 KVA)
    if (
      combined.includes('STEMAC 81/78') ||
      combined.includes('WACKER 75') ||
      combined.includes('CUMMINS 81') ||
      combined.includes('CUMMINS 80') ||
      combined.includes('PRAMAC 80') ||
      combined.includes('81 KVA') ||
      combined.includes('80 KVA')
    ) {
      return 'Grupo Gerador 81KVA';
    }

    // 6) Grupo Gerador 120KVA (Faixa 105 a 127 KVA)
    if (
      combined.includes('QAS 105') ||
      combined.includes('HIMOINSA 125') ||
      combined.includes('WACKER 121') ||
      combined.includes('GENERAC 127') ||
      combined.includes('PRAMAC 127') ||
      combined.includes('CUMMINS 116') ||
      combined.includes('CUMMINS 120') ||
      combined.includes('CUMMINS 125') ||
      combined.includes('120 KVA') ||
      combined.includes('127 KVA')
    ) {
      return 'Grupo Gerador 120KVA';
    }

    // 7) Grupo Gerador 150KVA (Faixa 140 a 150 KVA)
    if (
      combined.includes('CUMMINS 140') ||
      combined.includes('CUMMINS 150') ||
      combined.includes('GENERAC 140') ||
      combined.includes('GENERAC 150') ||
      combined.includes('STEMAC 150/141') ||
      combined.includes('WACKER 150') ||
      combined.includes('150 KVA') ||
      combined.includes('140 KVA')
    ) {
      return 'Grupo Gerador 150KVA';
    }

    // 8) Grupo Gerador 170KVA
    if (
      combined.includes('CUMMINS 170') ||
      combined.includes('STEMAC 180/168') ||
      combined.includes('170 KVA')
    )
      return 'Grupo Gerador 170KVA';

    // 9) Grupo Gerador 200KVA
    if (
      combined.includes('STEMAC 200/180') ||
      combined.includes('CUMMINS 212') ||
      combined.includes('200 KVA') ||
      combined.includes('212 KVA')
    )
      return 'Grupo Gerador 200KVA';

    // 10) Grupo Gerador 260KVA
    if (
      combined.includes('CUMMINS 260') ||
      combined.includes('STEMAC 260/240') ||
      combined.includes('260 KVA')
    )
      return 'Grupo Gerador 260KVA';

    // 11) Grupo Gerador 360KVA
    if (
      combined.includes('CUMMINS 385') ||
      combined.includes('STEMAC 360/325') ||
      combined.includes('360 KVA') ||
      combined.includes('385 KVA')
    )
      return 'Grupo Gerador 360KVA';

    // 12) Grupo Gerador 500KVA
    if (
      combined.includes('CUMMINS 500') ||
      combined.includes('GENERAC 500') ||
      combined.includes('STEMAC 500/455') ||
      combined.includes('500 KVA')
    )
      return 'Grupo Gerador 500KVA';

    // Fallback numérico se não encontrar palavra-chave exata
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

export const processRawData = (data: any[]): Partial<Equipment>[] => {
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
    if (!pat || pat === 'Patrimônio' || pat.toLowerCase() === 'patrimonio') continue;

    const uniqueKey = `${pat}-${normalizedRow.numero_serie}`;
    if (seen.has(uniqueKey)) continue;
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
