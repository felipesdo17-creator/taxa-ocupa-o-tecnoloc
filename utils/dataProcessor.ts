
import { Equipment, EquipmentStatus, EquipmentType, AggregateItem } from '../types';
import { STATUS_MAPPING, TYPE_PREFIXES } from '../constants';

export const normalizeString = (str: string) => 
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

const identifyModel = (nome: string, patrimonio: string): string => {
  const n = normalizeString(nome);
  const p = normalizeString(patrimonio);
  const combined = `${n} ${p}`;

  // Torres
  if (combined.includes("SOLAR") || combined.includes("300W") || combined.includes("MOD04") || combined.includes("MOD06") || combined.includes("MOD08")) return "Torre Solar";
  if (combined.includes("AUT") || combined.includes("AUTONOMA") || combined.includes("3TNV AUT")) return "Torre Autônoma";
  if (combined.includes("V5+") || combined.includes("HILIGHT V5")) return "V5+ LED";
  if (combined.includes("LED")) return "Torre LED";
  if (combined.includes("ALLMAND") || combined.includes("WACKER") || combined.includes("TEREX") || combined.includes("RL 4000") || combined.includes("QLT M20")) return "Torre Convencional";

  // Geradores
  if (combined.includes("QAS 55")) return "Gerador 55 Kva";
  if (combined.includes("QAS 105") || combined.includes("QAS 120")) return "Gerador 120 Kva";
  
  const kvaMatch = combined.match(/(\d+)\s?KVA/);
  if (kvaMatch) {
    const v = parseInt(kvaMatch[1]);
    if (v >= 19 && v <= 20) return "Gerador 19 Kva";
    if (v > 20 && v <= 25) return "Gerador 22 Kva";
    if (v >= 30 && v <= 35) return "Gerador 33 Kva";
    if (v >= 45 && v <= 50) return "Gerador 48 Kva";
    if ([50, 52, 53, 55, 59, 60].includes(v)) return "Gerador 55/60 Kva";
    if (v >= 75 && v <= 85) return "Gerador 81 Kva";
    if (v >= 105 && v <= 125) return "Gerador 120 Kva";
    if (v >= 140 && v <= 160) return "Gerador 150 Kva";
    if (v >= 170 && v <= 175) return "Gerador 170 Kva";
    if (v >= 180 && v <= 210) return "Gerador 200 Kva";
    if (v >= 250 && v <= 270) return "Gerador 260 Kva";
    if (v >= 300 && v <= 390) return "Gerador 360 Kva";
    if (v >= 450 && v <= 550) return "Gerador 500 Kva";
  }

  // Solda & Outros
  if (combined.includes("PIPEPRO")) return "Solda PipePro";
  if (combined.includes("PIPEWORX")) return "Solda PipeWorx";
  if (combined.includes("RANGER") || combined.includes("VANTAGE")) return "Moto Soldadora";
  if (combined.includes("MEGAFORCE")) return "Megaforce 300i";
  if (combined.includes("LHI")) return "Solda LHI ESAB";
  if (combined.includes("CST") || combined.includes("CST280")) return "Inversora CST";
  if (combined.includes("FLEXTEC")) return "Flextec 450/650";
  if (combined.includes("XMT") || combined.includes("XMT350")) return "Solda XMT Miller";
  if (combined.includes("CV400") || combined.includes("CV-400I")) return "Fonte CV400";
  if (combined.includes("LN25") || combined.includes("LN7") || combined.includes("LF72")) return "Alimentador de Arame";
  if (combined.includes("X-TREME") || combined.includes("12VS") || combined.includes("SUITCASE")) return "Suitcase X-Treme";
  if (combined.includes("ROBO") || combined.includes("BURRO") || p.startsWith("ET")) return "Robo Burro XL";
  if (combined.includes("RT56") || combined.includes("RT82") || combined.includes("ROLO")) return "Rolo compactador";

  return "Outros";
};

export const normalizeType = (patrimonio: string): EquipmentType => {
  const cleanPat = normalizeString(patrimonio).toUpperCase();
  const prefix = Object.keys(TYPE_PREFIXES).find(p => cleanPat.startsWith(p));
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
  if (c.includes("MG") || c.includes("CONTAGEM") || c.includes("BELO HORIZONTE")) return "MG";
  if (c.includes("PA") || c.includes("PARAUAPEBAS") || c.includes("CANAA")) return "PA";
  return "Outro";
};

export const processRawData = (data: any[]): Equipment[] => {
  const seen = new Set<string>();
  const processed: Equipment[] = [];

  const fieldMap: Record<string, string> = {
    'patrimonio': 'patrimonio',
    'nome do bem': 'nome_bem',
    'status bem': 'status',
    'centro trab': 'centro_trab',
    'serie': 'numero_serie',
    'pos.contador': 'pos_contador',
    'cont. acum.': 'contador_acumulado',
    'ult. acomp.': 'ultima_atualizacao',
    'ano fabric.': 'ano_fabricacao'
  };

  for (const row of data) {
    const normalizedRow: any = {};
    Object.keys(row).forEach(key => {
      const normalizedKey = normalizeString(key).toLowerCase();
      // Match exact or contains for better robustness
      const targetFieldKey = Object.keys(fieldMap).find(fk => 
        normalizedKey === fk.toLowerCase() || 
        normalizedKey.includes(fk.toLowerCase())
      );
      
      if (targetFieldKey) normalizedRow[fieldMap[targetFieldKey]] = row[key];
    });

    const pat = String(normalizedRow.patrimonio || '').trim();
    if (!pat || pat === 'Patrimônio' || pat.toLowerCase() === 'patrimonio') continue;

    const uniqueKey = `${pat}-${normalizedRow.numero_serie}`;
    if (seen.has(uniqueKey)) continue;
    seen.add(uniqueKey);

    processed.push({
      id: crypto.randomUUID(),
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
      ultima_atualizacao: normalizedRow.ultima_atualizacao || new Date().toLocaleDateString()
    });
  }

  return processed;
};

export const calculateTO = (equipments: Equipment[]) => {
  const active = equipments.filter(e => e.status !== EquipmentStatus.INATIVO && e.status !== EquipmentStatus.VENDIDO);
  const total = active.length;
  const rented = active.filter(e => e.status === EquipmentStatus.LOCADO).length;

  return {
    rate: total > 0 ? (rented / total) * 100 : 0,
    total: total,
    rented: rented,
    maintenance: active.filter(e => e.status === EquipmentStatus.EM_MANUTENCAO).length
  };
};

export const getAggregates = (equipments: Equipment[]): Record<string, AggregateItem> => {
  const byModel: Record<string, AggregateItem> = {};

  equipments.forEach(e => {
    if (e.status === EquipmentStatus.INATIVO || e.status === EquipmentStatus.VENDIDO) return;
    
    if (!byModel[e.modelo]) {
      byModel[e.modelo] = { 
        name: e.modelo, 
        tipo: e.tipo,
        liberado: 0, 
        manutencao: 0, 
        locado: 0, 
        total: 0,
        to: 0 
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

  Object.keys(byModel).forEach(m => {
    const item = byModel[m];
    item.to = item.total > 0 ? (item.locado / item.total) * 100 : 0;
  });

  return byModel;
};
