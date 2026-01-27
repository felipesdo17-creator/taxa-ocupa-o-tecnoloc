
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, Loader2, MessageSquare } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
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
    { role: 'assistant', content: 'Olá! Sou o assistente inteligente da Tecnoloc. Como posso ajudar com a análise da sua frota hoje?' }
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
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const compactData = fleetData.map(e => ({
        p: e.patrimonio,
        n: e.nome_bem,
        m: e.modelo,
        t: e.tipo,
        s: e.status,
        e: e.estado,
        a: e.ano_fabricacao
      })).slice(0, 400);

      const prompt = `
        Você é o Assistente Especialista da Tecnoloc (empresa de locação).
        Sua missão é realizar análises precisas da frota de equipamentos.

        DICIONÁRIO DE MAPEAMENTO SEMÂNTICO (O usuário usa apelidos, você mapeia para o Nome do Bem):
        - "19KVA" -> "GRUPO GERADOR BRANCO DIESEL 19 KVA"
        - "22KVA" -> "GRUPO GERADOR BRANCO DIESEL 22 KVA"
        - "33KVA" -> "GRUPO GERADOR BRANCO DIESEL 33 KVA"
        - "48KVA" -> "GRUPO GERADOR BRANCO DIESEL 48 KVA"
        - "55KVA" ou "60KVA" -> "GRUPO GERADOR CUMMINS/PRAMAC 55/60 KVA"
        - "120KVA" -> "GRUPO GERADOR CUMMINS 120 KVA"
        - "150KVA" -> "GRUPO GERADOR CUMMINS 150 KVA"
        - "200KVA" -> "GRUPO GERADOR CUMMINS 200 KVA"
        - "260KVA" -> "GRUPO GERADOR CUMMINS 260 KVA"
        - "360KVA" -> "GRUPO GERADOR CUMMINS 360 KVA"
        - "500KVA" -> "GRUPO GERADOR CUMMINS 500 KVA"
        - "Torre Solar" -> "TORRE DE ILUMINACAO SOLAR"
        - "V5" -> "TORRE DE ILUMINACAO LED V5"
        - "PipePro" -> "MAQUINA DE SOLDA MILLER PIPEPRO 450"
        - "PipeWorx" -> "MAQUINA DE SOLDA MILLER PIPEWORX 400"
        - "Vantage" -> "MOTOSOLDADORA LINCOLN VANTAGE"
        - "Burro" -> "ROBO BURRO XL"
        - "RT82" -> "ROLO COMPACTADOR WACKER RT82"

        INSTRUÇÕES DE ANÁLISE:
        1. Identifique o equipamento solicitado usando o dicionário acima ou buscando termos similares no campo 'n' (nome do bem).
        2. Ao responder sobre um modelo, use o nome comercial completo.
        3. Para contagem de "locados", considere APENAS os equipamentos com status "Locado".
        4. Para "disponíveis", considere status "Liberado".
        5. Se o usuário perguntar por estado (MG ou PA), filtre rigorosamente pelo campo 'e'.
        6. Responda de forma profissional, executiva e em Português (Brasil).

        DADOS DA FROTA (JSON):
        ${JSON.stringify(compactData)}
        
        PERGUNTA:
        ${userMessage}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const aiResponse = response.text || "Não foi possível processar a consulta.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Erro na conexão com a IA. Por favor, tente novamente." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-primary to-secondary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 group"
      >
        <Sparkles className="group-hover:animate-pulse" size={28} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-accent/20 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 bg-accent text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles size={20} className="text-secondary" />
                <div>
                  <h3 className="font-bold text-sm">IA Tecnoloc</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Expert em Frota</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-accent border border-gray-100 rounded-tl-none'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isTyping && <Loader2 className="animate-spin text-primary mx-auto" size={16} />}
            </div>
            <div className="p-6 border-t border-gray-100 bg-white">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Ex: Quais geradores de 19kva estão em MG?"
                  className="w-full pl-4 pr-12 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs outline-none"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-xl shadow-md"><Send size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatAssistant;
