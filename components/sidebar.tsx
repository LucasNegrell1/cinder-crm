"use client"; // 🌟 MUDANÇA 1: Adicionado para podermos ler a URL atual

import Link from "next/link";
import { usePathname } from "next/navigation"; // 🌟 MUDANÇA 2: Importamos o espião de URL
import { 
  Inbox, 
  LayoutDashboard, 
  KanbanSquare, 
  Users, 
  CheckSquare, 
  BarChart2, 
  Settings 
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname(); // 🌟 MUDANÇA 3: Pega a rota atual (ex: "/", "/contatos")

  // 🌟 MUDANÇA 4: Função para descobrir qual estilo aplicar no botão
  const getLinkStyle = (href: string) => {
    // Se a rota atual for exatamente igual ao link do botão, ele ganha a roupa azul!
    if (pathname === href) {
      return "flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-[#0284C7]/20 to-transparent border-l-2 border-[#0284C7] text-[#0284C7] rounded-r-lg transition-all font-medium text-sm";
    }
    // Se não, fica com a roupa cinza padrão
    return "flex items-center gap-3 px-3 py-2.5 border-l-2 border-transparent text-[#8B949E] hover:text-[#F8FAFC] hover:bg-white/5 rounded-r-lg transition-all font-medium text-sm";
  };

  return (
    <aside className="w-64 min-w-[256px] h-screen bg-[#06080D] flex flex-col z-20 border-r border-white/5">
      
      {/* Logo */}
      <div className="h-20 flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-[#0284C7] flex items-center justify-center text-white font-bold text-lg">
            C
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">
            Cinder<span className="text-white">CRM</span>
          </h1>
        </div>
      </div>
      
      {/* Menu de Navegação */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        
        {/* 🌟 MUDANÇA 5: Aplicamos a função getLinkStyle em todos os Links */}
        <Link href="/inbox" className={getLinkStyle("/inbox")}>
          <Inbox size={20} strokeWidth={1.5} />
          Inbox
        </Link>

        {/* Cuidado aqui! Se a sua página "Visão Geral" for a página inicial, o href é "/dashboard" ou "/"? */}
        {/* Assumindo que Visão Geral é "/dashboard" pelo seu código anterior: */}
        <Link href="/visao-geral" className={getLinkStyle("/visao-geral")}>
          <LayoutDashboard size={20} strokeWidth={2} />
          Visão Geral
        </Link>
        
        {/* E que "Boards" (Kanban) é a raiz "/" */}
        <Link href="/" className={getLinkStyle("/")}>
          <KanbanSquare size={20} strokeWidth={1.5} />
          Boards
        </Link>

        <Link href="/contatos" className={getLinkStyle("/contatos")}>
          <Users size={20} strokeWidth={1.5} />
          Contatos
        </Link>

        <Link href="/atividades" className={getLinkStyle("/atividades")}>
          <CheckSquare size={20} strokeWidth={1.5} />
          Atividades
        </Link>

        <Link href="/relatorios" className={getLinkStyle("/relatorios")}>
          <BarChart2 size={20} strokeWidth={1.5} />
          Relatórios
        </Link>

        <div className="pt-4 mt-4 border-t border-white/5">
          <Link href="/configuracoes" className={getLinkStyle("/configuracoes")}>
            <Settings size={20} strokeWidth={1.5} />
            Configurações
          </Link>
        </div>
      </nav>

      {/* Perfil na base */}
      <div className="p-4 mb-2">
        <div className="flex items-center gap-3 cursor-pointer p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
          <div className="w-9 h-9 rounded-full bg-[#0284C7] flex items-center justify-center text-white text-sm font-bold">
            LU
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-[#F8FAFC] truncate">lucasmcnegrelli</p>
            <p className="text-xs text-[#8B949E] truncate">lucasmcnegrelli@g...</p>
          </div>
        </div>
      </div>

    </aside>
  );
}