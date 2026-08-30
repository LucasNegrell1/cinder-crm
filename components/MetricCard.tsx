import React from 'react';

// TypeScript: Definindo exatamente o que a nossa caixa pode receber
interface MetricCardProps {
  title: string;
  value: string | number;
  trendPercentage?: string;
  icon?: React.ReactNode;
}

export function MetricCard({ title, value, trendPercentage, icon }: MetricCardProps) {
  return (
    <div className="flex flex-col p-6 rounded-xl bg-[#10141F] border border-[#1E2538] shadow-sm min-w-[240px]">
      
      {/* Cabeçalho da Caixa: Título + Ícone */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-[#8B949E]">
          {title}
        </h3>
        {icon && (
          // O fundo do ícone é um pouco mais escuro para dar contraste
          <div className="p-2 rounded-lg bg-[#06080D] border border-[#1E2538]">
            {icon}
          </div>
        )}
      </div>

      {/* Corpo da Caixa: Valor Principal */}
      <div className="flex flex-col gap-1">
        <span className="text-3xl font-bold text-[#F8FAFC]">
          {value}
        </span>

        {/* Indicador de Crescimento (Verde) */}
        {trendPercentage && (
          <div className="flex items-center gap-2 mt-2 text-sm">
            <span className="flex items-center text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded text-xs font-semibold">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              {trendPercentage}
            </span>
            <span className="text-[#8B949E] text-xs">vs mês passado</span>
          </div>
        )}
      </div>

    </div>
  );
}