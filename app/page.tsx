"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react"; // Um ícone para o botão

type Stage = { id: string; name: string; list_order: number; };
type Opportunity = { id: string; title: string; value: number; stage_id: string; contacts: { name: string } | null; };

export default function Home() {
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Busca de Estágios com Proteção
  const { data: stagesData, isLoading: loadingStages } = useQuery({
    queryKey: ['stages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('stages').select('*').order('list_order', { ascending: true });
      if (error) {
        console.error("Erro ao buscar estágios:", error);
        return []; // Retorna lista vazia em vez de quebrar a tela
      }
      return data as Stage[];
    }
  });

  // Busca de Oportunidades com Proteção
  const { data: oppsData, isLoading: loadingOpps } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('opportunities').select('*, contacts(name)');
      if (error) {
        console.error("Erro ao buscar oportunidades:", error);
        return []; // Retorna lista vazia
      }
      return data as Opportunity[];
    }
  });

  // Garantindo que nunca sejam undefined
  const stages = stagesData || [];
  const opportunities = oppsData || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    queryClient.setQueryData(['opportunities'], (oldCards: Opportunity[] | undefined) => {
      if (!oldCards) return [];
      return oldCards.map((card) =>
        card.id === draggableId ? { ...card, stage_id: destination.droppableId } : card
      );
    });

    await supabase.from('opportunities').update({ stage_id: destination.droppableId }).eq('id', draggableId);
  };

  if (!isMounted) return null;

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden bg-white">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Pipeline de Vendas</h1>
          <p className="text-slate-500 mt-1">Acompanhe suas negociações imobiliárias em andamento.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition">
          <Plus size={20} />
          Nova Oportunidade
        </button>
      </header>

      {/* Se estiver carregando, mostra o aviso mas não quebra a tela */}
      {(loadingStages || loadingOpps) && (
        <div className="mb-4 text-blue-600 font-medium animate-pulse">Sincronizando com banco de dados...</div>
      )}

      {/* Se o banco estiver literalmente vazio de colunas */}
      {!loadingStages && stages.length === 0 && (
         <div className="flex-1 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-center p-8 bg-slate-50">
            <h2 className="text-xl font-bold text-slate-700 mb-2">Seu funil está vazio</h2>
            <p className="text-slate-500 max-w-md">Para começar a gerenciar clientes, precisamos criar as colunas do seu Kanban (Ex: Prospecção, Visita).</p>
         </div>
      )}

      {/* O Kanban Real */}
      {stages.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
            {stages.map((stage) => {
              const cardsThisStage = opportunities.filter(opp => opp.stage_id === stage.id);

              return (
                <div key={stage.id} className="min-w-[320px] max-w-[320px] bg-slate-100 rounded-xl p-4 flex flex-col shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-2">
                    <h2 className="font-bold text-slate-700 uppercase tracking-wider text-sm">{stage.name}</h2>
                    <span className="bg-white text-slate-500 text-xs font-bold px-2 py-1 rounded-full shadow-sm border border-slate-200">
                      {cardsThisStage.length}
                    </span>
                  </div>
                  
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className={`flex-1 space-y-3 overflow-y-auto min-h-[150px] transition-colors rounded-lg ${snapshot.isDraggingOver ? 'bg-slate-200/50' : ''}`}>
                        {cardsThisStage.length === 0 && !snapshot.isDraggingOver && (
                          <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-lg opacity-50">
                              <p className="text-slate-400 text-xs font-medium uppercase">Vazio</p>
                          </div>
                        )}

                        {cardsThisStage.map((opp, index) => (
                          <Draggable key={opp.id} draggableId={opp.id} index={index}>
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`bg-white p-4 rounded-lg shadow-sm border ${snapshot.isDragging ? 'border-blue-500 shadow-xl rotate-2' : 'border-slate-200'} cursor-grab active:cursor-grabbing transition-all`}>
                                  <h3 className="font-bold text-slate-800">{opp.title}</h3>
                                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">👤 {opp.contacts?.name || 'Sem cliente'}</p>
                                  <div className="mt-3 text-sm font-bold text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded">{formatCurrency(opp.value)}</div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}