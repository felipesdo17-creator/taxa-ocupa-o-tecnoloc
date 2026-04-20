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
        'Olá! Sou o especialista de frota da Tecnoloc. Analiso a base integral de 3.167 equipamentos. Como posso ajudar hoje?',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Otimização de Contexto: Converte a frota para CSV compacto para economizar tokens
  const optimizedFleetContext = useMemo(() => {
    const header = "PAT,MOD,STATUS,EST,FAM,TIPO_MOD";
    const rows = fleetData.map(e => 
      `${e.patrimonio},${e.modelo},${e.status},${e.estado},${(e as any).familia || ''},${(e as any).tipo_modelo || ''}`
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
    const newHistory: Message[] = [...messages, { role: 'user', content: userMessage }];
    setMessages(newHistory);
    setIsTyping(true);

    try {
      const openai = new OpenAI({
        apiKey: import.meta.env.VITE_OPENAI_API_KEY, 
        dangerouslyAllowBrowser: true 
      });

      const systemPrompt = `
        Você é o Especialista de Frota da Tecnoloc. Sua missão é fornecer análises técnicas precisas sobre os 3.167 equipamentos.

        REGRAS DE FILTRAGEM E CATEGORIZAÇÃO (OBRIGATÓRIO):
        1. TORRES (FAMÍLIA TIL): Identifique torres APENAS se a coluna FAM (Família) for "TIL". Se a família não for TIL, ignore, mesmo que o nome sugira torre.
        2. GRUPO GERADOR 120KVA: Inclua equipamentos de 100KVA neste grupo.
        3. GRUPO GERADOR 200KVA: Inclua especificamente os modelos "200/180" ou "200 / 180" neste grupo.
        4. DIFERENCIAÇÃO SOLDA (TIPO_MOD): 
           - X-Treme: Se TIPO_MOD for MSM006 ou MSM007.
           - 12RC: Se TIPO_MOD for MSM008 ou MSM009.

        LISTA PADRONIZADA DE MODELOS (Use exatamente estes nomes):
        X-Treme, 12RC, LN25, CST, V275, XMT, V350, Flextec 450, Flextec 650, DC600, DC1000, CV400, Trailblazer, Ranger, Rolo compactador.

        LÓGICA DE ANÁLISE:
        - QUANTITATIVA: Filtre por Família, Modelo e Estado (MG/PA).
        - DISPONIBILIDADE: Status "Liberado" = Disponível. Status "Locado" = Em contrato.
        - HORÍMETRO/IDADE: Para "maior horímetro" use Contador Acumulado. Para "mais velho" use o menor Ano de Fabricação.

        DADOS DA FROTA (CSV):
        ${optimizedFleetContext}

        RESPONDA de forma curta, técnica e profissional em Português (Brasil).
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }, ...newHistory],
        temperature: 0.1,
      });

      const aiResponse = response.choices[0]?.message?.content || 'Não consegui processar a análise.';
      setMessages((prev) => [...prev, { role: 'assistant', content: aiResponse }]);

    } catch (error) {
      console.error('Erro OpenAI:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Erro na conexão com a IA. Verifique créditos e chave API.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-[#10a37f] to-accent text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
      >
        <Sparkles className="group-hover:animate-pulse" size={28} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 bg-[#10a37f] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot size={24} />
                <div>
                  <h3 className="font-black text-sm uppercase">Analista Tecnoloc</h3>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">Base: 3.167 Itens</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)}><X size={20} /></button>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 no-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-[#10a37f] text-white rounded-tr-none' : 'bg-white text-gray-800 border rounded-tl-none shadow-sm'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && <Loader2 className="animate-spin text-[#10a37f] mx-auto" size={20} />}
            </div>

            <div className="p-6 border-t bg-white">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Pergunte sobre a frota..."
                  className="w-full pl-5 pr-14 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-xs font-bold outline-none focus:border-[#10a37f]/20 transition-all"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-[#10a37f] text-white rounded-xl shadow-md">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;