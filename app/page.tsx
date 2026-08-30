"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus } from "lucide-react"; 
import { ModalNovaOportunidade } from "@/components/ModalNovaOportunidade";
import { ModalDetalhes } from "@/components/ModalDetalhes";


type Stage = { id: string; name: string; list_order: number; };
type Opportunity = { id: string; title: string; value: number; stage_id: string; contacts: { name: string } | null; };

export default function Home() {
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const { data: stagesData, isLoading: loadingStages } = useQuery({
    queryKey: ['stages'],
    queryFn: async () => {
      const { data, error } = await supabase.from('stages').select('*').order('list_order', { ascending: true });
      if (error) {
        console.error("Erro ao buscar estágios:", error);
        return []; 
      }
      return data as Stage[];
    }
  });

  const { data: oppsData, isLoading: loadingOpps } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase.from('opportunities').select('*, contacts(name)');
      if (error) {
        console.error("Erro ao buscar oportunidades:", error);
        return []; 
      }
      return data as Opportunity[];
    }
  });

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
    // Voltamos ao seu layout original, limpo e que funciona com a Sidebar!
    <div className="p-8 h-full flex flex-col overflow-hidden bg-[#090C15] bg-dots-pattern min-h-screen text-[#F8FAFC]">
      
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white">Pipeline de Vendas</h1>
          <p className="text-[#8B949E] mt-1">Acompanhe suas negociações imobiliárias em andamento.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0284C7] hover:bg-[#0369a1] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition">
          <Plus size={20} />
          Nova Oportunidade
        </button>
      </header>

      {(loadingStages || loadingOpps) && (
        <div className="mb-4 text-[#0284C7] font-medium animate-pulse">Sincronizando com banco de dados...</div>
      )}

      {!loadingStages && stages.length === 0 && (
         <div className="flex-1 border-2 border-dashed border-[#1E2538] rounded-xl flex flex-col items-center justify-center text-center p-8 bg-[#10141F]">
            <h2 className="text-xl font-bold text-white mb-2">Seu funil está vazio</h2>
            <p className="text-[#8B949E] max-w-md">Para começar a gerenciar clientes, precisamos criar as colunas do seu Kanban (Ex: Prospecção, Visita).</p>
         </div>
      )}

      {stages.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          {/* items-start impede que as colunas estiquem sozinhas */}
          <div className="flex flex-1 gap-6 overflow-x-auto pb-4 custom-scrollbar items-start">
            
            {stages.map((stage, index) => {
              const cardsThisStage = opportunities.filter(opp => opp.stage_id === stage.id);
              
              const borderColors = ["bg-[#3B82F6]", "bg-[#EAB308]", "bg-[#A855F7]", "bg-[#22C55E]"];
              const topColor = borderColors[index % borderColors.length];

              const totalValue = cardsThisStage.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
              const formattedTotal = formatCurrency(totalValue);
              
              return (
                // w-[320px] shrink-0 trava o tamanho exato da coluna para ela não amassar e não bugar o DND
                <div key={stage.id} className="w-[320px] shrink-0 bg-[#06080D] rounded-xl flex flex-col border border-[#1E2538] overflow-hidden max-h-full">
                  
                  <div className={`h-1 w-full ${topColor}`}></div>

                  <div className="bg-[#10141F] p-4 flex flex-col gap-3 border-b border-[#1E2538]">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-white uppercase tracking-wider text-sm">{stage.name}</h2>
                      <span className="bg-[#1E2538] text-[#8B949E] text-xs font-bold px-2 py-1 rounded-full border border-[#1E2538]">
                        {cardsThisStage.length}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-[#0284C7] bg-[#0284C7]/10 border border-[#0284C7]/20 px-2 py-1 rounded-full uppercase">
                        • Promove para: Lead
                      </span>
                    </div>

                    <div className="text-right text-xs text-[#8B949E] mt-1 flex justify-end items-center gap-1">
                      Total: <span className="font-semibold text-white tracking-wider">{formattedTotal}</span>
                    </div>
                  </div>

                  {/* Esta div agora controla o scroll vertical isolado de cada coluna */}
                  <div className="p-3 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
                    <Droppable droppableId={stage.id}>
                      {(provided, snapshot) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} 
                             className={`flex-1 space-y-3 min-h-[150px] rounded-lg ${snapshot.isDraggingOver ? 'bg-[#1E2538]/30' : ''}`}>
                          
                          {cardsThisStage.length === 0 && !snapshot.isDraggingOver && (
                            <div className="h-24 flex items-center justify-center border-2 border-dashed border-[#1E2538] rounded-lg opacity-50">
                                <p className="text-[#8B949E] text-xs font-medium uppercase">Vazio</p>
                            </div>
                          )}

                          {cardsThisStage.map((opp, index) => (
                            <Draggable key={opp.id} draggableId={opp.id} index={index}>
                              {(provided, snapshot) => (
                                // AQUI: select-none adicionado, e 'transition-all' removido para PARAR os bugs visuais de apagão!
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={() => setSelectedOpportunity(opp)}
                                     className={`bg-[#10141F] p-4 rounded-lg border ${snapshot.isDragging ? 'border-[#0284C7] shadow-xl rotate-2' : 'border-[#1E2538] hover:border-[#8B949E]/50'} cursor-grab active:cursor-grabbing select-none`}>
                                    <h3 className="font-bold text-white">{opp.title}</h3>
                                    <p className="text-sm text-[#8B949E] mt-1 flex items-center gap-2">👤 {opp.contacts?.name || 'Sem cliente'}</p>
                                    <div className="mt-3 text-sm font-bold text-[#10B981] bg-[#10B981]/10 w-fit px-2 py-1 rounded">
                                      {formatCurrency(opp.value)}
                                    </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>

                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}
      <ModalNovaOportunidade 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
      />
      <ModalDetalhes 
        opportunity={selectedOpportunity} 
        onClose={() => setSelectedOpportunity(null)} 
      />
    </div>
  );
}