"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ModalNovaOportunidade({ isOpen, onClose }: ModalProps) {
  // O QueryClient é o nosso acesso ao "cache" do TanStack Query
  const queryClient = useQueryClient();

  // 1. O Estado do Formulário (Onde guardamos o que o usuário digita)
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");

  // 2. O Motor de Inserção (useMutation)
  const mutation = useMutation({
    mutationFn: async () => {
      // Passo A: Perguntamos ao banco qual é o ID da primeira coluna (Prospecção)
      const { data: stageData, error: stageError } = await supabase
        .from('stages')
        .select('id')
        .order('list_order', { ascending: true })
        .limit(1)
        .single();

      if (stageError) throw new Error("Erro ao buscar a coluna inicial");

      // Passo B: Inserimos o novo card atrelado a essa coluna
      const { error: insertError } = await supabase
        .from('opportunities')
        .insert({
          title: title,
          value: Number(value), // Convertendo o texto para número/dinheiro
          stage_id: stageData.id,
        });

      if (insertError) throw new Error(insertError.message);
    },
    // O que fazer se a inserção der certo?
    onSuccess: () => {
      // Invalida a busca antiga, forçando o page.tsx a redesenhar a tela com o novo card
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      
      // Limpa os campos e fecha a janela
      setTitle("");
      setValue("");
      onClose();
    },
  });

  // 3. A Função disparada quando clicamos em "Salvar"
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Impede a página de dar F5 (comportamento padrão do HTML)
    if (!title || !value) return; // Trava de segurança
    
    mutation.mutate(); // Liga o motor!
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Nova Oportunidade</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Transformamos a div num <form> para podermos usar o evento 'onSubmit' */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {mutation.isError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                Ocorreu um erro ao salvar: {mutation.error.message}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Título do Imóvel / Negociação
              </label>
              <input 
                type="text" 
                placeholder="Ex: Apartamento Jardins"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Valor Estimado (R$)
              </label>
              <input 
                type="number" 
                placeholder="Ex: 850000"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={mutation.isPending}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {/* O texto do botão muda automaticamente se o React estiver processando */}
              {mutation.isPending ? "Salvando..." : "Salvar Oportunidade"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}