export enum EquipmentStatus {
  LIBERADO = 'Liberado',
  LOCADO = 'Locado',
  VENDIDO = 'Vendido',
  INATIVO = 'Inativo',
  EM_MANUTENCAO = 'Em Manutenção',
  DEVOLUCAO = 'Devolução',
}

export type EquipmentType =
  | 'Torres'
  | 'Geradores'
  | 'Solda'
  | 'Mini Rolo'
  | 'Controle'
  | 'Quadros'
  | 'Sublocados'
  | 'Outros';

export interface Equipment {
  id: string;
  patrimonio: string;
  nome_bem: string;
  modelo: string;
  tipo: EquipmentType;
  status: EquipmentStatus;
  centro_trab: string;
  estado: 'MG' | 'PA' | 'Outro';
  numero_serie: string;
  pos_contador: number;
  contador_acumulado: number;
  ano_fabricacao: string;
  data_inicio_locacao?: string;
  data_fim_locacao?: string;
  ultima_atualizacao: string;
  receita?: number;
}

export interface TODataPoint {
  date: string;
  occupancyRate: number;
  totalUnits: number;
  rentedUnits: number;
}

export interface AggregateItem {
  name: string;
  tipo: EquipmentType;
  liberado: number;
  manutencao: number;
  locado: number;
  total: number;
  to: number;
}

export type UserRole = 'USUARIO' | 'GESTOR' | 'ADMIN';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export interface ChartData {
  name: string;
  liberado: number;
  manutencao: number;
  locado: number;
  to: number;
}
