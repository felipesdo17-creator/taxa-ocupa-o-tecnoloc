import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { processRawData, normalizeString } from '../utils/dataProcessor';
import { Equipment } from '../types';

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
    // Acessa a biblioteca XLSX via window (comum no ambiente AI Studio)
    const XLSX = (window as any).XLSX;

    if (!XLSX) {
      setError('Erro de Sistema: Biblioteca SheetJS (XLSX) não detectada.');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(10);

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result;
        if (!(arrayBuffer instanceof ArrayBuffer)) {
          throw new Error('Falha física na leitura do arquivo (ArrayBuffer inválido).');
        }

        const data = new Uint8Array(arrayBuffer);
        setProgress(30);
        
        // Leitura do arquivo com detecção automática de formato
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Converte para matriz (header: 1) para escanear as linhas
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setProgress(50);

        // --- CALIBRAÇÃO DA BUSCA (Ajuste técnico) ---
        // Normalizamos o termo de busca para garantir a correspondência
        const searchTerm = normalizeString('Patrimônio'); 

        const headerRowIndex = rawRows.findIndex(row => 
          row.some(cell => {
            const cellValue = normalizeString(String(cell || ''));
            return cellValue.includes(searchTerm);
          })
        );

        if (headerRowIndex === -1) {
          // Log de diagnóstico para o desenvolvedor
          console.error("Cabeçalhos lidos na primeira linha:", rawRows[0]);
          throw new Error('Coluna "Patrimônio" não encontrada. Certifique-se de que a planilha possui essa coluna.');
        }

        // Extrai os dados reais a partir da linha de cabeçalho detectada
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          range: headerRowIndex,
          defval: ''
        });
        
        setProgress(80);
        
        // Processamento final dos dados da frota
        const processed = processRawData(jsonData);
        
        if (processed.length === 0) {
          throw new Error('A análise elétrica/mecânica não retornou dados válidos após o processamento.');
        }

        setProgress(100);
        
        // Simula um tempo de carregamento para feedback visual (UX)
        setTimeout(() => {
          onDataLoaded(processed);
          setLoading(false);
        }, 400);

      } catch (err: any) {
        console.error("Relatório de Falha no Upload:", err);
        setError(err.message || 'Erro inesperado no processamento do motor de dados.');
        setLoading(false);
      }
    };

    // Tratamento de erro específico do leitor de arquivos
    reader.onerror = () => {
      setError('Erro de permissão ou falha de leitura do arquivo no navegador.');
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
          isDragging ? 'border-primary bg-primary/5 scale-105' : 'border-gray-200 bg-white'
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
            <h2 className="text-2xl font-bold text-accent mb-2">Manutenção de Frota: Upload</h2>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto leading-relaxed text-sm">
              O sistema ignora metadados (ST9) e calibra o cabeçalho automaticamente para análise.
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
              className="px-8 py-3 bg-primary hover:bg-primary-light text-white rounded-xl font-semibold transition-colors shadow-lg shadow-primary/20"
            >
              Selecionar Planilha
            </button>
          </>
        ) : (
          <div className="py-10">
            <Loader2 className="animate-spin text-primary mx-auto mb-6" size={48} />
            <h3 className="text-xl font-bold text-accent mb-4">Analisando Sistemas...</h3>
            <div className="w-full max-w-md mx-auto h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-secondary transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-center gap-2 justify-center text-red-500 bg-red-50 p-3 rounded-xl font-medium text-sm border border-red-100">
            <AlertCircle size={18} />
            {error}
          </div>
        )}
      </div>

      {/* Indicadores de Status Técnico */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
        <div className="flex gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
           <FileSpreadsheet className="text-green-600 shrink-0" size={20} />
           <div className="text-[11px] font-medium uppercase tracking-wider">Auto-Scan de Cabeçalho</div>
        </div>
        <div className="flex gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
           <CheckCircle className="text-secondary shrink-0" size={20} />
           <div className="text-[11px] font-medium uppercase tracking-wider">Normalização de Dados</div>
        </div>
        <div className="flex gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
           <CheckCircle className="text-primary shrink-0" size={20} />
           <div className="text-[11px] font-medium uppercase tracking-wider">Pronto para Diagnóstico</div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;