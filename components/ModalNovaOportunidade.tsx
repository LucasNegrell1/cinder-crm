"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { X, Search, User, Mail, Phone, Building2, Loader2 } from "lucide-react";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

// Tipo para ajudar o TypeScript a entender o que é um Contato
type Contact = { id: string; name: string; email?: string; phone?: string; };

export function ModalNovaOportunidade({ isOpen, onClose }: ModalProps) {
  const queryClient = useQueryClient();
  
  // Controle de abas
  const [contactMode, setContactMode] = useState<'buscar' | 'novo'>('novo');

  // Estados da Oportunidade (O que você já tinha)
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");

  // Estados para NOVO Contato
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Estados para BUSCAR Contato
  const [searchQuery, setSearchQuery] = useState("");
  const [foundContacts, setFoundContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  // EFEITO: Faz a busca no banco enquanto você digita no campo "Buscar"
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      // Movemos a verificação para DENTRO do timeout. Zero erros agora!
      if (contactMode !== 'buscar' || searchQuery.trim().length < 2) {
        setFoundContacts([]);
        return;
      }

      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .ilike("name", `%${searchQuery}%`) 
        .limit(5);

      if (!error && data) setFoundContacts(data as Contact[]);
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, contactMode]);

  // MOTOR DE INSERÇÃO DUPLA (Contato + Negócio)
  const mutation = useMutation({
    mutationFn: async () => {
      let finalContactId = selectedContact?.id;

      // PASSO 1: Se for um contato novo, salva ele primeiro
      if (contactMode === 'novo') {
        if (!contactName.trim()) throw new Error("O nome do contato é obrigatório.");
        
        const { data: newContact, error: contactError } = await supabase
          .from("contacts")
          .insert({ name: contactName, email: contactEmail || null, phone: contactPhone || null })
          .select()
          .single();

        if (contactError) throw new Error(`Erro no Supabase (Contato): ${contactError.message}`);
        finalContactId = newContact.id;
      }

      if (!finalContactId) throw new Error("Selecione ou crie um contato.");

      // PASSO 2: Pega o ID da primeira coluna (O que você já fazia)
      const { data: stageData, error: stageError } = await supabase
        .from('stages')
        .select('id')
        .order('list_order', { ascending: true })
        .limit(1)
        .single();

      if (stageError) throw new Error("Erro ao buscar a coluna inicial.");

      // PASSO 3: Salva a oportunidade VINCULADA ao contato
      const { error: insertError } = await supabase
        .from('opportunities')
        .insert({
          title: title,
          value: Number(value),
          stage_id: stageData.id,
          contact_id: finalContactId 
        });

      if (insertError) throw new Error(`Erro no Supabase (Oportunidade): ${insertError.message}`);
    },
    onSuccess: () => {
      // Atualiza o Kanban e a tela de Contatos
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      
      // Limpa a casa
      setTitle(""); setValue(""); setContactName(""); setContactEmail(""); 
      setContactPhone(""); setSelectedContact(null); setSearchQuery("");
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!selectedContact && contactMode === 'buscar')) return;
    mutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06080D]/80 backdrop-blur-sm p-4">
      <div className="bg-[#10141F] border border-[#1E2538] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 text-[#F8FAFC]">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-[#1E2538]">
          <h2 className="text-xl font-bold text-white">Novo Negócio</h2>
          <button type="button" onClick={onClose} className="text-[#8B949E] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            
            {/* Tratamento de Erro */}
            {mutation.isError && (
              <div className="bg-red-500/10 text-red-400 p-3 rounded-lg text-sm border border-red-500/20">
                {mutation.error.message}
              </div>
            )}

            {/* SEÇÃO 1: CONTATO */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Contato</label>
                <div className="flex bg-[#06080D] p-1 rounded-lg border border-[#1E2538]">
                  <button type="button" onClick={() => { setContactMode('buscar'); setSelectedContact(null); }} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${contactMode === 'buscar' ? 'bg-[#1E2538] text-white' : 'text-[#8B949E] hover:text-white'}`}>
                    Buscar
                  </button>
                  <button type="button" onClick={() => { setContactMode('novo'); setSelectedContact(null); }} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${contactMode === 'novo' ? 'bg-[#1E2538] text-white' : 'text-[#8B949E] hover:text-white'}`}>
                    + Novo
                  </button>
                </div>
              </div>

              <div className="bg-[#06080D] p-4 rounded-xl border border-[#1E2538]">
                {contactMode === 'buscar' ? (
                  <div className="space-y-3">
                    {selectedContact ? (
                      <div className="flex items-center justify-between bg-[#10141F] border border-[#0284C7] p-3 rounded-lg">
                        <div>
                          <p className="text-sm font-semibold text-white">{selectedContact.name}</p>
                          <p className="text-xs text-[#8B949E]">{selectedContact.phone || 'Sem telefone'}</p>
                        </div>
                        <button type="button" onClick={() => setSelectedContact(null)} className="text-xs text-red-400 hover:underline">Alterar</button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" size={18} />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar por nome..." className="w-full bg-[#10141F] border border-[#1E2538] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#0284C7] transition-colors text-sm" />
                        {foundContacts.length > 0 && (
                          <div className="absolute left-0 right-0 mt-2 bg-[#10141F] border border-[#1E2538] rounded-lg shadow-xl overflow-hidden z-30">
                            {foundContacts.map(c => (
                              <div key={c.id} onClick={() => setSelectedContact(c)} className="p-3 hover:bg-[#1E2538] cursor-pointer border-b border-[#1E2538]/50 last:border-0 text-sm">
                                <p className="font-medium text-white">{c.name}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" size={18} />
                      <input type="text" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Nome do contato" className="w-full bg-[#10141F] border border-[#1E2538] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#0284C7] transition-colors text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" size={18} />
                        <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="E-mail" className="w-full bg-[#10141F] border border-[#1E2538] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#0284C7] transition-colors text-sm" />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" size={18} />
                        <input type="text" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="Telefone" className="w-full bg-[#10141F] border border-[#1E2538] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#0284C7] transition-colors text-sm" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <hr className="border-[#1E2538]" />

            {/* SEÇÃO 2: NEGÓCIO */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Dados do Negócio</h3>
              
              <div>
                <label className="block text-xs text-[#8B949E] mb-1">Título do Imóvel / Negociação *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex: Apartamento Jardins" className="w-full bg-[#06080D] border border-[#1E2538] rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#0284C7] transition-all text-sm" />
              </div>

              <div>
                <label className="block text-xs text-[#8B949E] mb-1">Valor Estimado (R$) *</label>
                <input type="number" value={value} onChange={(e) => setValue(e.target.value)} required placeholder="Ex: 850000" className="w-full bg-[#06080D] border border-[#1E2538] rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#0284C7] transition-all text-sm" />
              </div>
            </div>

          </div>

          <div className="p-5 bg-[#06080D] border-t border-[#1E2538]">
            <button type="submit" disabled={mutation.isPending} className="w-full py-3 bg-[#0284C7] hover:bg-[#0369a1] disabled:bg-[#1E2538] disabled:text-[#8B949E] text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2">
              {mutation.isPending && <Loader2 size={16} className="animate-spin" />}
              {mutation.isPending ? "Salvando..." : "Criar Negócio"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}