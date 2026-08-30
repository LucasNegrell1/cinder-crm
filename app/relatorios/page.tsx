"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from "recharts";
import { 
  Target, DollarSign, Clock, TrendingUp, Trophy, AlertTriangle, Users, Edit2, Check, X 
} from "lucide-react";

// Tipagens do banco
type Opportunity = {
  id: string;
  value: number;
  created_at: string;
  stages: { name: string } | null;
  contacts: { name: string } | null;
};

type TooltipValue = number | string | (number | string)[] | undefined;

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState("Este Mês");
  
  // 🌟 ESTADOS PARA CONTROLAR A META DINÂMICA
  const [metaContratos, setMetaContratos] = useState(50);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [tempMeta, setTempMeta] = useState(50);

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['relatorios_performance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select(`
          id,
          value,
          created_at,
          stages ( name ),
          contacts ( name )
        `);

     if (error) {
        console.error("Erro na busca do Supabase:", error);
        throw new Error(error.message);
      }
      
      // 2. DETETIVE: Vai mostrar exatamente o que está chegando do banco
      console.log("Oportunidades carregadas:", data);
      
      return data as unknown as Opportunity[];
    }
  });

  // ==========================================
  // LÓGICA DE DADOS E MÉTRICAS
  // ==========================================

  const dealsFechados = opportunities.filter(opp => {
    const nomeEstagio = opp.stages?.name?.toLowerCase().trim();
    return nomeEstagio === 'contrato assinado' || nomeEstagio === 'won' || nomeEstagio === 'ganho';
  });
  
  const dealsPerdidos = opportunities.filter(opp => {
    const nomeEstagio = opp.stages?.name?.toLowerCase().trim();
    return nomeEstagio === 'sem negócio' || nomeEstagio === 'lost' || nomeEstagio === 'perdido';
  });

  
  const totalGanhos = dealsFechados.length;
  const totalPerdidos = dealsPerdidos.length;
  const totalFinalizados = totalGanhos + totalPerdidos;

  const winRate = totalFinalizados > 0 ? ((totalGanhos / totalFinalizados) * 100).toFixed(1) : "0.0";
  const pipelineTotal = opportunities.reduce((acc, curr) => acc + (curr.value || 0), 0);

  // 🌟 CÁLCULOS DA META USANDO O ESTADO
  const gapMeta = totalGanhos - metaContratos;
  const progressoMeta = Math.min(100, metaContratos > 0 ? (totalGanhos / metaContratos) * 100 : 0);

  const ultimos6Meses = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      mes: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      mesNum: d.getMonth(),
      ano: d.getFullYear(),
      receita: 0
    };
  });

  dealsFechados.forEach(opp => {
    const date = new Date(opp.created_at);
    const mesIndex = ultimos6Meses.findIndex(m => m.mesNum === date.getMonth() && m.ano === date.getFullYear());
    if (mesIndex !== -1) {
      ultimos6Meses[mesIndex].receita += (opp.value || 0);
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // 🌟 FUNÇÃO PARA SALVAR A NOVA META
  const salvarMeta = () => {
    if (tempMeta > 0) {
      setMetaContratos(tempMeta);
    }
    setIsEditingMeta(false);
  };

  if (isLoading) {
    return <div className="p-8 h-screen bg-[#090C15] flex items-center justify-center text-[#8B949E]">Calculando métricas...</div>;
  }

  return (
    <div className="p-8 h-full flex flex-col overflow-y-auto custom-scrollbar bg-[#090C15] bg-dots-pattern min-h-screen text-[#F8FAFC]">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Relatórios de Performance</h1>
          <p className="text-[#8B949E] mt-1 text-sm">Análise detalhada de vendas e tendências.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="bg-[#10141F] border border-[#1E2538] text-white text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-[#0284C7] appearance-none cursor-pointer hover:bg-[#1E2538]/50 transition-colors"
          >
            <option>Este Mês</option>
            <option>Mês Passado</option>
            <option>Este Ano</option>
          </select>
        </div>
      </header>

      {/* SEÇÃO DA META (PROGRESS BAR) */}
      <div className="bg-[#10141F] border border-[#1E2538] rounded-xl p-6 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          
          {/* 🌟 ÁREA DO TÍTULO COM O BOTÃO DE EDITAR */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-[#F59E0B]" />
              <h3 className="font-semibold text-white text-sm">Contratos Assinados (Meta)</h3>
            </div>
            
            {isEditingMeta ? (
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={tempMeta} 
                  onChange={(e) => setTempMeta(Number(e.target.value))}
                  className="w-20 bg-[#06080D] border border-[#1E2538] rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-[#0284C7]"
                  min="1"
                  autoFocus
                />
                <button onClick={salvarMeta} className="p-1.5 bg-[#10B981] hover:bg-[#059669] text-white rounded transition-colors">
                  <Check size={14} />
                </button>
                <button onClick={() => setIsEditingMeta(false)} className="p-1.5 bg-[#EF4444] hover:bg-[#B91C1C] text-white rounded transition-colors">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setTempMeta(metaContratos);
                  setIsEditingMeta(true);
                }} 
                className="flex items-center gap-1.5 text-xs font-medium text-[#8B949E] hover:text-white transition-colors bg-[#1E2538]/40 hover:bg-[#1E2538] px-2.5 py-1 rounded-md"
              >
                <Edit2 size={12} />
                Alterar Meta
              </button>
            )}
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex flex-col items-end">
              <span className="text-[#8B949E] text-[11px] uppercase tracking-wider mb-1">Realizado</span>
              <span className="text-[#10B981] font-bold text-base">{totalGanhos}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#8B949E] text-[11px] uppercase tracking-wider mb-1">Meta</span>
              <span className="text-white font-bold text-base">{metaContratos}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#8B949E] text-[11px] uppercase tracking-wider mb-1">Gap</span>
              <span className={`${gapMeta >= 0 ? 'text-[#10B981]' : 'text-[#F59E0B]'} font-bold text-base`}>
                {gapMeta > 0 ? `+${gapMeta}` : gapMeta}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full bg-[#1E2538] h-3 rounded-full mb-3 overflow-hidden relative">
          <div 
            className={`${progressoMeta >= 100 ? 'bg-[#10B981]' : 'bg-[#0284C7]'} h-full rounded-full transition-all duration-1000 ease-out`}
            style={{ width: `${progressoMeta}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-xs text-[#8B949E]">
            {progressoMeta >= 100 ? (
              <span className="text-[#10B981] flex items-center gap-1.5">
                <Trophy size={14} />
                Parabéns! Você atingiu ou ultrapassou a meta.
              </span>
            ) : (
              <span className="text-[#F59E0B]/90 flex items-center gap-1.5">
                <AlertTriangle size={14} />
                Atenção! Você está em {progressoMeta.toFixed(0)}% da meta. Faltam {Math.abs(gapMeta)}.
              </span>
            )}
          </div>
          <span className="text-xs font-bold text-white">{progressoMeta.toFixed(0)}%</span>
        </div>
      </div>

      {/* 4 CARDS (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        
        <div className="bg-[#10141F] border border-[#1E2538] p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#0284C7]/10 flex items-center justify-center text-[#0284C7]">
              <DollarSign size={16} />
            </div>
            <span className="text-[#8B949E] text-sm">Pipeline Total</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{formatCurrency(pipelineTotal)}</h3>
          <p className="text-xs text-[#10B981]">+0.0% vs mês passado</p>
        </div>

        <div className="bg-[#10141F] border border-[#1E2538] p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
              <Target size={16} />
            </div>
            <span className="text-[#8B949E] text-sm">Win Rate</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{winRate}%</h3>
          <p className="text-xs text-[#10B981]">+0.0% vs mês passado</p>
        </div>

        <div className="bg-[#10141F] border border-[#1E2538] p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6]">
              <Clock size={16} />
            </div>
            <span className="text-[#8B949E] text-sm">Ciclo Médio</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">0 dias</h3>
          <p className="text-xs text-[#8B949E]">Rápido: 0d | Lento: 0d</p>
        </div>

        <div className="bg-[#10141F] border border-[#1E2538] p-5 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center text-[#F59E0B]">
              <TrendingUp size={16} />
            </div>
            <span className="text-[#8B949E] text-sm">Deals Fechados</span>
          </div>
          <h3 className="text-2xl font-bold mb-1">
            <span className="text-[#10B981]">{totalGanhos}</span>
            <span className="text-[#8B949E] mx-1">/</span>
            <span className="text-[#EF4444]">{totalPerdidos}</span>
          </h3>
          <p className="text-xs text-[#8B949E]">Ganhos / Perdas</p>
        </div>
      </div>

      {/* GRÁFICO E TOP VENDEDORES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico de Linha */}
        <div className="lg:col-span-2 bg-[#10141F] border border-[#1E2538] p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-white">Tendência de Receita</h3>
            <span className="text-xs text-[#8B949E] px-3 py-1 bg-[#1E2538]/50 rounded-md">Últimos 6 Meses</span>
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ultimos6Meses} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2538" vertical={false} />
                <XAxis 
                  dataKey="mes" 
                  stroke="#8B949E" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                  style={{ textTransform: 'capitalize' }}
                />
                <YAxis 
                  stroke="#8B949E" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `$${value / 1000}k`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#06080D', borderColor: '#1E2538', borderRadius: '8px', color: '#fff' }}
                  formatter={(value: unknown) => formatCurrency(Number(value))}
                  labelStyle={{ textTransform: 'capitalize', color: '#8B949E', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="receita" 
                  stroke="#0284C7" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#0284C7', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#0284C7', stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Vendedores */}
        <div className="bg-[#10141F] border border-[#1E2538] p-6 rounded-xl shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Trophy size={20} className="text-[#F59E0B]" />
            <h3 className="font-bold text-white">Top Vendedores</h3>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-[#1E2538]/50 rounded-full flex items-center justify-center text-[#8B949E] mb-4">
              <Users size={28} />
            </div>
            <p className="text-[#8B949E] text-sm">Nenhum deal fechado no período.</p>
          </div>
        </div>
        
      </div>

    </div>
  );
}