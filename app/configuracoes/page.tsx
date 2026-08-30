"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { LogOut, Shield, User } from "lucide-react";

export default function ConfiguracoesPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    // 1. Diz ao Supabase para encerrar a sessão de forma segura
    await supabase.auth.signOut();
    
    // 2. Redireciona o usuário de volta para a tela de Login
    router.push("/login");
  };

  return (
    <div className="p-8 h-full flex flex-col bg-[#090C15] bg-dots-pattern min-h-screen text-[#F8FAFC]">
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        <p className="text-[#8B949E] mt-1 text-sm">Gerencie sua conta e o acesso ao sistema.</p>
      </header>

      <div className="max-w-3xl space-y-6">
        
        {/* Cartão de Perfil / Conta */}
        <div className="bg-[#10141F] border border-[#1E2538] rounded-2xl overflow-hidden shadow-xl">
          
          {/* Cabeçalho do Cartão */}
          <div className="p-6 border-b border-[#1E2538] flex items-center gap-4 bg-[#10141F]">
            <div className="w-16 h-16 bg-[#0284C7] rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              LU
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">lucasmcnegrelli</h2>
              <p className="text-[#8B949E] text-sm">Acesso de Administrador</p>
              <span className="inline-block mt-2 text-[10px] font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 px-2 py-0.5 rounded uppercase tracking-wider">
                Plano Ativo
              </span>
            </div>
          </div>

          {/* Área de Segurança e Logout */}
          <div className="p-6 bg-[#06080D]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-2">
              <Shield size={16} className="text-[#0284C7]" />
              Segurança da Conta
            </h3>
            <p className="text-[#8B949E] text-sm mb-6 max-w-lg">
              Para encerrar sua sessão atual em segurança neste dispositivo e retornar à tela inicial, clique no botão abaixo.
            </p>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg transition-all font-medium text-sm shadow-sm"
            >
              <LogOut size={18} />
              Sair da Conta
            </button>
          </div>
          
        </div>

      </div>
    </div>
  );
}