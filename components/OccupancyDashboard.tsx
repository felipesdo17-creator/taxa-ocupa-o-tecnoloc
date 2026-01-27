
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, CheckCircle, AlertTriangle, TrendingUp, MapPin } from 'lucide-react';
import { Equipment, AggregateItem } from '../types';
import { calculateTO, getAggregates } from '../utils/dataProcessor';
import KpiCard from './KpiCard';

interface DashboardProps {
  data: Equipment[];
}

const OccupancyDashboard: React.FC<DashboardProps> = ({ data }) => {
  const [selectedState, setSelectedState] = useState<'TODOS' | 'MG' | 'PA'>('TODOS');

  const filteredByState = useMemo(() => {
    if (selectedState === 'TODOS') return data;
    return data.filter(e => e.estado === selectedState);
  }, [data, selectedState]);

  const stats = useMemo(() => calculateTO(filteredByState), [filteredByState]);
  const aggregates = useMemo(() => getAggregates(filteredByState), [filteredByState]);

  const sections = useMemo(() => {
    const list = Object.values(aggregates) as AggregateItem[];
    return {
      torres: list.filter(i => i.tipo === 'Torres').sort((a,b) => b.to - a.to),
      geradores: list.filter(i => i.tipo === 'Geradores').sort((a,b) => b.to - a.to),
      soldas: list.filter(i => i.tipo === 'Solda' || i.tipo === 'Mini Rolo' || i.tipo === 'Outros').sort((a,b) => b.to - a.to)
    };
  }, [aggregates]);

  // Grouped and sorted data for the performance table
  const groupedTableData = useMemo(() => {
    const list = Object.values(aggregates) as AggregateItem[];
    
    const geradores = list.filter(i => i.tipo === 'Geradores').sort((a,b) => b.to - a.to); // Ordem decrescente de TO (ou locado)
    const torres = list.filter(i => i.tipo === 'Torres').sort((a,b) => a.name.localeCompare(b.name));
    const soldas = list.filter(i => i.tipo === 'Solda').sort((a,b) => a.name.localeCompare(b.name));
    const rolos = list.filter(i => i.tipo === 'Mini Rolo').sort((a,b) => a.name.localeCompare(b.name));
    const outros = list.filter(i => !['Geradores', 'Torres', 'Solda', 'Mini Rolo'].includes(i.tipo)).sort((a,b) => a.name.localeCompare(b.name));

    return [
      { title: 'Geradores', items: geradores },
      { title: 'Torres', items: torres },
      { title: 'Máquinas de Solda', items: soldas },
      { title: 'Mini Rolo', items: rolos },
      { title: 'Outros', items: outros }
    ].filter(group => group.items.length > 0);
  }, [aggregates]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-100">
          <p className="font-bold text-accent mb-2">{label}</p>
          <div className="space-y-1 text-xs">
            <p className="flex justify-between gap-4"><span className="text-blue-600 font-medium">Liberado:</span> <b>{data.liberado}</b></p>
            <p className="flex justify-between gap-4"><span className="text-orange-600 font-medium">Manutenção:</span> <b>{data.manutencao}</b></p>
            <p className="flex justify-between gap-4"><span className="text-gray-600 font-medium">Locado:</span> <b>{data.locado}</b></p>
            <div className="h-px bg-gray-100 my-2" />
            <p className="flex justify-between gap-4 text-primary font-bold"><span>Taxa Ocupação:</span> <span>{data.to.toFixed(1)}%</span></p>
          </div>
        </div>
      );
    }
    return null;
  };

  const ChartSection = ({ title, data }: { title: string, data: any[] }) => (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-xl font-bold text-accent">{title}</h3>
          <p className="text-xs text-gray-400 mt-1">Comparativo de disponibilidade e ocupação por modelo</p>
        </div>
        <div className="flex flex-wrap gap-4">
           <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
             <div className="w-3 h-3 bg-blue-500 rounded-sm" /> Liberado
           </div>
           <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
             <div className="w-3 h-3 bg-orange-500 rounded-sm" /> Manut.
           </div>
           <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase">
             <div className="w-3 h-3 bg-gray-500 rounded-sm" /> Locado
           </div>
        </div>
      </div>
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: '#64748b', fontSize: 10}} 
                interval={0} 
                angle={-45} 
                textAnchor="end"
                height={80}
            />
            <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
            <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
            <Bar dataKey="liberado" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={10} />
            <Bar dataKey="manutencao" fill="#f97316" radius={[4, 4, 0, 0]} barSize={10} />
            <Bar dataKey="locado" fill="#64748b" radius={[4, 4, 0, 0]} barSize={10} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* State Filter */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm w-fit">
        <MapPin className="text-primary" size={20} />
        <span className="text-sm font-bold text-accent">Filtrar por Estado:</span>
        <div className="flex gap-2">
          {['TODOS', 'MG', 'PA'].map(st => (
            <button
              key={st}
              onClick={() => setSelectedState(st as any)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedState === st 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="Ocupação Média" 
          value={`${stats.rate.toFixed(1)}%`} 
          subtitle="Locados / Total"
          icon={Activity} 
          color="green"
        />
        <KpiCard 
          title="Unidades Locadas" 
          value={stats.rented} 
          subtitle={`De ${stats.total} ativos`}
          icon={CheckCircle} 
          color="orange" 
        />
        <KpiCard 
          title="Em Manutenção" 
          value={stats.maintenance} 
          icon={AlertTriangle} 
          color="gray" 
        />
        <KpiCard 
          title="Total da Frota" 
          value={stats.total} 
          icon={TrendingUp} 
          color="green" 
        />
      </div>

      <ChartSection title="Taxa de Ocupação - Torres" data={sections.torres} />
      <ChartSection title="Taxa de Ocupação - Geradores" data={sections.geradores} />
      <ChartSection title="Taxa de Ocupação - Solda & Outros" data={sections.soldas} />

      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold text-accent mb-6">Tabela de Performance por Modelo</h3>
        <div className="space-y-12">
          {groupedTableData.map(group => (
            <div key={group.title}>
              <h4 className="text-sm font-extrabold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-secondary rounded-full" />
                {group.title}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase">Modelo</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase text-center">Liberado</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase text-center">Manut.</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase text-center">Locado</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase text-center">Total</th>
                      <th className="py-4 px-4 text-[10px] font-bold text-gray-400 uppercase text-right">Ocupação (TO)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {group.items.map((item) => (
                      <tr key={item.name} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-accent text-sm">{item.name}</td>
                        <td className="py-3 px-4 text-sm text-blue-600 font-medium text-center">{item.liberado}</td>
                        <td className="py-3 px-4 text-sm text-orange-600 font-medium text-center">{item.manutencao}</td>
                        <td className="py-3 px-4 text-sm text-gray-600 font-bold text-center">{item.locado}</td>
                        <td className="py-3 px-4 text-sm text-accent font-bold text-center">{item.total}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${item.to}%` }} />
                            </div>
                            <span className="text-xs font-bold text-primary min-w-[40px]">{item.to.toFixed(1)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OccupancyDashboard;
