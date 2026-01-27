
import { EquipmentStatus, EquipmentType } from './types';

export const STATUS_MAPPING: Record<string, EquipmentStatus> = {
  '0': EquipmentStatus.LIBERADO,
  '00': EquipmentStatus.LIBERADO,
  '20': EquipmentStatus.LOCADO,
  '40': EquipmentStatus.VENDIDO,
  '50': EquipmentStatus.DEVOLUCAO,
  '66': EquipmentStatus.INATIVO,
  '90': EquipmentStatus.EM_MANUTENCAO
};

export const TYPE_PREFIXES: Record<string, EquipmentType> = {
  'AT': 'Torres',
  'GG': 'Geradores',
  'GA': 'Geradores',
  'CG': 'Geradores',
  'GS': 'Geradores',
  'GH': 'Geradores',
  'GB': 'Geradores',
  'GW': 'Geradores',
  'P15': 'Solda',
  'P21': 'Solda',
  'P14': 'Solda',
  'WC': 'Mini Rolo',
  'CR': 'Controle',
  'QT': 'Quadros',
  'SB': 'Sublocados'
};

export const REQUIRED_FIELDS: (keyof any)[] = [
  'patrimonio',
  'nome_bem',
  'status',
  'centro_trab',
  'numero_serie',
  'pos_contador',
  'contador_acumulado'
];
