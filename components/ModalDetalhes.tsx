"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { X, Trash2, Edit2, Check, XCircle } from "lucide-react";

type Opportunity = {
  id: string;
  title: string;
  value: number;
  stage_id: string;
  contacts: { name: string } | null;
};

interface ModalDetalhesProps {
  opportunity: Opportunity | null;
  onClose: () => void;
}

export function ModalDetalhes({ opportunity, onClose }: ModalDetalhesProps) {
  const queryClient = useQueryClient();
  
  // Estados para controlar a edição
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editValue, setEditValue] = useState<number | string>("");
  const [isSaving, setIsSaving] = useState(false);

  // Estado auxiliar para o React saber quando os dados chegaram/mudaram
  const [prevOppId, setPrevOppId] = useState<string | null>(null);

  // 🌟 A MÁGICA QUE RESOLVE O ERRO AQUI 🌟
  // O padrão oficial do React (Render-phase state update) que substitui o useEffect.
  // Ele atualiza os dados instantaneamente sem causar duplo-render.
  if (opportunity && opportunity.id !== prevOppId) {
    setPrevOppId(opportunity.id);
    setEditTitle(opportunity.title);
    setEditValue(opportunity.value);
    setIsEditing(false); // Sempre começa visualizando
  }

  if (!opportunity) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const numericValue = typeof editValue === 'string' ? parseFloat(editValue.toString().replace(',', '.')) : editValue;

      const { error } = await supabase
        .from('opportunities')
        .update({ 
          title: editTitle, 
          value: isNaN(numericValue) ? 0 : numericValue 
        })
        .eq('id', opportunity.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar as alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Tem certeza que deseja excluir esta negociação?")) return;
    
    try {
      const { error } = await supabase.from('opportunities').delete().eq('id', opportunity.id);
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      onClose();
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        
        {/* Cabeçalho */}
        <div className="flex justify-between items-center p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#0F172A]">Detalhes da Negociação</h2>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-[#0284C7] transition-colors rounded-md hover:bg-gray-100" title="Editar">
                <Edit2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors rounded-md hover:bg-gray-100">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 space-y-5 flex-1">
          
          {/* Campo: Título */}
          <div>
            <label className="text-sm text-gray-500 font-medium block mb-1">Título do Imóvel</label>
            {isEditing ? (
              <input 
                type="text" 
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                autoFocus
              />
            ) : (
              <p className="font-bold text-[#0F172A] text-lg">{editTitle}</p>
            )}
          </div>

          {/* Campo: Valor */}
          <div>
            <label className="text-sm text-gray-500 font-medium block mb-1">Valor Estimado</label>
            {isEditing ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                <input 
                  type="number" 
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-[#0F172A] focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                />
              </div>
            ) : (
              <div className="bg-[#ECFDF5] text-[#10B981] font-bold px-3 py-1.5 rounded-md w-fit">
                {formatCurrency(Number(editValue))}
              </div>
            )}
          </div>

          {/* Campo: Cliente */}
          <div>
            <label className="text-sm text-gray-500 font-medium block mb-1">Cliente Vinculado</label>
            <div className="flex items-center gap-2 text-[#0F172A]">
              👤 <span>{opportunity.contacts?.name || 'Sem cliente vinculado'}</span>
            </div>
          </div>

        </div>

        {/* Rodapé (Botões) */}
        <div className="p-5 bg-gray-50 flex justify-between items-center">
          {isEditing ? (
            <>
              <button 
                onClick={() => setIsEditing(false)} 
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <XCircle size={18} /> Cancelar
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-medium px-4 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                <Check size={18} /> {isSaving ? "Salvando..." : "Salvar"}
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleDelete}
                className="flex items-center gap-2 text-red-600 hover:text-red-700 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={18} /> Excluir
              </button>
              <button 
                onClick={onClose} 
                className="bg-[#E2E8F0] hover:bg-[#CBD5E1] text-[#0F172A] font-medium px-6 py-2 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}