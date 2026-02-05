import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { processRawData, normalizeString } from '../utils/dataProcessor';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    const XLSX = (window as any).XLSX;
    if (!XLSX) {
      setError('Erro de Sistema: Biblioteca SheetJS (XLSX) não detectada.');
      return;
    }

    if (!supabase) {
      setError('Erro de Sistema: Conexão com Supabase não inicializada.');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(10);

    // Passo 1: Leitura Local do Arquivo
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result;
        if (!(arrayBuffer instanceof ArrayBuffer)) {
          throw new Error('Falha na leitura do arquivo.');
        }

        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const searchTerm = normalizeString('Patrimônio');
        const headerRowIndex = rawRows.findIndex((row) =>
          row.some((cell) => normalizeString(String(cell || '')).includes(searchTerm))
        );

        if (headerRowIndex === -1) {
          throw new Error('Coluna "Patrimônio" não encontrada na planilha.');
        }

        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          range: headerRowIndex,
          defval: '',
        });

        setProgress(40);

        const processed = processRawData(jsonData);
        if (processed.length === 0) {
          throw new Error('Nenhum equipamento válido encontrado para processamento.');
        }

        setProgress(60);

        // Passo 2: Upload opcional para Storage (tentamos, mas não bloqueamos se o bucket não existir)
        try {
          await supabase.storage
            .from('uploads')
            .upload(`planilhas/${Date.now()}_${file.name}`, file, {
              cacheControl: '3600',
              upsert: true,
            });
        } catch (sErr) {
          console.warn('Storage inacessível, continuando apenas com o Banco de Dados.', sErr);
        }

        setProgress(70);

        // Passo 3: Limpeza e Inserção no Banco de Dados
        // Para uma sincronização de frota, geralmente limpamos e inserimos os novos dados
        // ou usamos uma lógica de UPSERT baseada no patrimônio.

        // Aqui, removemos os dados antigos para garantir que o dashboard reflita exatamente a planilha enviada
        const { error: deleteError } = await supabase
          .from('equipments')
          .delete()
          .not('id', 'is', null); // Limpa tudo

        if (deleteError) throw deleteError;

        const { error: insertError } = await (supabase.from('equipments') as any).insert(processed);

        if (insertError) throw insertError;

        setProgress(100);

        // Feedback visual de sucesso
        setTimeout(() => {
          onDataLoaded(processed as Equipment[]);
          setLoading(false);
          alert(`Sucesso! ${processed.length} equipamentos foram sincronizados.`);
        }, 500);
      } catch (err: any) {
        console.error('Erro no processamento:', err);
        setError(err.message || 'Erro inesperado no processamento.');
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Erro físico de leitura do arquivo no navegador.');
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="max-w-4xl mx-auto mt-12 px-4">
      <div
        className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
          isDragging
            ? 'border-primary bg-primary/5 scale-105'
            : 'border-gray-200 bg-white shadow-sm'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        {!loading ? (
          <>
            <div className="bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
              <Upload size={32} />
            </div>
            <h2 className="text-2xl font-black text-accent mb-2 uppercase tracking-tighter italic">
              Sincronizar Frota
            </h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed text-xs font-medium">
              Arraste a planilha de equipamentos aqui. O sistema atualizará o banco de dados e
              recalculará as taxas de ocupação instantaneamente.
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
              className="px-10 py-4 bg-accent text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black active:scale-95 transition-all"
            >
              Escolher Arquivo
            </button>
          </>
        ) : (
          <div className="py-10">
            <div className="relative w-20 h-20 mx-auto mb-8">
              <Loader2 className="animate-spin text-primary w-full h-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-black text-primary">{progress}%</span>
              </div>
            </div>
            <h3 className="text-xl font-black text-accent mb-4 uppercase tracking-tighter italic">
              Sincronizando Sistemas...
            </h3>
            <div className="w-full max-w-md mx-auto h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3 text-red-600 text-[10px] font-bold uppercase tracking-wider animate-shake">
            <AlertCircle size={18} className="shrink-0" />
            <span className="text-left">{error}</span>
          </div>
        )}
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
        <div className="flex gap-4 p-5 rounded-2xl bg-white border border-gray-100">
          <FileSpreadsheet className="text-blue-500 shrink-0" size={20} />
          <div className="text-[9px] font-black uppercase tracking-widest text-accent">
            Parsing SheetJS v0.20
          </div>
        </div>
        <div className="flex gap-4 p-5 rounded-2xl bg-white border border-gray-100">
          <CheckCircle className="text-green-500 shrink-0" size={20} />
          <div className="text-[9px] font-black uppercase tracking-widest text-accent">
            DB Sync Supabase
          </div>
        </div>
        <div className="flex gap-4 p-5 rounded-2xl bg-white border border-gray-100">
          <Upload className="text-primary shrink-0" size={20} />
          <div className="text-[9px] font-black uppercase tracking-widest text-accent">
            Recalibração TO
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;
