import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { Equipment } from '../types';

interface ChatAssistantProps {
  fleetData: Equipment[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ fleetData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Olá! Sou o assistente inteligente da Tecnoloc. Como posso ajudar com a análise da sua frota hoje?',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      /**
       * Inicialização seguindo estritamente as diretrizes do SDK:
       * 1. Uso exclusivo de process.env.API_KEY.
       * 2. Instanciamento imediato antes da chamada de conteúdo.
       */
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const compactData = fleetData
        .map((e) => ({
          p: e.patrimonio,
          n: e.nome_bem,
          m: e.modelo,
          t: e.tipo,
          s: e.status,
          e: e.estado,
          a: e.ano_fabricacao,
        }))
        .slice(0, 450);

      const prompt = `
        Você é o Assistente Especialista da Tecnoloc (empresa de locação).
        Sua missão é realizar análises precisas da frota de equipamentos.

        REGRAS DE CATEGORIZAÇÃO DE GERADORES (OBRIGATÓRIO):
        A categorização NÃO deve considerar apenas a potência exata no nome; deve seguir as CLASSES COMERCIAIS.
        Sempre use EXATAMENTE uma destas categorias (formato "Grupo Gerador XXKVA"):
        - Grupo Gerador 19KVA (ex: BRANCO DIESEL 19 KVA)
        - Grupo Gerador 22KVA (ex: PRAMAC 22 KVA)
        - Grupo Gerador 33KVA (ex: BRANCO DIESEL 33 KVA)
        - Grupo Gerador 55KVA (faixa ~48–60 KVA; ex: CUMMINS 55, ATLAS QAS 55, BRANCO 48, GENERAC 59, PRAMAC 60, STEMAC 55/50, WACKER 52; regra comercial pode incluir outros)
        - Grupo Gerador 81KVA (faixa ~75–81 KVA; ex: CUMMINS 80/81, PRAMAC 80, STEMAC 81/78, WACKER 75)
        - Grupo Gerador 120KVA (faixa ~105–127 KVA; ex: CUMMINS 116/120/125, GENERAC/PRAMAC 127, HIMOINSA 125, WACKER 121, ATLAS QAS 105)
        - Grupo Gerador 150KVA (faixa ~140–150 KVA)
        - Grupo Gerador 170KVA (ex: CUMMINS 170, STEMAC 180/168)
        - Grupo Gerador 200KVA (ex: STEMAC 200/180, CUMMINS 212)
        - Grupo Gerador 260KVA (ex: CUMMINS 260, STEMAC 260/240)
        - Grupo Gerador 360KVA (ex: CUMMINS 385, STEMAC 360/325)
        - Grupo Gerador 500KVA (ex: CUMMINS 500, GENERAC 500, STEMAC 500/455)
        Marcas, motores, tensão ou observações NÃO alteram a categoria. Nunca crie categorias fora desta lista.

        INSTRUÇÕES DE ANÁLISE:
        1. Identifique o equipamento solicitado mapeando para uma das categorias acima (sempre "Grupo Gerador XXKVA").
        2. Status "Locado" = Em contrato de locação.
        3. Status "Liberado" = Disponível para novos contratos.
        4. "Manutenção" = Em oficina ou reparo técnico.
        5. Filtre por Estado ('e') se mencionado (MG ou PA).
        6. Responda de forma curta, técnica, profissional e direta.

        DADOS DA FROTA (JSON):
        ${JSON.stringify(compactData)}
        
        PERGUNTA DO USUÁRIO:
        ${userMessage}
      `;

      // gemini-3-flash-preview selecionado para tarefas de análise de dados técnica
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          temperature: 0.1, // Baixa temperatura para evitar alucinações em dados numéricos
          topP: 0.8,
          topK: 40,
        },
      });

      // Acesso à propriedade .text (propriedade, não método) conforme diretrizes
      const aiResponse =
        response.text || 'Desculpe, não consegui processar essa análise no momento.';
      setMessages((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Houve um erro na comunicação com a IA. Por favor, tente novamente em instantes.',
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-primary to-accent text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
        aria-label="Abrir Assistente IA"
      >
        <Sparkles className="group-hover:animate-pulse" size={28} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-accent/20 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 bg-accent text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight uppercase">Analista Frota</h3>
                  <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em]">
                    Tecnoloc S/A
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8F9FA] no-scrollbar"
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-tr-none'
                        : 'bg-white text-accent border border-gray-100 rounded-tl-none font-medium'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                    <Loader2 className="animate-spin text-primary" size={16} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-white">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Ex: Quantos geradores de 500kva temos locados?"
                  className="w-full pl-5 pr-14 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-xs font-bold outline-none focus:border-primary/20 focus:bg-white transition-all shadow-inner"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-accent text-white rounded-xl shadow-md hover:bg-black active:scale-95 disabled:opacity-50 transition-all"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[8px] text-center text-gray-400 font-bold uppercase tracking-widest mt-4">
                Motor de IA Gemini 2.0 • Tecnoloc Inteligência
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;
