import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  Barcode, // Importei um ícone para ilustrar a série (opcional)
} from 'lucide-react';
import { Equipment, EquipmentStatus } from '../types';

interface EquipmentTableProps {
  data: Equipment[];
}

const EquipmentTable: React.FC<EquipmentTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter] = useState<string>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [modelFilter, setModelFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Extract unique models for the filter
  const uniqueModels = useMemo(() => {
    return Array.from(new Set(data.map((e) => e.modelo))).sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch =
        item.patrimonio.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.numero_serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.nome_bem.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      const matchesType = typeFilter === 'all' || item.tipo === typeFilter;
      const matchesState = stateFilter === 'all' || item.estado === stateFilter;
      const matchesModel = modelFilter === 'all' || item.modelo === modelFilter;
      return matchesSearch && matchesStatus && matchesType && matchesState && matchesModel;
    });
  }, [data, searchTerm, statusFilter, typeFilter, stateFilter, modelFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getStatusStyle = (status: EquipmentStatus) => {
    switch (status) {
      case EquipmentStatus.LOCADO:
        return 'bg-green-100 text-green-700 border-green-200';
      case EquipmentStatus.EM_MANUTENCAO:
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case EquipmentStatus.LIBERADO:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case EquipmentStatus.VENDIDO:
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case EquipmentStatus.DEVOLUCAO:
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Patrimonio',
      'Nome',
      'Tipo',
      'Modelo',
      'Estado',
      'Status',
      'Série',
      'Ano Fabric.',
      'Pos. Contador',
      'Cont. Acum.',
    ];
    const rows = filteredData.map((e) => [
      e.patrimonio,
      e.nome_bem,
      e.tipo,
      e.modelo,
      e.estado,
      e.status,
      e.numero_serie,
      e.ano_fabricacao,
      e.pos_contador,
      e.contador_acumulado,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers, ...rows].map((r) => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'equipamentos_filtrados.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-gray-50 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar patrimônio, série..."
              className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <button
            onClick={exportToCSV}
            className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-50 text-accent hover:bg-gray-100 rounded-xl transition-colors border border-gray-100 font-bold text-xs"
            title="Exportar CSV"
          >
            <Download size={16} /> Exportar Dados
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
            <Filter size={12} className="text-gray-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase">Filtros:</span>
          </div>

          <select
            className="px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none cursor-pointer hover:bg-gray-50"
            value={modelFilter}
            onChange={(e) => {
              setModelFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Todos Modelos</option>
            {uniqueModels.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            className="px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none cursor-pointer hover:bg-gray-50"
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Todos Estados</option>
            <option value="MG">MG</option>
            <option value="PA">PA</option>
          </select>

          <select
            className="px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-xs font-bold outline-none cursor-pointer hover:bg-gray-50"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Todos Status</option>
            {Object.values(EquipmentStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50/50 border-b border-gray-50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Ativo / Modelo
              </th>
              {/* NOVA COLUNA: SÉRIE */}
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Série
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Ano / Estado
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Status
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                Contadores
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-accent text-sm">{item.patrimonio}</span>
                    <span className="text-[10px] text-primary font-black uppercase tracking-tight">
                      {item.modelo}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium truncate max-w-[180px]">
                      {item.nome_bem}
                    </span>
                  </div>
                </td>
                
                {/* DADOS DA NOVA COLUNA: SÉRIE */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-md text-[11px] font-mono font-bold text-gray-600">
                      {item.numero_serie}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-accent">{item.ano_fabricacao}</span>
                    <div className="flex items-center gap-1">
                      <MapPin size={10} className="text-primary" />
                      <span className="text-[10px] text-gray-400 font-bold">{item.estado}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase border ${getStatusStyle(item.status)}`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-6">
                    <div className="text-center">
                      <p className="text-xs font-bold text-accent">
                        {item.pos_contador.toLocaleString()}
                      </p>
                      <p className="text-[9px] text-gray-400 font-medium">Pos. Cont</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold text-accent">
                        {item.contador_acumulado.toLocaleString()}
                      </p>
                      <p className="text-[9px] text-gray-400 font-medium">Cont. Acum</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-gray-300 hover:text-primary transition-colors">
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredData.length === 0 && (
        <div className="p-12 text-center">
          <p className="text-gray-400 font-medium">
            Nenhum equipamento encontrado para os filtros selecionados.
          </p>
        </div>
      )}

      <div className="p-6 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
          Mostrando {paginatedData.length} de {filteredData.length} itens
        </span>

        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="p-1.5 bg-white rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition-all shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="px-3 py-1 bg-white rounded-lg border border-gray-200 text-[10px] font-bold text-accent shadow-sm">
            {currentPage} / {totalPages || 1}
          </div>
          <button
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="p-1.5 bg-white rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 transition-all shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentTable;