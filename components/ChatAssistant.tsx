import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, Send, X, Bot, Loader2 } from 'lucide-react';
import OpenAI from 'openai';
import { Equipment } from '../types';

interface ChatAssistantProps {
  fleetData: Equipment[];
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ fleetData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Olá! Sou o assistente inteligente da Tecnoloc. Já carreguei os 3.174 equipamentos da frota. Como posso ajudar?',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Otimização: Transforma os dados em CSV (string) para gastar menos tokens que JSON
  // Isso permite enviar os 3174 itens dentro do limite do GPT-4o
  const optimizedFleetContext = useMemo(() => {
    const header = "ID,MODELO,STATUS,ESTADO";
    const rows = fleetData.map(e => 
      `${e.patrimonio},${e.modelo},${e.status},${e.estado}`
    ).join('\n');
    return `${header}\n${rows}`;
  }, [fleetData]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    
    // Adiciona mensagem do usuário na tela
    const newHistory: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newHistory);
    setIsTyping(true);

    try {
      // Inicializa OpenAI
      // Atenção: O uso de dangerouslyAllowBrowser é necessário para React puro (Vite)
      // Em produção real, recomenda-se fazer isso via Backend para proteger a chave.
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY, 
        dangerouslyAllowBrowser: true 
      });

      const systemPrompt = `
        Você é o Especialista de Frota da Tecnoloc.
        
        CONTEXTO DE DADOS:
        Você tem acesso à lista COMPLETA da frota abaixo (Formato CSV: ID, Modelo, Status, Estado).
        Total de itens: ${fleetData.length}.
        
        REGRAS DE NEGÓCIO:
        1. "Grupo Gerador XXKVA" refere-se à potência comercial.
        2. Status "Locado" = Em cliente. "Liberado" = Disponível no pátio. "Manutenção" = Oficina.
        3. Se o usuário perguntar totais, conte EXATAMENTE as linhas do CSV fornecido.
        4. Responda de forma executiva, direta e em português do Brasil.
        5. Se perguntarem sobre equipamentos específicos, cite o ID (Patrimônio).

        DADOS (CSV):
        ${optimizedFleetContext}
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // Modelo mais capaz para grandes contextos
        messages: [
          { role: "system", content: systemPrompt },
          ...newHistory.filter(m => m.role !== 'system') // Envia histórico da conversa
        ],
        temperature: 0.1, // Baixa criatividade para garantir precisão numérica
      });

      const aiResponse = response.choices[0]?.message?.content || 'Desculpe, não consegui analisar os dados.';
      
      setMessages((prev) => [...prev, { role: 'assistant', content: aiResponse }]);

    } catch (error) {
      console.error('OpenAI Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Erro ao conectar com a OpenAI. Verifique sua chave API e créditos.',
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
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-green-600 to-green-800 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
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
            {/* Header */}
            <div className="p-6 bg-[#10a37f] text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shadow-lg">
                  <Bot size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="font-black text-sm tracking-tight uppercase">Tecnoloc GPT-4o</h3>
                  <p className="text-[9px] text-white/80 font-black uppercase tracking-[0.2em]">
                    Análise Integral ({fleetData.length} itens)
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

            {/* Chat Area */}
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
                        ? 'bg-[#10a37f] text-white rounded-tr-none'
                        : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none font-medium'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm">
                    <Loader2 className="animate-spin text-[#10a37f]" size={16} />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-gray-100 bg-white">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Ex: Liste os geradores 500kva em manutenção..."
                  className="w-full pl-5 pr-14 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-xs font-bold outline-none focus:border-[#10a37f]/20 focus:bg-white transition-all shadow-inner"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-[#10a37f] text-white rounded-xl shadow-md hover:bg-black active:scale-95 disabled:opacity-50 transition-all"
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[8px] text-center text-gray-400 font-bold uppercase tracking-widest mt-4">
                Powered by OpenAI GPT-4o
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;