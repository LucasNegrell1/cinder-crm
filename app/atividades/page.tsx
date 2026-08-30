"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Search, Filter, LayoutList, Calendar, Plus } from "lucide-react";
import { ModalNovaAtividade } from "@/components/ModalNovaAtividade";

type Activity = {
  id: string;
  title: string;
  date: string;
  created_at: string;
};

export default function AtividadesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Activity[];
    }
  });

  const filteredActivities = activities?.filter(act => 
    act.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#090C15] bg-dots-pattern min-h-screen">
      
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Atividades</h1>
          <p className="text-[#8B949E] mt-1 text-sm">Gerencie suas tarefas e compromissos</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Botões de visualização (Lista / Calendário) */}
          <div className="flex items-center bg-[#10141F] border border-[#1E2538] rounded-lg overflow-hidden">
            <button className="p-2.5 bg-[#1E2538] text-white hover:bg-[#1E2538]/80 transition-colors">
              <LayoutList size={18} />
            </button>
            <button className="p-2.5 text-[#8B949E] hover:text-white hover:bg-[#1E2538]/50 transition-colors">
              <Calendar size={18} />
            </button>
          </div>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#0284C7] hover:bg-[#0369a1] text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm shadow-lg shadow-[#0284C7]/20"
          >
            <Plus size={18} />
            Nova Atividade
          </button>
        </div>
      </div>

      {/* Barra de Pesquisa e Filtros */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B949E]" size={18} />
          <input 
            type="text" 
            placeholder="Buscar atividades..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-[#10141F] border border-[#1E2538] text-white placeholder-[#8B949E] rounded-xl focus:outline-none focus:border-[#0284C7] transition-all text-sm"
          />
        </div>
        
        <button className="p-3 bg-[#10141F] border border-[#1E2538] text-[#8B949E] hover:text-white rounded-xl transition-colors">
          <Filter size={18} />
        </button>
        
        <select className="bg-[#10141F] border border-[#1E2538] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0284C7] appearance-none cursor-pointer">
          <option>Todos os tipos</option>
          <option>Ligações</option>
          <option>Reuniões</option>
        </select>
      </div>

      {/* Lista de Atividades */}
      <div className="flex-1">
        {isLoading ? (
          <div className="text-center text-[#8B949E] mt-10">Carregando atividades...</div>
        ) : filteredActivities?.length === 0 ? (
          <div className="text-center text-[#8B949E] mt-10">Nenhuma atividade encontrada.</div>
        ) : (
          <div className="space-y-1">
            {filteredActivities?.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center gap-4 py-4 px-2 hover:bg-[#1E2538]/30 rounded-lg transition-colors group cursor-pointer border-b border-[#1E2538]/30 last:border-0"
              >
                {/* Ponto / Indicador */}
                <div className="w-2.5 h-2.5 rounded-full bg-[#1E2538] group-hover:bg-[#0284C7] transition-colors ml-2 shadow-[0_0_8px_rgba(2,132,199,0)] group-hover:shadow-[0_0_8px_rgba(2,132,199,0.5)]"></div>
                
                                <span className="text-[#8B949E] text-sm flex-1 group-hover:text-[#F8FAFC] transition-colors">
                {activity.title.split(/\*\*(.*?)\*\*/g).map((part, i) => 
                    i % 2 === 1 ? (
                    <strong key={i} className="text-[#F8FAFC] font-semibold">{part}</strong>
                    ) : (
                    part
                    )
                )}
                </span>
                
                <span className="text-xs text-[#8B949E] pr-2">
                  {activity.date ? new Date(activity.date).toLocaleDateString('pt-BR') : 'Sem data'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Embutido */}
      <ModalNovaAtividade 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      
    </div>
  );
}