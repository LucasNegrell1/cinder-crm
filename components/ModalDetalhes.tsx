"use client";

import { X, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// Precisamos definir o formato do dado que vamos receber do page.tsx
type Opportunity = { 
  id: string; 
  title: string; 
  value: number; 
  stage_id: string; 
  contacts: { name: string } | null; 
};

type ModalDetalhesProps = {
  opportunity: Opportunity | null; // Recebe o card inteiro ou 'null' se fechado
  onClose: () => void;
};

export function ModalDetalhes({ opportunity, onClose }: ModalDetalhesProps) {
  const queryClient = useQueryClient();

  // O Motor de Exclusão (useMutation)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('opportunities').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      // Atualiza a tela instantaneamente e fecha o modal
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      onClose();
    }
  });

  // Se a variável for null (modal fechado), não desenha nada
  if (!opportunity) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleDelete = () => {
    // Trava de segurança para o corretor não excluir sem querer
    if (window.confirm("Tem certeza que deseja excluir esta oportunidade? Essa ação não pode ser desfeita.")) {
      deleteMutation.mutate(opportunity.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Detalhes da Negociação</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Corpo com os Dados do Banco */}
        <div className="p-6 space-y-4">
            {deleteMutation.isError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
              Erro ao excluir: {deleteMutation.error.message}
               </div>
            )}
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Título do Imóvel</p>
            <p className="text-lg font-bold text-slate-800">{opportunity.title}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Valor Estimado</p>
            <div className="inline-block text-lg font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
              {formatCurrency(opportunity.value)}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Cliente Vinculado</p>
            <p className="text-slate-800 flex items-center gap-2">
              👤 {opportunity.contacts?.name || 'Nenhum cliente atrelado (ainda)'}
            </p>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
          
          {/* Botão de Excluir (Esquerda) */}
          <button 
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            <Trash2 size={18} />
            {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
          </button>

          {/* Botão de Fechar (Direita) */}
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg shadow-sm transition-colors"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}