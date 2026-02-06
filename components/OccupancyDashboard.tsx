import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
    return data.filter((e) => e.estado === selectedState);
  }, [data, selectedState]);

  const stats = useMemo(() => calculateTO(filteredByState), [filteredByState]);
  const aggregates = useMemo(() => getAggregates(filteredByState), [filteredByState]);

  const sections = useMemo(() => {
    const list = Object.values(aggregates) as AggregateItem[];
    return {
      torres: list.filter((i) => i.tipo === 'Torres').sort((a, b) => b.to - a.to),
      geradores: list.filter((i) => i.tipo === 'Geradores').sort((a, b) => b.to - a.to),
      soldas: list
        .filter((i) => i.tipo === 'Solda' || i.tipo === 'Mini Rolo' || i.tipo === 'Outros')
        .sort((a, b) => b.to - a.to),
    };
  }, [aggregates]);

  const groupedTableData = useMemo(() => {
    const list = Object.values(aggregates) as AggregateItem[];
    const geradores = list.filter((i) => i.tipo === 'Geradores').sort((a, b) => b.to - a.to);
    const torres = list
      .filter((i) => i.tipo === 'Torres')
      .sort((a, b) => a.name.localeCompare(b.name));
    const soldas = list
      .filter((i) => i.tipo === 'Solda')
      .sort((a, b) => a.name.localeCompare(b.name));
    const rolos = list
      .filter((i) => i.tipo === 'Mini Rolo')
      .sort((a, b) => a.name.localeCompare(b.name));
    const outros = list
      .filter((i) => !['Geradores', 'Torres', 'Solda', 'Mini Rolo'].includes(i.tipo))
      .sort((a, b) => a.name.localeCompare(b.name));

    return [
      { title: 'Geradores', items: geradores },
      { title: 'Torres', items: torres },
      { title: 'Máquinas de Solda', items: soldas },
      { title: 'Mini Rolo', items: rolos },
      { title: 'Outros', items: outros },
    ].filter((group) => group.items.length > 0);
  }, [aggregates]);

  const ChartSection = ({ title, data }: { title: string; data: any[] }) => (
    <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-xl font-black text-accent uppercase tracking-tighter">{title}</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            Distribuição de Status
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase">
            <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" /> Liberado
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase">
            <div className="w-2.5 h-2.5 bg-orange-500 rounded-full" /> Manut.
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase">
            <div className="w-2.5 h-2.5 bg-gray-500 rounded-full" /> Locado
          </div>
        </div>
      </div>
      <div className="h-[300px] md:h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 700 }}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{
                borderRadius: '20px',
                border: 'none',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                fontSize: '11px',
              }}
            />
            <Bar dataKey="liberado" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={12} />
            <Bar dataKey="manutencao" fill="#f97316" radius={[6, 6, 0, 0]} barSize={12} />
            <Bar dataKey="locado" fill="#0F172A" radius={[6, 6, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  if (!data || data.length === 0) return null;

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-12">
      {/* State Filter - Mobile Optimized */}
      <div className="flex overflow-x-auto no-scrollbar items-center gap-3 bg-white p-3 md:p-4 rounded-3xl border border-gray-100 shadow-sm w-full md:w-fit">
        <MapPin className="text-primary shrink-0" size={18} />
        <span className="text-[10px] font-black text-accent uppercase tracking-widest shrink-0">
          Filtrar:
        </span>
        <div className="flex gap-2">
          {['TODOS', 'MG', 'PA'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedState(st as any)}
              className={`px-6 py-2 rounded-2xl text-[10px] font-black transition-all whitespace-nowrap ${
                selectedState === st
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                  : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Grid - Mobile Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <KpiCard
          title="Ocupação Média"
          value={`${stats.rate.toFixed(1)}%`}
          icon={Activity}
          color="green"
        />
        <KpiCard
          title="Locados"
          value={stats.rented}
          subtitle={`Frota: ${stats.total}`}
          icon={CheckCircle}
          color="orange"
        />
        <KpiCard title="Manutenção" value={stats.maintenance} icon={AlertTriangle} color="gray" />
        <KpiCard title="Total" value={stats.total} icon={TrendingUp} color="green" />
      </div>

      <ChartSection title="Torres" data={sections.torres} />
      <ChartSection title="Geradores" data={sections.geradores} />
      <ChartSection title="Soldas & Mini Rolo" data={sections.soldas} />

      {/* Tabela Responsiva */}
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <h3 className="text-xl font-black text-accent mb-8 uppercase tracking-tighter">
          Performance por Modelo
        </h3>
        <div className="space-y-10">
          {groupedTableData.map((group) => (
            <div key={group.title} className="animate-in fade-in duration-500">
              <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4 flex items-center gap-3">
                <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                {group.title}
              </h4>
              <div className="overflow-x-auto -mx-6 px-6 no-scrollbar">
                <table className="w-full text-left min-w-[650px]">
                  <thead>
                    <tr className="border-b border-gray-50">
                      <th className="py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                        Modelo
                      </th>
                      <th className="py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">
                        Lib.
                      </th>
                      <th className="py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">
                        Manut.
                      </th>
                      <th className="py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">
                        Locado
                      </th>
                      <th className="py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">
                        Total
                      </th>
                      <th className="py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">
                        TO %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {group.items.map((item) => (
                      <tr key={item.name} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="py-4 font-bold text-accent text-xs group-hover:text-primary transition-colors">
                          {item.name}
                        </td>
                        <td className="py-4 text-[11px] text-blue-600 font-bold text-center bg-blue-50/20">
                          {item.liberado}
                        </td>
                        <td className="py-4 text-[11px] text-orange-600 font-bold text-center">
                          {item.manutencao}
                        </td>
                        <td className="py-4 text-[11px] text-accent font-black text-center bg-gray-50/50">
                          {item.locado}
                        </td>
                        <td className="py-4 text-[11px] text-accent font-black text-center">
                          {item.total}
                        </td>
                        <td className="py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <div className="hidden sm:block w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${item.to}%` }} />
                            </div>
                            <span className="text-[11px] font-black text-primary min-w-[35px]">
                              {item.to.toFixed(0)}%
                            </span>
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
