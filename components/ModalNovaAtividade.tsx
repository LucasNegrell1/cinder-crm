"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ModalNovaAtividade({ isOpen, onClose }: ModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    type: "Ligação",
    opportunity_id: "",
    date: "",
    time: "",
    description: "",
  });

  // Busca os negócios para o select
  const { data: opportunities } = useQuery({
    queryKey: ['opportunities_select'],
    queryFn: async () => {
      const { data, error } = await supabase.from('opportunities').select('id, title');
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  type NovaAtividadeInput = {
  title: string;
  type: string;
  opportunity_id: string | null;
  date: string;
  time: string;
  description: string;
};

  // Salva a nova atividade
  const mutation = useMutation({
    mutationFn: async (newActivity: NovaAtividadeInput) => {
      const { error } = await supabase.from('activities').insert([newActivity]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      onClose();
      setFormData({ title: "", type: "Ligação", opportunity_id: "", date: "", time: "", description: "" });
    },
  });

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...formData,
      opportunity_id: formData.opportunity_id || null, // Envia nulo se não selecionar nada
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#10141F] border border-[#1E2538] rounded-xl shadow-2xl overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-[#1E2538]">
          <h2 className="text-xl font-bold text-white">Nova Atividade</h2>
          <button onClick={onClose} className="text-[#8B949E] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div>
            <label className="block text-[11px] font-bold text-[#8B949E] tracking-wider mb-1.5 uppercase">Título</label>
            <input 
              required
              type="text" 
              placeholder="Ex: Ligar para Cliente" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-[#06080D] border border-[#1E2538] rounded-lg px-3 py-2.5 text-white placeholder-[#8B949E] focus:outline-none focus:border-[#0284C7] transition-colors text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#8B949E] tracking-wider mb-1.5 uppercase">Tipo</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full bg-[#06080D] border border-[#1E2538] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#0284C7] transition-colors text-sm appearance-none"
              >
                <option value="Ligação">Ligação</option>
                <option value="Reunião">Reunião</option>
                <option value="E-mail">E-mail</option>
                <option value="Tarefa">Tarefa</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8B949E] tracking-wider mb-1.5 uppercase">Negócio Relacionado</label>
              <select 
                value={formData.opportunity_id}
                onChange={(e) => setFormData({...formData, opportunity_id: e.target.value})}
                className="w-full bg-[#06080D] border border-[#1E2538] rounded-lg px-3 py-2.5 text-[#8B949E] focus:outline-none focus:border-[#0284C7] transition-colors text-sm appearance-none"
              >
                <option value="">Selecione...</option>
                {opportunities?.map((opp) => (
                  <option key={opp.id} value={opp.id}>{opp.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#8B949E] tracking-wider mb-1.5 uppercase">Data</label>
              <input 
                required
                type="date" 
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full bg-[#06080D] border border-[#1E2538] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#0284C7] transition-colors text-sm [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#8B949E] tracking-wider mb-1.5 uppercase">Hora</label>
              <input 
                required
                type="time" 
                value={formData.time}
                onChange={(e) => setFormData({...formData, time: e.target.value})}
                className="w-full bg-[#06080D] border border-[#1E2538] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[#0284C7] transition-colors text-sm [color-scheme:dark]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#8B949E] tracking-wider mb-1.5 uppercase">Descrição</label>
            <textarea 
              rows={3}
              placeholder="Detalhes da atividade..." 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="w-full bg-[#06080D] border border-[#1E2538] rounded-lg px-3 py-2.5 text-white placeholder-[#8B949E] focus:outline-none focus:border-[#0284C7] transition-colors text-sm resize-none"
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={mutation.isPending}
              className="w-full bg-[#0284C7] hover:bg-[#0369a1] text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? "Criando..." : "Criar Atividade"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}