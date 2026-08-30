"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, MessageCircle, Paperclip, Send } from "lucide-react";
import { supabase } from "@/lib/supabase"



type Contact = { id: string; name: string; phone: string; };
type Message = { id: string; content: string; direction: 'inbound' | 'outbound' | 'system'; created_at: string; };

export default function InboxPage() {
  const queryClient = useQueryClient();
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // OUVINTE EM TEMPO REAL
  useEffect(() => {
    const channel = supabase
      .channel('mudancas-ao-vivo')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        queryClient.invalidateQueries({ queryKey: ['messages'] });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contacts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // BUSCA OS CONTATOS
  const { data: contacts, isLoading: isLoadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data as Contact[];
    }
  });

  // BUSCA AS MENSAGENS DO CONTATO SELECIONADO
  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['messages', selectedContactId],
    queryFn: async () => {
      if (!selectedContactId) return []; 
      const { data, error } = await supabase.from('messages').select('*').eq('contact_id', selectedContactId).order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return data as Message[];
    },
    enabled: !!selectedContactId 
  });

  const activeContact = contacts?.find(c => c.id === selectedContactId);

  // Supabase + GreenAPI
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!selectedContactId || !activeContact) return;

      // 1. Salva no banco de dados (Para aparecer na sua tela)
      const { error } = await supabase.from('messages').insert({
        contact_id: selectedContactId,
        content: content,
        direction: 'outbound'
      });

      if (error) throw new Error(error.message);

      // 2. Dispara para o Backend enviar via GreenAPI
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: activeContact.phone, 
          message: content 
        })
      });

      if (!response.ok) throw new Error("Falha ao enviar para a GreenAPI");
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['messages', selectedContactId] });
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(newMessage);
  };

  const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : "?";

  // LÓGICA DE FILTRO CORRIGIDA (Fora do useEffect e antes do return)
  const filteredContacts = contacts?.filter(contact => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = contact.name?.toLowerCase().includes(searchLower);
    const phoneMatch = contact.phone?.includes(searchQuery);
    return nameMatch || phoneMatch;
  });

  return (
    <div className="p-8 h-full flex flex-col bg-[#090C15] min-h-screen">
      
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-white">Caixa de Entrada</h1>
        <p className="text-[#8B949E] mt-1 text-sm">Gerencie suas conversas de WhatsApp em tempo real.</p>
      </header>

      <div className="flex flex-1 bg-[#10141F] rounded-2xl border border-[#1E2538] overflow-hidden shadow-2xl">
        
        {/* BARRA LATERAL (LISTA DE CONTATOS) */}
        <div className="w-1/3 border-r border-[#1E2538] flex flex-col bg-[#06080D]">
          
          <div className="p-4 border-b border-[#1E2538]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" size={18} />
              <input 
                 type="text" 
                 placeholder="Buscar conversas..." 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full pl-10 pr-4 py-2.5 bg-[#10141F] border border-[#1E2538] text-white placeholder-[#8B949E] rounded-lg focus:outline-none focus:border-[#0284C7] transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {isLoadingContacts ? (
              <div className="p-6 text-center text-[#8B949E] text-sm animate-pulse">Carregando contatos...</div>
            ) : filteredContacts?.length === 0 ? (
              <div className="p-6 text-center text-[#8B949E] text-sm">Nenhum contato encontrado.</div>
            ) : (
              filteredContacts?.map((contact) => (
                <div 
                  key={contact.id}
                  onClick={() => setSelectedContactId(contact.id)}
                  className={`flex items-center gap-3 p-4 cursor-pointer transition-all border-b border-[#1E2538]/50 ${
                    selectedContactId === contact.id 
                      ? 'bg-[#1E2538]/30 border-l-4 border-l-[#0284C7]' 
                      : 'hover:bg-[#1E2538]/20 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="w-12 h-12 bg-[#0284C7] rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    {getInitial(contact.name)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-semibold text-white truncate text-sm">{contact.name}</h3>
                    <p className="text-xs text-[#8B949E] truncate mt-0.5">{contact.phone}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ÁREA PRINCIPAL DO CHAT */}
        <div className="w-2/3 flex flex-col bg-[#090C15] relative">
          
          <div className="absolute inset-0 bg-dots-pattern opacity-50 pointer-events-none"></div>

          {!selectedContactId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[#8B949E] relative z-10">
              <div className="w-20 h-20 bg-[#1E2538]/50 rounded-full flex items-center justify-center mb-4 border border-[#1E2538]">
                <MessageCircle size={32} className="text-[#0284C7]" />
              </div>
              <h2 className="text-xl font-bold text-white">Nenhuma conversa selecionada</h2>
              <p className="text-sm mt-2">Clique em um contato na lateral para abrir o chat.</p>
            </div>
          ) : (
            <>
              <div className="h-16 px-6 bg-[#06080D] border-b border-[#1E2538] flex items-center justify-between shrink-0 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0284C7] rounded-full flex items-center justify-center text-white font-bold shrink-0 text-sm">
                    {getInitial(activeContact?.name || "")}
                  </div>
                  <div>
                    <h2 className="font-semibold text-white text-sm">{activeContact?.name}</h2>
                    <p className="text-xs text-[#10B981] font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
                      {activeContact?.phone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10 custom-scrollbar">
                {isLoadingMessages ? (
                  <div className="text-center text-[#8B949E] text-xs p-2 bg-[#1E2538]/50 border border-[#1E2538] rounded-full w-max mx-auto animate-pulse">
                    Sincronizando mensagens...
                  </div>
                ) : messages?.length === 0 ? (
                  <div className="text-center text-[#8B949E] text-xs p-2 bg-[#1E2538]/50 border border-[#1E2538] rounded-full w-max mx-auto">
                    Inicie a conversa enviando uma mensagem.
                  </div>
                ) : (
                  messages?.map((msg) => {
                    const isOutbound = msg.direction === 'outbound';
                    return (
                      <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                        <div className={`px-4 py-2.5 rounded-xl shadow-md max-w-[75%] text-sm ${
                          isOutbound 
                            ? 'bg-[#0284C7] text-white rounded-tr-sm' 
                            : 'bg-[#1E2538] text-white border border-white/5 rounded-tl-sm'
                        }`}>
                          <p className="leading-relaxed">{msg.content}</p>
                          <span className={`text-[10px] block mt-1.5 text-right font-medium ${
                            isOutbound ? 'text-white/70' : 'text-[#8B949E]'
                          }`}>
                            {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form 
                onSubmit={handleSendMessage}
                className="p-4 bg-[#06080D] border-t border-[#1E2538] flex items-center gap-3 shrink-0 relative z-10"
              >
                <button type="button" className="p-2 text-[#8B949E] hover:text-white transition-colors">
                  <Paperclip size={20} />
                </button>
                
                <input 
                  type="text" 
                  placeholder="Digite sua mensagem..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={sendMessageMutation.isPending}
                  className="flex-1 bg-[#10141F] text-white placeholder-[#8B949E] border border-[#1E2538] rounded-xl px-4 py-3 focus:outline-none focus:border-[#0284C7] transition-all text-sm disabled:opacity-50"
                />
                
                <button 
                  type="submit"
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="w-12 h-12 bg-[#0284C7] hover:bg-[#0369a1] text-white rounded-xl shadow-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:hover:bg-[#0284C7]"
                >
                  <Send size={18} className="ml-1" />
                </button>
              </form>
            </>
          )}
        </div>

      </div>
    </div>
  );
}