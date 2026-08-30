"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { 
  Search, Filter, Download, Plus, Users, Building2, 
  Mail, Phone, CalendarDays, MoreHorizontal, Trash2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ModalNovoContato } from "@/components/ModalNovoContato";

// Tipagens atualizadas
type Stage = { id: string; name: string; };
type Opportunity = { id: string; stage_id: string; }; 
type Contact = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  created_at: string;
  opportunities: Opportunity[];
};

export default function ContatosPage() {
  const [activeTab, setActiveTab] = useState<string>("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient(); // 🌟 Adicionado para podermos recarregar a lista

  const { data: stages = [] } = useQuery({
    queryKey: ['stages'],
    queryFn: async () => {
      const { data } = await supabase.from('stages').select('*').order('list_order');
      return (data as Stage[]) || [];
    }
  });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts_with_pipeline'],
    queryFn: async () => {
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (contactsError) throw contactsError;

      const { data: oppsData, error: oppsError } = await supabase
        .from('opportunities')
        .select('id, stage_id, contact_id');

      if (oppsError) throw oppsError;

      const mergedContacts = (contactsData || []).map(contact => {
        return {
          ...contact,
          opportunities: (oppsData || []).filter(opp => opp.contact_id === contact.id)
        };
      });

      return mergedContacts as Contact[];
    }
  });

  // 🌟 FUNÇÃO PARA DELETAR O CONTATO
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      // Quando der certo, recarrega a lista de contatos instantaneamente!
      queryClient.invalidateQueries({ queryKey: ['contacts_with_pipeline'] });
    },
    onError: (error) => {
      alert("Erro ao excluir contato: " + error.message);
    }
  });

  const handleDelete = (id: string, name: string) => {
    // Confirmação de segurança para não deletar sem querer
    if (window.confirm(`Tem certeza que deseja excluir o contato ${name}? Esta ação não pode ser desfeita.`)) {
      deleteMutation.mutate(id);
    }
  };

  const formatRelativeTime = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ptBR });
  };

  const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : "?";

  const getContactStageName = (contact: Contact) => {
    const firstOpp = contact.opportunities?.[0];
    if (!firstOpp) return "Sem Negócio";
    
    const stageObj = stages.find(s => s.id === firstOpp.stage_id);
    return stageObj ? stageObj.name : "Sem Negócio";
  };

  const filteredContacts = contacts.filter(contact => {
    if (activeTab === "Todos") return true;
    return getContactStageName(contact) === activeTab;
  });

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden bg-[#090C15] bg-dots-pattern min-h-screen text-[#F8FAFC]">
      
      {/* HEADER DA PÁGINA */}
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Contatos (Pessoas)</h1>
          <p className="text-[#8B949E] mt-1 text-sm">Pessoas com quem você negocia.</p>
        </div>

        <div className="flex items-center gap-3">
          <select className="bg-[#10141F] border border-[#1E2538] text-sm text-[#8B949E] rounded-lg px-3 py-2 focus:outline-none focus:border-[#0284C7]">
            <option>Todos os Status</option>
            <option>Ativos</option>
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" size={16} />
            <input 
              type="text" 
              placeholder="Buscar nomes, emails..." 
              className="bg-[#10141F] border border-[#1E2538] text-sm text-white rounded-lg pl-9 pr-4 py-2 w-64 focus:outline-none focus:border-[#0284C7] transition-all"
            />
          </div>

          <button className="bg-[#10141F] border border-[#1E2538] text-[#8B949E] hover:text-white p-2 rounded-lg transition-colors">
            <Filter size={18} />
          </button>
          
          <button className="bg-[#10141F] border border-[#1E2538] text-[#8B949E] hover:text-white p-2 rounded-lg transition-colors">
            <Download size={18} />
          </button>

          <button 
            onClick={() => setIsModalOpen(true)} 
            className="bg-[#0284C7] hover:bg-[#0369a1] text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors">
            <Plus size={18} />
            Novo Contato
          </button>
        </div>
      </header>

      {/* ABAS DO KANBAN DINÂMICAS */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 border-b border-[#1E2538]">
        <TabButton 
          active={activeTab === "Todos"} 
          label="Todos" 
          count={contacts.length} 
          onClick={() => setActiveTab("Todos")} 
        />
        
        {stages.map(stage => {
          const count = contacts.filter(c => c.opportunities?.[0]?.stage_id === stage.id).length;
          return (
            <TabButton 
              key={stage.id} 
              active={activeTab === stage.name} 
              label={stage.name} 
              count={count} 
              onClick={() => setActiveTab(stage.name)} 
            />
          );
        })}
        
        <TabButton 
          active={activeTab === "Sem Negócio"} 
          label="Sem Negócio" 
          count={contacts.filter(c => !c.opportunities?.length).length} 
          onClick={() => setActiveTab("Sem Negócio")} 
        />
      </div>

      <div className="flex gap-4 mb-4">
        <button className="flex items-center gap-2 text-white text-sm font-semibold border-b-2 border-white pb-1">
          <Users size={16} /> Pessoas <span className="bg-[#1E2538] text-xs px-1.5 rounded-full">{filteredContacts.length}</span>
        </button>
        <button className="flex items-center gap-2 text-[#8B949E] text-sm font-medium hover:text-white pb-1">
          <Building2 size={16} /> Empresas <span className="bg-[#1E2538] text-xs px-1.5 rounded-full">0</span>
        </button>
      </div>

      {/* TABELA DE DADOS */}
      <div className="flex-1 bg-[#10141F] border border-[#1E2538] rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#8B949E] uppercase font-bold border-b border-[#1E2538] bg-[#06080D]/50">
              <tr>
                <th className="px-4 py-4 w-12"><input type="checkbox" className="rounded bg-[#1E2538] border-gray-600" /></th>
                <th className="px-4 py-4">Nome</th>
                <th className="px-4 py-4">Estágio</th>
                <th className="px-4 py-4">Cargo / Empresa</th>
                <th className="px-4 py-4">Contato</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Criado ↓</th>
                <th className="px-4 py-4 w-20 text-right">Ações</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-[#1E2538]">
              {isLoading ? (
                <tr><td colSpan={8} className="text-center py-8 text-[#8B949E]">Carregando contatos...</td></tr>
              ) : filteredContacts.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-[#8B949E]">Nenhum contato encontrado nesta etapa.</td></tr>
              ) : (
                filteredContacts.map((contact) => {
                  const stageName = getContactStageName(contact);
                  
                  return (
                    <tr key={contact.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-4 py-4"><input type="checkbox" className="rounded bg-[#1E2538] border-gray-600" /></td>
                      
                      {/* NOME E AVATAR */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0284C7] flex items-center justify-center text-white font-bold text-xs">
                            {getInitial(contact.name)}
                          </div>
                          <span className="font-semibold text-white">{contact.name}</span>
                        </div>
                      </td>

                      {/* ESTÁGIO */}
                      <td className="px-4 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${
                          stageName === "Sem Negócio" 
                            ? "bg-[#1E2538] text-[#8B949E] border-[#8B949E]/20" 
                            : "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20"
                        }`}>
                          {stageName}
                        </span>
                      </td>

                      {/* CARGO / EMPRESA */}
                      <td className="px-4 py-4 text-[#8B949E]">
                        <p className="font-medium text-white/80">Cargo não inf.</p>
                        <p className="text-xs flex items-center gap-1 mt-0.5"><Building2 size={12}/> Sem empresa</p>
                      </td>

                      {/* DADOS DE CONTATO */}
                      <td className="px-4 py-4 text-[#8B949E] space-y-1 text-xs">
                        {contact.email && <p className="flex items-center gap-2"><Mail size={12}/> {contact.email}</p>}
                        {contact.phone && <p className="flex items-center gap-2"><Phone size={12}/> {contact.phone}</p>}
                        {!contact.email && !contact.phone && <span>--</span>}
                      </td>

                      {/* STATUS ATIVO */}
                      <td className="px-4 py-4">
                        <span className="text-[10px] font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 px-2 py-0.5 rounded uppercase">
                          Ativo
                        </span>
                      </td>

                      {/* DATAS */}
                      <td className="px-4 py-4 text-[#8B949E] text-xs">
                        <p className="flex items-center gap-1.5"><CalendarDays size={14}/> {formatRelativeTime(contact.created_at)}</p>
                      </td>

                      {/* 🌟 BOTÕES DE AÇÃO (LIXEIRA ADICIONADA) */}
                      <td className="px-4 py-4 text-right flex items-center justify-end gap-1">
                        <button className="text-[#8B949E] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded hover:bg-[#1E2538]">
                          <MoreHorizontal size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(contact.id, contact.name)}
                          disabled={deleteMutation.isPending}
                          className="text-[#8B949E] hover:text-[#EF4444] opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded hover:bg-[#EF4444]/10 disabled:opacity-50"
                          title="Excluir Contato"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* RODAPÉ */}
        <div className="bg-[#06080D]/50 border-t border-[#1E2538] p-4 flex items-center justify-between text-xs text-[#8B949E]">
          <span>Mostrando {filteredContacts.length} contatos</span>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Ir para:</span>
              <input type="text" defaultValue="1" className="bg-[#1E2538] border-none text-white w-8 text-center rounded py-1 focus:outline-none" />
            </div>
            <span>Página 1 de 1</span>
          </div>
        </div>
      </div>
      
      <ModalNovoContato 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

    </div>
  );
}

function TabButton({ active, label, count, onClick }: { active: boolean, label: string, count: number, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm transition-all whitespace-nowrap ${
        active 
          ? "bg-[#0284C7]/10 border-[#0284C7]/30 text-[#0284C7] font-semibold" 
          : "bg-[#10141F] border-[#1E2538] text-[#8B949E] hover:bg-[#1E2538] hover:text-white"
      }`}
    >
      {label}
      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-[#0284C7]/20 text-[#0284C7]" : "bg-[#1E2538] text-[#8B949E]"}`}>
        {count}
      </span>
    </button>
  );
}