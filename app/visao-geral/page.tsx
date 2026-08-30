"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer 
} from "recharts";
import { 
  DollarSign, Users, Target, TrendingUp, AlertTriangle, 
  X, Clock, Calendar, CheckCircle2, ArrowRightLeft
} from "lucide-react";

type Opportunity = {
  id: string;
  value: number;
  created_at: string;
  stages: { name: string } | null;
};

type ActivityType = {
  id: string;
  title: string;
  created_at: string;
};

export default function VisaoGeralPage() {
  const [periodo, setPeriodo] = useState("Este Mês");
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);

  const { data: opportunities = [], isLoading: isLoadingOpps } = useQuery({
    queryKey: ['visao_geral_opps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`id, value, created_at, stages ( name )`);
      if (error) throw new Error(error.message);
      return data as unknown as Opportunity[];
    }
  });

  const { data: activities = [], isLoading: isLoadingActs } = useQuery({
    queryKey: ['visao_geral_acts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activities')
        .select('id, title, created_at')
        .order('created_at', { ascending: false })
        .limit(15);
      if (error) throw new Error(error.message);
      return data as ActivityType[];
    }
  });

  // ==========================================
  // CÁLCULOS E MÉTRICAS
  // ==========================================

  const pipelineTotal = opportunities.reduce((acc, curr) => acc + (curr.value || 0), 0);
  
  const ganhos = opportunities.filter(opp => opp.stages?.name?.toLowerCase() === 'contrato assinado');
  const perdas = opportunities.filter(opp => opp.stages?.name?.toLowerCase() === 'sem negócio');
  
  const ativos = opportunities.filter(
    opp => opp.stages?.name?.toLowerCase() !== 'contrato assinado' && opp.stages?.name?.toLowerCase() !== 'sem negócio'
  );

  const receitaGanha = ganhos.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const conversao = (ganhos.length + perdas.length) > 0 
    ? ((ganhos.length / (ganhos.length + perdas.length)) * 100).toFixed(1) 
    : "0.0";

  const hoje = new Date();
  const estagnados = ativos.filter(opp => {
    const dataCriacao = new Date(opp.created_at);
    const diffTime = Math.abs(hoje.getTime() - dataCriacao.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 10;
  });

  const valorEmRisco = estagnados.reduce((acc, curr) => acc + (curr.value || 0), 0);
  const ltvMedio = ganhos.length > 0 ? (receitaGanha / ganhos.length) : 0;

  // LÓGICA DO FUNIL
  const funilDataMap: Record<string, number> = {};
  ativos.forEach(opp => {
    const stageName = opp.stages?.name || 'Sem Etapa';
    if (!funilDataMap[stageName]) funilDataMap[stageName] = 0;
    funilDataMap[stageName] += 1;
  });
  
  let funilData = Object.keys(funilDataMap).map(key => ({
    name: key,
    quantidade: funilDataMap[key]
  }));

  // Esqueleto padrão se não houver negócios ativos
  if (funilData.length === 0) {
    funilData = [
      { name: 'Prospecção', quantidade: 0 },
      { name: 'Qualificação', quantidade: 0 },
      { name: 'Proposta', quantidade: 0 },
      { name: 'Negociação', quantidade: 0 }
    ];
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  };

  const formatCurrencyK = (value: number) => {
    return `$${(value / 1000).toFixed(1)}k`;
  };

  if (isLoadingOpps || isLoadingActs) {
    return <div className="p-8 h-screen bg-[#090C15] flex items-center justify-center text-[#8B949E]">Carregando Visão Geral...</div>;
  }

  return (
    <div className="p-8 h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#090C15] bg-dots-pattern min-h-screen text-[#F8FAFC]">
      
      {/* HEADER E BOTÃO DE ALERTA */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Visão Geral</h1>
          <p className="text-[#8B949E] mt-1 text-sm">O pulso do seu negócio em tempo real.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="bg-[#10141F] border border-[#1E2538] text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#0284C7] appearance-none cursor-pointer"
          >
            <option>Este Mês</option>
            <option>Mês Passado</option>
          </select>

          <button 
            onClick={() => setIsAlertModalOpen(true)}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] hover:bg-[#F59E0B]/20 transition-colors relative"
          >
            <AlertTriangle size={18} />
            {estagnados.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#EF4444] rounded-full border-2 border-[#090C15]"></span>
            )}
          </button>
        </div>
      </header>

      {/* 4 CARDS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#10141F] border border-[#1E2538] p-5 rounded-xl shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[#8B949E] text-sm">Pipeline Total</span>
            <div className="w-8 h-8 rounded-lg bg-[#0284C7]/10 flex items-center justify-center text-[#0284C7]">
              <DollarSign size={16} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{formatCurrency(pipelineTotal)}</h3>
          <p className="text-xs text-[#10B981] flex items-center gap-1">
            <TrendingUp size={12} /> +0.0% <span className="text-[#8B949E]">vs mês passado</span>
          </p>
        </div>

        <div className="bg-[#10141F] border border-[#1E2538] p-5 rounded-xl shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[#8B949E] text-sm">Negócios Ativos</span>
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6]">
              <Users size={16} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{ativos.length}</h3>
          <p className="text-xs text-[#10B981] flex items-center gap-1">
            <TrendingUp size={12} /> +0.0% <span className="text-[#8B949E]">vs mês passado</span>
          </p>
        </div>

        <div className="bg-[#10141F] border border-[#1E2538] p-5 rounded-xl shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[#8B949E] text-sm">Conversão</span>
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
              <Target size={16} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{conversao}%</h3>
          <p className="text-xs text-[#10B981] flex items-center gap-1">
            <TrendingUp size={12} /> +0.0% <span className="text-[#8B949E]">vs mês passado</span>
          </p>
        </div>

        <div className="bg-[#10141F] border border-[#1E2538] p-5 rounded-xl shadow-sm relative overflow-hidden">
          <div className="flex items-start justify-between mb-2">
            <span className="text-[#8B949E] text-sm">Receita (Ganha)</span>
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]">
              <TrendingUp size={16} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{formatCurrency(receitaGanha)}</h3>
          <p className="text-xs text-[#10B981] flex items-center gap-1">
            <TrendingUp size={12} /> +0.0% <span className="text-[#8B949E]">vs mês passado</span>
          </p>
        </div>
      </div>

      {/* SAÚDE DA CARTEIRA */}
      <div className="mb-4 flex items-center gap-2 text-white font-semibold">
        <Users size={18} className="text-[#0284C7]" />
        Saúde da Carteira
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        
        {/* Distribuição da Carteira */}
        <div className="bg-[#10141F] border border-[#1E2538] p-5 rounded-xl shadow-sm flex flex-col justify-center">
          <span className="text-[#8B949E] text-sm mb-2">Distribuição da Carteira</span>
          <div className="flex items-baseline gap-2 mb-3">
            <h3 className="text-2xl font-bold text-white">100%</h3>
            <span className="text-[#10B981] text-xs font-semibold">Ativos</span>
          </div>
          <div className="w-full bg-[#1E2538] h-2 rounded-full mb-3 overflow-hidden">
            <div className="bg-[#10B981] h-full rounded-full w-full"></div>
          </div>
          <div className="flex items-center justify-between text-xs text-[#8B949E]">
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10B981]"></span> Ativos ({ativos.length})</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span> Inativos (0)</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#EF4444]"></span> Churn (0)</div>
          </div>
        </div>

        {/* Negócios Parados */}
        <div className="bg-[#10141F] border border-[#1E2538] p-5 rounded-xl shadow-sm flex flex-col justify-center">
          <span className="text-[#8B949E] text-sm mb-2">Negócios Parados</span>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-2xl font-bold text-white">{estagnados.length} Deals</h3>
            {estagnados.length > 0 && <span className="text-[#F59E0B] text-xs font-semibold">Atenção</span>}
          </div>
          <p className="text-xs text-[#8B949E] mb-1">Sem mudança de estágio há +10 dias.</p>
          <p className="text-xs text-[#8B949E]">{formatCurrency(valorEmRisco)} em risco</p>
        </div>

        {/* LTV Médio */}
        <div className="bg-[#10141F] border border-[#1E2538] p-5 rounded-xl shadow-sm flex flex-col justify-center">
          <span className="text-[#8B949E] text-sm mb-2">LTV Médio</span>
          <div className="flex items-baseline gap-2 mb-2">
            <h3 className="text-2xl font-bold text-white">{formatCurrencyK(ltvMedio)}</h3>
            <span className="text-[#10B981] text-xs font-semibold">Médio</span>
          </div>
          <p className="text-xs text-[#8B949E]">Valor médio vitalício por cliente ativo.</p>
        </div>
      </div>

      {/* FUNIL & ATIVIDADES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* GRÁFICO DE FUNIL SUPER CLEAN */}
        <div className="bg-[#10141F] border border-[#1E2538] p-6 rounded-xl shadow-sm h-[400px] flex flex-col">
          <h3 className="font-bold text-white mb-6">Funil</h3>
          <div className="flex-1 w-full -ml-4 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funilData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  stroke="#8B949E" 
                  fontSize={12}
                  width={110}
                  tickMargin={10}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }} 
                  contentStyle={{ backgroundColor: '#06080D', borderColor: '#1E2538', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: unknown) => [`${value} Oportunidades`, 'Quantidade']}
                />
                <Bar 
                  dataKey="quantidade" 
                  fill="#0284C7" 
                  radius={[0, 4, 4, 0]} 
                  barSize={20} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Atividades Recentes */}
        <div className="bg-[#10141F] border border-[#1E2538] p-6 rounded-xl shadow-sm h-[400px] flex flex-col">
          <h3 className="font-bold text-white mb-6">Atividades Recentes</h3>
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
            {activities.length === 0 ? (
              <p className="text-[#8B949E] text-sm text-center mt-10">Nenhuma atividade recente.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#1E2538] flex items-center justify-center shrink-0 mt-1">
                    <ArrowRightLeft size={14} className="text-[#8B949E]" />
                  </div>
                  <div className="flex-1 border-b border-[#1E2538]/50 pb-4">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-white text-sm">
                        {act.title.split(/\*\*(.*?)\*\*/g).map((part, i) => 
                          i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part
                        )}
                      </p>
                      <span className="text-[10px] text-[#8B949E] shrink-0 ml-4">
                        {new Date(act.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })},{' '}
                        {new Date(act.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ========================================== */}
      {/* MODAL DE ALERTAS DE PIPELINE */}
      {/* ========================================== */}
      {isAlertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-[#0F131E] border border-[#1E2538] rounded-xl shadow-2xl overflow-hidden flex flex-col">
            
            <div className="p-6 border-b border-[#1E2538] flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#0284C7]/20 rounded-full flex items-center justify-center text-[#0284C7]">
                    <Clock size={18} />
                  </div>
                  Alertas de Pipeline
                </h2>
                <p className="text-[#8B949E] mt-2">
                  {estagnados.length === 0 ? "Seu pipeline está saudável! 🎉" : "Alguns negócios precisam da sua atenção."}
                </p>
              </div>
              <button onClick={() => setIsAlertModalOpen(false)} className="text-[#8B949E] hover:text-white transition-colors p-1">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/20 flex items-center justify-center text-[#EF4444] shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <h4 className="text-white font-semibold flex items-center gap-2 text-lg">
                    Negócios Estagnados
                    <span className="bg-[#1E2538] text-[#8B949E] text-xs px-2 py-0.5 rounded-full">{estagnados.length}</span>
                  </h4>
                  <p className="text-[#8B949E] text-sm mb-2">Sem mudança de estágio há mais de 10 dias</p>
                  
                  {estagnados.length === 0 ? (
                    <p className="text-sm text-[#8B949E] italic flex items-center gap-1">Nenhum deal nesta categoria <CheckCircle2 size={14}/></p>
                  ) : (
                    <div className="space-y-2 mt-3">
                      {estagnados.map(opp => (
                        <div key={opp.id} className="text-sm text-white bg-[#1E2538]/50 p-2 rounded border border-[#1E2538]">
                          Deal de <span className="font-bold text-[#EF4444]">{formatCurrency(opp.value)}</span> preso em <span className="text-[#8B949E]">{opp.stages?.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center text-[#F59E0B] shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <h4 className="text-white font-semibold flex items-center gap-2 text-lg">
                    Sem Próximo Passo
                    <span className="bg-[#1E2538] text-[#8B949E] text-xs px-2 py-0.5 rounded-full">0</span>
                  </h4>
                  <p className="text-[#8B949E] text-sm mb-2">Nenhuma atividade futura agendada</p>
                  <p className="text-sm text-[#8B949E] italic flex items-center gap-1">Nenhum deal nesta categoria <CheckCircle2 size={14}/></p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center text-[#10B981] shrink-0">
                  <TrendingUp size={20} />
                </div>
                <div>
                  <h4 className="text-white font-semibold flex items-center gap-2 text-lg">
                    Prontos para Fechar
                    <span className="bg-[#1E2538] text-[#8B949E] text-xs px-2 py-0.5 rounded-full">0</span>
                  </h4>
                  <p className="text-[#8B949E] text-sm mb-2">Alta probabilidade de conversão</p>
                  <p className="text-sm text-[#8B949E] italic flex items-center gap-1">Nenhum deal nesta categoria <CheckCircle2 size={14}/></p>
                </div>
              </div>

            </div>

            <div className="bg-[#1E2538]/50 p-4 border-t border-[#1E2538] text-center">
              <p className="text-sm text-[#8B949E]">
                💡 Dica: Deals sem atividade futura têm menor chance de conversão. Agende próximos passos!
              </p>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}