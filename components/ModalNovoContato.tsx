"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { X, User, Phone, Mail, Loader2 } from "lucide-react";

export function ModalNovoContato({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsLoading(true);

    const { error } = await supabase
      .from("contacts")
      .insert([{ name, phone, email }]);

    if (!error) {
      // Atualiza a tabela de contatos e do Kanban instantaneamente
      queryClient.invalidateQueries({ queryKey: ["contacts_with_pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setName(""); setPhone(""); setEmail("");
      onClose();
    } else {
      console.error("Erro ao criar contato:", error);
      alert("Erro ao criar contato. Verifique o console.");
    }
    
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#06080D]/80 backdrop-blur-sm p-4">
      <div className="bg-[#10141F] border border-[#1E2538] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 text-[#F8FAFC]">
        
        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-5 border-b border-[#1E2538]">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">Novo Contato</h2>
          <button type="button" onClick={onClose} className="text-[#8B949E] hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6">
            
            {/* Título da Seção (Igual à imagem) */}
            <div className="mb-4">
              <h3 className="text-xs font-bold text-[#8B949E] uppercase tracking-wider">Contato</h3>
            </div>

            {/* A "Caixinha" do formulário */}
            <div className="bg-[#06080D] p-4 rounded-xl border border-[#1E2538] space-y-4">
              
              {/* Campo de Nome (Ocupa a linha toda) */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" size={18} />
                <input 
                  type="text" 
                  required
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Nome do contato" 
                  className="w-full bg-[#10141F] border border-[#1E2538] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#0284C7] transition-colors text-sm" 
                />
              </div>

              {/* Grid para E-mail e Telefone (Lado a lado, igual à imagem) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" size={18} />
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="E-mail" 
                    className="w-full bg-[#10141F] border border-[#1E2538] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#0284C7] transition-colors text-sm" 
                  />
                </div>
                
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B949E]" size={18} />
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="Telefone" 
                    className="w-full bg-[#10141F] border border-[#1E2538] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#0284C7] transition-colors text-sm" 
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Rodapé com botão de Salvar */}
          <div className="p-5 bg-[#06080D] border-t border-[#1E2538]">
            <button 
              type="submit" 
              disabled={isLoading} 
              className="w-full py-3 bg-[#0284C7] hover:bg-[#0369a1] disabled:bg-[#1E2538] disabled:text-[#8B949E] text-white font-medium rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isLoading ? "Salvando..." : "Salvar Contato"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}