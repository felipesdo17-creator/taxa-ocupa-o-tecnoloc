import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Info } from 'lucide-react';
import { processRawData, normalizeString, ImportIssue } from '../utils/dataProcessor';
import { Equipment } from '../types';
import { supabase } from '../lib/supabase';

interface FileUploadProps {
  onDataLoaded: (data: Equipment[]) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null); // Novo estado para avisos
  const [importIssues, setImportIssues] = useState<ImportIssue[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const XLSX = (window as any).XLSX;
    
    // Verificações iniciais
    if (!XLSX) return setError('Erro de Sistema: Biblioteca XLSX não encontrada.');
    if (!supabase) return setError('Erro de Sistema: Supabase não conectado.');

    setLoading(true);
    setError(null);
    setWarning(null);
    setProgress(10);
    setImportIssues([]);

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        // 1. Leitura do Arquivo
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];

        // Encontrar cabeçalho (linha do "Patrimônio")
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headerRowIndex = rawRows.findIndex((row) =>
          row.some((cell) => normalizeString(String(cell || '')).includes('PATRIMONIO'))
        );

        if (headerRowIndex === -1) throw new Error('Coluna "Patrimônio" não encontrada.');

        // Converter para JSON a partir do cabeçalho
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          range: headerRowIndex,
          defval: '', // Garante que células vazias não quebrem a leitura
          blankrows: false
        });

        console.log(`Linhas brutas detectadas: ${jsonData.length}`);
        
        // --- TRAVA DE SEGURANÇA: ALERTA DE 1000 LINHAS ---
        if (jsonData.length === 1000) {
          setWarning(
            "Atenção: O arquivo possui EXATAMENTE 1000 linhas. Isso geralmente indica que a exportação do sistema foi cortada na primeira página."
          );
        }

        setProgress(40);

        // 2. Processamento (Sem filtros de Status)
        const issues: ImportIssue[] = [];
        const processed = processRawData(jsonData, issues);
        setImportIssues(issues);

        if (processed.length === 0) throw new Error('Nenhum dado válido encontrado.');

        setProgress(60);

        // 3. Limpeza do Banco de Dados (Reset Total)
        const { error: deleteError } = await supabase
          .from('equipments')
          .delete()
          .not('id', 'is', null);

        if (deleteError) throw deleteError;

        setProgress(80);

        // 4. Inserção em Lotes (Batch Insert) para aguentar 3000+ itens
        const BATCH_SIZE = 500;
        for (let i = 0; i < processed.length; i += BATCH_SIZE) {
          const batch = processed.slice(i, i + BATCH_SIZE);
          const { error: insertError } = await (supabase.from('equipments') as any).insert(batch);
          if (insertError) throw insertError;
        }

        setProgress(100);

        // Sucesso
        setTimeout(() => {
          onDataLoaded(processed as Equipment[]);
          setLoading(false);
          alert(`Sucesso! ${processed.length} equipamentos carregados.`);
        }, 500);

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Erro desconhecido ao processar.');
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Erro ao ler o arquivo físico.');
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4">
      <div
        className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
          isDragging ? 'border-primary bg-primary/5 scale-105' : 'border-gray-200 bg-white shadow-sm'
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        {!loading ? (
          <>
            <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
              <Upload size={32} />
            </div>
            <h2 className="text-2xl font-black text-accent mb-2 uppercase tracking-tighter italic">
              Importar Frota Completa
            </h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed text-xs font-medium">
              Arraste seu arquivo único (.xlsx ou .csv) contendo todos os equipamentos.
            </p>
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".xlsx,.csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-10 py-4 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all"
            >
              Selecionar Arquivo
            </button>
          </>
        ) : (
          <div className="py-10">
            <Loader2 className="animate-spin text-primary w-12 h-12 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-accent">Processando...</h3>
            <p className="text-sm text-gray-500">{progress}% concluído</p>
          </div>
        )}

        {/* Exibição de Erros */}
        {error && (
          <div className="mt-8 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-600 text-xs font-bold uppercase animate-shake">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* Exibição de Alertas (Ex: Arquivo cortado em 1000) */}
        {warning && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-200 flex items-center gap-3 text-yellow-800 text-xs font-bold text-left">
            <Info size={24} className="shrink-0" />
            <span>{warning}</span>
          </div>
        )}
      </div>

      {/* Tabela de Ignorados (se houver) */}
      {importIssues.length > 0 && (
        <div className="mt-10 bg-white border border-amber-100 rounded-2xl p-6 shadow-sm">
          <h3 className="text-amber-700 font-bold mb-2 flex items-center gap-2">
            <AlertCircle size={16} /> Linhas não importadas: {importIssues.length}
          </h3>
          <div className="max-h-64 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-amber-800 border-b border-amber-100">
                  <th className="py-2">Patrimônio</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {importIssues.map((issue, idx) => (
                  <tr key={idx} className="border-b border-amber-50 text-gray-600">
                    <td className="py-2 font-mono">{issue.patrimonio || '-'}</td>
                    <td>{issue.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;